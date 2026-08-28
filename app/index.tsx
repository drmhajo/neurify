import { ActivityIndicator, View } from "react-native";
import { Redirect } from "expo-router";
import { useDepartment } from "@/lib/department-store";
import { palette } from "@/components/neuro-ui";

export default function StartScreen() {
  const { hydrated } = useDepartment();
  if (!hydrated) return <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: palette.canvas }}><ActivityIndicator color={palette.navy} /></View>;
  // Opening the app always begins with an explicit central sign-in. This prevents a
  // restored device session, including a historical administrator session, from
  // taking a user directly to clinical or administrative content at startup.
  return <Redirect href="/login" />;
}
