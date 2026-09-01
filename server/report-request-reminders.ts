import type { Express, Request, Response } from "express";
import { prepareDailyReportReminders } from "../lib/report-request-notifications";
import { sdk } from "./_core/sdk";
import { getPilotSnapshot, savePilotSnapshot } from "./supabase-sync";

function centralConfiguration() {
  const projectUrl = process.env.SUPABASE_URL?.trim().replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
  const serviceRoleKey = process.env.CENTRAL_SUPABASE_SERVICE_ROLE_KEY?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!projectUrl || !serviceRoleKey) throw new Error("Central report reminder service is not configured.");
  return { url: `${projectUrl}/functions/v1/central-registration`, serviceRoleKey };
}

async function dispatchCentralReportReminder(reportId: string) {
  const { url, serviceRoleKey } = centralConfiguration();
  const response = await fetch(url, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      "x-report-reminder-internal": serviceRoleKey,
    },
    body: JSON.stringify({ action: "push_send_report_reminder", reportId }),
  });
  if (!response.ok) throw new Error(`Central report reminder delivery failed (${response.status}).`);
  return response.json() as Promise<{ submitted: number; skipped?: string }>;
}

/** Runs from the platform scheduler. It is idempotent per report and Riyadh calendar day. */
export async function generateReportRequestReminders(now = new Date()) {
  const snapshot = await getPilotSnapshot();
  if (!snapshot) return { ok: true as const, skipped: "no-snapshot" as const, reminded: 0 };
  const prepared = prepareDailyReportReminders(snapshot.data, now);
  if (!prepared.reminderReportIds.length) return { ok: true as const, skipped: "none-due" as const, reminded: 0 };

  await savePilotSnapshot({ data: prepared.data, actorName: "نظام تذكير طلبات التقارير" });
  let submitted = 0;
  for (const reportId of prepared.reminderReportIds) {
    const result = await dispatchCentralReportReminder(reportId);
    submitted += result.submitted;
  }
  return { ok: true as const, reminded: prepared.reminderReportIds.length, submitted };
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
