import { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView, StyleSheet } from "react-native";
import { Button, ProductGrid, ThemeProvider, type StorefrontTheme } from "@storeforge/ui-native";

// Two placeholder StorefrontTheme objects -- standing in for what a real
// client config (e.g. Beautiful Mess's) will supply. Swapping which one is
// active re-skins the whole screen with no change to ProductGrid/Button.
const THEME_A: StorefrontTheme = {
  colorBrand: "#C0504D",
  colorBrandForeground: "#FFFFFF",
  colorBackground: "#FFF7F5",
  colorForeground: "#2B2320",
  colorMuted: "#F0DCD8",
  colorBorder: "#E8C9C4",
  fontSans: "System",
  radius: 12,
};

const THEME_B: StorefrontTheme = {
  colorBrand: "#1F5D50",
  colorBrandForeground: "#FFFFFF",
  colorBackground: "#F3FAF8",
  colorForeground: "#12211D",
  colorMuted: "#D6ECE6",
  colorBorder: "#B9DAD1",
  fontSans: "System",
  radius: 2,
};

const PLACEHOLDER_PRODUCTS = [
  { id: "1", name: "Blue Frock", price: 550000 },
  { id: "2", name: "Sling Bag", price: 150000 },
  { id: "3", name: "Bow Hairclip", price: 45000 },
  { id: "4", name: "Canvas Sneakers", price: 320000 },
];

export default function App() {
  const [theme, setTheme] = useState(THEME_A);

  return (
    <ThemeProvider theme={theme}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colorBackground }]}>
        <Button
          label={theme === THEME_A ? "Switch to Theme B" : "Switch to Theme A"}
          onPress={() => setTheme((current) => (current === THEME_A ? THEME_B : THEME_A))}
        />
        <ProductGrid products={PLACEHOLDER_PRODUCTS} onSelectProduct={() => {}} />
        <StatusBar style="auto" />
      </SafeAreaView>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 16,
  },
});
