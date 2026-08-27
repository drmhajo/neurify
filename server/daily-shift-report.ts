import type { Express, Request, Response } from "express";
import { getPilotSnapshot, savePilotSnapshot } from "./supabase-sync";
import { buildDailyShiftReport } from "../lib/shift-endorsement";
import { sdk } from "./_core/sdk";

export async function generateScheduledShiftReport(now = new Date()) {
  const snapshot = await getPilotSnapshot();
  if (!snapshot) return { ok: true as const, skipped: "no-snapshot" as const };
  const report = buildDailyShiftReport(snapshot.data, "النظام الآلي", now);
  if ((snapshot.data.shiftReports ?? []).some((item) => item.id === report.id)) return { ok: true as const, skipped: "already-generated" as const, reportId: report.id };
  const recipients = snapshot.data.users.filter((user) => user.active && user.permissions.includes("manage_reports")).map((user) => user.id);
  const reportNotification = {
    id: `n-${report.id}`,
    type: "shift_report" as const,
    teamId: "department",
    teamName: "قسم جراحة المخ والأعصاب",
    title: "تقرير المناوبة اليومي جاهز",
    message: `تم إعداد تقرير مناوبة ${report.reportDate}. يمكنك فتحه أو تنزيله من صفحة التقارير.`,
    createdAt: "الآن",
    recipientIds: recipients,
    readByUserIds: [],
  };
  const data = {
    ...snapshot.data,
    shiftReports: [report, ...(snapshot.data.shiftReports ?? [])],
    notifications: snapshot.data.notifications.some((item) => item.id === reportNotification.id) ? snapshot.data.notifications : [reportNotification, ...snapshot.data.notifications],
  };
  await savePilotSnapshot({ data, actorName: "النظام الآلي" });
  return { ok: true as const, reportId: report.id, reportDate: report.reportDate };
}

export function registerDailyShiftReportRoute(app: Express) {
  app.post("/api/scheduled/daily-shift-report", async (req: Request, res: Response) => {
    try {
      const user = await sdk.authenticateRequest(req);
      if (!user.isCron || !user.taskUid) return res.status(403).json({ error: "cron-only" });
      return res.json(await generateScheduledShiftReport());
    } catch (error) {
      return res.status(500).json({ error: error instanceof Error ? error.message : String(error), timestamp: new Date().toISOString() });
    }
  });
}
