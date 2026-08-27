import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Platform } from "react-native";
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
  type DailyShiftReport,
  type OnCallSlot,
  rolePermissionDefaults,
} from "@/lib/department-model";
import { dispatchGeneralPush, dispatchTeamPush } from "@/lib/push-notifications";
import type { DepartmentBackup } from "@/lib/department-backup";
import { createTRPCClient } from "@/lib/trpc";
import { syncFailureStatus, type DepartmentSyncState, parseCloudDepartmentData, prepareDepartmentDataForCloud, restoreLocalAttachmentReferences } from "@/lib/department-sync";
import { canRemoveDepartmentUser, normalizeDemoUsername } from "@/lib/department-user-admin";
import { buildDailyShiftReport } from "@/lib/shift-endorsement";
import { createGeneralAnnouncement, validateGeneralAnnouncement } from "@/lib/general-announcement";

type Session = {
  userId: string;
  name: string;
  role: UserRole;
};

type DepartmentStore = {
  hydrated: boolean;
  session: Session | null;
  data: DepartmentData;
  signIn: (username: string, password: string) => Promise<{ ok: boolean; message?: string; recoveryRequired?: boolean }>;
  signInWithGoogleDemo: () => Promise<void>;
  signOut: () => Promise<void>;
  advanceReport: (id: string) => void;
  addReport: (input: { patientCode: string; title: string; priority: ReportPriority }) => void;
  sendGeneralAnnouncement: (input: { title: string; message: string }) => { ok: boolean; recipientCount: number; reason?: "permission" | "validation" };
  generateDailyShiftReport: () => DailyShiftReport | null;
  setOnCallUserId: (slot: OnCallSlot, userId: string) => void;
  addConsultation: (teamId: string, input: { title: string; subject: string; disposition: ClinicalDisposition; patient: ConsultationPatient }) => void;
  addCase: (teamId: string, input: { code: string; diagnosis: string }) => void;
  dischargePatient: (teamId: string, caseId: string, reason: string) => void;
  addUser: (input: { name: string; username: string; role: UserRole; teamId: string; jobTitle?: string }) => void;
  changeUserRole: (userId: string, role: UserRole) => void;
  updateUserAccess: (userId: string, input: { active: boolean; permissions: PermissionKey[]; teamIds: string[] }) => void;
  removeUser: (userId: string) => Promise<boolean>;
  resetUserPassword: (userId: string) => Promise<{ ok: boolean; temporaryPassword?: string }>;
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
  changeOwnPassword: (currentPassword: string, newPassword: string) => Promise<{ ok: boolean; message?: string }>;
  markNotificationRead: (notificationId: string) => void;
  markAllNotificationsRead: () => void;
  restoreDepartmentBackup: (backup: DepartmentBackup) => boolean;
  syncState: DepartmentSyncState;
  syncNow: () => Promise<boolean>;
};

const DATA_KEY = "ksmc-neuro.demo-data.v1";
const SESSION_KEY = "ksmc-neuro.demo-session.v1";
const SYNC_STATE_KEY = "ksmc-neuro.demo-sync-state.v1";
const PASSWORD_KEY_PREFIX = "ksmc.neuro.demo.password.";
const DEFAULT_DEMO_PASSWORD = "Neuro@2026";
const DepartmentContext = createContext<DepartmentStore | null>(null);

function passwordKey(userId: string) { return `${PASSWORD_KEY_PREFIX}${userId}`; }
async function readDemoPassword(userId: string) {
  if (Platform.OS === "web") return (await AsyncStorage.getItem(passwordKey(userId))) ?? DEFAULT_DEMO_PASSWORD;
  return (await SecureStore.getItemAsync(passwordKey(userId))) ?? DEFAULT_DEMO_PASSWORD;
}
async function writeDemoPassword(userId: string, password: string) {
  if (Platform.OS === "web") return AsyncStorage.setItem(passwordKey(userId), password);
  return SecureStore.setItemAsync(passwordKey(userId), password);
}
async function removeDemoPassword(userId: string) {
  if (Platform.OS === "web") return AsyncStorage.removeItem(passwordKey(userId));
  return SecureStore.deleteItemAsync(passwordKey(userId));
}
function createTemporaryPassword() { return `KSMC-${Math.floor(100000 + Math.random() * 900000)}!`; }

export function DepartmentProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [data, setData] = useState<DepartmentData>(createInitialDepartmentData);
  const [session, setSession] = useState<Session | null>(null);
  const [syncState, setSyncState] = useState<DepartmentSyncState>({ status: "local" });
  const dataRef = useRef(data);
  const dirtyRef = useRef(false);
  const hasPersistedLocalDataRef = useRef(false);
  const firstSyncUserRef = useRef<string | null>(null);
  const trpcClient = useMemo(() => createTRPCClient(), []);

  useEffect(() => { dataRef.current = data; }, [data]);

  useEffect(() => {
    const hydrate = async () => {
      try {
        const [storedData, storedSession, storedSyncState] = await Promise.all([AsyncStorage.getItem(DATA_KEY), AsyncStorage.getItem(SESSION_KEY), AsyncStorage.getItem(SYNC_STATE_KEY)]);
        if (storedData) {
          hasPersistedLocalDataRef.current = true;
          const parsedData = JSON.parse(storedData) as DepartmentData;
          parsedData.shiftReports ??= [];
          parsedData.users = parsedData.users.map((user) => ({ ...user, username: user.username ?? (user.id === "u-admin" ? "admin" : `staff-${user.id.replace(/[^a-z0-9]/gi, "")}`), passwordRecoveryRequired: user.passwordRecoveryRequired ?? false }));
          setData({ ...parsedData, shiftReportPreferences: parsedData.shiftReportPreferences ?? {}, users: parsedData.users.map((user) => ({ ...user, jobTitle: user.jobTitle ?? "عضو القسم", permissions: user.permissions ?? rolePermissionDefaults[user.role] })), notifications: parsedData.notifications ?? [], weeklyAssignments: parsedData.weeklyAssignments ?? [], scheduleDocuments: (parsedData.scheduleDocuments ?? []).map((document) => ({ ...document, mimeType: document.mimeType ?? (document.fileName.toLowerCase().endsWith(".pdf") ? "application/pdf" : "image/*") })), surgeries: parsedData.surgeries.map((surgery) => ({ ...surgery, date: surgery.date ?? "اليوم", notes: surgery.notes ?? "", patientLink: surgery.patientLink ?? parsedData.teams.flatMap((team) => team.cases.map((patientCase) => patientCase.code === surgery.patientCode ? { teamId: team.id, caseId: patientCase.id } : null)).find(Boolean) ?? undefined })), teams: parsedData.teams.map((team) => ({ ...team, dischargedCases: team.dischargedCases ?? [], cases: team.cases.map((patientCase) => ({ ...patientCase, fileNumber: patientCase.fileNumber ?? patientCase.code, fullName: patientCase.fullName ?? `حالة ${patientCase.code}`, age: patientCase.age ?? null, medicalHistory: patientCase.medicalHistory ?? "غير موثّق بعد", clinicalTests: patientCase.clinicalTests ?? "غير موثّق بعد", imaging: patientCase.imaging ?? [], messages: patientCase.messages ?? [] })) })) });
        }
        if (storedSession) setSession(JSON.parse(storedSession) as Session);
        if (storedSyncState) setSyncState(JSON.parse(storedSyncState) as DepartmentSyncState);
      } finally {
        setHydrated(true);
      }
    };
    hydrate();
  }, []);

  const updateData = useCallback((updater: (current: DepartmentData) => DepartmentData) => {
    setData((current) => {
      const next = updater(current);
      dataRef.current = next;
      dirtyRef.current = true;
      AsyncStorage.setItem(DATA_KEY, JSON.stringify(next)).catch(() => undefined);
      return next;
    });
  }, []);

  const syncNow = useCallback(async () => {
    if (session?.role !== "admin") return false;
    setSyncState((current) => ({ ...current, status: "syncing" }));
    try {
      const localData = dataRef.current;
      if (!hasPersistedLocalDataRef.current && !dirtyRef.current) {
        const remote = await trpcClient.cloudSync.pull.query();
        if (remote) {
          const restored = restoreLocalAttachmentReferences(parseCloudDepartmentData(remote.data), localData);
          dataRef.current = restored;
          hasPersistedLocalDataRef.current = true;
          setData(restored);
          await AsyncStorage.setItem(DATA_KEY, JSON.stringify(restored));
          const nextState: DepartmentSyncState = { status: "synced", lastSyncedAt: remote.updatedAt, version: remote.version };
          setSyncState(nextState);
          await AsyncStorage.setItem(SYNC_STATE_KEY, JSON.stringify(nextState));
          return true;
        }
      }
      const saved = await trpcClient.cloudSync.push.mutate({ data: prepareDepartmentDataForCloud(localData), actorName: session.name });
      dirtyRef.current = false;
      hasPersistedLocalDataRef.current = true;
      const nextState: DepartmentSyncState = { status: "synced", lastSyncedAt: saved.updatedAt, version: saved.version };
      setSyncState(nextState);
      await AsyncStorage.setItem(SYNC_STATE_KEY, JSON.stringify(nextState));
      return true;
    } catch (error) {
      const status = syncFailureStatus(error);
      setSyncState((current) => {
        const nextState: DepartmentSyncState = { ...current, status };
        AsyncStorage.setItem(SYNC_STATE_KEY, JSON.stringify(nextState)).catch(() => undefined);
        return nextState;
      });
      return false;
    }
  }, [session, trpcClient]);

  useEffect(() => {
    if (!hydrated || session?.role !== "admin" || !dirtyRef.current) return;
    const timer = setTimeout(() => { void syncNow(); }, 1400);
    return () => clearTimeout(timer);
  }, [data, hydrated, session?.role, syncNow]);

  useEffect(() => {
    if (!hydrated || session?.role !== "admin" || firstSyncUserRef.current === session.userId) return;
    firstSyncUserRef.current = session.userId;
    void syncNow();
  }, [hydrated, session?.role, session?.userId, syncNow]);

  const signIn = useCallback(async (username: string, password: string) => {
    if (!username.trim() || !password.trim()) return { ok: false, message: "أدخل اسم المستخدم وكلمة المرور." };
    const user = data.users.find((item) => item.active && normalizeDemoUsername(item.username ?? "") === normalizeDemoUsername(username));
    if (!user || password !== await readDemoPassword(user.id)) return { ok: false, message: "تحقق من بيانات الدخول." };
    const nextSession: Session = { userId: user.id, name: user.name, role: user.role };
    setSession(nextSession);
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
    return { ok: true, recoveryRequired: user.passwordRecoveryRequired };
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

  const sendGeneralAnnouncement = useCallback((input: { title: string; message: string }) => {
    const currentUser = session ? dataRef.current.users.find((user) => user.id === session.userId) : undefined;
    if (!currentUser?.active || !currentUser.permissions.includes("send_general_announcement")) return { ok: false, recipientCount: 0, reason: "permission" as const };
    const validated = validateGeneralAnnouncement(input);
    if (!validated.ok) return { ok: false, recipientCount: 0, reason: "validation" as const };
    const now = Date.now();
    const recipientCount = dataRef.current.users.filter((user) => user.active).length;
    updateData((current) => {
      const recipientIds = current.users.filter((user) => user.active).map((user) => user.id);
      return { ...current, notifications: [createGeneralAnnouncement({ id: `n-general-${now}`, title: validated.title, message: validated.message, recipientIds }), ...(current.notifications ?? [])] };
    });
    void dispatchGeneralPush({ recipientIds: dataRef.current.users.filter((user) => user.active).map((user) => user.id), title: validated.title, body: validated.message });
    return { ok: true, recipientCount };
  }, [session, updateData]);

  const generateDailyShiftReport = useCallback(() => {
    if (!session || !data.users.find((user) => user.id === session.userId)?.permissions.includes("manage_reports")) return null;
    const report = buildDailyShiftReport(dataRef.current, session.name);
    updateData((current) => {
      const recipients = current.users.filter((user) => user.active && user.permissions.includes("manage_reports")).map((user) => user.id);
      const notificationId = `n-${report.id}`;
      return {
        ...current,
        shiftReports: [report, ...(current.shiftReports ?? []).filter((item) => item.id !== report.id)],
        notifications: current.notifications.some((item) => item.id === notificationId) ? current.notifications : [{ id: notificationId, type: "shift_report", teamId: "department", teamName: "قسم جراحة المخ والأعصاب", title: "تقرير المناوبة اليومي جاهز", message: `تم إعداد تقرير مناوبة ${report.reportDate}. يمكنك فتحه أو تنزيله من صفحة التقارير.`, createdAt: "الآن", recipientIds: recipients, readByUserIds: [] }, ...current.notifications],
      };
    });
    return report;
  }, [data.users, session, updateData]);

  const setOnCallUserId = useCallback((slot: OnCallSlot, userId: string) => updateData((current) => {
    const preferenceKey: Record<OnCallSlot, "firstOnCallUserId" | "secondOnCallUserId" | "thirdOnCallUserId"> = {
      first: "firstOnCallUserId",
      second: "secondOnCallUserId",
      third: "thirdOnCallUserId",
    };
    return {
      ...current,
      shiftReportPreferences: { ...current.shiftReportPreferences, [preferenceKey[slot]]: userId },
    };
  }), [updateData]);

  const addConsultation = useCallback((teamId: string, input: { title: string; subject: string; disposition: ClinicalDisposition; patient: ConsultationPatient }) => {
    const targetTeam = data.teams.find((team) => team.id === teamId);
    if (!targetTeam) return;
    const now = Date.now();
    const caseId = `c-${now}`;
    const patientCase: PatientCase = { id: caseId, code: input.patient.code.trim(), fileNumber: input.patient.fileNumber.trim() || input.patient.code.trim(), fullName: input.patient.fullName.trim(), age: input.patient.age, medicalHistory: input.patient.medicalHistory.trim() || "غير موثّق بعد", clinicalTests: input.patient.clinicalTests.trim() || "غير موثّق بعد", diagnosis: input.patient.diagnosis.trim(), clinicalDecision: input.patient.clinicalDecision?.trim(), surgeryType: input.patient.surgeryType?.trim(), admittedSince: "الآن", admittedAt: new Date(now).toISOString(), status: input.disposition === "admit" ? "منوّم" : "متابعة", imaging: [], messages: [] };
    updateData((current) => ({
      ...current,
      teams: current.teams.map((team) => team.id === teamId ? {
        ...team,
        consultations: [{ id: `q-${now}`, title: input.title.trim(), subject: input.subject.trim(), createdBy: session?.name ?? "عضو الفريق", time: "الآن", createdAt: new Date(now).toISOString(), patient: input.patient, disposition: input.disposition, convertedCaseId: caseId }, ...team.consultations],
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
        cases: [{ id: `c-${now}`, code: input.code.trim(), fileNumber: input.code.trim(), fullName: "حالة جديدة", age: null, medicalHistory: "غير موثّق بعد", clinicalTests: "غير موثّق بعد", diagnosis: input.diagnosis.trim(), admittedSince: "الآن", admittedAt: new Date(now).toISOString(), status: "منوّم", imaging: [], messages: [] }, ...team.cases],
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

  const addUser = useCallback((input: { name: string; username: string; role: UserRole; teamId: string; jobTitle?: string }) => updateData((current) => {
    const id = `u-${Date.now()}`;
    const newUser: DepartmentUser = { id, username: normalizeDemoUsername(input.username), name: input.name.trim(), role: input.role, jobTitle: input.jobTitle?.trim() || "عضو القسم", teamIds: [input.teamId], active: true, permissions: rolePermissionDefaults[input.role], passwordRecoveryRequired: true };
    return {
      ...current,
      users: [...current.users, newUser],
      teams: current.teams.map((team) => team.id === input.teamId ? { ...team, memberIds: [...team.memberIds, id] } : team),
    };
  }), [updateData]);

  const removeUser = useCallback(async (userId: string) => {
    if (session?.role !== "admin" || !canRemoveDepartmentUser(data.users, userId, session.userId)) return false;
    updateData((current) => ({ ...current, users: current.users.filter((user) => user.id !== userId), teams: current.teams.map((team) => ({ ...team, memberIds: team.memberIds.filter((memberId) => memberId !== userId) })) }));
    await removeDemoPassword(userId).catch(() => undefined);
    return true;
  }, [data.users, session?.role, session?.userId, updateData]);

  const resetUserPassword = useCallback(async (userId: string) => {
    if (session?.role !== "admin" || !data.users.some((user) => user.id === userId)) return { ok: false };
    const temporaryPassword = createTemporaryPassword();
    await writeDemoPassword(userId, temporaryPassword);
    updateData((current) => ({ ...current, users: current.users.map((user) => user.id === userId ? { ...user, passwordRecoveryRequired: true, lastPasswordChangeAt: "الآن" } : user) }));
    return { ok: true, temporaryPassword };
  }, [data.users, session?.role, updateData]);

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

  const addSurgery = useCallback((input: Omit<Surgery, "id">) => updateData((current) => {
    const matchedPatient = current.teams.flatMap((team) => team.cases.map((patientCase) => patientCase.code === input.patientCode.trim() ? { teamId: team.id, caseId: patientCase.id } : null)).find(Boolean) ?? undefined;
    return { ...current, surgeries: [{ ...input, id: `o-${Date.now()}`, patientLink: input.patientLink ?? matchedPatient, date: input.date.trim(), time: input.time.trim(), patientCode: input.patientCode.trim(), procedure: input.procedure.trim(), surgeon: input.surgeon.trim(), room: input.room.trim(), notes: input.notes.trim(), recordedAt: input.recordedAt ?? new Date().toISOString() }, ...current.surgeries] };
  }), [updateData]);

  const updateSurgery = useCallback((surgeryId: string, input: Omit<Surgery, "id">) => updateData((current) => {
    const matchedPatient = current.teams.flatMap((team) => team.cases.map((patientCase) => patientCase.code === input.patientCode.trim() ? { teamId: team.id, caseId: patientCase.id } : null)).find(Boolean) ?? undefined;
    return { ...current, surgeries: current.surgeries.map((surgery) => surgery.id === surgeryId ? { ...input, id: surgeryId, patientLink: input.patientLink ?? matchedPatient, date: input.date.trim(), time: input.time.trim(), patientCode: input.patientCode.trim(), procedure: input.procedure.trim(), surgeon: input.surgeon.trim(), room: input.room.trim(), notes: input.notes.trim() } : surgery) };
  }), [updateData]);

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

  const changeOwnPassword = useCallback(async (currentPassword: string, newPassword: string) => {
    if (!currentPassword || newPassword.length < 8) return { ok: false, message: "أدخل كلمة المرور الحالية وكلمة جديدة من 8 أحرف على الأقل." };
    const userId = session?.userId;
    if (!userId) return { ok: false, message: "انتهت جلسة المستخدم." };
    if (currentPassword !== await readDemoPassword(userId)) return { ok: false, message: "كلمة المرور الحالية غير صحيحة." };
    await writeDemoPassword(userId, newPassword);
    updateData((current) => ({ ...current, users: current.users.map((user) => user.id === userId ? { ...user, lastPasswordChangeAt: "الآن", passwordRecoveryRequired: false } : user) }));
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

  const restoreDepartmentBackup = useCallback((backup: DepartmentBackup) => {
    if (session?.role !== "admin") return false;
    updateData(() => backup.data);
    return true;
  }, [session?.role, updateData]);

  const value = useMemo(() => ({ hydrated, session, data, signIn, signInWithGoogleDemo, signOut, advanceReport, addReport, sendGeneralAnnouncement, generateDailyShiftReport, setOnCallUserId, addConsultation, addCase, dischargePatient, addUser, changeUserRole, updateUserAccess, removeUser, resetUserPassword, addShift, addSurgery, updateSurgery, addSchedulePdf, addCareTeam, updateCareTeam, updateMedicalFile, addDiagnosticImaging, addPatientMessage, updateOwnProfile, changeOwnPassword, markNotificationRead, markAllNotificationsRead, restoreDepartmentBackup, syncState, syncNow }), [addCase, addCareTeam, addConsultation, addDiagnosticImaging, addPatientMessage, addReport, addSchedulePdf, addShift, addSurgery, addUser, advanceReport, changeOwnPassword, changeUserRole, data, dischargePatient, generateDailyShiftReport, hydrated, markAllNotificationsRead, markNotificationRead, removeUser, resetUserPassword, restoreDepartmentBackup, sendGeneralAnnouncement, session, setOnCallUserId, signIn, signInWithGoogleDemo, signOut, syncNow, syncState, updateCareTeam, updateMedicalFile, updateOwnProfile, updateSurgery, updateUserAccess]);

  return <DepartmentContext.Provider value={value}>{children}</DepartmentContext.Provider>;
}

export function useDepartment() {
  const context = useContext(DepartmentContext);
  if (!context) throw new Error("useDepartment must be used inside DepartmentProvider");
  return context;
}
