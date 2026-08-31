// Local Material Community Icons create a consistent outlined tab style on Android and web.

import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconSymbolName = keyof typeof MAPPING;

/**
 * Add SF Symbol to Material Community Icon mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  "house.fill": "home-variant-outline",
  "doc.text.fill": "file-document-outline",
  "calendar": "calendar-month-outline",
  "person.3.fill": "account-group-outline",
  "bubble.left.and.bubble.right.fill": "forum-outline",
  "gearshape.fill": "shield-account-outline",
  "chevron.right": "chevron-right",
} as const satisfies Partial<Record<SymbolViewProps["name"], ComponentProps<typeof MaterialCommunityIcons>["name"]>>;

/**
 * An icon component that uses locally bundled Material Community Icons for a modern outlined tab treatment.
 * Icon names remain based on SF Symbols and map to their Material Community counterpart.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialCommunityIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
