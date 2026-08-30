import type { ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useTheme } from "@storeforge/ui-native";

// Shared page wrapper: theme background + consistent padding/spacing, so
// individual route files only need to render their own content.
export function Screen({ children, scroll = true }: { children: ReactNode; scroll?: boolean }) {
  const theme = useTheme();
  if (!scroll) {
    return <View style={[styles.content, { backgroundColor: theme.colorBackground, flex: 1 }]}>{children}</View>;
  }
  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colorBackground }} contentContainerStyle={styles.content}>
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    gap: 16,
  },
});
