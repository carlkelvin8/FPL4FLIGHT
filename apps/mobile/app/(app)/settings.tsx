import { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, ScrollView, Switch, Alert, ActivityIndicator,
  Modal, TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useAuth } from "@features/auth/hooks/useAuth";
import { useAuthStore } from "@features/auth/stores/authStore";
import { useProfile } from "@features/forms/hooks/useProfile";
import { supabase } from "@core/network";
import { isBiometricAvailable, isBiometricLockEnabled, enableBiometricLock, disableBiometricLock, authenticateWithBiometrics, getBiometricType } from "@core/biometrics";
import { colors, spacing, borderRadius, fontSize } from "@shared/theme";
import { Card } from "@shared/components/Card";
import { PressableScale } from "@shared/components/PressableScale";

// Pilot-themed avatars
const PILOT_AVATARS = [
  { id: "captain", label: "Captain", icon: "airplane" as const, bg: "#1e3a5f" },
  { id: "copilot", label: "Co-Pilot", icon: "navigate" as const, bg: "#2d5a3f" },
  { id: "navigator", label: "Navigator", icon: "compass" as const, bg: "#5b2d8e" },
  { id: "engineer", label: "Engineer", icon: "construct" as const, bg: "#8b4513" },
  { id: "tower", label: "ATC", icon: "radio" as const, bg: "#1a6b5c" },
  { id: "instructor", label: "Instructor", icon: "school" as const, bg: "#c4421a" },
  { id: "cadet", label: "Cadet", icon: "ribbon" as const, bg: "#4a5568" },
  { id: "ace", label: "Ace", icon: "star" as const, bg: "#b8860b" },
  { id: "hawk", label: "Hawk", icon: "flash" as const, bg: "#2c3e50" },
  { id: "sky", label: "Sky", icon: "cloudy" as const, bg: "#3b82f6" },
  { id: "jet", label: "Jet", icon: "rocket" as const, bg: "#0f172a" },
  { id: "wing", label: "Wing", icon: "paper-plane" as const, bg: "#7c3aed" },
] as const;

const ACCOUNT_LINKS = [
  { icon: "person-outline" as const, label: "Account", desc: "Profile, email, name", route: "/(app)/account" },
  { icon: "card-outline" as const, label: "Billing", desc: "Subscription & plans", route: "/(app)/billing" },
  { icon: "people-outline" as const, label: "Team", desc: "Invite & manage crew", route: "/(app)/team" },
  { icon: "help-circle-outline" as const, label: "Help & Support", desc: "FAQ, contact us", route: "/(app)/help" },
] as const;

const APP_INFO_LINKS = [
  { icon: "document-text-outline" as const, label: "Terms of Service", route: "/(app)/terms" },
  { icon: "shield-checkmark-outline" as const, label: "Privacy Policy", route: "/(app)/privacy" },
  { icon: "information-circle-outline" as const, label: "Open Source Licenses", route: "/(app)/licenses" },
] as const;

const PILOT_TOOLS = [
  { icon: "book-outline" as const, label: "Pilot Logbook", desc: "Log your flight hours", route: "/(app)/logbook" },
  { icon: "calculator-outline" as const, label: "E6B Calculator", desc: "TAS, wind, fuel, distance", route: "/(app)/e6b" },
  { icon: "scale-outline" as const, label: "Weight & Balance", desc: "CG calculator", route: "/(app)/weight-balance" },
  { icon: "warning-outline" as const, label: "NOTAM Viewer", desc: "Notices to Airmen", route: "/(app)/notams" },
  { icon: "map-outline" as const, label: "Navigation Log", desc: "Waypoint planning", route: "/(app)/navlog" },
  { icon: "navigate-outline" as const, label: "Flight Planning", desc: "VFR & IFR routes", route: "/(app)/flight-planning" },
  { icon: "library-outline" as const, label: "AIP Reference", desc: "Aeronautical publications", route: "/(app)/aip" },
  { icon: "cloud-outline" as const, label: "Weather & METAR", desc: "Aviation weather briefing", route: "/(app)/weather" },
  { icon: "time-outline" as const, label: "Duty & FRMS Tracker", desc: "Fatigue risk management", route: "/(app)/duty-tracker" },
  { icon: "locate-outline" as const, label: "Live Flight Tracking", desc: "GPS track with speed & altitude", route: "/(app)/live-track" },
  { icon: "construct-outline" as const, label: "Form Builder", desc: "Create custom form templates", route: "/(app)/form-builder" },
] as const;

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signOut } = useAuth();
  const user = useAuthStore((s) => s.user);
  const { profile, isLoading: profileLoading } = useProfile();

  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState("Biometric");
  const [email, setEmail] = useState(user?.email || "");
  const [selectedAvatar, setSelectedAvatar] = useState<typeof PILOT_AVATARS[number]>(PILOT_AVATARS[0]);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function init() {
      try {
        // Check biometric availability
        const bioAvail = await isBiometricAvailable();
        if (mounted) setBiometricAvailable(bioAvail);
        if (bioAvail) {
          const type = await getBiometricType();
          if (mounted) setBiometricType(type);
          const enabled = await isBiometricLockEnabled();
          if (mounted) setBiometricEnabled(enabled);
        }

        const { data } = await supabase.auth.getUser();
        if (!mounted) return;
        if (data?.user?.email) setEmail(data.user.email);
        if (data?.user?.id) {
          const { data: prefs } = await supabase
            .from("user_preferences")
            .select("*")
            .eq("id", data.user.id)
            .single();
          if (!mounted) return;
          if (prefs) {
            setPushEnabled(prefs.push_notifications ?? true);
            setEmailNotifs(prefs.email_notifications ?? true);
            setOfflineMode(prefs.offline_mode ?? false);
            const avatar = PILOT_AVATARS.find((a) => a.id === prefs.avatar_id);
            if (avatar) setSelectedAvatar(avatar);
          }
        }
      } catch {
        // Silently fail — preferences will use defaults
      }
    }
    init();
    return () => { mounted = false; };
  }, []);

  const displayName = profile?.fullName || email?.split("@")[0] || "Pilot";

  async function handleToggle(setter: (v: boolean) => void, _value: boolean, field: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newVal = !_value;
    setter(newVal);
    const { data: { user: u } } = await supabase.auth.getUser();
    if (u) {
      await supabase.from("user_preferences").upsert({ id: u.id, [field]: newVal }, { onConflict: "id" });
    }
  }

  function handleSignOut() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: signOut },
    ]);
  }

  async function handleSelectAvatar(avatar: typeof PILOT_AVATARS[number]) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedAvatar(avatar);
    setShowAvatarPicker(false);
    const { data: { user: u } } = await supabase.auth.getUser();
    if (u) {
      await supabase.from("user_preferences").upsert({ id: u.id, avatar_id: avatar.id }, { onConflict: "id" });
    }
  }

  function handleAccountLink(link: typeof ACCOUNT_LINKS[number]) {
    router.push(link.route);
  }

  function handleAppInfoLink(link: typeof APP_INFO_LINKS[number]) {
    router.push(link.route);
  }

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Settings</Text>

      {/* Profile Card */}
      <Card variant="elevated" style={styles.profileCard}>
        <PressableScale onPress={() => setShowAvatarPicker(true)} haptic>
          <View style={[styles.avatar, { backgroundColor: selectedAvatar.bg }]}>
            <Ionicons name={selectedAvatar.icon} size={26} color={colors.white} />
            <View style={styles.avatarBadge}>
              <Ionicons name="pencil" size={9} color={colors.white} />
            </View>
          </View>
        </PressableScale>
        <View style={styles.profileInfo}>
          {profileLoading ? (
            <ActivityIndicator size="small" color={colors.brand[500]} />
          ) : (
            <>
              <Text style={styles.profileName}>{displayName}</Text>
              <Text style={styles.profileEmail}>{email || "No email"}</Text>
              <View style={styles.profileRoleRow}>
                <View style={styles.roleBadge}>
                  <Ionicons name="shield-checkmark" size={10} color={colors.runway[600]} style={{ marginRight: 3 }} />
                  <Text style={styles.roleText}>{profile?.role ?? user?.role ?? "pilot"}</Text>
                </View>
              </View>
            </>
          )}
        </View>
      </Card>

      {/* Pilot ID Card — Premium Glass Design */}
      <View style={styles.idCardContainer}>
        <View style={styles.idCard}>
          {/* Gradient accent top */}
          <View style={styles.idCardGradientTop} />
          
          {/* Header */}
          <View style={styles.idCardHeader}>
            <View style={styles.idCardHeaderLeft}>
              <Text style={styles.idCardBrand}>FPL4FLIGHT</Text>
              <Text style={styles.idCardSubtitle}>DIGITAL PILOT CERTIFICATE</Text>
            </View>
            <View style={styles.idCardChip}>
              <View style={styles.idCardChipInner}>
                <Ionicons name="airplane" size={14} color="#fff" />
              </View>
            </View>
          </View>

          {/* Main content */}
          <View style={styles.idCardContent}>
            <View style={styles.idCardAvatarSection}>
              <View style={[styles.idCardAvatar, { backgroundColor: selectedAvatar.bg }]}>  
                <Ionicons name={selectedAvatar.icon} size={26} color="#fff" />
              </View>
              <View style={styles.idCardVerifiedBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#34d399" />
              </View>
            </View>

            <View style={styles.idCardTextSection}>
              <Text style={styles.idCardPilotName}>{displayName}</Text>
              <Text style={styles.idCardRole}>{(profile?.role ?? user?.role ?? "pilot").toUpperCase()} • VERIFIED</Text>
            </View>
          </View>

          {/* Details grid */}
          <View style={styles.idCardGrid}>
            <View style={styles.idCardGridItem}>
              <Text style={styles.idCardGridLabel}>EMAIL</Text>
              <Text style={styles.idCardGridValue} numberOfLines={1}>{email}</Text>
            </View>
            <View style={styles.idCardGridItem}>
              <Text style={styles.idCardGridLabel}>MEMBER ID</Text>
              <Text style={styles.idCardGridValue}>{user?.id?.substring(0, 8).toUpperCase() ?? "—"}</Text>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.idCardFooter}>
            <View style={styles.idCardFooterLeft}>
              <View style={styles.idCardActiveDot} />
              <Text style={styles.idCardFooterStatus}>ACTIVE</Text>
            </View>
            <Text style={styles.idCardFooterYear}>EST. {new Date().getFullYear()}</Text>
          </View>

          {/* Bottom accent */}
          <View style={styles.idCardGradientBottom} />
        </View>
      </View>

      {/* Preferences */}
      <Text style={styles.sectionLabel}>Preferences</Text>
      <Card variant="default" style={styles.card}>
        <View style={styles.toggleRow}>
          <View style={styles.toggleLeft}>
            <View style={[styles.iconCircle, { backgroundColor: colors.brand[50] }]}>
              <Ionicons name="notifications-outline" size={16} color={colors.brand[600]} />
            </View>
            <View>
              <Text style={styles.toggleLabel}>Push notifications</Text>
              <Text style={styles.toggleDesc}>Receive flight form alerts</Text>
            </View>
          </View>
          <Switch
            value={pushEnabled}
            onValueChange={() => handleToggle(setPushEnabled, pushEnabled, "push_notifications")}
            trackColor={{ false: colors.runway[300], true: colors.brand[300] }}
            thumbColor={pushEnabled ? colors.brand[600] : colors.runway[400]}
          />
        </View>
        <View style={styles.divider} />
        <View style={styles.toggleRow}>
          <View style={styles.toggleLeft}>
            <View style={[styles.iconCircle, { backgroundColor: colors.green[50] }]}>
              <Ionicons name="mail-outline" size={16} color={colors.green[600]} />
            </View>
            <View>
              <Text style={styles.toggleLabel}>Email notifications</Text>
              <Text style={styles.toggleDesc}>Weekly digest & updates</Text>
            </View>
          </View>
          <Switch
            value={emailNotifs}
            onValueChange={() => handleToggle(setEmailNotifs, emailNotifs, "email_notifications")}
            trackColor={{ false: colors.runway[300], true: colors.brand[300] }}
            thumbColor={emailNotifs ? colors.brand[600] : colors.runway[400]}
          />
        </View>
        <View style={styles.divider} />
        <View style={styles.toggleRow}>
          <View style={styles.toggleLeft}>
            <View style={[styles.iconCircle, { backgroundColor: colors.amber[50] }]}>
              <Ionicons name="cloud-offline-outline" size={16} color={colors.amber[600]} />
            </View>
            <View>
              <Text style={styles.toggleLabel}>Offline mode</Text>
              <Text style={styles.toggleDesc}>Save forms locally</Text>
            </View>
          </View>
          <Switch
            value={offlineMode}
            onValueChange={() => handleToggle(setOfflineMode, offlineMode, "offline_mode")}
            trackColor={{ false: colors.runway[300], true: colors.brand[300] }}
            thumbColor={offlineMode ? colors.brand[600] : colors.runway[400]}
          />
        </View>
        {biometricAvailable && (
          <>
            <View style={styles.divider} />
            <View style={styles.toggleRow}>
              <View style={styles.toggleLeft}>
                <View style={[styles.iconCircle, { backgroundColor: "#f0fdf4" }]}>
                  <Ionicons name="finger-print-outline" size={16} color="#16a34a" />
                </View>
                <View>
                  <Text style={styles.toggleLabel}>{biometricType} Lock</Text>
                  <Text style={styles.toggleDesc}>Require authentication on launch</Text>
                </View>
              </View>
              <Switch
                value={biometricEnabled}
                onValueChange={async () => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  if (!biometricEnabled) {
                    const authenticated = await authenticateWithBiometrics("Verify to enable biometric lock");
                    if (authenticated) { await enableBiometricLock(); setBiometricEnabled(true); }
                  } else {
                    await disableBiometricLock();
                    setBiometricEnabled(false);
                  }
                }}
                trackColor={{ false: colors.runway[300], true: "#86efac" }}
                thumbColor={biometricEnabled ? "#16a34a" : colors.runway[400]}
              />
            </View>
          </>
        )}
      </Card>

      {/* Account Links */}
      <Text style={styles.sectionLabel}>Account</Text>
      <Card variant="default" style={styles.card}>
        {ACCOUNT_LINKS.map((link, i) => (
          <View key={link.label}>
            <PressableScale style={styles.linkRow} haptic onPress={() => handleAccountLink(link)}>
              <View style={[styles.iconCircle, { backgroundColor: colors.runway[100] }]}>
                <Ionicons name={link.icon} size={16} color={colors.runway[700]} />
              </View>
              <View style={styles.linkContent}>
                <Text style={styles.linkLabel}>{link.label}</Text>
                <Text style={styles.linkDesc}>{link.desc}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.runway[400]} />
            </PressableScale>
            {i < ACCOUNT_LINKS.length - 1 && <View style={styles.divider} />}
          </View>
        ))}
      </Card>

      {/* Pilot Tools — Compact Grid */}
      <Text style={styles.sectionLabel}>Pilot Tools</Text>
      <View style={styles.toolsGrid}>
        {PILOT_TOOLS.map((tool) => (
          <PressableScale key={tool.label} style={styles.toolCard} haptic onPress={() => router.push(tool.route as any)}>
            <View style={styles.toolIconBg}>
              <Ionicons name={tool.icon} size={20} color={colors.brand[600]} />
            </View>
            <Text style={styles.toolLabel} numberOfLines={2}>{tool.label}</Text>
          </PressableScale>
        ))}
      </View>

      {/* App Info */}
      <Text style={styles.sectionLabel}>About</Text>
      <Card variant="default" style={styles.card}>
        {APP_INFO_LINKS.map((link, i) => (
          <View key={link.label}>
            <PressableScale style={styles.linkRow} haptic onPress={() => handleAppInfoLink(link)}>
              <View style={[styles.iconCircle, { backgroundColor: colors.runway[100] }]}>
                <Ionicons name={link.icon} size={16} color={colors.runway[700]} />
              </View>
              <View style={styles.linkContent}>
                <Text style={styles.linkLabel}>{link.label}</Text>
              </View>
              <Ionicons name="chevron-forward" size={14} color={colors.runway[400]} />
            </PressableScale>
            {i < APP_INFO_LINKS.length - 1 && <View style={styles.divider} />}
          </View>
        ))}
      </Card>

      {/* Sign Out */}
      <PressableScale style={styles.signOutBtn} onPress={handleSignOut} haptic>
        <Ionicons name="log-out-outline" size={18} color={colors.red[600]} />
        <Text style={styles.signOutText}>Sign out</Text>
      </PressableScale>

      <Text style={styles.version}>FPL4FLIGHT v1.0.0 (Build 1)</Text>
      <Text style={styles.copyright}>© 2024 FPL4FLIGHT. All rights reserved.</Text>

      {/* Avatar Picker Modal */}
      <Modal visible={showAvatarPicker} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowAvatarPicker(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Choose Your Callsign</Text>
            <Text style={styles.modalSubtitle}>Select a pilot avatar</Text>
            <View style={styles.avatarGrid}>
              {PILOT_AVATARS.map((avatar) => (
                <PressableScale key={avatar.id} onPress={() => handleSelectAvatar(avatar)} haptic style={styles.avatarOptionWrapper}>
                  <View style={[
                    styles.avatarOption,
                    { backgroundColor: avatar.bg },
                    selectedAvatar.id === avatar.id && styles.avatarOptionSelected,
                  ]}>
                    <Ionicons name={avatar.icon} size={22} color={colors.white} />
                    {selectedAvatar.id === avatar.id && (
                      <View style={styles.checkBadge}>
                        <Ionicons name="checkmark" size={10} color={colors.white} />
                      </View>
                    )}
                  </View>
                  <Text style={[
                    styles.avatarOptionLabel,
                    selectedAvatar.id === avatar.id && styles.avatarOptionLabelActive,
                  ]}>{avatar.label}</Text>
                </PressableScale>
              ))}
            </View>
            <PressableScale style={styles.modalDismiss} onPress={() => setShowAvatarPicker(false)} haptic>
              <Text style={styles.modalDismissText}>Done</Text>
            </PressableScale>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.runway[50] },
  title: { fontSize: 28, fontWeight: "700", color: colors.runway[900], letterSpacing: -0.5, paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.md },

  // Profile card
  profileCard: { flexDirection: "row", gap: spacing.md, alignItems: "center", marginHorizontal: spacing.lg, marginBottom: spacing.md },
  avatar: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", position: "relative" },
  avatarBadge: { position: "absolute", bottom: -2, right: -2, width: 18, height: 18, borderRadius: 9, backgroundColor: colors.runway[700], alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: colors.white },
  profileInfo: { flex: 1 },
  profileName: { fontSize: fontSize.base, fontWeight: "700", color: colors.runway[900] },
  profileEmail: { fontSize: fontSize.sm, color: colors.runway[500], marginTop: 1 },
  profileRoleRow: { flexDirection: "row", gap: spacing.xs, marginTop: spacing.sm },
  roleBadge: { flexDirection: "row", alignItems: "center", backgroundColor: colors.runway[100], paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.sm },
  roleText: { fontSize: fontSize.xs, fontWeight: "600", color: colors.runway[600] },

  // Section
  sectionLabel: { fontSize: fontSize.xs, fontWeight: "700", color: colors.runway[500], textTransform: "uppercase", letterSpacing: 0.6, paddingHorizontal: spacing.lg, marginBottom: spacing.sm, marginTop: spacing.sm },
  card: { marginHorizontal: spacing.lg, marginBottom: spacing.md },

  // Toggles
  toggleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: spacing.sm + 2 },
  toggleLeft: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flex: 1 },
  toggleLabel: { fontSize: fontSize.sm, fontWeight: "600", color: colors.runway[800] },
  toggleDesc: { fontSize: fontSize.xs, color: colors.runway[400], marginTop: 1 },
  divider: { height: 1, backgroundColor: colors.runway[100], marginLeft: 44 },

  // Icon circle
  iconCircle: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },

  // Links
  linkRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: spacing.sm + 4 },
  linkContent: { flex: 1 },
  linkLabel: { fontSize: fontSize.sm, fontWeight: "600", color: colors.runway[800] },
  linkDesc: { fontSize: fontSize.xs, color: colors.runway[400], marginTop: 1 },

  // Sign out
  signOutBtn: { marginHorizontal: spacing.lg, marginTop: spacing.sm, marginBottom: spacing.sm, paddingVertical: spacing.sm + 6, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: spacing.sm, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.red[100], backgroundColor: colors.white },
  signOutText: { fontSize: fontSize.base, fontWeight: "600", color: colors.red[600] },

  // Footer
  version: { textAlign: "center", fontSize: fontSize.xs, color: colors.runway[400], marginTop: spacing.md },
  copyright: { textAlign: "center", fontSize: fontSize.xs, color: colors.runway[300], marginTop: spacing.xs },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg, paddingBottom: spacing.xl, alignItems: "center" },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.runway[300], marginBottom: spacing.md },
  modalTitle: { fontSize: fontSize.lg, fontWeight: "700", color: colors.runway[900], marginBottom: 2 },
  modalSubtitle: { fontSize: fontSize.sm, color: colors.runway[500], marginBottom: spacing.lg },
  avatarGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: spacing.md, marginBottom: spacing.lg, width: "100%" },
  avatarOptionWrapper: { alignItems: "center", width: 64 },
  avatarOption: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", position: "relative" },
  avatarOptionSelected: { borderWidth: 3, borderColor: colors.brand[400] },
  avatarOptionLabel: { fontSize: 10, color: colors.runway[500], textAlign: "center", fontWeight: "500", marginTop: 4 },
  avatarOptionLabelActive: { color: colors.brand[600], fontWeight: "700" },
  checkBadge: { position: "absolute", bottom: -2, right: -2, width: 16, height: 16, borderRadius: 8, backgroundColor: colors.brand[600], alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: colors.white },
  modalDismiss: { backgroundColor: colors.runway[900], paddingHorizontal: spacing["2xl"], paddingVertical: spacing.sm + 4, borderRadius: borderRadius.md, width: "100%", alignItems: "center" },
  modalDismissText: { fontSize: fontSize.base, fontWeight: "600", color: colors.white },

  // Pilot ID Card — Ultra Premium Glass Design
  idCardContainer: { marginHorizontal: spacing.md, marginBottom: spacing.lg },
  idCard: { borderRadius: 20, overflow: "hidden", backgroundColor: "#1e1b4b", shadowColor: "#6366f1", shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.4, shadowRadius: 24, elevation: 12 },
  idCardGradientTop: { height: 4, backgroundColor: "#818cf8" },
  idCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 18, paddingTop: 16, paddingBottom: 8 },
  idCardHeaderLeft: {},
  idCardBrand: { fontSize: 10, fontWeight: "900", color: "#c7d2fe", letterSpacing: 3 },
  idCardSubtitle: { fontSize: 9, fontWeight: "600", color: "#6366f1", marginTop: 2, letterSpacing: 0.8 },
  idCardChip: { width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(99,102,241,0.15)", alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: "rgba(129,140,248,0.3)" },
  idCardChipInner: { width: 28, height: 28, borderRadius: 8, backgroundColor: "rgba(99,102,241,0.4)", alignItems: "center", justifyContent: "center" },
  idCardContent: { flexDirection: "row", alignItems: "center", paddingHorizontal: 18, paddingVertical: 14, gap: 14 },
  idCardAvatarSection: { position: "relative" },
  idCardAvatar: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: "rgba(129,140,248,0.5)" },
  idCardVerifiedBadge: { position: "absolute", bottom: -3, right: -3, backgroundColor: "#1e1b4b", borderRadius: 10, padding: 2 },
  idCardTextSection: { flex: 1 },
  idCardPilotName: { fontSize: 20, fontWeight: "800", color: "#ffffff", letterSpacing: -0.5 },
  idCardRole: { fontSize: 10, fontWeight: "700", color: "#34d399", marginTop: 4, letterSpacing: 1.2 },
  idCardGrid: { flexDirection: "row", paddingHorizontal: 18, paddingBottom: 14, gap: 12 },
  idCardGridItem: { flex: 1, backgroundColor: "rgba(99,102,241,0.08)", borderRadius: 10, padding: 10, borderWidth: 1, borderColor: "rgba(129,140,248,0.15)" },
  idCardGridLabel: { fontSize: 8, fontWeight: "700", color: "#818cf8", letterSpacing: 1.2, marginBottom: 3 },
  idCardGridValue: { fontSize: 11, fontWeight: "600", color: "#e0e7ff" },
  idCardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 18, paddingVertical: 10, backgroundColor: "rgba(30,27,75,0.6)", borderTopWidth: 1, borderTopColor: "rgba(129,140,248,0.1)" },
  idCardFooterLeft: { flexDirection: "row", alignItems: "center", gap: 6 },
  idCardActiveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#34d399" },
  idCardFooterStatus: { fontSize: 9, fontWeight: "800", color: "#34d399", letterSpacing: 1 },
  idCardFooterYear: { fontSize: 9, fontWeight: "600", color: "#6366f1" },
  idCardGradientBottom: { height: 3, backgroundColor: "#6366f1" },

  // Pilot Tools Grid
  toolsGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: spacing.md, gap: spacing.sm, marginBottom: spacing.md },
  toolCard: { width: "30%", backgroundColor: colors.white, borderRadius: borderRadius.md, padding: spacing.sm, alignItems: "center", borderWidth: 1, borderColor: colors.runway[100], minHeight: 80, justifyContent: "center" },
  toolIconBg: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.brand[50], alignItems: "center", justifyContent: "center", marginBottom: spacing.xs },
  toolLabel: { fontSize: 10, fontWeight: "600", color: colors.runway[700], textAlign: "center" },
});
