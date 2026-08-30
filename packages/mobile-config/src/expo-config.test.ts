import { describe, expect, it } from "vitest";
import { buildExpoConfig, type StorefrontMobileConfig } from "./expo-config";

const CONFIG: StorefrontMobileConfig = {
  appName: "Beautiful Mess",
  slug: "beautifulmess-mobile",
  bundleIdentifier: "com.beautifulforce.beautifulmess",
  androidPackage: "com.beautifulforce.beautifulmess",
  theme: { colorBrand: "#C0504D", colorBrandForeground: "#FFFFFF", colorBackground: "#FFFFFF" },
};

describe("buildExpoConfig", () => {
  it("sets the client's name, slug, bundle identifier, and Android package", () => {
    const result = buildExpoConfig(CONFIG, { orientation: "portrait" });
    expect(result.name).toBe("Beautiful Mess");
    expect(result.slug).toBe("beautifulmess-mobile");
    expect(result.ios).toEqual({ bundleIdentifier: "com.beautifulforce.beautifulmess" });
    expect(result.android).toMatchObject({ package: "com.beautifulforce.beautifulmess" });
    expect(result.orientation).toBe("portrait");
  });

  it("uses the theme's background color for the adaptive icon and splash screen", () => {
    const result = buildExpoConfig(CONFIG, {});
    expect(result.android?.adaptiveIcon).toMatchObject({ backgroundColor: "#FFFFFF" });
    expect(result.splash).toMatchObject({ backgroundColor: "#FFFFFF" });
  });

  it("omits extra.eas entirely when no easProjectId is set yet", () => {
    const result = buildExpoConfig(CONFIG, {});
    expect(result.extra).toEqual({});
  });

  it("sets extra.eas.projectId once a client has run eas init", () => {
    const result = buildExpoConfig({ ...CONFIG, easProjectId: "abc-123" }, {});
    expect(result.extra).toEqual({ eas: { projectId: "abc-123" } });
  });

  it("preserves unrelated fields already on the base config, and never mutates it", () => {
    const base = { orientation: "portrait" as const, plugins: ["expo-secure-store"] };
    const result = buildExpoConfig(CONFIG, base);
    expect(result.plugins).toEqual(["expo-secure-store"]);
    expect(base).toEqual({ orientation: "portrait", plugins: ["expo-secure-store"] });
  });
});
