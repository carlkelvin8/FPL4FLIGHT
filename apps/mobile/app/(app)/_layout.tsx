import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, darkTheme, lightTheme } from "@shared/theme";
import { useThemeStore } from "@shared/stores/themeStore";

export default function AppLayout() {
  const isDark = useThemeStore((s) => s.isDark);
  const theme = isDark ? darkTheme : lightTheme;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand[600],
        tabBarInactiveTintColor: colors.runway[400],
        tabBarStyle: {
          borderTopWidth: 0,
          backgroundColor: theme.surface,
          paddingBottom: 12,
          paddingTop: 12,
          height: 74,
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
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="account" options={{ href: null }} />
      <Tabs.Screen name="qrcode" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="templates" options={{ href: null }} />
      <Tabs.Screen name="terms" options={{ href: null }} />
      <Tabs.Screen name="privacy" options={{ href: null }} />
      <Tabs.Screen name="weather" options={{ href: null }} />
      <Tabs.Screen name="logbook" options={{ href: null }} />
      <Tabs.Screen name="e6b" options={{ href: null }} />
      <Tabs.Screen name="weight-balance" options={{ href: null }} />
      <Tabs.Screen name="notams" options={{ href: null }} />
      <Tabs.Screen name="navlog" options={{ href: null }} />
      <Tabs.Screen name="flight-planning" options={{ href: null }} />
      <Tabs.Screen name="aip" options={{ href: null }} />
      <Tabs.Screen name="duty-tracker" options={{ href: null }} />
      <Tabs.Screen name="live-track" options={{ href: null }} />
      <Tabs.Screen name="form-builder" options={{ href: null }} />
      <Tabs.Screen name="licenses" options={{ href: null }} />
      <Tabs.Screen name="billing" options={{ href: null }} />
      <Tabs.Screen name="team" options={{ href: null }} />
      <Tabs.Screen name="help" options={{ href: null }} />
      <Tabs.Screen name="form-editor" options={{ href: null }} />
    </Tabs>
  );
}
