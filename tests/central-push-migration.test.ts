import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");

describe("central Push registration migration", () => {
  it("keeps Push devices behind RLS and the service role", () => {
    const migration = fs.readFileSync(path.join(root, "supabase/central_registration.sql"), "utf8");
    expect(migration).toContain("create table if not exists public.push_devices");
    expect(migration).toContain("alter table public.push_devices enable row level security");
    expect(migration).toContain("revoke all on table public.push_devices from anon, authenticated");
  });

  it("routes remote-device registration through the HTTPS central function with a signed proof", () => {
    const functionCode = fs.readFileSync(path.join(root, "supabase/functions/central-registration/index.ts"), "utf8");
    const client = fs.readFileSync(path.join(root, "lib/central-registration-api.ts"), "utf8");
    const pushClient = fs.readFileSync(path.join(root, "lib/push-notifications.ts"), "utf8");
    expect(functionCode).toContain('case "push_register"');
    expect(functionCode).toContain("createPushRegistrationProof");
    expect(functionCode).toContain("hasValidPushRegistrationProof");
    expect(client).toContain("registerCentralPushDevice");
    expect(pushClient).toContain("registerCentralPushDevice");
    expect(pushClient).toContain('staffId.startsWith("remote-")');
    expect(pushClient).toContain("pushProof: pushProof!");
  });

  it("protects general Push dispatch with the central approval secret and sends no patient details", () => {
    const functionCode = fs.readFileSync(path.join(root, "supabase/functions/central-registration/index.ts"), "utf8");
    const announcementScreen = fs.readFileSync(path.join(root, "app/general-announcement.tsx"), "utf8");
    expect(functionCode).toContain('case "push_send_general"');
    expect(functionCode).toContain("requireApprovalSecret(body.approvalSecret)");
    expect(functionCode).toContain('url: "/notifications"');
    expect(announcementScreen).toContain("secureTextEntry");
    expect(announcementScreen).toContain("never saved on the device");
  });

  it("routes every newly created consultation through the protected central FCM action without patient identifiers", () => {
    const functionCode = fs.readFileSync(path.join(root, "supabase/functions/central-registration/index.ts"), "utf8");
    const client = fs.readFileSync(path.join(root, "lib/central-registration-api.ts"), "utf8");
    const pushClient = fs.readFileSync(path.join(root, "lib/push-notifications.ts"), "utf8");
    const store = fs.readFileSync(path.join(root, "lib/department-store.tsx"), "utf8");
    expect(functionCode).toContain('case "push_send_consultation"');
    expect(functionCode).toContain("handleConsultationPush");
    expect(functionCode).toContain("تم تسجيل استشارة جديدة. افتح التطبيق لمتابعة تفاصيل القسم.");
    expect(client).toContain("sendCentralConsultationPush");
    expect(pushClient).toContain("sendCentralConsultationPush");
    expect(pushClient).not.toContain("client.push.sendTeam.mutate");
    expect(store).toContain('type: "consultation", accountId: session?.userId, pushProof: session?.pushProof');
  });

  it("keeps the Push proof usable beyond the old ten-minute window and requires central re-sign-in when absent", () => {
    const functionCode = fs.readFileSync(path.join(root, "supabase/functions/central-registration/index.ts"), "utf8");
    const pushClient = fs.readFileSync(path.join(root, "lib/push-notifications.ts"), "utf8");
    expect(functionCode).toContain("30 * 24 * 60 * 60 * 1000");
    expect(functionCode).not.toContain("Date.now() + 10 * 60 * 1000");
    expect(pushClient).toContain('staffId.startsWith("remote-") && !pushProof');
    expect(pushClient).toContain('state: "needs_sign_in"');
    expect(pushClient).toContain("سجّل الخروج ثم ادخل مرة أخرى");
    expect(pushClient).toContain('if (!staffId.startsWith("remote-"))');
    expect(pushClient).not.toContain('createTRPCClient().push.register.mutate');
  });

  it("uses Firebase device tokens rather than Expo tokens and preserves safe registration errors", () => {
    const pushClient = fs.readFileSync(path.join(root, "lib/push-notifications.ts"), "utf8");
    const functionCode = fs.readFileSync(path.join(root, "supabase/functions/central-registration/index.ts"), "utf8");
    expect(pushClient).toContain("Notifications.getDevicePushTokenAsync");
    expect(pushClient).not.toContain("Notifications.getExpoPushTokenAsync");
    expect(pushClient).toContain("تعذر الحصول على رمز Firebase للإشعارات");
    expect(pushClient).toContain("تعذر حفظ رمز الجهاز في الخدمة المركزية");
    expect(pushClient).toContain("إصدار التطبيق لا يتضمن إعدادات الخدمة المركزية");
    expect(pushClient).toContain("تعذر الاتصال بالخدمة المركزية");
    expect(functionCode).toContain("https://fcm.googleapis.com/v1/projects/");
    expect(functionCode).toContain("FIREBASE_SERVICE_ACCOUNT_JSON");
    expect(functionCode).not.toContain("https://exp.host/--/api/v2/push/send");
  });
});
