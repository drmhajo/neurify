import { ActivityIndicator, View } from "react-native";
import { Redirect } from "expo-router";
import type { ReactNode } from "react";
import { useDepartment } from "@/lib/department-store";
import { palette } from "@/components/neuro-ui";

export function RequireSession({ children }: { children: ReactNode }) {
  const { hydrated, session } = useDepartment();
  if (!hydrated) return <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: palette.canvas }}><ActivityIndicator color={palette.navy} /></View>;
  if (!session) return <Redirect href={"/login" as any} />;
  return <>{children}</>;
}
