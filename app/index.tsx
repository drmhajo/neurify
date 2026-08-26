import { ActivityIndicator, View } from "react-native";
import { Redirect } from "expo-router";
import { useDepartment } from "@/lib/department-store";
import { palette } from "@/components/neuro-ui";

export default function StartScreen() {
  const { hydrated, session } = useDepartment();
  if (!hydrated) return <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: palette.canvas }}><ActivityIndicator color={palette.navy} /></View>;
  return <Redirect href={(session ? "/(tabs)" : "/login") as any} />;
}
