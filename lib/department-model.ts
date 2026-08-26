export type UserRole = "admin" | "consultant" | "coordinator" | "team_member";
export type ReportPriority = "عاجل" | "عادي" | "متابعة";
export type ReportStatus = "جديد" | "قيد الإعداد" | "مكتمل";

export type DepartmentUser = {
  id: string;
  name: string;
  role: UserRole;
  teamIds: string[];
  active: boolean;
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
  diagnosis: string;
  admittedSince: string;
  status: "منوّم" | "متابعة" | "جاهز للخروج";
};

export type Consultation = {
  id: string;
  title: string;
  subject: string;
  createdBy: string;
  time: string;
};

export type CareTeam = {
  id: string;
  name: string;
  shortName: string;
  color: string;
  lead: string;
  memberIds: string[];
  cases: PatientCase[];
  consultations: Consultation[];
};

export type DepartmentData = {
  users: DepartmentUser[];
  reports: MedicalReport[];
  shifts: Shift[];
  surgeries: Surgery[];
  teams: CareTeam[];
};

export const roleLabels: Record<UserRole, string> = {
  admin: "مشرف القسم",
  consultant: "استشاري",
  coordinator: "منسق طبي",
  team_member: "عضو فريق",
};

export const createInitialDepartmentData = (): DepartmentData => ({
  users: [
    { id: "u-admin", name: "د. عبدالله السالم", role: "admin", teamIds: ["t1", "t2", "t3"], active: true },
    { id: "u-1", name: "د. نورة الحربي", role: "consultant", teamIds: ["t1"], active: true },
    { id: "u-2", name: "أ. فهد القحطاني", role: "coordinator", teamIds: ["t1", "t2"], active: true },
    { id: "u-3", name: "د. سارة العتيبي", role: "team_member", teamIds: ["t2"], active: true },
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
  surgeries: [
    { id: "o1", time: "08:00", patientCode: "NS-2048", procedure: "استئصال ورم سحائي", surgeon: "د. نورة الحربي", room: "غرفة عمليات 3", status: "مؤكد" },
    { id: "o2", time: "11:30", patientCode: "NS-1985", procedure: "تثبيت فقرات قطنية", surgeon: "د. عبدالله السالم", room: "غرفة عمليات 2", status: "قيد التحضير" },
    { id: "o3", time: "14:00", patientCode: "NS-2011", procedure: "تحويلة بطينية صفاقية", surgeon: "د. سارة العتيبي", room: "غرفة عمليات 1", status: "بانتظار مراجعة" },
  ],
  teams: [
    {
      id: "t1", name: "فريق أورام الجهاز العصبي", shortName: "أورام", color: "#075985", lead: "د. نورة الحربي", memberIds: ["u-admin", "u-1", "u-2"],
      cases: [
        { id: "c1", code: "NS-2048", diagnosis: "ورم سحائي أمامي", admittedSince: "منذ 3 أيام", status: "منوّم" },
        { id: "c2", code: "NS-1973", diagnosis: "ورم دبقي عالي الدرجة", admittedSince: "منذ 6 أيام", status: "متابعة" },
      ],
      consultations: [
        { id: "q1", title: "تقييم قبل العملية", subject: "مراجعة خطة الجراحة والصور", createdBy: "د. نورة الحربي", time: "اليوم، 07:45" },
      ],
    },
    {
      id: "t2", name: "فريق العمود الفقري", shortName: "عمود", color: "#0F766E", lead: "د. عبدالله السالم", memberIds: ["u-admin", "u-2", "u-3"],
      cases: [
        { id: "c3", code: "NS-1985", diagnosis: "تضيّق قطني متعدد المستويات", admittedSince: "منذ يومين", status: "منوّم" },
      ],
      consultations: [
        { id: "q2", title: "استشارة علاج طبيعي", subject: "برنامج التأهيل بعد التثبيت", createdBy: "د. سارة العتيبي", time: "أمس، 15:10" },
      ],
    },
    {
      id: "t3", name: "فريق الأعصاب الوعائية", shortName: "وعائي", color: "#B45309", lead: "د. عبدالله السالم", memberIds: ["u-admin"],
      cases: [
        { id: "c4", code: "NS-2011", diagnosis: "استسقاء دماغي", admittedSince: "منذ يوم", status: "منوّم" },
      ],
      consultations: [],
    },
  ],
});

export function getDashboardSummary(data: DepartmentData) {
  return {
    openReports: data.reports.filter((report) => report.status !== "مكتمل").length,
    surgeriesToday: data.surgeries.length,
    admittedCases: data.teams.reduce((total, team) => total + team.cases.filter((item) => item.status === "منوّم").length, 0),
    activeTeams: data.teams.length,
  };
}

export function getNextReportStatus(status: ReportStatus): ReportStatus {
  if (status === "جديد") return "قيد الإعداد";
  if (status === "قيد الإعداد") return "مكتمل";
  return "مكتمل";
}
