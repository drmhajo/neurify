export type UserRole = "admin" | "consultant" | "coordinator" | "team_member";
export type PermissionKey = "manage_users" | "manage_permissions" | "manage_teams" | "manage_schedules" | "manage_reports" | "view_all_patients" | "edit_medical_files" | "add_imaging" | "patient_chat" | "view_audit";
export type ReportPriority = "عاجل" | "عادي" | "متابعة";
export type ReportStatus = "جديد" | "قيد الإعداد" | "مكتمل";

export type DepartmentUser = {
  id: string;
  name: string;
  role: UserRole;
  teamIds: string[];
  active: boolean;
  jobTitle: string;
  permissions: PermissionKey[];
  email?: string;
  phone?: string;
  lastPasswordChangeAt?: string;
};

export type MedicalReport = {
  id: string;
  patientCode: string;
  title: string;
  priority: ReportPriority;
  status: ReportStatus;
  requester: string;
  createdAt: string;
  dueAt: string;
};

export type Shift = {
  id: string;
  date: string;
  period: "صباحي" | "مسائي" | "ليلي";
  clinician: string;
  role: string;
  team: string;
  location: string;
};

export type WeeklyAssignment = {
  id: string;
  day: string;
  clinician: string;
  role: string;
  team: string;
  period: "صباحي" | "مسائي" | "ليلي";
  location: string;
};

export type SchedulePdf = {
  id: string;
  section: "shifts" | "weekly";
  fileName: string;
  localUri: string;
  uploadedBy: string;
  uploadedAt: string;
};

export type Surgery = {
  id: string;
  time: string;
  patientCode: string;
  procedure: string;
  surgeon: string;
  room: string;
  status: "مؤكد" | "قيد التحضير" | "بانتظار مراجعة";
};

export type PatientCase = {
  id: string;
  code: string;
  fileNumber: string;
  fullName: string;
  age: number | null;
  medicalHistory: string;
  clinicalTests: string;
  diagnosis: string;
  admittedSince: string;
  status: "منوّم" | "متابعة" | "جاهز للخروج";
  imaging: DiagnosticImaging[];
  messages: PatientMessage[];
};

export type DischargedPatient = PatientCase & {
  dischargedAt: string;
  dischargedBy: string;
  dischargeReason: string;
};

export type ConsultationPatient = {
  code: string;
  fileNumber: string;
  fullName: string;
  age: number | null;
  medicalHistory: string;
  clinicalTests: string;
  diagnosis: string;
};

export type ClinicalDisposition = "follow_up" | "admit" | "discharge";

export type DiagnosticImaging = {
  id: string;
  studyName: string;
  modality: string;
  date: string;
  fileName: string;
  mimeType: string;
  localUri: string;
  addedBy: string;
};

export type PatientMessage = {
  id: string;
  text: string;
  senderName: string;
  sentAt: string;
};

export type Consultation = {
  id: string;
  title: string;
  subject: string;
  createdBy: string;
  time: string;
  patient?: ConsultationPatient;
  disposition?: ClinicalDisposition;
  convertedCaseId?: string;
};

export type TeamNotification = {
  id: string;
  type: "consultation" | "admitted_case";
  teamId: string;
  teamName: string;
  title: string;
  message: string;
  createdAt: string;
  recipientIds: string[];
  readByUserIds: string[];
};

export type CareTeam = {
  id: string;
  name: string;
  shortName: string;
  color: string;
  lead: string;
  memberIds: string[];
  cases: PatientCase[];
  dischargedCases: DischargedPatient[];
  consultations: Consultation[];
};

export type DepartmentData = {
  users: DepartmentUser[];
  reports: MedicalReport[];
  shifts: Shift[];
  surgeries: Surgery[];
  weeklyAssignments: WeeklyAssignment[];
  scheduleDocuments: SchedulePdf[];
  teams: CareTeam[];
  notifications: TeamNotification[];
};

export const roleLabels: Record<UserRole, string> = {
  admin: "مشرف القسم",
  consultant: "استشاري",
  coordinator: "منسق طبي",
  team_member: "عضو فريق",
};

export const permissionLabels: Record<PermissionKey, string> = {
  manage_users: "إدارة المستخدمين",
  manage_permissions: "إدارة الصلاحيات",
  manage_teams: "إدارة الفرق العلاجية",
  manage_schedules: "إدارة الجداول",
  manage_reports: "إدارة التقارير",
  view_all_patients: "عرض جميع الملفات الطبية",
  edit_medical_files: "تعديل الملفات الطبية",
  add_imaging: "إضافة الأشعة التشخيصية",
  patient_chat: "الدردشة الخاصة بالحالات",
  view_audit: "عرض سجل التدقيق",
};

export const rolePermissionDefaults: Record<UserRole, PermissionKey[]> = {
  admin: ["manage_users", "manage_permissions", "manage_teams", "manage_schedules", "manage_reports", "view_all_patients", "edit_medical_files", "add_imaging", "patient_chat", "view_audit"],
  consultant: ["manage_reports", "view_all_patients", "edit_medical_files", "add_imaging", "patient_chat"],
  coordinator: ["manage_schedules", "manage_reports", "view_all_patients", "patient_chat"],
  team_member: ["edit_medical_files", "add_imaging", "patient_chat"],
};

export const createInitialDepartmentData = (): DepartmentData => ({
  users: [
    { id: "u-admin", name: "د. عبدالله السالم", role: "admin", jobTitle: "رئيس القسم", teamIds: ["t1", "t2", "t3"], active: true, permissions: rolePermissionDefaults.admin },
    { id: "u-1", name: "د. نورة الحربي", role: "consultant", jobTitle: "استشاري جراحة مخ وأعصاب", teamIds: ["t1"], active: true, permissions: rolePermissionDefaults.consultant },
    { id: "u-2", name: "أ. فهد القحطاني", role: "coordinator", jobTitle: "منسق طبي", teamIds: ["t1", "t2"], active: true, permissions: rolePermissionDefaults.coordinator },
    { id: "u-3", name: "د. سارة العتيبي", role: "team_member", jobTitle: "طبيب مقيم", teamIds: ["t2"], active: true, permissions: rolePermissionDefaults.team_member },
  ],
  reports: [
    { id: "r1", patientCode: "NS-2048", title: "تقرير خروج طبي", priority: "عاجل", status: "جديد", requester: "قسم الطوارئ", createdAt: "اليوم، 08:20", dueAt: "اليوم، 13:00" },
    { id: "r2", patientCode: "NS-1973", title: "ملخص متابعة جراحية", priority: "عادي", status: "قيد الإعداد", requester: "العيادات الخارجية", createdAt: "أمس، 14:10", dueAt: "اليوم، 16:00" },
    { id: "r3", patientCode: "NS-1904", title: "تقرير إحالة تخصصية", priority: "متابعة", status: "مكتمل", requester: "التنويم", createdAt: "أمس، 10:45", dueAt: "أمس، 17:00" },
  ],
  shifts: [
    { id: "s1", date: "اليوم", period: "صباحي", clinician: "د. نورة الحربي", role: "استشاري مناوب", team: "فريق الأورام", location: "الدور الرابع" },
    { id: "s2", date: "اليوم", period: "مسائي", clinician: "د. سارة العتيبي", role: "طبيب مقيم", team: "فريق العمود الفقري", location: "الطوارئ" },
    { id: "s3", date: "اليوم", period: "ليلي", clinician: "د. عبدالله السالم", role: "استشاري مناوب", team: "فريق الأعصاب الوعائية", location: "التنويم" },
    { id: "s4", date: "غداً", period: "صباحي", clinician: "د. نورة الحربي", role: "استشاري مناوب", team: "فريق الأورام", location: "الدور الرابع" },
  ],
  weeklyAssignments: [
    { id: "w1", day: "الأحد", clinician: "د. نورة الحربي", role: "استشاري مناوب", team: "فريق أورام الجهاز العصبي", period: "صباحي", location: "الدور الرابع" },
    { id: "w2", day: "الاثنين", clinician: "د. سارة العتيبي", role: "طبيب مقيم", team: "فريق العمود الفقري", period: "صباحي", location: "العيادات" },
    { id: "w3", day: "الثلاثاء", clinician: "أ. فهد القحطاني", role: "منسق طبي", team: "فريق أورام الجهاز العصبي", period: "مسائي", location: "التنويم" },
    { id: "w4", day: "الأربعاء", clinician: "د. عبدالله السالم", role: "استشاري مناوب", team: "فريق الأعصاب الوعائية", period: "ليلي", location: "الطوارئ" },
    { id: "w5", day: "الخميس", clinician: "د. نورة الحربي", role: "استشاري مناوب", team: "فريق أورام الجهاز العصبي", period: "صباحي", location: "الدور الرابع" },
  ],
  scheduleDocuments: [
    { id: "pdf-1", section: "weekly", fileName: "weekly_allocation_august.pdf", localUri: "", uploadedBy: "د. عبدالله السالم", uploadedAt: "اليوم، 07:30" },
  ],
  surgeries: [
    { id: "o1", time: "08:00", patientCode: "NS-2048", procedure: "استئصال ورم سحائي", surgeon: "د. نورة الحربي", room: "غرفة عمليات 3", status: "مؤكد" },
    { id: "o2", time: "11:30", patientCode: "NS-1985", procedure: "تثبيت فقرات قطنية", surgeon: "د. عبدالله السالم", room: "غرفة عمليات 2", status: "قيد التحضير" },
    { id: "o3", time: "14:00", patientCode: "NS-2011", procedure: "تحويلة بطينية صفاقية", surgeon: "د. سارة العتيبي", room: "غرفة عمليات 1", status: "بانتظار مراجعة" },
  ],
  teams: [
    {
      id: "t1", name: "فريق أورام الجهاز العصبي", shortName: "أورام", color: "#075985", lead: "د. نورة الحربي", memberIds: ["u-admin", "u-1", "u-2"],
      cases: [
        { id: "c1", code: "NS-2048", fileNumber: "KSMC-007584", fullName: "مريض تجريبي (أ)", age: 53, medicalHistory: "صداع تدريجي خلال أربعة أشهر مع نوبات دوار متقطعة.", clinicalTests: "الفحص العصبي: قوة الأطراف محفوظة؛ لا يوجد عجز بؤري ظاهر.", diagnosis: "ورم سحائي أمامي", admittedSince: "منذ 3 أيام", status: "منوّم", imaging: [{ id: "i1", studyName: "رنين مغناطيسي للدماغ مع صبغة", modality: "MRI", date: "24 أغسطس 2026", fileName: "brain_mri_2408.pdf", mimeType: "application/pdf", localUri: "", addedBy: "د. نورة الحربي" }], messages: [{ id: "m1", text: "تمت مراجعة صور الرنين مع الفريق قبل العملية.", senderName: "د. نورة الحربي", sentAt: "اليوم، 08:10" }] },
        { id: "c2", code: "NS-1973", fileNumber: "KSMC-006973", fullName: "مريض تجريبي (ب)", age: 41, medicalHistory: "نوبات صداع مستمرة مع أعراض بصرية متقطعة.", clinicalTests: "الفحص السريري: يقظة تامة؛ فحص الحقول البصرية بحاجة إلى متابعة.", diagnosis: "ورم دبقي عالي الدرجة", admittedSince: "منذ 6 أيام", status: "متابعة", imaging: [], messages: [] },
      ],
      dischargedCases: [],
      consultations: [
        { id: "q1", title: "تقييم قبل العملية", subject: "مراجعة خطة الجراحة والصور", createdBy: "د. نورة الحربي", time: "اليوم، 07:45" },
      ],
    },
    {
      id: "t2", name: "فريق العمود الفقري", shortName: "عمود", color: "#0F766E", lead: "د. عبدالله السالم", memberIds: ["u-admin", "u-2", "u-3"],
      cases: [
        { id: "c3", code: "NS-1985", fileNumber: "KSMC-007112", fullName: "مريض تجريبي (ج)", age: 62, medicalHistory: "ألم قطني مزمن ممتد إلى الطرف السفلي الأيسر منذ عام.", clinicalTests: "اختبار رفع الساق إيجابي يساراً؛ القوة الحركية 4/5 في عضلات القدم اليسرى.", diagnosis: "تضيّق قطني متعدد المستويات", admittedSince: "منذ يومين", status: "منوّم", imaging: [{ id: "i2", studyName: "رنين مغناطيسي للعمود القطني", modality: "MRI", date: "25 أغسطس 2026", fileName: "lumbar_mri_2508.pdf", mimeType: "application/pdf", localUri: "", addedBy: "د. عبدالله السالم" }], messages: [{ id: "m2", text: "تم اعتماد خطة التثبيت الجراحي بعد اجتماع الفريق.", senderName: "د. عبدالله السالم", sentAt: "أمس، 16:30" }] },
      ],
      dischargedCases: [],
      consultations: [
        { id: "q2", title: "استشارة علاج طبيعي", subject: "برنامج التأهيل بعد التثبيت", createdBy: "د. سارة العتيبي", time: "أمس، 15:10" },
      ],
    },
    {
      id: "t3", name: "فريق الأعصاب الوعائية", shortName: "وعائي", color: "#B45309", lead: "د. عبدالله السالم", memberIds: ["u-admin"],
      cases: [
        { id: "c4", code: "NS-2011", fileNumber: "KSMC-008019", fullName: "مريض تجريبي (د)", age: 35, medicalHistory: "صداع حديث مع غثيان وقيء متكرر خلال أسبوعين.", clinicalTests: "الفحص السريري: استجابة بصرية وحركية مناسبة؛ يلزم رصد العلامات الحيوية.", diagnosis: "استسقاء دماغي", admittedSince: "منذ يوم", status: "منوّم", imaging: [], messages: [] },
      ],
      dischargedCases: [],
      consultations: [],
    },
  ],
  notifications: [],
});

export function getDashboardSummary(data: DepartmentData) {
  return {
    openReports: data.reports.filter((report) => report.status !== "مكتمل").length,
    surgeriesToday: data.surgeries.length,
    admittedCases: data.teams.reduce((total, team) => total + team.cases.filter((item) => item.status === "منوّم").length, 0),
    activeTeams: data.teams.length,
  };
}

export function createTeamNotification(input: {
  id: string;
  type: TeamNotification["type"];
  team: Pick<CareTeam, "id" | "name" | "memberIds">;
  actorName?: string;
  consultationTitle?: string;
}): TeamNotification {
  const isConsultation = input.type === "consultation";
  return {
    id: input.id,
    type: input.type,
    teamId: input.team.id,
    teamName: input.team.name,
    title: isConsultation ? "استشارة جديدة في غرفة الفريق" : "حالة منوّمة جديدة في غرفة الفريق",
    message: isConsultation
      ? `أضاف ${input.actorName ?? "عضو الفريق"} استشارة جديدة: ${input.consultationTitle ?? "بدون عنوان"}`
      : `تمت إضافة حالة منوّمة جديدة إلى ${input.team.name}.`,
    createdAt: "الآن",
    recipientIds: input.team.memberIds,
    readByUserIds: [],
  };
}

export function getNextReportStatus(status: ReportStatus): ReportStatus {
  if (status === "جديد") return "قيد الإعداد";
  if (status === "قيد الإعداد") return "مكتمل";
  return "مكتمل";
}
