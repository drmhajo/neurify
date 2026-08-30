import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "..");

describe("صلاحيات ومكان قائمة انتظار OPD", () => {
  it("يضع رابط OPD داخل سياق العمليات ويعرضه لجميع المستخدمين المعتمدين للإضافة", () => {
    const schedule = fs.readFileSync(path.join(root, "app", "(tabs)", "schedule.tsx"), "utf8");
    const waitingList = fs.readFileSync(path.join(root, "app", "(tabs)", "opd-operation-waiting-list.tsx"), "utf8");
    expect(schedule).toContain('section === "operations" ? <Pressable');
    expect(schedule).toContain("opdWaitingListLink");
    expect(waitingList).toContain("const canAdd = canAddOpdOperationWaitingList");
    expect(waitingList).toContain("const canManage = canManageOpdOperationWaitingList");
    expect(waitingList).toContain("isOpdWaitingEntryNew(item)");
    expect(waitingList).toContain("opdNewEntryLabel(language)");
    expect(waitingList).toContain("styles.newEntry");
    expect(waitingList).toContain("styles.newBanner");
  });
});
