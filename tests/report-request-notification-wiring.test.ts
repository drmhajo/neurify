import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const project = resolve(__dirname, "..");
const reportsScreen = readFileSync(resolve(project, "app/(tabs)/reports.tsx"), "utf8");
const centralFunction = readFileSync(resolve(project, "supabase/functions/central-registration/index.ts"), "utf8");
const scheduledRoute = readFileSync(resolve(project, "server/report-request-reminders.ts"), "utf8");

describe("report request reminder wiring", () => {
  it("keeps Notify completed visible in both interface languages and gates it through the store", () => {
    expect(reportsScreen).toContain("Notify completed");
    expect(reportsScreen).toContain("إشعار مكتمل");
    expect(reportsScreen).toContain("completeReportNotification(item.id)");
  });

  it("uses a cron-only route and does not place patient identifiers in Push copy", () => {
    expect(scheduledRoute).toContain("/api/scheduled/report-request-reminders");
    expect(scheduledRoute).toContain("user.isCron");
    expect(centralFunction).toContain("push_send_report_request");
    expect(centralFunction).toContain("push_send_report_reminder");
    expect(centralFunction).toContain("recipientIds");
    expect(centralFunction).not.toContain("medical record number");
    expect(centralFunction).not.toContain("Patient name");
  });
});
