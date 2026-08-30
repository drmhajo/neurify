import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AppState, Platform } from "react-native";
import {
  createInternalDepartmentData,
  applyWeeklyGroupsRoster,
  prepareInternalReleaseData,
  createTeamNotification,
  type DepartmentData,
  type DepartmentUser,
  type GeneralDiscussionMessage,
  createGeneralDiscussionMessage,
  getUnreadGeneralDiscussionCount,
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
import { syncFailureStatus, type DepartmentSyncState, parseCloudDepartmentData, prepareDepartmentDataForCloud, restoreLocalAttachmentReferences } from "@/lib/department-sync";
import { canRemoveDepartmentUser, normalizeDemoUsername } from "@/lib/department-user-admin";
import { buildDailyShiftReport } from "@/lib/shift-endorsement";
import { createGeneralAnnouncement, validateGeneralAnnouncement } from "@/lib/general-announcement";
import { isEligibleForOnCallSlot } from "@/lib/on-call-eligibility";
import { canManageDischargedCases, deleteDischargedCase, type ArchivedCaseUpdate, updateDischargedCase } from "@/lib/discharged-case-admin";
import { shouldLockLocalBootstrap } from "@/lib/local-bootstrap";
import { changeCentralPassword, pullCentralDepartmentData, resetCentralPassword, saveCentralDepartmentData, signInCentralRegistration, submitCentralRegistration } from "@/lib/central-registration-api";
import { parseStoredDepartmentSession, type DepartmentSession } from "@/lib/department-session";
import { patientUpdateMarker } from "@/lib/patient-file-updates";

type Session = DepartmentSession;

type DepartmentStore = {
  hydrated: boolean;
  session: Session | null;
  data: DepartmentData;
  completeInitialSetup: (password: string) => Promise<{ ok: boolean; message?: string }>;
  signIn: (username: string, password: string) => Promise<{ ok: boolean; message?: string; recoveryRequired?: boolean }>;
  requestRegistration: (input: { name: string; email: string; phone: string; jobTitle: string; password: string }) => Promise<{ ok: boolean; reason?: "pending" | "existing" | "service" }>;
  importApprovedRegistration: (input: { id: string; name: string; email: string; phone: string; jobTitle: string }) => void;
  signOut: () => Promise<void>;
  advanceReport: (id: string) => void;
  addReport: (input: { patientCode: string; title: string; priority: ReportPriority }) => void;
  sendGeneralAnnouncement: (input: { title: string; message: string; approvalSecret?: string }) => Promise<{ ok: boolean; recipientCount: number; pushSubmitted: number; reason?: "permission" | "validation" }>;
  generateDailyShiftReport: (selectedReportDate?: string) => DailyShiftReport | null;
  setOnCallUserId: (slot: OnCallSlot, userId: string) => void;
  addConsultation: (teamId: string, input: { title: string; subject: string; disposition: ClinicalDisposition; patient: ConsultationPatient }) => void;
  addCase: (teamId: string, input: { code: string; diagnosis: string }) => void;
  dischargePatient: (teamId: string, caseId: string, reason: string) => void;
  updateDischargedPatient: (teamId: string, caseId: string, input: ArchivedCaseUpdate) => boolean;
  deleteDischargedPatient: (teamId: string, caseId: string) => boolean;
  addUser: (input: { name: string; username: string; role: UserRole; teamId: string; jobTitle?: string }) => void;
  changeUserRole: (userId: string, role: UserRole) => void;
  updateUserAccess: (userId: string, input: { active: boolean; permissions: PermissionKey[]; teamIds: string[] }) => void;
  removeUser: (userId: string) => Promise<boolean>;
  resetUserPassword: (userId: string, approvalSecret?: string) => Promise<{ ok: boolean; temporaryPassword?: string; message?: string }>;
  addShift: (input: { clinician: string; period: "صباحي" | "مسائي" | "ليلي"; team: string }) => void;
  addSurgery: (input: Omit<Surgery, "id">) => void;
  updateSurgery: (surgeryId: string, input: Omit<Surgery, "id">) => void;
  addSchedulePdf: (input: Omit<SchedulePdf, "id" | "uploadedBy" | "uploadedAt">) => void;
  addCareTeam: (input: Pick<CareTeam, "name" | "shortName" | "color" | "lead">) => void;
  updateCareTeam: (teamId: string, input: Pick<CareTeam, "name" | "shortName" | "color" | "lead">) => void;
  updateMedicalFile: (teamId: string, caseId: string, input: Pick<PatientCase, "fullName" | "age" | "medicalHistory" | "clinicalTests" | "diagnosis" | "ward" | "bed">) => void;
  markPatientFileUpdateRead: (teamId: string, caseId: string) => void;
  updateWeekendPlan: (teamId: string, caseId: string, plan: string) => boolean;
  addDiagnosticImaging: (teamId: string, caseId: string, input: Omit<DiagnosticImaging, "id" | "addedBy">) => void;
  addPatientMessage: (teamId: string, caseId: string, text: string, attachment?: PatientMessage["attachment"]) => void;
  addGeneralDiscussionMessage: (text: string) => boolean;
  markGeneralDiscussionRead: () => void;
  updateOwnProfile: (input: { name: string; jobTitle: string; email: string; phone: string }) => void;
  changeOwnPassword: (currentPassword: string, newPassword: string) => Promise<{ ok: boolean; message?: string }>;
  markNotificationRead: (notificationId: string) => void;
  markAllNotificationsRead: () => void;
  restoreDepartmentBackup: (backup: DepartmentBackup) => boolean;
  syncState: DepartmentSyncState;
  syncNow: () => Promise<boolean>;
};

const DATA_KEY = "ksmc-neuro.department-data.v2";
const SESSION_KEY = "ksmc-neuro.department-session.v2";
const SYNC_STATE_KEY = "ksmc-neuro.department-sync-state.v2";
const CENTRAL_DATA_PROOF_KEY_PREFIX = "ksmc.neuro.central-data-proof.";
const CENTRAL_MIGRATION_BACKUP_KEY = "ksmc-neuro.central-migration-backup.v1";
const CENTRAL_CONFLICT_BACKUP_KEY = "ksmc-neuro.central-conflict-backup.v1";
const PASSWORD_KEY_PREFIX = "ksmc.neuro.department.password.";
const LEGACY_DATA_KEY = "ksmc-neuro.demo-data.v1";
const LEGACY_SESSION_KEY = "ksmc-neuro.demo-session.v1";
const LEGACY_SYNC_STATE_KEY = "ksmc-neuro.demo-sync-state.v1";
const LEGACY_PASSWORD_KEY_PREFIX = "ksmc.neuro.demo.password.";
const DepartmentContext = createContext<DepartmentStore | null>(null);
const CENTRAL_SYNC_POLL_MS = 30_000;

function passwordKey(userId: string) { return `${PASSWORD_KEY_PREFIX}${userId}`; }
function legacyPasswordKey(userId: string) { return `${LEGACY_PASSWORD_KEY_PREFIX}${userId}`; }
async function readDepartmentPassword(userId: string) {
  if (Platform.OS === "web") return (await AsyncStorage.getItem(passwordKey(userId))) ?? (await AsyncStorage.getItem(legacyPasswordKey(userId)));
  return (await SecureStore.getItemAsync(passwordKey(userId))) ?? (await SecureStore.getItemAsync(legacyPasswordKey(userId)));
}
async function hasDepartmentPassword(userId: string) { return Boolean(await readDepartmentPassword(userId)); }
async function writeDepartmentPassword(userId: string, password: string) {
  if (Platform.OS === "web") return AsyncStorage.setItem(passwordKey(userId), password);
  return SecureStore.setItemAsync(passwordKey(userId), password);
}
async function removeDepartmentPassword(userId: string) {
  if (Platform.OS === "web") return AsyncStorage.removeItem(passwordKey(userId));
  return SecureStore.deleteItemAsync(passwordKey(userId));
}
function centralDataProofKey(userId: string) { return `${CENTRAL_DATA_PROOF_KEY_PREFIX}${userId}`; }
async function readCentralDataProof(userId: string) {
  if (Platform.OS === "web") return AsyncStorage.getItem(centralDataProofKey(userId));
  return SecureStore.getItemAsync(centralDataProofKey(userId));
}
async function writeCentralDataProof(userId: string, proof: string) {
  if (Platform.OS === "web") return AsyncStorage.setItem(centralDataProofKey(userId), proof);
  return SecureStore.setItemAsync(centralDataProofKey(userId), proof);
}
async function removeCentralDataProof(userId: string) {
  if (Platform.OS === "web") return AsyncStorage.removeItem(centralDataProofKey(userId));
  return SecureStore.deleteItemAsync(centralDataProofKey(userId));
}
function persistedSession(session: Session) {
  const { dataProof: _dataProof, ...persisted } = session;
  return persisted;
}
function mergeMissingCentralUsers(remoteData: DepartmentData, localData: DepartmentData) {
  const remoteUsers = localData.users.filter((user) => user.id.startsWith("remote-") && !remoteData.users.some((candidate) => candidate.id === user.id));
  return remoteUsers.length ? { ...remoteData, users: [...remoteData.users, ...remoteUsers] } : remoteData;
}
function createTemporaryPassword() { return `KSMC-${Math.floor(100000 + Math.random() * 900000)}!`; }

export function DepartmentProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [data, setData] = useState<DepartmentData>(createInternalDepartmentData);
  const [session, setSession] = useState<Session | null>(null);
  const [syncState, setSyncState] = useState<DepartmentSyncState>({ status: "local" });
  const dataRef = useRef(data);
  const dirtyRef = useRef(false);
  const hasPersistedLocalDataRef = useRef(false);
  const firstSyncUserRef = useRef<string | null>(null);
  const hasCentralBaselineRef = useRef(false);

  useEffect(() => { dataRef.current = data; }, [data]);

  useEffect(() => {
    const hydrate = async () => {
      try {
        let initialSetupCompleted = false;
        const [storedData, legacyData, storedSession, legacySession, storedSyncState, legacySyncState] = await Promise.all([AsyncStorage.getItem(DATA_KEY), AsyncStorage.getItem(LEGACY_DATA_KEY), AsyncStorage.getItem(SESSION_KEY), AsyncStorage.getItem(LEGACY_SESSION_KEY), AsyncStorage.getItem(SYNC_STATE_KEY), AsyncStorage.getItem(LEGACY_SYNC_STATE_KEY)]);
        const restoredData = storedData ?? legacyData;
        const restoredSession = storedSession ?? legacySession;
        const restoredSyncState = storedSyncState ?? legacySyncState;
        if (restoredData) {
          hasPersistedLocalDataRef.current = true;
          let parsedData = JSON.parse(restoredData) as DepartmentData;
          parsedData.shiftReports ??= [];
          parsedData.users = parsedData.users.map((user) => ({ ...user, username: user.username ?? (user.id === "u-admin" ? "admin" : `staff-${user.id.replace(/[^a-z0-9]/gi, "")}`), passwordRecoveryRequired: user.passwordRecoveryRequired ?? false }));
          const rosterUpdated = applyWeeklyGroupsRoster(parsedData);
          const releaseReadyData = prepareInternalReleaseData(rosterUpdated);
          if (releaseReadyData !== parsedData) {
            parsedData = releaseReadyData;
            dirtyRef.current = true;
            await AsyncStorage.setItem(DATA_KEY, JSON.stringify(parsedData));
          }
          initialSetupCompleted = Boolean(parsedData.initialSetupCompleted);
          const localAdminPasswordExists = await hasDepartmentPassword("u-admin");
          if (shouldLockLocalBootstrap(parsedData, localAdminPasswordExists)) {
            parsedData = { ...parsedData, initialSetupCompleted: true };
            initialSetupCompleted = true;
            dirtyRef.current = true;
            await AsyncStorage.setItem(DATA_KEY, JSON.stringify(parsedData));
          }
          setData({ ...parsedData, shiftReportPreferences: parsedData.shiftReportPreferences ?? {}, users: parsedData.users.map((user) => ({ ...user, jobTitle: user.jobTitle ?? "عضو القسم", permissions: user.permissions ?? rolePermissionDefaults[user.role] })), notifications: parsedData.notifications ?? [], generalDiscussionMessages: parsedData.generalDiscussionMessages ?? [], generalDiscussionReadByUser: parsedData.generalDiscussionReadByUser ?? {}, weeklyAssignments: parsedData.weeklyAssignments ?? [], scheduleDocuments: (parsedData.scheduleDocuments ?? []).map((document) => ({ ...document, mimeType: document.mimeType ?? (document.fileName.toLowerCase().endsWith(".pdf") ? "application/pdf" : "image/*") })), surgeries: parsedData.surgeries.map((surgery) => ({ ...surgery, date: surgery.date ?? "اليوم", notes: surgery.notes ?? "", patientLink: surgery.patientLink ?? parsedData.teams.flatMap((team) => team.cases.map((patientCase) => patientCase.fileNumber === surgery.patientCode || patientCase.code === surgery.patientCode ? { teamId: team.id, caseId: patientCase.id } : null)).find(Boolean) ?? undefined })), teams: parsedData.teams.map((team) => ({ ...team, dischargedCases: team.dischargedCases ?? [], cases: team.cases.map((patientCase) => ({ ...patientCase, fileNumber: patientCase.fileNumber ?? patientCase.code, weekendPlan: patientCase.weekendPlan ?? "", fullName: patientCase.fullName ?? `حالة ${patientCase.code}`, age: patientCase.age ?? null, medicalHistory: patientCase.medicalHistory ?? "غير موثّق بعد", clinicalTests: patientCase.clinicalTests ?? "غير موثّق بعد", ward: patientCase.ward ?? "", bed: patientCase.bed ?? "", imaging: patientCase.imaging ?? [], messages: patientCase.messages ?? [] })) })) });
        } else {
          const freshData = { ...createInternalDepartmentData(), initialSetupCompleted: true };
          initialSetupCompleted = true;
          setData(freshData);
          await AsyncStorage.setItem(DATA_KEY, JSON.stringify(freshData));
        }
        const parsedSession = restoredSession ? parseStoredDepartmentSession(restoredSession) : null;
        const dataProof = parsedSession?.userId.startsWith("remote-") ? await readCentralDataProof(parsedSession.userId) : null;
        if (parsedSession?.userId.startsWith("remote-") && dataProof) {
          const activeSession = { ...parsedSession, dataProof };
          setSession(activeSession);
          await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(persistedSession(activeSession)));
        } else if (restoredSession) {
          await AsyncStorage.removeItem(SESSION_KEY);
        }
        if (restoredSyncState) {
          setSyncState(JSON.parse(restoredSyncState) as DepartmentSyncState);
          await AsyncStorage.setItem(SYNC_STATE_KEY, restoredSyncState);
        }
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
    const accountId = session?.userId?.replace(/^remote-/, "");
    const dataProof = session?.dataProof;
    if (!session || !accountId || !dataProof || !session.userId.startsWith("remote-")) return false;
    setSyncState((current) => ({ ...current, status: "syncing" }));
    try {
      const localData = dataRef.current;
      const remote = await pullCentralDepartmentData({ accountId, dataProof });
      if (remote.snapshot && (!hasCentralBaselineRef.current || !dirtyRef.current)) {
        if (hasPersistedLocalDataRef.current) {
          await AsyncStorage.setItem(CENTRAL_MIGRATION_BACKUP_KEY, JSON.stringify({ exportedAt: new Date().toISOString(), data: localData }));
        }
        const cloudData = parseCloudDepartmentData(remote.snapshot.data);
        const rosterData = applyWeeklyGroupsRoster(cloudData);
        const releaseReadyData = prepareInternalReleaseData(rosterData);
        const mergedUsers = mergeMissingCentralUsers(releaseReadyData, localData);
        const restored = { ...restoreLocalAttachmentReferences(mergedUsers, localData), initialSetupCompleted: true };
        dirtyRef.current = mergedUsers !== releaseReadyData || releaseReadyData !== cloudData;
        dataRef.current = restored;
        hasPersistedLocalDataRef.current = true;
        hasCentralBaselineRef.current = true;
        setData(restored);
        await AsyncStorage.setItem(DATA_KEY, JSON.stringify(restored));
        const nextState: DepartmentSyncState = { status: "synced", lastSyncedAt: remote.snapshot.updatedAt, version: remote.snapshot.version };
        setSyncState(nextState);
        await AsyncStorage.setItem(SYNC_STATE_KEY, JSON.stringify(nextState));
        return true;
      }
      if (!remote.snapshot && session.role !== "admin") {
        const nextState: DepartmentSyncState = { status: "awaiting_initialization" };
        setSyncState(nextState);
        await AsyncStorage.setItem(SYNC_STATE_KEY, JSON.stringify(nextState));
        return false;
      }
      if (remote.snapshot && syncState.version !== remote.snapshot.version) {
        await AsyncStorage.setItem(CENTRAL_CONFLICT_BACKUP_KEY, JSON.stringify({ exportedAt: new Date().toISOString(), latestVersion: remote.snapshot.version, data: localData }));
        dirtyRef.current = false;
        const nextState: DepartmentSyncState = { status: "conflict", version: remote.snapshot.version };
        setSyncState(nextState);
        await AsyncStorage.setItem(SYNC_STATE_KEY, JSON.stringify(nextState));
        return false;
      }
      const saved = await saveCentralDepartmentData({
        accountId,
        dataProof,
        expectedVersion: syncState.version ?? remote.snapshot?.version ?? 0,
        data: prepareDepartmentDataForCloud(localData),
      });
      if (!saved.ok) {
        await AsyncStorage.setItem(CENTRAL_CONFLICT_BACKUP_KEY, JSON.stringify({ exportedAt: new Date().toISOString(), latestVersion: saved.latestVersion, data: localData }));
        dirtyRef.current = false;
        const nextState: DepartmentSyncState = { status: "conflict", version: saved.latestVersion };
        setSyncState(nextState);
        await AsyncStorage.setItem(SYNC_STATE_KEY, JSON.stringify(nextState));
        return false;
      }
      dirtyRef.current = false;
      hasPersistedLocalDataRef.current = true;
      hasCentralBaselineRef.current = true;
      const nextState: DepartmentSyncState = { status: "synced", lastSyncedAt: saved.snapshot.updatedAt, version: saved.snapshot.version };
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
  }, [session, syncState.version]);

  useEffect(() => {
    if (!hydrated || !session?.dataProof || !dirtyRef.current) return;
    const timer = setTimeout(() => { void syncNow(); }, 1400);
    return () => clearTimeout(timer);
  }, [data, hydrated, session?.dataProof, syncNow]);

  useEffect(() => {
    if (!hydrated || !session?.dataProof || firstSyncUserRef.current === session.userId) return;
    firstSyncUserRef.current = session.userId;
    void syncNow();
  }, [hydrated, session?.dataProof, session?.userId, syncNow]);

  useEffect(() => {
    if (!hydrated || !session?.dataProof) return;
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void syncNow();
    });
    const interval = setInterval(() => { void syncNow(); }, CENTRAL_SYNC_POLL_MS);
    return () => {
      subscription.remove();
      clearInterval(interval);
    };
  }, [hydrated, session?.dataProof, session?.userId, syncNow]);

  const importApprovedRegistration = useCallback((input: { id: string; name: string; email: string; phone: string; jobTitle: string }) => updateData((current) => {
    const userId = `remote-${input.id}`;
    const administrator = input.email.trim().toLowerCase() === "admin@ksmc.local";
    const role: UserRole = administrator ? "admin" : "team_member";
    const registeredUser: DepartmentUser = { id: userId, username: administrator ? "admin" : input.email.trim().toLowerCase(), name: input.name.trim(), email: input.email.trim().toLowerCase(), phone: input.phone.trim(), jobTitle: input.jobTitle.trim(), role, teamIds: [], active: true, permissions: rolePermissionDefaults[role], passwordRecoveryRequired: false };
    const existing = current.users.find((user) => user.id === userId || user.email?.toLowerCase() === registeredUser.email);
    return { ...current, users: existing ? current.users.map((user) => user.id === existing.id ? { ...user, ...registeredUser, id: existing.id, permissions: user.permissions.length ? user.permissions : registeredUser.permissions } : user) : [...current.users, registeredUser] };
  }), [updateData]);

  const requestRegistration = useCallback(async (input: { name: string; email: string; phone: string; jobTitle: string; password: string }) => {
    try {
      const result = await submitCentralRegistration(input);
      return result.accepted ? { ok: true } : { ok: false, reason: result.reason };
    } catch {
      return { ok: false, reason: "service" as const };
    }
  }, []);

  const signIn = useCallback(async (username: string, password: string) => {
    if (!username.trim() || !password.trim()) return { ok: false, message: "أدخل اسم المستخدم وكلمة المرور." };
    const normalizedUsername = normalizeDemoUsername(username);
    const isCentralAdministrator = normalizedUsername === "admin";
    if (!username.includes("@") && !isCentralAdministrator) return { ok: false, message: "استخدم اسم المشرف المركزي أو البريد الإلكتروني المعتمد." };
    try {
      const remote = await signInCentralRegistration({ identifier: username.trim().toLowerCase(), password });
      if (!remote.ok) return { ok: false, message: remote.status === "pending" ? "طلب التسجيل ما زال بانتظار الموافقة." : remote.status === "rejected" ? "تم رفض طلب التسجيل. تواصل مع مشرف القسم." : "تحقق من بيانات الدخول." };
      const remoteUser: DepartmentUser = { id: remote.account.id, username: remote.account.username ?? remote.account.email, name: remote.account.name, email: remote.account.email, phone: remote.account.phone, jobTitle: remote.account.jobTitle, role: remote.account.role, teamIds: [], active: true, permissions: rolePermissionDefaults[remote.account.role], passwordRecoveryRequired: false };
      updateData((current) => ({ ...current, users: current.users.some((item) => item.id === remoteUser.id) ? current.users.map((item) => item.id === remoteUser.id ? { ...item, ...remoteUser } : item) : [...current.users.filter((item) => item.id !== "u-admin"), remoteUser] }));
      if (!remote.account.dataProof) return { ok: false, message: "تعذر تأكيد جلسة البيانات المركزية. أعد المحاولة." };
      const nextSession: Session = { userId: remoteUser.id, name: remoteUser.name, role: remoteUser.role, pushProof: remote.account.pushProof, dataProof: remote.account.dataProof };
      setSession(nextSession);
      firstSyncUserRef.current = null;
      hasCentralBaselineRef.current = false;
      setSyncState({ status: "local" });
      await Promise.all([
        AsyncStorage.setItem(SESSION_KEY, JSON.stringify(persistedSession(nextSession))),
        AsyncStorage.removeItem(SYNC_STATE_KEY),
        writeCentralDataProof(nextSession.userId, remote.account.dataProof),
      ]);
      return { ok: true, recoveryRequired: false };
    } catch {
      return { ok: false, message: "تعذر الاتصال بخدمة تسجيل المستخدمين. تحقق من الاتصال بالشبكة وحاول مرة أخرى." };
    }
  }, [data.users, updateData]);

  const completeInitialSetup = useCallback(async (password: string) => {
    void password;
    return { ok: false, message: "تم إلغاء الإعداد المحلي. سجّل الدخول بحساب المشرف المركزي." };
  }, []);

  const signOut = useCallback(async () => {
    const currentUserId = session?.userId;
    setSession(null);
    firstSyncUserRef.current = null;
    hasCentralBaselineRef.current = false;
    await Promise.all([AsyncStorage.removeItem(SESSION_KEY), currentUserId ? removeCentralDataProof(currentUserId) : Promise.resolve()]);
  }, [session?.userId]);

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

  const sendGeneralAnnouncement = useCallback(async (input: { title: string; message: string; approvalSecret?: string }) => {
    const currentUser = session ? dataRef.current.users.find((user) => user.id === session.userId) : undefined;
    if (!currentUser?.active || !currentUser.permissions.includes("send_general_announcement")) return { ok: false, recipientCount: 0, pushSubmitted: 0, reason: "permission" as const };
    const validated = validateGeneralAnnouncement(input);
    if (!validated.ok) return { ok: false, recipientCount: 0, pushSubmitted: 0, reason: "validation" as const };
    const now = Date.now();
    const recipientCount = dataRef.current.users.filter((user) => user.active).length;
    updateData((current) => {
      const recipientIds = current.users.filter((user) => user.active).map((user) => user.id);
      return { ...current, notifications: [createGeneralAnnouncement({ id: `n-general-${now}`, title: validated.title, message: validated.message, recipientIds }), ...(current.notifications ?? [])] };
    });
    const push = await dispatchGeneralPush({ recipientIds: dataRef.current.users.filter((user) => user.active).map((user) => user.id), title: validated.title, body: validated.message, approvalSecret: input.approvalSecret });
    return { ok: true, recipientCount, pushSubmitted: push.submitted };
  }, [session, updateData]);

  const generateDailyShiftReport = useCallback((selectedReportDate?: string) => {
    if (!session || !data.users.find((user) => user.id === session.userId)?.permissions.includes("manage_reports")) return null;
    const report = buildDailyShiftReport(dataRef.current, session.name, new Date(), selectedReportDate);
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
    const selectedUser = current.users.find((user) => user.id === userId);
    if (!selectedUser || !isEligibleForOnCallSlot(selectedUser, slot)) return current;
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
    const fileNumber = input.patient.fileNumber.trim() || input.patient.code.trim();
    const patientCase: PatientCase = { id: caseId, code: fileNumber, fileNumber, fullName: input.patient.fullName.trim(), age: input.patient.age, medicalHistory: input.patient.medicalHistory.trim() || "غير موثّق بعد", clinicalTests: input.patient.clinicalTests.trim() || "غير موثّق بعد", diagnosis: input.patient.diagnosis.trim(), clinicalDecision: input.patient.clinicalDecision?.trim(), surgeryType: input.patient.surgeryType?.trim(), admittedSince: "الآن", admittedAt: new Date(now).toISOString(), status: input.disposition === "admit" ? "منوّم" : "متابعة", imaging: [], messages: [], ...patientUpdateMarker(session?.userId, session?.name ?? "عضو الفريق") };
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
    void dispatchTeamPush({ teamId, recipientIds: targetTeam.memberIds, type: "consultation", accountId: session?.userId, pushProof: session?.pushProof });
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
        cases: [{ id: `c-${now}`, code: input.code.trim(), fileNumber: input.code.trim(), fullName: "حالة جديدة", age: null, medicalHistory: "غير موثّق بعد", clinicalTests: "غير موثّق بعد", diagnosis: input.diagnosis.trim(), admittedSince: "الآن", admittedAt: new Date(now).toISOString(), status: "منوّم", imaging: [], messages: [], ...patientUpdateMarker(session?.userId, session?.name ?? "عضو الفريق") }, ...team.cases],
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

  const updateDischargedPatient = useCallback((teamId: string, caseId: string, input: ArchivedCaseUpdate) => {
    if (!canManageDischargedCases(session?.role)) return false;
    const exists = dataRef.current.teams.find((team) => team.id === teamId)?.dischargedCases?.some((patient) => patient.id === caseId);
    if (!exists) return false;
    updateData((current) => updateDischargedCase(current, teamId, caseId, input));
    return true;
  }, [session?.role, updateData]);

  const deleteDischargedPatient = useCallback((teamId: string, caseId: string) => {
    if (!canManageDischargedCases(session?.role)) return false;
    const exists = dataRef.current.teams.find((team) => team.id === teamId)?.dischargedCases?.some((patient) => patient.id === caseId);
    if (!exists) return false;
    updateData((current) => deleteDischargedCase(current, teamId, caseId));
    return true;
  }, [session?.role, updateData]);

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
    await removeDepartmentPassword(userId).catch(() => undefined);
    return true;
  }, [data.users, session?.role, session?.userId, updateData]);

  const resetUserPassword = useCallback(async (userId: string, approvalSecret?: string) => {
    if (session?.role !== "admin" || !data.users.some((user) => user.id === userId)) return { ok: false };
    if (userId.startsWith("remote-")) {
      if (!approvalSecret?.trim()) return { ok: false, message: "أدخل رمز الاعتماد المركزي لإصدار كلمة مرور مؤقتة." };
      try {
        const result = await resetCentralPassword({ accountId: userId, approvalSecret: approvalSecret.trim() });
        updateData((current) => ({ ...current, users: current.users.map((user) => user.id === userId ? { ...user, passwordRecoveryRequired: true, lastPasswordChangeAt: "الآن" } : user) }));
        return result;
      } catch {
        return { ok: false, message: "تعذر استعادة كلمة المرور المركزية. تحقق من رمز الاعتماد والاتصال." };
      }
    }
    const temporaryPassword = createTemporaryPassword();
    await writeDepartmentPassword(userId, temporaryPassword);
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
    const matchedPatient = current.teams.flatMap((team) => team.cases.map((patientCase) => patientCase.fileNumber === input.patientCode.trim() || patientCase.code === input.patientCode.trim() ? { teamId: team.id, caseId: patientCase.id } : null)).find(Boolean) ?? undefined;
    const patientLink = input.patientLink ?? matchedPatient;
    return { ...current, surgeries: [{ ...input, id: `o-${Date.now()}`, patientLink, date: input.date.trim(), time: input.time.trim(), patientCode: input.patientCode.trim(), procedure: input.procedure.trim(), surgeon: input.surgeon.trim(), room: input.room.trim(), notes: input.notes.trim(), recordedAt: input.recordedAt ?? new Date().toISOString() }, ...current.surgeries], teams: patientLink ? current.teams.map((team) => team.id === patientLink.teamId ? { ...team, cases: team.cases.map((patient) => patient.id === patientLink.caseId ? { ...patient, ...patientUpdateMarker(session?.userId, session?.name ?? "عضو الفريق") } : patient) } : team) : current.teams };
  }), [session?.name, session?.userId, updateData]);

  const updateSurgery = useCallback((surgeryId: string, input: Omit<Surgery, "id">) => updateData((current) => {
    const matchedPatient = current.teams.flatMap((team) => team.cases.map((patientCase) => patientCase.fileNumber === input.patientCode.trim() || patientCase.code === input.patientCode.trim() ? { teamId: team.id, caseId: patientCase.id } : null)).find(Boolean) ?? undefined;
    const patientLink = input.patientLink ?? matchedPatient;
    return { ...current, surgeries: current.surgeries.map((surgery) => surgery.id === surgeryId ? { ...input, id: surgeryId, patientLink, date: input.date.trim(), time: input.time.trim(), patientCode: input.patientCode.trim(), procedure: input.procedure.trim(), surgeon: input.surgeon.trim(), room: input.room.trim(), notes: input.notes.trim() } : surgery), teams: patientLink ? current.teams.map((team) => team.id === patientLink.teamId ? { ...team, cases: team.cases.map((patient) => patient.id === patientLink.caseId ? { ...patient, ...patientUpdateMarker(session?.userId, session?.name ?? "عضو الفريق") } : patient) } : team) : current.teams };
  }), [session?.name, session?.userId, updateData]);

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

  const updateMedicalFile = useCallback((teamId: string, caseId: string, input: Pick<PatientCase, "fullName" | "age" | "medicalHistory" | "clinicalTests" | "diagnosis" | "ward" | "bed">) => updateData((current) => ({
    ...current,
    teams: current.teams.map((team) => team.id === teamId ? { ...team, cases: team.cases.map((patientCase) => patientCase.id === caseId ? { ...patientCase, ...input, ...patientUpdateMarker(session?.userId, session?.name ?? "عضو الفريق") } : patientCase) } : team),
  })), [session?.name, session?.userId, updateData]);

  const markPatientFileUpdateRead = useCallback((teamId: string, caseId: string) => {
    const userId = session?.userId;
    if (!userId) return;
    const patient = dataRef.current.teams.find((team) => team.id === teamId)?.cases.find((item) => item.id === caseId);
    if (!patient?.lastUpdatedAt || patient.updateReadByUserIds?.includes(userId)) return;
    updateData((current) => ({
      ...current,
      teams: current.teams.map((team) => team.id === teamId ? { ...team, cases: team.cases.map((patientCase) => patientCase.id === caseId ? { ...patientCase, updateReadByUserIds: [...(patientCase.updateReadByUserIds ?? []), userId] } : patientCase) } : team),
    }));
  }, [session?.userId, updateData]);

  const updateWeekendPlan = useCallback((teamId: string, caseId: string, plan: string) => {
    const team = data.teams.find((item) => item.id === teamId);
    const allowed = Boolean(team && session);
    if (!allowed) return false;
    updateData((current) => ({
      ...current,
      teams: current.teams.map((item) => item.id === teamId ? {
        ...item,
        cases: item.cases.map((patientCase) => patientCase.id === caseId ? {
          ...patientCase,
          weekendPlan: plan.trim(),
          weekendPlanUpdatedAt: new Date().toISOString(),
          weekendPlanUpdatedBy: session?.name ?? "عضو الفريق",
          ...patientUpdateMarker(session?.userId, session?.name ?? "عضو الفريق"),
        } : patientCase),
      } : item),
    }));
    return true;
  }, [data.teams, session?.name, session?.role, session?.userId, updateData]);

  const addDiagnosticImaging = useCallback((teamId: string, caseId: string, input: Omit<DiagnosticImaging, "id" | "addedBy">) => updateData((current) => ({
    ...current,
    teams: current.teams.map((team) => team.id === teamId ? { ...team, cases: team.cases.map((patientCase) => patientCase.id === caseId ? { ...patientCase, imaging: [{ ...input, id: `i-${Date.now()}`, addedBy: session?.name ?? "عضو الفريق" }, ...patientCase.imaging], ...patientUpdateMarker(session?.userId, session?.name ?? "عضو الفريق") } : patientCase) } : team),
  })), [session?.name, session?.userId, updateData]);

  const addPatientMessage = useCallback((teamId: string, caseId: string, text: string, attachment?: PatientMessage["attachment"]) => {
    const message: PatientMessage = { id: `m-${Date.now()}`, text: text.trim(), senderName: session?.name ?? "عضو الفريق", sentAt: "الآن", attachment };
    updateData((current) => ({
      ...current,
    teams: current.teams.map((team) => team.id === teamId ? { ...team, cases: team.cases.map((patientCase) => patientCase.id === caseId ? { ...patientCase, messages: [...patientCase.messages, message], ...patientUpdateMarker(session?.userId, session?.name ?? "عضو الفريق") } : patientCase) } : team),
    }));
  }, [session?.name, session?.userId, updateData]);

  const addGeneralDiscussionMessage = useCallback((text: string) => {
    const currentUser = session ? dataRef.current.users.find((user) => user.id === session.userId) : undefined;
    if (!currentUser?.active || !text.trim()) return false;
    const message: GeneralDiscussionMessage = createGeneralDiscussionMessage({
      id: `g-${Date.now()}`,
      text,
      senderId: currentUser.id,
      senderName: currentUser.name,
      sentAt: "الآن",
      sentAtIso: new Date().toISOString(),
    });
    updateData((current) => ({ ...current, generalDiscussionMessages: [...(current.generalDiscussionMessages ?? []), message] }));
    return true;
  }, [session, updateData]);

  const markGeneralDiscussionRead = useCallback(() => {
    const userId = session?.userId;
    if (!userId || !getUnreadGeneralDiscussionCount({ messages: dataRef.current.generalDiscussionMessages ?? [], userId, lastReadAt: dataRef.current.generalDiscussionReadByUser?.[userId] })) return;
    updateData((current) => ({ ...current, generalDiscussionReadByUser: { ...(current.generalDiscussionReadByUser ?? {}), [userId]: new Date().toISOString() } }));
  }, [session?.userId, updateData]);

  const updateOwnProfile = useCallback((input: { name: string; jobTitle: string; email: string; phone: string }) => {
    const userId = session?.userId;
    if (!userId) return;
    const name = input.name.trim();
    updateData((current) => ({ ...current, users: current.users.map((user) => user.id === userId ? { ...user, name, jobTitle: input.jobTitle.trim(), email: input.email.trim(), phone: input.phone.trim() } : user) }));
    if (session) { const nextSession = { ...session, name }; setSession(nextSession); AsyncStorage.setItem(SESSION_KEY, JSON.stringify(persistedSession(nextSession))).catch(() => undefined); }
  }, [session, updateData]);

  const changeOwnPassword = useCallback(async (currentPassword: string, newPassword: string) => {
    if (!currentPassword || newPassword.length < 8) return { ok: false, message: "أدخل كلمة المرور الحالية وكلمة جديدة من 8 أحرف على الأقل." };
    const userId = session?.userId;
    if (!userId) return { ok: false, message: "انتهت جلسة المستخدم." };
    if (userId.startsWith("remote-")) {
      if (!session?.pushProof) return { ok: false, message: "أعد تسجيل الدخول لتأكيد جلسة الحساب المركزي قبل تغيير كلمة المرور." };
      try {
        await changeCentralPassword({ accountId: userId, pushProof: session.pushProof, currentPassword, newPassword });
        updateData((current) => ({ ...current, users: current.users.map((user) => user.id === userId ? { ...user, lastPasswordChangeAt: "الآن", passwordRecoveryRequired: false } : user) }));
        return { ok: true };
      } catch {
        return { ok: false, message: "تعذر تغيير كلمة المرور المركزية. تحقق من كلمة المرور الحالية والاتصال." };
      }
    }
    if (currentPassword !== await readDepartmentPassword(userId)) return { ok: false, message: "كلمة المرور الحالية غير صحيحة." };
    await writeDepartmentPassword(userId, newPassword);
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

  const value = useMemo(() => ({ hydrated, session, data, completeInitialSetup, signIn, requestRegistration, importApprovedRegistration, signOut, advanceReport, addReport, sendGeneralAnnouncement, generateDailyShiftReport, setOnCallUserId, addConsultation, addCase, dischargePatient, updateDischargedPatient, deleteDischargedPatient, addUser, changeUserRole, updateUserAccess, removeUser, resetUserPassword, addShift, addSurgery, updateSurgery, addSchedulePdf, addCareTeam, updateCareTeam, updateMedicalFile, markPatientFileUpdateRead, updateWeekendPlan, addDiagnosticImaging, addPatientMessage, addGeneralDiscussionMessage, markGeneralDiscussionRead, updateOwnProfile, changeOwnPassword, markNotificationRead, markAllNotificationsRead, restoreDepartmentBackup, syncState, syncNow }), [addCase, addCareTeam, addConsultation, addDiagnosticImaging, addGeneralDiscussionMessage, addPatientMessage, addReport, addSchedulePdf, addShift, addSurgery, addUser, advanceReport, changeOwnPassword, changeUserRole, completeInitialSetup, data, deleteDischargedPatient, dischargePatient, generateDailyShiftReport, hydrated, importApprovedRegistration, markAllNotificationsRead, markGeneralDiscussionRead, markNotificationRead, markPatientFileUpdateRead, removeUser, requestRegistration, resetUserPassword, restoreDepartmentBackup, sendGeneralAnnouncement, session, setOnCallUserId, signIn, signOut, syncNow, syncState, updateCareTeam, updateDischargedPatient, updateMedicalFile, updateOwnProfile, updateSurgery, updateUserAccess, updateWeekendPlan]);

  return <DepartmentContext.Provider value={value}>{children}</DepartmentContext.Provider>;
}

export function useDepartment() {
  const context = useContext(DepartmentContext);
  if (!context) throw new Error("useDepartment must be used inside DepartmentProvider");
  return context;
}
