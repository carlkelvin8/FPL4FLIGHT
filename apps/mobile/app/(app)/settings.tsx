import { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Alert, ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useAuth } from "../../src/features/auth/hooks/useAuth";
import { useAuthStore } from "../../src/features/auth/stores/authStore";
import { useProfile } from "../../src/features/forms/hooks/useProfile";
import { colors, spacing, borderRadius, fontSize, shadows } from "../../src/shared/theme";
import { Card } from "../../src/shared/components/Card";
import { PressableScale } from "../../src/shared/components/PressableScale";

const SECTION_LINKS = [
  { icon: "👤", label: "Account", badge: "" },
  { icon: "🔒", label: "Security", badge: "" },
  { icon: "💳", label: "Billing", badge: "" },
  { icon: "👥", label: "Team", badge: "" },
  { icon: "❓", label: "Help & Support", badge: "" },
];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { signOut } = useAuth();
  const user = useAuthStore((s) => s.user);
  const { profile, isLoading: profileLoading } = useProfile();

  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);

  const initials = (profile?.fullName ?? user?.email ?? "U")
    .split(" ")
    .map((s) => s[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  function handleToggle(setter: (v: boolean) => void, value: boolean) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setter(!value);
  }

  function handleSignOut() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: signOut },
    ]);
  }

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Settings</Text>

      <Card variant="elevated" style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.profileInfo}>
          {profileLoading ? (
            <ActivityIndicator size="small" color={colors.brand[500]} />
          ) : (
            <>
              <Text style={styles.profileName}>{profile?.fullName || "Pilot"}</Text>
              <Text style={styles.profileEmail}>{user?.email ?? "No email"}</Text>
              <View style={styles.profileRoleRow}>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleText}>{profile?.role ?? user?.role ?? "pilot"}</Text>
                </View>
              </View>
            </>
          )}
        </View>
      </Card>

      <Text style={styles.sectionLabel}>Preferences</Text>
      <Card variant="default" style={styles.toggleCard}>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Push notifications</Text>
          <Switch
            value={pushEnabled}
            onValueChange={(v) => handleToggle(setPushEnabled, v)}
            trackColor={{ false: colors.runway[300], true: colors.brand[300] }}
            thumbColor={pushEnabled ? colors.brand[600] : colors.runway[400]}
          />
        </View>
        <View style={styles.divider} />
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Email notifications</Text>
          <Switch
            value={emailNotifs}
            onValueChange={(v) => handleToggle(setEmailNotifs, v)}
            trackColor={{ false: colors.runway[300], true: colors.brand[300] }}
            thumbColor={emailNotifs ? colors.brand[600] : colors.runway[400]}
          />
        </View>
        <View style={styles.divider} />
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Offline mode</Text>
          <Switch
            value={offlineMode}
            onValueChange={(v) => handleToggle(setOfflineMode, v)}
            trackColor={{ false: colors.runway[300], true: colors.brand[300] }}
            thumbColor={offlineMode ? colors.brand[600] : colors.runway[400]}
          />
        </View>
      </Card>

      <Text style={styles.sectionLabel}>Account</Text>
      <Card variant="default" style={styles.linksCard}>
        {SECTION_LINKS.map((link, i) => (
          <View key={link.label}>
            <PressableScale style={styles.linkRow} haptic>
              <Text style={styles.linkIcon}>{link.icon}</Text>
              <Text style={styles.linkLabel}>{link.label}</Text>
              {link.badge ? (
                <View style={styles.linkBadge}><Text style={styles.linkBadgeText}>{link.badge}</Text></View>
              ) : null}
              <Text style={styles.linkArrow}>›</Text>
            </PressableScale>
            {i < SECTION_LINKS.length - 1 && <View style={styles.divider} />}
          </View>
        ))}
      </Card>

      <PressableScale style={styles.signOutBtn} onPress={handleSignOut} haptic>
        <Text style={styles.signOutText}>Sign out</Text>
      </PressableScale>

      <Text style={styles.version}>PilotForms v2.1.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.runway[50] },
  title: { fontSize: 28, fontWeight: "700", color: colors.runway[900], letterSpacing: -0.5, paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.md },
  profileCard: { flexDirection: "row", gap: spacing.md, alignItems: "center", marginHorizontal: spacing.lg, marginBottom: spacing.lg },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.brand[600], alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: fontSize.xl, fontWeight: "700", color: colors.white },
  profileInfo: { flex: 1 },
  profileName: { fontSize: fontSize.base, fontWeight: "700", color: colors.runway[900] },
  profileEmail: { fontSize: fontSize.sm, color: colors.runway[500], marginTop: 1 },
  profileRoleRow: { flexDirection: "row", gap: spacing.xs, marginTop: spacing.sm },
  roleBadge: { backgroundColor: colors.runway[100], paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.sm },
  roleText: { fontSize: fontSize.xs, fontWeight: "600", color: colors.runway[600] },
  sectionLabel: { fontSize: fontSize.xs, fontWeight: "700", color: colors.runway[500], textTransform: "uppercase", letterSpacing: 0.6, paddingHorizontal: spacing.lg, marginBottom: spacing.sm, marginTop: spacing.xs },
  toggleCard: { marginHorizontal: spacing.lg, marginBottom: spacing.lg },
  toggleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: spacing.sm + 2 },
  toggleLabel: { fontSize: fontSize.base, color: colors.runway[800] },
  divider: { height: 1, backgroundColor: colors.runway[100] },
  linksCard: { marginHorizontal: spacing.lg, marginBottom: spacing.lg },
  linkRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.sm + 4 },
  linkIcon: { fontSize: 20, width: 28, textAlign: "center" },
  linkLabel: { flex: 1, fontSize: fontSize.base, color: colors.runway[800] },
  linkBadge: { backgroundColor: colors.brand[50], paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.sm },
  linkBadgeText: { fontSize: fontSize.xs, fontWeight: "600", color: colors.brand[600] },
  linkArrow: { fontSize: fontSize.xl, color: colors.runway[400], fontWeight: "300" },
  signOutBtn: { marginHorizontal: spacing.lg, marginBottom: spacing.md, paddingVertical: spacing.sm + 6, alignItems: "center", borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.red[100], backgroundColor: colors.white },
  signOutText: { fontSize: fontSize.base, fontWeight: "600", color: colors.red[600] },
  version: { textAlign: "center", fontSize: fontSize.xs, color: colors.runway[400], marginTop: spacing.sm },
});
