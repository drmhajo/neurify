import { describe, expect, it } from "vitest";
import type { DepartmentData } from "../lib/department-model";
import {
  parseCloudDepartmentData,
  prepareDepartmentDataForCloud,
  restoreLocalAttachmentReferences,
  syncFailureStatus,
} from "../lib/department-sync";

function createData(): DepartmentData {
  return {
    users: [], reports: [], shifts: [], surgeries: [], weeklyAssignments: [], notifications: [],
    scheduleDocuments: [{ id: "schedule-1", section: "shifts", fileName: "weekly.pdf", mimeType: "application/pdf", localUri: "file:///schedule.pdf", uploadedBy: "Demo", uploadedAt: "now" }],
    teams: [{
      id: "team-1", name: "Demo", shortName: "D", color: "#075985", lead: "Demo", memberIds: [], consultations: [], dischargedCases: [],
      cases: [{
        id: "case-1", code: "DEMO-1", fileNumber: "DEMO-1", fullName: "Demo Patient", age: null, medicalHistory: "Demo only", clinicalTests: "Demo only", diagnosis: "Demo", admittedSince: "now", status: "منوّم",
        imaging: [{ id: "image-1", studyName: "CT", modality: "CT", date: "now", fileName: "ct.jpg", mimeType: "image/jpeg", localUri: "file:///ct.jpg", addedBy: "Demo" }],
        messages: [{ id: "message-1", text: "Demo", senderName: "Demo", sentAt: "now", attachment: { fileName: "clip.mp4", mimeType: "video/mp4", localUri: "file:///clip.mp4", kind: "video" } }],
      }],
    }],
  };
}

describe("لقطات المزامنة التجريبية", () => {
  it("تزيل مراجع ملفات الجهاز قبل الرفع إلى السحابة", () => {
    const local = createData();
    const cloud = prepareDepartmentDataForCloud(local);

    expect(cloud.scheduleDocuments[0].localUri).toBe("");
    expect(cloud.teams[0].cases[0].imaging[0].localUri).toBe("");
    expect(cloud.teams[0].cases[0].messages[0].attachment?.localUri).toBe("");
    expect(local.teams[0].cases[0].imaging[0].localUri).toBe("file:///ct.jpg");
  });

  it("يعيد مراجع الملفات المحلية المطابقة عند استلام لقطة سحابية", () => {
    const local = createData();
    const merged = restoreLocalAttachmentReferences(prepareDepartmentDataForCloud(local), local);

    expect(merged.scheduleDocuments[0].localUri).toBe("file:///schedule.pdf");
    expect(merged.teams[0].cases[0].imaging[0].localUri).toBe("file:///ct.jpg");
    expect(merged.teams[0].cases[0].messages[0].attachment?.localUri).toBe("file:///clip.mp4");
  });

  it("يرفض أي لقطة لا تحتوي على أقسام بيانات القسم المطلوبة", () => {
    expect(() => parseCloudDepartmentData({ users: [] })).toThrow("unsupported structure");
  });

  it("يميّز بين انقطاع الشبكة وخطأ المزامنة القابل لإعادة المحاولة", () => {
    expect(syncFailureStatus(new Error("Failed to fetch"))).toBe("offline");
    expect(syncFailureStatus(new Error("Supabase request failed (401)"))).toBe("error");
  });
});
