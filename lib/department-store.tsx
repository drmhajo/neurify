import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  createInitialDepartmentData,
  createTeamNotification,
  type DepartmentData,
  type DepartmentUser,
  type ReportPriority,
  type UserRole,
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
  addConsultation: (teamId: string, input: { title: string; subject: string }) => void;
  addCase: (teamId: string, input: { code: string; diagnosis: string }) => void;
  addUser: (input: { name: string; role: UserRole; teamId: string }) => void;
  changeUserRole: (userId: string, role: UserRole) => void;
  addShift: (input: { clinician: string; period: "صباحي" | "مسائي" | "ليلي"; team: string }) => void;
  addSurgery: (input: { patientCode: string; procedure: string; surgeon: string }) => void;
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
          setData({ ...parsedData, notifications: parsedData.notifications ?? [] });
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

  const addConsultation = useCallback((teamId: string, input: { title: string; subject: string }) => {
    const targetTeam = data.teams.find((team) => team.id === teamId);
    if (!targetTeam) return;
    const now = Date.now();
    updateData((current) => ({
      ...current,
      teams: current.teams.map((team) => team.id === teamId ? {
        ...team,
        consultations: [{ id: `q-${now}`, title: input.title.trim(), subject: input.subject.trim(), createdBy: session?.name ?? "عضو الفريق", time: "الآن" }, ...team.consultations],
      } : team),
      notifications: [createTeamNotification({ id: `n-${now}`, type: "consultation", team: targetTeam, actorName: session?.name, consultationTitle: input.title.trim() }), ...(current.notifications ?? [])],
    }));
    void dispatchTeamPush({ teamId, recipientIds: targetTeam.memberIds, type: "consultation" });
  }, [data.teams, session?.name, updateData]);

  const addCase = useCallback((teamId: string, input: { code: string; diagnosis: string }) => {
    const targetTeam = data.teams.find((team) => team.id === teamId);
    if (!targetTeam) return;
    const now = Date.now();
    updateData((current) => ({
      ...current,
      teams: current.teams.map((team) => team.id === teamId ? {
        ...team,
        cases: [{ id: `c-${now}`, code: input.code.trim(), diagnosis: input.diagnosis.trim(), admittedSince: "الآن", status: "منوّم" }, ...team.cases],
      } : team),
      notifications: [createTeamNotification({ id: `n-${now}`, type: "admitted_case", team: targetTeam }), ...(current.notifications ?? [])],
    }));
    void dispatchTeamPush({ teamId, recipientIds: targetTeam.memberIds, type: "admitted_case" });
  }, [data.teams, updateData]);

  const addUser = useCallback((input: { name: string; role: UserRole; teamId: string }) => updateData((current) => {
    const id = `u-${Date.now()}`;
    const newUser: DepartmentUser = { id, name: input.name.trim(), role: input.role, teamIds: [input.teamId], active: true };
    return {
      ...current,
      users: [...current.users, newUser],
      teams: current.teams.map((team) => team.id === input.teamId ? { ...team, memberIds: [...team.memberIds, id] } : team),
    };
  }), [updateData]);

  const changeUserRole = useCallback((userId: string, role: UserRole) => updateData((current) => ({
    ...current,
    users: current.users.map((item) => item.id === userId ? { ...item, role } : item),
  })), [updateData]);

  const addShift = useCallback((input: { clinician: string; period: "صباحي" | "مسائي" | "ليلي"; team: string }) => updateData((current) => ({
    ...current,
    shifts: [{ id: `s-${Date.now()}`, date: "اليوم", period: input.period, clinician: input.clinician.trim(), role: "مناوب", team: input.team.trim(), location: "يُحدد لاحقاً" }, ...current.shifts],
  })), [updateData]);

  const addSurgery = useCallback((input: { patientCode: string; procedure: string; surgeon: string }) => updateData((current) => ({
    ...current,
    surgeries: [{ id: `o-${Date.now()}`, time: "يُحدد", patientCode: input.patientCode.trim(), procedure: input.procedure.trim(), surgeon: input.surgeon.trim(), room: "يُحدد", status: "بانتظار مراجعة" }, ...current.surgeries],
  })), [updateData]);

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

  const value = useMemo(() => ({ hydrated, session, data, signIn, signInWithGoogleDemo, signOut, advanceReport, addReport, addConsultation, addCase, addUser, changeUserRole, addShift, addSurgery, markNotificationRead, markAllNotificationsRead }), [addCase, addConsultation, addReport, addShift, addSurgery, addUser, advanceReport, changeUserRole, data, hydrated, markAllNotificationsRead, markNotificationRead, session, signIn, signInWithGoogleDemo, signOut]);

  return <DepartmentContext.Provider value={value}>{children}</DepartmentContext.Provider>;
}

export function useDepartment() {
  const context = useContext(DepartmentContext);
  if (!context) throw new Error("useDepartment must be used inside DepartmentProvider");
  return context;
}
