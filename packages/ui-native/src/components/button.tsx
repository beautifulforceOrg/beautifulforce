import { Pressable, Text, StyleSheet } from "react-native";
import { useTheme } from "../theme/theme-provider";

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: "solid" | "outline";
  disabled?: boolean;
}

export function Button({ label, onPress, variant = "solid", disabled = false }: ButtonProps) {
  const theme = useTheme();
  const isOutline = variant === "outline";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.base,
        {
          // A literal "transparent" background can make a Pressable fail
          // to receive touches on Android (observed: the fully-opaque
          // "solid" variant worked, "outline" silently didn't) -- an
          // effectively-invisible but non-zero-alpha fill keeps the same
          // look while staying hit-testable.
          backgroundColor: isOutline ? "rgba(255,255,255,0.01)" : theme.colorBrand,
          borderColor: theme.colorBrand,
          borderWidth: isOutline ? 1 : 0,
          borderRadius: theme.radius ?? 8,
          opacity: disabled ? 0.5 : 1,
        },
      ]}
    >
      <Text
        style={{
          color: isOutline ? theme.colorBrand : theme.colorBrandForeground,
          fontFamily: theme.fontSans,
          fontWeight: "600",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
