import type { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "FPL4FLIGHT",
  slug: "fpl4flight",
  owner: "carllll",
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
  },
  web: {
    favicon: "./assets/favicon.png",
  },
  plugins: [
    "expo-router",
    "expo-secure-store",
    "expo-mail-composer",
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
      projectId: "68b80506-301f-48d2-b869-fd07d8168fc7",
    },
  },
  scheme: "fpl4flight",
});
