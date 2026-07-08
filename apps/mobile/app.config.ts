import type { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "FPL4FLIGHT",
  slug: "fpl4flight",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#1d4ed8",
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "io.pilotforms.app",
    buildNumber: "1",
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#1d4ed8",
    },
    package: "io.pilotforms.app",
    versionCode: 1,
    googleServicesFile: "./google-services.json",
  },
  web: {
    favicon: "./assets/favicon.png",
  },
  plugins: [
    "expo-router",
    "expo-secure-store",
    [
      "expo-sqlite",
      {
        useSQLCipher: false,
      },
    ],
  ],
  extra: {
    supabaseUrl: process.env["EXPO_PUBLIC_SUPABASE_URL"],
    supabaseAnonKey: process.env["EXPO_PUBLIC_SUPABASE_ANON_KEY"],
    revenueCatKeyIos: process.env["REVENUECAT_API_KEY_IOS"],
    revenueCatKeyAndroid: process.env["REVENUECAT_API_KEY_ANDROID"],
    sentryDsn: process.env["SENTRY_DSN"],
    eas: {
      projectId: "f22e6c2e-fe6e-4b23-af2e-0b8768dda46d",
    },
  },
  scheme: "fpl4flight",
});
