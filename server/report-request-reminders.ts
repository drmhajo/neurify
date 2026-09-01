import type { Express, Request, Response } from "express";
import { prepareDailyReportReminders, recordReportReminderDelivery } from "../lib/report-request-notifications";
import { getPilotSnapshot, savePilotSnapshot } from "./supabase-sync";
import { sdk } from "./_core/sdk";

function centralFunctionConfig() {
  const projectUrl = process.env.SUPABASE_URL?.trim().replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!projectUrl || !serviceKey) throw new Error("Central report reminder service is not configured.");
  return { url: `${projectUrl}/functions/v1/central-registration`, serviceKey };
}

async function dispatchReminder(reportId: string) {
  const { url, serviceKey } = centralFunctionConfig();
  const response = await fetch(url, {
    method: "POST",
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json", "x-report-reminder-internal": serviceKey },
    body: JSON.stringify({ action: "push_send_report_reminder", reportId }),
  });
  if (!response.ok) throw new Error(`Central reminder delivery failed (${response.status}).`);
  return response.json() as Promise<{ submitted: number; skipped?: string }>;
}

/** Cron-only, idempotent daily run. The database snapshot is updated before Push dispatch to avoid duplicate retries. */
export async function generateReportRequestReminders(now = new Date()) {
  const snapshot = await getPilotSnapshot();
  if (!snapshot) return { ok: true as const, reminded: 0, skipped: "no-snapshot" as const };
  const prepared = prepareDailyReportReminders(snapshot.data, now);
  if (!prepared.reportIds.length) return { ok: true as const, reminded: 0, skipped: "none-due" as const };
  let current = (await savePilotSnapshot({ data: prepared.data, actorName: "Neurify report reminder service" })).data;
  let submitted = 0;
  for (const reportId of prepared.reportIds) {
    try {
      const result = await dispatchReminder(reportId);
      submitted += result.submitted;
      current = recordReportReminderDelivery(current, reportId, result.submitted, now);
    } catch {
      current = {
        ...current,
        reports: current.reports.map((report) => report.id === reportId ? { ...report, lastReminderAt: now.toISOString(), lastReminderStatus: "delivery_unavailable" } : report),
      };
    }
  }
  await savePilotSnapshot({ data: current, actorName: "Neurify report reminder service" });
  return { ok: true as const, reminded: prepared.reportIds.length, submitted };
}

export function registerReportRequestReminderRoute(app: Express) {
  app.post("/api/scheduled/report-request-reminders", async (req: Request, res: Response) => {
    try {
      const user = await sdk.authenticateRequest(req);
      if (!user.isCron || !user.taskUid) return res.status(403).json({ error: "cron-only" });
      return res.json(await generateReportRequestReminders());
    } catch (error) {
      return res.status(500).json({ error: error instanceof Error ? error.message : String(error), timestamp: new Date().toISOString() });
    }
  });
}
