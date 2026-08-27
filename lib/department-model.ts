import type { NeurosurgeryProcedureCode } from "./neurosurgery-procedure-catalog";

export type UserRole = "admin" | "consultant" | "coordinator" | "team_member";
export type PermissionKey = "manage_users" | "manage_permissions" | "manage_teams" | "manage_schedules" | "manage_reports" | "view_all_patients" | "edit_medical_files" | "add_imaging" | "patient_chat" | "view_audit" | "send_general_announcement";
export type ReportPriority = "عاجل" | "عادي" | "متابعة";
export type ReportStatus = "جديد" | "قيد الإعداد" | "مكتمل";

export type DepartmentUser = {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  teamIds: string[];
  active: boolean;
  jobTitle: string;
  permissions: PermissionKey[];
  email?: string;
  phone?: string;
  lastPasswordChangeAt?: string;
  passwordRecoveryRequired?: boolean;
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
  mimeType: string;
  localUri: string;
  uploadedBy: string;
  uploadedAt: string;
};

export type Surgery = {
  id: string;
  patientLink?: { teamId: string; caseId: string };
  date: string;
  time: string;
  patientCode: string;
  procedure: string;
  procedureCode?: NeurosurgeryProcedureCode;
  surgeon: string;
  room: string;
  notes: string;
  status: "مؤكد" | "قيد التحضير" | "بانتظار مراجعة";
  recordedAt?: string;
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
  clinicalDecision?: string;
  surgeryType?: string;
  surgeryTypeCode?: NeurosurgeryProcedureCode;
  admittedSince: string;
  admittedAt?: string;
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
  clinicalDecision?: string;
  surgeryType?: string;
  surgeryTypeCode?: NeurosurgeryProcedureCode;
};

export type ClinicalDisposition = "follow_up" | "admit" | "discharge";

export function consultationDestination(disposition: ClinicalDisposition) {
  if (disposition === "admit") return { section: "inpatients" as const, icon: "hotel" as const, color: "#B42318", arabicHint: "سيضاف المريض تلقائياً إلى قائمة المنومين للفريق المعالج.", englishHint: "The patient will be added automatically to the treating team's inpatient list." };
  if (disposition === "discharge") return { section: "discharged" as const, icon: "archive" as const, color: "#0F766E", arabicHint: "ستنتقل الحالة تلقائياً إلى قائمة الخروج وأرشيف الفريق المعالج.", englishHint: "The case will be moved automatically to the treating team's discharged list and archive." };
  return { section: "consultations" as const, icon: "forum" as const, color: "#075985", arabicHint: "ستبقى الحالة ضمن قائمة استشارات الفريق المعالج للمتابعة.", englishHint: "The case will stay in the treating team's consultation list for follow-up." };
}

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
  attachment?: {
    fileName: string;
    mimeType: string;
    localUri: string;
    kind: "video" | "file";
  };
};

export type Consultation = {
  id: string;
  title: string;
  subject: string;
  createdBy: string;
  time: string;
  createdAt?: string;
  patient?: ConsultationPatient;
  disposition?: ClinicalDisposition;
  convertedCaseId?: string;
};

export type TeamNotification = {
  id: string;
  type: "consultation" | "admitted_case" | "shift_report" | "general_announcement";
  teamId: string;
  teamName: string;
  title: string;
  message: string;
  createdAt: string;
  recipientIds: string[];
  readByUserIds: string[];
};

export type ShiftReportConsultation = {
  id: string;
  period: "AM" | "PM";
  mrn: string;
  age: string;
  diagnosis: string;
  consultingSpecialty: string;
  plan: string;
  requiresFollowUp: boolean;
};

export type ShiftReportAdmission = {
  id: string;
  mrn: string;
  diagnosis: string;
  admissionType: "Elective" | "Emergency" | "Unspecified";
  plan: string;
  admittingConsultant: string;
};

export type ShiftReportEmergencySurgery = {
  id: string;
  mrn: string;
  diagnosis: string;
  surgery: string;
};

export type DailyShiftReport = {
  id: string;
  reportDate: string;
  shiftStartAt: string;
  shiftEndAt: string;
  generatedAt: string;
  generatedBy: string;
  onCall: { first: string; second: string; third: string };
  consultations: ShiftReportConsultation[];
  admissions: ShiftReportAdmission[];
  emergencySurgeries: ShiftReportEmergencySurgery[];
  statistics: { consultations: number; requiringFollowUp: number; admissions: number; emergencySurgeries: number };
};

export type OnCallSlot = "first" | "second" | "third";

export type ShiftReportPreferences = {
  firstOnCallUserId?: string;
  secondOnCallUserId?: string;
  thirdOnCallUserId?: string;
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
  shiftReports: DailyShiftReport[];
  shiftReportPreferences?: ShiftReportPreferences;
  rosterVersion?: string;
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
  send_general_announcement: "إرسال إشعار عام",
};

export const rolePermissionDefaults: Record<UserRole, PermissionKey[]> = {
  admin: ["manage_users", "manage_permissions", "manage_teams", "manage_schedules", "manage_reports", "view_all_patients", "edit_medical_files", "add_imaging", "patient_chat", "view_audit", "send_general_announcement"],
  consultant: ["manage_reports", "view_all_patients", "edit_medical_files", "add_imaging", "patient_chat"],
  coordinator: ["manage_schedules", "manage_reports", "view_all_patients", "patient_chat"],
  team_member: ["edit_medical_files", "add_imaging", "patient_chat"],
};

/** Roster transcribed from the provided Neurosurgery groups Distribution, 19–24 July 2026. */
export const WEEKLY_GROUPS_ROSTER_VERSION = "ns-weekly-groups-2026-07-19-consultant-leads";

type WeeklyRosterMember = Pick<DepartmentUser, "username" | "name" | "role" | "jobTitle">;

const consultantRoster: WeeklyRosterMember[] = [
  ["sami", "Sami"], ["maryam", "Maryam"], ["babar", "Babar"], ["akram", "Akram"], ["hashmi", "Hashmi"], ["saad", "Saad"], ["ibrahim", "Ibrahim"], ["albaraa", "Albaraa"], ["nuha", "Nuha"], ["wajab", "Wajab"], ["alhammad", "Alhammad"], ["jamaan", "Jama'an"],
].map(([username, name]) => ({ username, name, role: "consultant", jobTitle: "استشاري | Consultant" }));

const specialistRoster: WeeklyRosterMember[] = [
  ["ahmed", "Ahmed"], ["awad", "Awad"], ["mostafa", "Mostafa"], ["zaghloul", "Zaghloul"], ["hossam", "Hossam"], ["abdulrahman", "Abdulrahman"], ["shoaib", "Shoaib"], ["marahib", "Marahib"],
].map(([username, name]) => ({ username, name, role: "team_member", jobTitle: "أخصائي | Specialist" }));

const residentRoster: WeeklyRosterMember[] = [
  ["osman", "Osman"], ["hajo", "Hajo"], ["omer", "Omer"], ["tahir", "Tahir"], ["m.hashim", "M.Hashim"], ["rahaf", "Rahaf"], ["monzir.r6", "Monzir R6"], ["sarah", "Sarah"], ["ragad.r3", "Ragad R3"], ["lina.r1", "Lina R1"], ["alaa.r1", "Ala'a R1"],
].map(([username, name]) => ({ username, name, role: "team_member", jobTitle: "طبيب مقيم | Resident" }));

const weeklyGroupsRoster: WeeklyRosterMember[] = [
  ...consultantRoster,
  ...specialistRoster,
  ...residentRoster,
  { username: "eman", name: "Eman", role: "team_member", jobTitle: "عضو فريق | Team member" },
  { username: "munira", name: "Munira", role: "team_member", jobTitle: "عضو فريق | Team member" },
];

const weeklyGroupDefinitions = [
  { id: "t1", name: "فريق د. Hashmi | Dr. Hashmi", shortName: "Hashmi", color: "#075985", lead: "Dr. Hashmi", members: ["hashmi", "babar", "albaraa", "wajab", "shoaib", "awad", "omer", "sarah", "tahir", "alaa.r1"] },
  { id: "t2", name: "فريق د. Jama'an | Dr. Jama'an", shortName: "Jama'an", color: "#08766D", lead: "Dr. Jama'an", members: ["jamaan", "ibrahim", "saad", "marahib", "hossam", "ragad.r3", "rahaf"] },
  { id: "t3", name: "فريق د. Sami | Dr. Sami", shortName: "Sami", color: "#B97922", lead: "Dr. Sami", members: ["sami", "nuha", "akram", "marahib", "eman", "ahmed", "rahaf", "munira"] },
  { id: "t4", name: "فريق د. Maryam | Dr. Maryam", shortName: "Maryam", color: "#9F1239", lead: "Dr. Maryam", members: ["maryam", "alhammad", "osman", "lina.r1"] },
] as const;

const initialSampleUserIds = new Set(["u-1", "u-2", "u-3"]);
const coreWeeklyGroupIds = weeklyGroupDefinitions.map((team) => team.id);

function compactRosterValue(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Replaces the previous fictitious staff roster with the supplied weekly group list.
 * The migration intentionally retains the admin account, existing cases, reports, and any
 * custom users or teams that were added after the initial demonstration data.
 */
export function applyWeeklyGroupsRoster(current: DepartmentData): DepartmentData {
  if (current.rosterVersion === WEEKLY_GROUPS_ROSTER_VERSION) return current;

  const sourceMemberships = new Map<string, string[]>();
  weeklyGroupDefinitions.forEach((team) => team.members.forEach((username) => {
    sourceMemberships.set(username, [...(sourceMemberships.get(username) ?? []), team.id]);
  }));

  const sourceUserByKey = new Map<string, DepartmentUser>();
  const matchingUsers = current.users.filter((user) => !initialSampleUserIds.has(user.id));
  const rosterUsers = weeklyGroupsRoster.map((member) => {
    const matched = matchingUsers.find((user) => compactRosterValue(user.username) === compactRosterValue(member.username) || compactRosterValue(user.name) === compactRosterValue(member.name));
    const teamIds = [...new Set([...(sourceMemberships.get(member.username) ?? []), ...(matched?.teamIds ?? []).filter((teamId) => !coreWeeklyGroupIds.includes(teamId as (typeof coreWeeklyGroupIds)[number]))])];
    const rosterUser: DepartmentUser = {
      id: matched?.id ?? `u-roster-${member.username.replace(/[^a-z0-9]/g, "-")}`,
      username: member.username,
      name: member.name,
      role: member.role,
      jobTitle: member.jobTitle,
      teamIds,
      active: matched?.active ?? true,
      permissions: matched?.permissions?.length ? matched.permissions : rolePermissionDefaults[member.role],
      email: matched?.email,
      phone: matched?.phone,
      lastPasswordChangeAt: matched?.lastPasswordChangeAt,
      passwordRecoveryRequired: matched?.passwordRecoveryRequired,
    };
    sourceUserByKey.set(member.username, rosterUser);
    return rosterUser;
  });

  const rosterUserIds = new Set(rosterUsers.map((user) => user.id));
  const retainedUsers = matchingUsers.filter((user) => !rosterUsers.some((rosterUser) => rosterUser.id === user.id));
  const admin = retainedUsers.find((user) => user.id === "u-admin");
  const otherRetainedUsers = retainedUsers.filter((user) => user.id !== "u-admin");
  const users = [
    ...(admin ? [{ ...admin, teamIds: admin.teamIds.filter((teamId) => !coreWeeklyGroupIds.includes(teamId as (typeof coreWeeklyGroupIds)[number])) }] : []),
    ...rosterUsers,
    ...otherRetainedUsers,
  ];

  const teams = [
    ...weeklyGroupDefinitions.map((definition) => {
      const existing = current.teams.find((team) => team.id === definition.id);
      const rosterMemberIds = definition.members.map((username) => sourceUserByKey.get(username)?.id).filter((id): id is string => Boolean(id));
      const customMemberIds = (existing?.memberIds ?? []).filter((id) => !initialSampleUserIds.has(id) && !rosterUserIds.has(id) && id !== "u-admin");
      return {
        id: definition.id,
        name: definition.name,
        shortName: definition.shortName,
        color: definition.color,
        lead: definition.lead,
        memberIds: [...new Set([...rosterMemberIds, ...customMemberIds])],
        cases: existing?.cases ?? [],
        dischargedCases: existing?.dischargedCases ?? [],
        consultations: existing?.consultations ?? [],
      };
    }),
    ...current.teams.filter((team) => !coreWeeklyGroupIds.includes(team.id as (typeof coreWeeklyGroupIds)[number])),
  ];

  return { ...current, users, teams, rosterVersion: WEEKLY_GROUPS_ROSTER_VERSION };
}

export const createInitialDepartmentData = (): DepartmentData => applyWeeklyGroupsRoster({
  users: [
    { id: "u-admin", username: "admin", name: "د. عبدالله السالم", role: "admin", jobTitle: "رئيس القسم", teamIds: ["t1", "t2", "t3"], active: true, permissions: rolePermissionDefaults.admin },
    { id: "u-1", username: "noura", name: "د. نورة الحربي", role: "consultant", jobTitle: "استشاري جراحة مخ وأعصاب", teamIds: ["t1"], active: true, permissions: rolePermissionDefaults.consultant },
    { id: "u-2", username: "fahad", name: "أ. فهد القحطاني", role: "coordinator", jobTitle: "منسق طبي", teamIds: ["t1", "t2"], active: true, permissions: rolePermissionDefaults.coordinator },
    { id: "u-3", username: "sara", name: "د. سارة العتيبي", role: "team_member", jobTitle: "طبيب مقيم", teamIds: ["t2"], active: true, permissions: rolePermissionDefaults.team_member },
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
    { id: "pdf-1", section: "weekly", fileName: "weekly_allocation_august.pdf", mimeType: "application/pdf", localUri: "", uploadedBy: "د. عبدالله السالم", uploadedAt: "اليوم، 07:30" },
  ],
  surgeries: [
    { id: "o1", patientLink: { teamId: "t1", caseId: "c1" }, date: "26 أغسطس 2026", time: "08:00", patientCode: "NS-2048", procedure: "استئصال ورم سحائي", surgeon: "د. نورة الحربي", room: "غرفة عمليات 3", notes: "تمت مراجعة صور الرنين وخطة التخدير.", status: "مؤكد" },
    { id: "o2", patientLink: { teamId: "t2", caseId: "c3" }, date: "26 أغسطس 2026", time: "11:30", patientCode: "NS-1985", procedure: "تثبيت فقرات قطنية", surgeon: "د. عبدالله السالم", room: "غرفة عمليات 2", notes: "بانتظار إتمام تحضيرات غرفة العمليات.", status: "قيد التحضير" },
    { id: "o3", date: "26 أغسطس 2026", time: "14:00", patientCode: "NS-2011", procedure: "تحويلة بطينية صفاقية", surgeon: "د. سارة العتيبي", room: "غرفة عمليات 1", notes: "تتطلب مراجعة الفريق قبل تأكيد الموعد.", status: "بانتظار مراجعة" },
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
  shiftReports: [],
  shiftReportPreferences: {},
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
