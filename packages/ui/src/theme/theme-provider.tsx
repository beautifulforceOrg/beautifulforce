import type { CSSProperties, ReactNode } from "react";

/**
 * The theming contract every storefront fulfills to make these components
 * look like its own store. No component in this package ever reads a
 * client's brand color, font, or logo directly -- everything flows through
 * the CSS variables this provider sets, matching the tokens declared in
 * packages/config/tailwind.preset.js.
 */
export interface StorefrontTheme {
  colorBrand: string;
  colorBrandForeground: string;
  colorBackground: string;
  colorForeground: string;
  colorMuted: string;
  colorBorder: string;
  fontSans: string;
  // Many brands set a distinct display/heading face apart from body text
  // (a serif heading over a sans body, for instance) -- optional so a
  // single-font storefront can omit it and fall back to fontSans.
  fontHeading?: string;
  radius?: string;
  logo?: ReactNode;
}

const CSS_VAR_NAME: Record<keyof Omit<StorefrontTheme, "logo">, string> = {
  colorBrand: "--sf-color-brand",
  colorBrandForeground: "--sf-color-brand-foreground",
  colorBackground: "--sf-color-background",
  colorForeground: "--sf-color-foreground",
  colorMuted: "--sf-color-muted",
  colorBorder: "--sf-color-border",
  fontSans: "--sf-font-sans",
  fontHeading: "--sf-font-heading",
  radius: "--sf-radius",
};

export function themeToCssVariables(theme: StorefrontTheme): CSSProperties {
  const style: Record<string, string> = {};
  for (const [key, cssVar] of Object.entries(CSS_VAR_NAME)) {
    const value = theme[key as keyof StorefrontTheme];
    if (typeof value === "string") {
      style[cssVar] = value;
    }
  }
  return style as CSSProperties;
}

export function ThemeProvider({
  theme,
  children,
}: {
  theme: StorefrontTheme;
  children: ReactNode;
}) {
  return (
    <div data-storefront-theme="" style={themeToCssVariables(theme)}>
      {children}
    </div>
  );
}
