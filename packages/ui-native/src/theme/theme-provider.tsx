import { createContext, useContext, type ReactNode } from "react";

/**
 * Structurally identical to packages/ui/src/theme/theme-provider.tsx's
 * StorefrontTheme -- duplicated rather than imported cross-package (a
 * native package shouldn't depend on the web-only ui package just for a
 * type). Keep these two in sync if the contract ever grows; both exist
 * so a storefront's brand data (colors, fonts, logo) is expressed once
 * conceptually and rendered by whichever renderer (DOM CSS variables for
 * web, this Context for native) the platform needs.
 */
export interface StorefrontTheme {
  colorBrand: string;
  colorBrandForeground: string;
  colorBackground: string;
  colorForeground: string;
  colorMuted: string;
  colorBorder: string;
  fontSans: string;
  fontHeading?: string;
  radius?: number;
  logo?: ReactNode;
}

const ThemeContext = createContext<StorefrontTheme | null>(null);

export function ThemeProvider({ theme, children }: { theme: StorefrontTheme; children: ReactNode }) {
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): StorefrontTheme {
  const theme = useContext(ThemeContext);
  if (!theme) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return theme;
}
