// The mobile analogue of each web app's app/layout.tsx theme object --
// one plain data shape per client, consumed by that client's own
// app.config.ts (see apps/beautifulmess-mobile/app.config.ts) rather than
// hand-editing app.json per fork. Isolation mirrors the web model in
// CLAUDE.md: own bundle ID, own Android package, own EAS project.
export interface StorefrontMobileConfig {
  appName: string;
  slug: string;
  bundleIdentifier: string;
  androidPackage: string;
  /** Set after running `eas init` for this client's own EAS project -- undefined until then. */
  easProjectId?: string;
  theme: {
    colorBrand: string;
    colorBrandForeground: string;
    colorBackground: string;
  };
}

export interface ExpoConfigLike {
  name?: string;
  slug?: string;
  ios?: Record<string, unknown>;
  android?: Record<string, unknown> & { adaptiveIcon?: Record<string, unknown> };
  splash?: Record<string, unknown>;
  extra?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Merges a client's StorefrontMobileConfig into a base Expo config object
 * (the shared, non-branded fields -- orientation, icon/splash asset
 * paths, plugins). Never mutates `base`.
 */
export function buildExpoConfig(config: StorefrontMobileConfig, base: ExpoConfigLike): ExpoConfigLike {
  return {
    ...base,
    name: config.appName,
    slug: config.slug,
    ios: {
      ...base.ios,
      bundleIdentifier: config.bundleIdentifier,
    },
    android: {
      ...base.android,
      package: config.androidPackage,
      adaptiveIcon: {
        ...base.android?.adaptiveIcon,
        backgroundColor: config.theme.colorBackground,
      },
    },
    splash: {
      ...base.splash,
      backgroundColor: config.theme.colorBackground,
    },
    extra: {
      ...base.extra,
      ...(config.easProjectId ? { eas: { projectId: config.easProjectId } } : {}),
    },
  };
}
