import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  createInitialDepartmentData,
  createTeamNotification,
  type DepartmentData,
  type DepartmentUser,
  type ClinicalDisposition,
  type ConsultationPatient,
  type DischargedPatient,
  type DiagnosticImaging,
  type PatientCase,
  type PatientMessage,
  type PermissionKey,
  type ReportPriority,
  type SchedulePdf,
  type Surgery,
  type UserRole,
  type CareTeam,
  rolePermissionDefaults,
} from "@/lib/department-model";
import { dispatchTeamPush } from "@/lib/push-notifications";

type Session = {
  userId: string;
  name: string;
  role: UserRole;
};

type DepartmentStore = {
  hydrated: boolean;
  session: Session | null;
  data: DepartmentData;
  signIn: (username: string, password: string) => Promise<{ ok: boolean; message?: string }>;
  signInWithGoogleDemo: () => Promise<void>;
  signOut: () => Promise<void>;
  advanceReport: (id: string) => void;
  addReport: (input: { patientCode: string; title: string; priority: ReportPriority }) => void;
  addConsultation: (teamId: string, input: { title: string; subject: string; disposition: ClinicalDisposition; patient: ConsultationPatient }) => void;
  addCase: (teamId: string, input: { code: string; diagnosis: string }) => void;
  dischargePatient: (teamId: string, caseId: string, reason: string) => void;
  addUser: (input: { name: string; role: UserRole; teamId: string; jobTitle?: string }) => void;
  changeUserRole: (userId: string, role: UserRole) => void;
  updateUserAccess: (userId: string, input: { active: boolean; permissions: PermissionKey[]; teamIds: string[] }) => void;
  addShift: (input: { clinician: string; period: "صباحي" | "مسائي" | "ليلي"; team: string }) => void;
  addSurgery: (input: Omit<Surgery, "id">) => void;
  updateSurgery: (surgeryId: string, input: Omit<Surgery, "id">) => void;
  addSchedulePdf: (input: Omit<SchedulePdf, "id" | "uploadedBy" | "uploadedAt">) => void;
  addCareTeam: (input: Pick<CareTeam, "name" | "shortName" | "color" | "lead">) => void;
  updateCareTeam: (teamId: string, input: Pick<CareTeam, "name" | "shortName" | "color" | "lead">) => void;
  updateMedicalFile: (teamId: string, caseId: string, input: Pick<PatientCase, "fullName" | "age" | "medicalHistory" | "clinicalTests" | "diagnosis">) => void;
  addDiagnosticImaging: (teamId: string, caseId: string, input: Omit<DiagnosticImaging, "id" | "addedBy">) => void;
  addPatientMessage: (teamId: string, caseId: string, text: string, attachment?: PatientMessage["attachment"]) => void;
  updateOwnProfile: (input: { name: string; jobTitle: string; email: string; phone: string }) => void;
  changeOwnPassword: (currentPassword: string, newPassword: string) => { ok: boolean; message?: string };
  markNotificationRead: (notificationId: string) => void;
  markAllNotificationsRead: () => void;
};

const DATA_KEY = "ksmc-neuro.demo-data.v1";
const SESSION_KEY = "ksmc-neuro.demo-session.v1";
const DepartmentContext = createContext<DepartmentStore | null>(null);

export function DepartmentProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [data, setData] = useState<DepartmentData>(createInitialDepartmentData);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const hydrate = async () => {
      try {
        const [storedData, storedSession] = await Promise.all([AsyncStorage.getItem(DATA_KEY), AsyncStorage.getItem(SESSION_KEY)]);
        if (storedData) {
          const parsedData = JSON.parse(storedData) as DepartmentData;
          setData({ ...parsedData, users: parsedData.users.map((user) => ({ ...user, jobTitle: user.jobTitle ?? "عضو القسم", permissions: user.permissions ?? rolePermissionDefaults[user.role] })), notifications: parsedData.notifications ?? [], weeklyAssignments: parsedData.weeklyAssignments ?? [], scheduleDocuments: (parsedData.scheduleDocuments ?? []).map((document) => ({ ...document, mimeType: document.mimeType ?? (document.fileName.toLowerCase().endsWith(".pdf") ? "application/pdf" : "image/*") })), surgeries: parsedData.surgeries.map((surgery) => ({ ...surgery, date: surgery.date ?? "اليوم", notes: surgery.notes ?? "" })), teams: parsedData.teams.map((team) => ({ ...team, dischargedCases: team.dischargedCases ?? [], cases: team.cases.map((patientCase) => ({ ...patientCase, fileNumber: patientCase.fileNumber ?? patientCase.code, fullName: patientCase.fullName ?? `حالة ${patientCase.code}`, age: patientCase.age ?? null, medicalHistory: patientCase.medicalHistory ?? "غير موثّق بعد", clinicalTests: patientCase.clinicalTests ?? "غير موثّق بعد", imaging: patientCase.imaging ?? [], messages: patientCase.messages ?? [] })) })) });
        }
        if (storedSession) setSession(JSON.parse(storedSession) as Session);
      } finally {
        setHydrated(true);
      }
    };
    hydrate();
  }, []);

  const updateData = useCallback((updater: (current: DepartmentData) => DepartmentData) => {
    setData((current) => {
      const next = updater(current);
      AsyncStorage.setItem(DATA_KEY, JSON.stringify(next)).catch(() => undefined);
      return next;
    });
  }, []);

  const signIn = useCallback(async (username: string, password: string) => {
    if (!username.trim() || !password.trim()) return { ok: false, message: "أدخل اسم المستخدم وكلمة المرور." };
    const isAdmin = username.trim().toLowerCase() === "admin" && password === "Neuro@2026";
    const user = isAdmin ? data.users[0] : data.users.find((item) => item.role !== "admin") ?? data.users[1];
    const nextSession: Session = { userId: user.id, name: user.name, role: isAdmin ? "admin" : user.role };
    setSession(nextSession);
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
    return { ok: true };
  }, [data.users]);

  const signInWithGoogleDemo = useCallback(async () => {
    const user = data.users[1];
    const nextSession: Session = { userId: user.id, name: user.name, role: user.role };
    setSession(nextSession);
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
  }, [data.users]);

  const signOut = useCallback(async () => {
    setSession(null);
    await AsyncStorage.removeItem(SESSION_KEY);
  }, []);

  const advanceReport = useCallback((id: string) => updateData((current) => ({
    ...current,
    reports: current.reports.map((item) => {
      const status = item.status === "جديد" ? "قيد الإعداد" : "مكتمل";
      return item.id === id ? { ...item, status } : item;
    }),
  })), [updateData]);

  const addReport = useCallback((input: { patientCode: string; title: string; priority: ReportPriority }) => updateData((current) => ({
    ...current,
    reports: [{
      id: `r-${Date.now()}`,
      patientCode: input.patientCode.trim(),
      title: input.title.trim(),
      priority: input.priority,
      status: "جديد",
      requester: session?.name ?? "مستخدم القسم",
      createdAt: "الآن",
      dueAt: input.priority === "عاجل" ? "اليوم، 13:00" : "خلال 24 ساعة",
    }, ...current.reports],
  })), [session?.name, updateData]);

  const addConsultation = useCallback((teamId: string, input: { title: string; subject: string; disposition: ClinicalDisposition; patient: ConsultationPatient }) => {
    const targetTeam = data.teams.find((team) => team.id === teamId);
    if (!targetTeam) return;
    const now = Date.now();
    const caseId = `c-${now}`;
    const patientCase: PatientCase = { id: caseId, code: input.patient.code.trim(), fileNumber: input.patient.fileNumber.trim() || input.patient.code.trim(), fullName: input.patient.fullName.trim(), age: input.patient.age, medicalHistory: input.patient.medicalHistory.trim() || "غير موثّق بعد", clinicalTests: input.patient.clinicalTests.trim() || "غير موثّق بعد", diagnosis: input.patient.diagnosis.trim(), admittedSince: "الآن", status: input.disposition === "admit" ? "منوّم" : "متابعة", imaging: [], messages: [] };
    updateData((current) => ({
      ...current,
      teams: current.teams.map((team) => team.id === teamId ? {
        ...team,
        consultations: [{ id: `q-${now}`, title: input.title.trim(), subject: input.subject.trim(), createdBy: session?.name ?? "عضو الفريق", time: "الآن", patient: input.patient, disposition: input.disposition, convertedCaseId: caseId }, ...team.consultations],
        cases: input.disposition === "discharge" ? team.cases : [patientCase, ...team.cases],
        dischargedCases: input.disposition === "discharge" ? [{ ...patientCase, dischargedAt: "الآن", dischargedBy: session?.name ?? "عضو الفريق", dischargeReason: input.subject.trim() || "خروج من الخدمة" }, ...(team.dischargedCases ?? [])] : team.dischargedCases ?? [],
      } : team),
      notifications: [createTeamNotification({ id: `n-${now}`, type: "consultation", team: targetTeam, actorName: session?.name, consultationTitle: input.title.trim() }), ...(current.notifications ?? [])],
    }));
    void dispatchTeamPush({ teamId, recipientIds: targetTeam.memberIds, type: "consultation" });
    if (input.disposition === "admit") void dispatchTeamPush({ teamId, recipientIds: targetTeam.memberIds, type: "admitted_case" });
  }, [data.teams, session?.name, updateData]);

  const addCase = useCallback((teamId: string, input: { code: string; diagnosis: string }) => {
    const targetTeam = data.teams.find((team) => team.id === teamId);
    if (!targetTeam) return;
    const now = Date.now();
    updateData((current) => ({
      ...current,
      teams: current.teams.map((team) => team.id === teamId ? {
        ...team,
        cases: [{ id: `c-${now}`, code: input.code.trim(), fileNumber: input.code.trim(), fullName: "حالة جديدة", age: null, medicalHistory: "غير موثّق بعد", clinicalTests: "غير موثّق بعد", diagnosis: input.diagnosis.trim(), admittedSince: "الآن", status: "منوّم", imaging: [], messages: [] }, ...team.cases],
      } : team),
      notifications: [createTeamNotification({ id: `n-${now}`, type: "admitted_case", team: targetTeam }), ...(current.notifications ?? [])],
    }));
    void dispatchTeamPush({ teamId, recipientIds: targetTeam.memberIds, type: "admitted_case" });
  }, [data.teams, updateData]);

  const dischargePatient = useCallback((teamId: string, caseId: string, reason: string) => {
    const team = data.teams.find((item) => item.id === teamId);
    const patient = team?.cases.find((item) => item.id === caseId);
    if (!patient) return;
    const archived: DischargedPatient = { ...patient, dischargedAt: "الآن", dischargedBy: session?.name ?? "عضو الفريق", dischargeReason: reason.trim() || "خروج من خدمة جراحة المخ والأعصاب" };
    updateData((current) => ({ ...current, teams: current.teams.map((item) => item.id === teamId ? { ...item, cases: item.cases.filter((patientCase) => patientCase.id !== caseId), dischargedCases: [archived, ...(item.dischargedCases ?? [])] } : item) }));
  }, [data.teams, session?.name, updateData]);

  const addUser = useCallback((input: { name: string; role: UserRole; teamId: string; jobTitle?: string }) => updateData((current) => {
    const id = `u-${Date.now()}`;
    const newUser: DepartmentUser = { id, name: input.name.trim(), role: input.role, jobTitle: input.jobTitle?.trim() || "عضو القسم", teamIds: [input.teamId], active: true, permissions: rolePermissionDefaults[input.role] };
    return {
      ...current,
      users: [...current.users, newUser],
      teams: current.teams.map((team) => team.id === input.teamId ? { ...team, memberIds: [...team.memberIds, id] } : team),
    };
  }), [updateData]);

  const changeUserRole = useCallback((userId: string, role: UserRole) => updateData((current) => ({
    ...current,
    users: current.users.map((item) => item.id === userId ? { ...item, role, permissions: rolePermissionDefaults[role] } : item),
  })), [updateData]);

  const updateUserAccess = useCallback((userId: string, input: { active: boolean; permissions: PermissionKey[]; teamIds: string[] }) => updateData((current) => {
    const previousUser = current.users.find((user) => user.id === userId);
    if (!previousUser) return current;
    return {
      ...current,
      users: current.users.map((user) => user.id === userId ? { ...user, ...input } : user),
      teams: current.teams.map((team) => ({
        ...team,
        memberIds: input.teamIds.includes(team.id)
          ? team.memberIds.includes(userId) ? team.memberIds : [...team.memberIds, userId]
          : team.memberIds.filter((memberId) => memberId !== userId),
      })),
    };
  }), [updateData]);

  const addShift = useCallback((input: { clinician: string; period: "صباحي" | "مسائي" | "ليلي"; team: string }) => updateData((current) => ({
    ...current,
    shifts: [{ id: `s-${Date.now()}`, date: "اليوم", period: input.period, clinician: input.clinician.trim(), role: "مناوب", team: input.team.trim(), location: "يُحدد لاحقاً" }, ...current.shifts],
  })), [updateData]);

  const addSurgery = useCallback((input: Omit<Surgery, "id">) => updateData((current) => ({
    ...current,
    surgeries: [{ ...input, id: `o-${Date.now()}`, date: input.date.trim(), time: input.time.trim(), patientCode: input.patientCode.trim(), procedure: input.procedure.trim(), surgeon: input.surgeon.trim(), room: input.room.trim(), notes: input.notes.trim() }, ...current.surgeries],
  })), [updateData]);

  const updateSurgery = useCallback((surgeryId: string, input: Omit<Surgery, "id">) => updateData((current) => ({
    ...current,
    surgeries: current.surgeries.map((surgery) => surgery.id === surgeryId ? { ...input, id: surgeryId, date: input.date.trim(), time: input.time.trim(), patientCode: input.patientCode.trim(), procedure: input.procedure.trim(), surgeon: input.surgeon.trim(), room: input.room.trim(), notes: input.notes.trim() } : surgery),
  })), [updateData]);

  const addSchedulePdf = useCallback((input: Omit<SchedulePdf, "id" | "uploadedBy" | "uploadedAt">) => updateData((current) => ({
    ...current,
    scheduleDocuments: [{ ...input, id: `pdf-${Date.now()}`, uploadedBy: session?.name ?? "مستخدم مخول", uploadedAt: "الآن" }, ...current.scheduleDocuments],
  })), [session?.name, updateData]);

  const addCareTeam = useCallback((input: Pick<CareTeam, "name" | "shortName" | "color" | "lead">) => updateData((current) => ({
    ...current,
    teams: [...current.teams, { id: `t-${Date.now()}`, ...input, memberIds: session?.userId ? [session.userId] : [], cases: [], dischargedCases: [], consultations: [] }],
  })), [session?.userId, updateData]);

  const updateCareTeam = useCallback((teamId: string, input: Pick<CareTeam, "name" | "shortName" | "color" | "lead">) => updateData((current) => ({
    ...current,
    teams: current.teams.map((team) => team.id === teamId ? { ...team, ...input } : team),
  })), [updateData]);

  const updateMedicalFile = useCallback((teamId: string, caseId: string, input: Pick<PatientCase, "fullName" | "age" | "medicalHistory" | "clinicalTests" | "diagnosis">) => updateData((current) => ({
    ...current,
    teams: current.teams.map((team) => team.id === teamId ? { ...team, cases: team.cases.map((patientCase) => patientCase.id === caseId ? { ...patientCase, ...input } : patientCase) } : team),
  })), [updateData]);

  const addDiagnosticImaging = useCallback((teamId: string, caseId: string, input: Omit<DiagnosticImaging, "id" | "addedBy">) => updateData((current) => ({
    ...current,
    teams: current.teams.map((team) => team.id === teamId ? { ...team, cases: team.cases.map((patientCase) => patientCase.id === caseId ? { ...patientCase, imaging: [{ ...input, id: `i-${Date.now()}`, addedBy: session?.name ?? "عضو الفريق" }, ...patientCase.imaging] } : patientCase) } : team),
  })), [session?.name, updateData]);

  const addPatientMessage = useCallback((teamId: string, caseId: string, text: string, attachment?: PatientMessage["attachment"]) => {
    const message: PatientMessage = { id: `m-${Date.now()}`, text: text.trim(), senderName: session?.name ?? "عضو الفريق", sentAt: "الآن", attachment };
    updateData((current) => ({
      ...current,
      teams: current.teams.map((team) => team.id === teamId ? { ...team, cases: team.cases.map((patientCase) => patientCase.id === caseId ? { ...patientCase, messages: [...patientCase.messages, message] } : patientCase) } : team),
    }));
  }, [session?.name, updateData]);

  const updateOwnProfile = useCallback((input: { name: string; jobTitle: string; email: string; phone: string }) => {
    const userId = session?.userId;
    if (!userId) return;
    const name = input.name.trim();
    updateData((current) => ({ ...current, users: current.users.map((user) => user.id === userId ? { ...user, name, jobTitle: input.jobTitle.trim(), email: input.email.trim(), phone: input.phone.trim() } : user) }));
    if (session) { const nextSession = { ...session, name }; setSession(nextSession); AsyncStorage.setItem(SESSION_KEY, JSON.stringify(nextSession)).catch(() => undefined); }
  }, [session, updateData]);

  const changeOwnPassword = useCallback((currentPassword: string, newPassword: string) => {
    if (!currentPassword || newPassword.length < 8) return { ok: false, message: "أدخل كلمة المرور الحالية وكلمة جديدة من 8 أحرف على الأقل." };
    const userId = session?.userId;
    if (!userId) return { ok: false, message: "انتهت جلسة المستخدم." };
    updateData((current) => ({ ...current, users: current.users.map((user) => user.id === userId ? { ...user, lastPasswordChangeAt: "الآن" } : user) }));
    return { ok: true };
  }, [session?.userId, updateData]);

  const markNotificationRead = useCallback((notificationId: string) => {
    const currentUserId = session?.userId;
    if (!currentUserId) return;
    updateData((current) => ({
      ...current,
      notifications: (current.notifications ?? []).map((item) => item.id === notificationId && !item.readByUserIds.includes(currentUserId)
        ? { ...item, readByUserIds: [...item.readByUserIds, currentUserId] }
        : item),
    }));
  }, [session?.userId, updateData]);

  const markAllNotificationsRead = useCallback(() => {
    const currentUserId = session?.userId;
    if (!currentUserId) return;
    updateData((current) => ({
      ...current,
      notifications: (current.notifications ?? []).map((item) => item.recipientIds.includes(currentUserId) && !item.readByUserIds.includes(currentUserId)
        ? { ...item, readByUserIds: [...item.readByUserIds, currentUserId] }
        : item),
    }));
  }, [session?.userId, updateData]);

  const value = useMemo(() => ({ hydrated, session, data, signIn, signInWithGoogleDemo, signOut, advanceReport, addReport, addConsultation, addCase, dischargePatient, addUser, changeUserRole, updateUserAccess, addShift, addSurgery, updateSurgery, addSchedulePdf, addCareTeam, updateCareTeam, updateMedicalFile, addDiagnosticImaging, addPatientMessage, updateOwnProfile, changeOwnPassword, markNotificationRead, markAllNotificationsRead }), [addCase, addCareTeam, addConsultation, addDiagnosticImaging, addPatientMessage, addReport, addSchedulePdf, addShift, addSurgery, addUser, advanceReport, changeOwnPassword, changeUserRole, data, dischargePatient, hydrated, markAllNotificationsRead, markNotificationRead, session, signIn, signInWithGoogleDemo, signOut, updateCareTeam, updateMedicalFile, updateOwnProfile, updateSurgery, updateUserAccess]);

  return <DepartmentContext.Provider value={value}>{children}</DepartmentContext.Provider>;
}

export function useDepartment() {
  const context = useContext(DepartmentContext);
  if (!context) throw new Error("useDepartment must be used inside DepartmentProvider");
  return context;
}
