import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "../components/button";
import { ThemeProvider, type StorefrontTheme } from "./theme-provider";

const themeA: StorefrontTheme = {
  colorBrand: "#1B4332",
  colorBrandForeground: "#FFFFFF",
  colorBackground: "#FFFFFF",
  colorForeground: "#111111",
  colorMuted: "#6B7280",
  colorBorder: "#E5E7EB",
  fontSans: "'Fraunces', serif",
};

const themeB: StorefrontTheme = {
  colorBrand: "#B91C1C",
  colorBrandForeground: "#FFF7ED",
  colorBackground: "#0B0B0F",
  colorForeground: "#F5F5F5",
  colorMuted: "#9CA3AF",
  colorBorder: "#27272A",
  fontSans: "'Space Grotesk', sans-serif",
};

describe("ThemeProvider", () => {
  it("injects theme A's values as CSS variables", () => {
    const { container } = render(
      <ThemeProvider theme={themeA}>
        <p>Storefront A</p>
      </ThemeProvider>
    );

    const root = container.querySelector("[data-storefront-theme]") as HTMLElement;
    expect(root.style.getPropertyValue("--sf-color-brand")).toBe(themeA.colorBrand);
    expect(root.style.getPropertyValue("--sf-font-sans")).toBe(themeA.fontSans);
  });

  it("injects a completely different theme B's values, with nothing hardcoded", () => {
    const { container } = render(
      <ThemeProvider theme={themeB}>
        <p>Storefront B</p>
      </ThemeProvider>
    );

    const root = container.querySelector("[data-storefront-theme]") as HTMLElement;
    expect(root.style.getPropertyValue("--sf-color-brand")).toBe(themeB.colorBrand);
    expect(root.style.getPropertyValue("--sf-color-background")).toBe(themeB.colorBackground);
    expect(root.style.getPropertyValue("--sf-color-brand")).not.toBe(themeA.colorBrand);
  });

  it("renders the same component, with the same classes, under either theme", () => {
    const { unmount } = render(
      <ThemeProvider theme={themeA}>
        <Button>Buy now</Button>
      </ThemeProvider>
    );
    const classesUnderA = screen.getByRole("button", { name: "Buy now" }).className;
    unmount();

    render(
      <ThemeProvider theme={themeB}>
        <Button>Buy now</Button>
      </ThemeProvider>
    );
    const classesUnderB = screen.getByRole("button", { name: "Buy now" }).className;

    // The component itself never changes -- only the CSS variables a
    // storefront supplies do. If this ever drifts, a component has started
    // branching on theme instead of reading it through CSS variables.
    expect(classesUnderA).toBe(classesUnderB);
    expect(classesUnderA).not.toMatch(/#[0-9a-fA-F]{3,6}/);
  });
});
