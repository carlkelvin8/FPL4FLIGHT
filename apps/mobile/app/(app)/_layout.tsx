import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@shared/theme";

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand[600],
        tabBarInactiveTintColor: colors.runway[400],
        tabBarStyle: {
          borderTopWidth: 0,
          backgroundColor: colors.white,
          paddingBottom: Platform.OS === "android" ? 8 : 12,
          paddingTop: 12,
          height: Platform.OS === "android" ? 68 : 74,
          shadowColor: colors.black,
          shadowOffset: { width: 0, height: -6 },
          shadowOpacity: 0.12,
          shadowRadius: 24,
          elevation: 20,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "700",
          marginTop: 4,
          letterSpacing: 0.3,
        },
        tabBarIconStyle: {
          marginBottom: -2,
        },
      }}
    >
      {/* ─── Visible Tabs ──────────────────────────────── */}
      <Tabs.Screen
        name="forms"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="aircraft"
        options={{
          title: "Aircraft",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="airplane" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: "Flights",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: "Map",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />

      {/* ─── Hidden Screens (navigated via Stack-style push) ── */}
      {/* These screens are registered in the tab navigator with href: null
          so they remain accessible via router.push() but don't show in the tab bar.
          Expo Router requires all files in (app)/ to be registered. */}
      <Tabs.Screen name="index" options={{ href: null, tabBarStyle: { display: "none" } }} />
      <Tabs.Screen name="account" options={{ href: null, tabBarStyle: { display: "none" } }} />
      <Tabs.Screen name="qrcode" options={{ href: null, tabBarStyle: { display: "none" } }} />
      <Tabs.Screen name="notifications" options={{ href: null, tabBarStyle: { display: "none" } }} />
      <Tabs.Screen name="templates" options={{ href: null, tabBarStyle: { display: "none" } }} />
      <Tabs.Screen name="terms" options={{ href: null, tabBarStyle: { display: "none" } }} />
      <Tabs.Screen name="privacy" options={{ href: null, tabBarStyle: { display: "none" } }} />
      <Tabs.Screen name="weather" options={{ href: null, tabBarStyle: { display: "none" } }} />
      <Tabs.Screen name="logbook" options={{ href: null, tabBarStyle: { display: "none" } }} />
      <Tabs.Screen name="e6b" options={{ href: null, tabBarStyle: { display: "none" } }} />
      <Tabs.Screen name="weight-balance" options={{ href: null, tabBarStyle: { display: "none" } }} />
      <Tabs.Screen name="notams" options={{ href: null, tabBarStyle: { display: "none" } }} />
      <Tabs.Screen name="navlog" options={{ href: null, tabBarStyle: { display: "none" } }} />
      <Tabs.Screen name="flight-planning" options={{ href: null, tabBarStyle: { display: "none" } }} />
      <Tabs.Screen name="aip" options={{ href: null, tabBarStyle: { display: "none" } }} />
      <Tabs.Screen name="duty-tracker" options={{ href: null, tabBarStyle: { display: "none" } }} />
      <Tabs.Screen name="live-track" options={{ href: null, tabBarStyle: { display: "none" } }} />
      <Tabs.Screen name="form-builder" options={{ href: null, tabBarStyle: { display: "none" } }} />
      <Tabs.Screen name="licenses" options={{ href: null, tabBarStyle: { display: "none" } }} />
      <Tabs.Screen name="billing" options={{ href: null, tabBarStyle: { display: "none" } }} />
      <Tabs.Screen name="team" options={{ href: null, tabBarStyle: { display: "none" } }} />
      <Tabs.Screen name="help" options={{ href: null, tabBarStyle: { display: "none" } }} />
      <Tabs.Screen name="form-editor" options={{ href: null, tabBarStyle: { display: "none" } }} />
    </Tabs>
  );
}
