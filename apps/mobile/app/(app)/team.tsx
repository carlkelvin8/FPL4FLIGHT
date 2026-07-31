import { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useAuthStore } from "@features/auth/stores/authStore";
import { supabase } from "@core/network";
import { colors, spacing, borderRadius, fontSize, avatarPalette, type ThemeColors } from "@shared/theme";
import { Card } from "@shared/components/Card";
import { PressableScale } from "@shared/components/PressableScale";
import { useAppTheme } from "@shared/hooks/useAppTheme";
import { APP_NAME, SUPPORT_EMAIL } from "@shared/constants";

interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  role: string;
  created_at: string;
}

export default function TeamScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors: theme } = useAppTheme();
  const user = useAuthStore((s) => s.user);
  const [member, setMember] = useState<TeamMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const styles = createStyles(theme);

  useEffect(() => {
    let mounted = true;
    async function loadMember() {
      try {
        const { data: { user: u } } = await supabase.auth.getUser();
        if (!mounted || !u) return;
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, full_name, role, created_at")
          .eq("id", u.id)
          .single();
        if (!mounted) return;
        if (profile) {
          setMember({ id: profile.id, full_name: profile.full_name, email: u.email ?? "", role: profile.role, created_at: profile.created_at });
        }
      } catch {
        if (mounted) setError("Could not load your profile.");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadMember();
    return () => { mounted = false; };
  }, []);

  function handleInvite() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Team invites are coming soon",
      "Crew invites and role management need the Team plan backend, which isn't live yet. Contact us and we'll notify you when it launches.",
      [
        { text: "Not now", style: "cancel" },
        {
          text: "Contact Sales",
          onPress: () => {
            const subject = encodeURIComponent(`${APP_NAME} Team Plan — Early Access Request`);
            Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${subject}`).catch(() => {
              Alert.alert("Unable to Open Mail", `Please email us directly at ${SUPPORT_EMAIL}.`);
            });
          },
        },
      ]
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Back">
          <Ionicons name="chevron-back" size={20} color={colors.brand[600]} />
          <Text style={styles.backText}>Settings</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Team</Text>
        <View style={{ width: 70 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
        {/* Current member */}
        <Text style={styles.sectionLabel}>Members</Text>
        <Card variant="default" style={styles.memberCard}>
          {loading ? (
            <ActivityIndicator size="small" color={colors.brand[500]} style={{ paddingVertical: spacing.md }} />
          ) : member ? (
            <View style={styles.memberRow}>
              <View style={[styles.memberAvatar, { backgroundColor: avatarPalette[0] }]}>
                <Text style={styles.memberInitial}>{(member.full_name || member.email || "P").charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{member.full_name || "Pilot"}</Text>
                <Text style={styles.memberEmail}>{member.email}</Text>
              </View>
              <View style={styles.memberRoleBadge}>
                <Text style={styles.memberRoleText}>{member.role}</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.memberError}>{error ?? "No member profile found."}</Text>
          )}
        </Card>
        <Text style={styles.memberHint}>You are currently the only member of this workspace.</Text>

        {/* Invite CTA */}
        <PressableScale style={styles.inviteBtn} haptic onPress={handleInvite}>
          <Ionicons name="person-add-outline" size={18} color={colors.white} />
          <Text style={styles.inviteText}>Invite Crew Member</Text>
        </PressableScale>

        {/* Team plan banner */}
        <View style={styles.proBanner}>
          <Ionicons name="lock-closed" size={16} color={colors.amber[600]} />
          <Text style={styles.proText}>
            Invites and role-based access unlock with the Team plan. Billing isn't live yet — contact us for early access.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.md, paddingVertical: 14, backgroundColor: theme.surface, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border },
    backBtn: { flexDirection: "row", alignItems: "center", gap: 2, width: 70 },
    backText: { fontSize: fontSize.sm, color: colors.brand[600], fontWeight: "500" },
    headerTitle: { fontSize: fontSize.lg, fontWeight: "700", color: theme.textPrimary, letterSpacing: -0.3 },
    sectionLabel: { fontSize: fontSize.xs, fontWeight: "700", color: theme.textMuted, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: spacing.sm },
    memberCard: { marginBottom: spacing.xs },
    memberRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
    memberAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
    memberInitial: { fontSize: fontSize.base, fontWeight: "700", color: colors.white },
    memberInfo: { flex: 1 },
    memberName: { fontSize: fontSize.sm, fontWeight: "600", color: theme.textPrimary },
    memberEmail: { fontSize: fontSize.xs, color: theme.textMuted, marginTop: 1 },
    memberRoleBadge: { backgroundColor: theme.borderLight, paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: borderRadius.sm },
    memberRoleText: { fontSize: fontSize.xs, fontWeight: "600", color: theme.textSecondary, textTransform: "uppercase" },
    memberError: { fontSize: fontSize.sm, color: colors.red[600], paddingVertical: spacing.sm },
    memberHint: { fontSize: fontSize.xs, color: theme.textMuted, marginBottom: spacing.lg },
    inviteBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, backgroundColor: colors.brand[600], paddingVertical: spacing.md, borderRadius: borderRadius.md, marginBottom: spacing.lg },
    inviteText: { fontSize: fontSize.base, fontWeight: "700", color: colors.white },
    proBanner: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm, backgroundColor: colors.amber[50], paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.amber[100] },
    proText: { fontSize: fontSize.sm, fontWeight: "500", color: colors.amber[600], flex: 1, lineHeight: 18 },
  });
