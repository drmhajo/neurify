import { useWindowDimensions } from "react-native";
import { createResponsiveLayout } from "@/lib/responsive-layout";

export { createResponsiveLayout } from "@/lib/responsive-layout";

export function useResponsiveLayout() {
  const { width, height } = useWindowDimensions();
  return createResponsiveLayout(width, height);
}
