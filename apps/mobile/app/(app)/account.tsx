import { useState, useEffect, useRef } from "react";
import {
  View, Text, TextInput, StyleSheet, ScrollView, Alert,
  ActivityIndicator, TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useAuthStore } from "@features/auth/stores/authStore";
import { useProfile } from "@features/forms/hooks/useProfile";
import { supabase } from "@core/network";
import { colors, spacing, borderRadius, fontSize } from "@shared/theme";
import { PressableScale } from "@shared/components/PressableScale";

export default function AccountScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { profile, isLoading: profileLoading, refetch } = useProfile();
  const mountedRef = useRef(true);

  const [email, setEmail] = useState(user?.email || "");
  const [fullName, setFullName] = useState("");
  const [saving, setSaving] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (profile?.fullName && !fullName) {
      setFullName(profile.fullName);
    }
  }, [profile?.fullName]);

  useEffect(() => {
    async function fetchEmail() {
      try {
        const { data } = await supabase.auth.getUser();
        if (data?.user?.email && mountedRef.current) setEmail(data.user.email);
      } catch {
        // Silently fail — email will remain as placeholder
      }
    }
    if (!email) fetchEmail();
  }, []);

  const role = profile?.role ?? user?.role ?? "pilot";
  const displayInitial = (fullName || email || "P").charAt(0).toUpperCase();

  async function handleSaveProfile() {
    if (!fullName.trim()) {
      Alert.alert("Error", "Full name cannot be empty.");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName.trim(), updated_at: new Date().toISOString() })
        .eq("id", user?.id);
      if (error) {
        Alert.alert("Error", error.message);
      } else {
        Alert.alert("Success", "Profile updated successfully.");
        refetch();
      }
    } catch {
      Alert.alert("Error", "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword() {
    if (!newPassword || newPassword.length < 8) {
      Alert.alert("Error", "New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        Alert.alert("Error", error.message);
      } else {
        Alert.alert("Success", "Password changed successfully.");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch {
      Alert.alert("Error", "Failed to change password.");
    } finally {
      setChangingPassword(false);
    }
  }

  async function handleDeleteAccount() {
    Alert.alert(
      "Delete Account",
      "This action is irreversible. All your data will be permanently deleted. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            Alert.alert("Contact Support", "Please contact support@fpl4flight.io to delete your account.");
          },
        },
      ]
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color={colors.brand[600]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Account</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar & Name Hero */}
        <View style={styles.heroSection}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarText}>{displayInitial}</Text>
          </View>
          <Text style={styles.heroName}>{fullName || "Pilot"}</Text>
          <View style={styles.rolePill}>
            <Ionicons name="shield-checkmark" size={12} color={colors.brand[600]} />
            <Text style={styles.roleText}>{role}</Text>
          </View>
        </View>

        {/* Profile Card */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>PROFILE INFORMATION</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Email</Text>
            <View style={styles.readOnlyField}>
              <Ionicons name="mail-outline" size={16} color={colors.runway[400]} />
              <Text style={styles.readOnlyText}>{email || "Loading..."}</Text>
              <Ionicons name="lock-closed" size={12} color={colors.runway[300]} />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Full Name</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={16} color={colors.runway[400]} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Enter your full name"
                placeholderTextColor={colors.runway[300]}
                autoCapitalize="words"
                editable={!saving}
              />
            </View>
          </View>

          <PressableScale
            style={[styles.primaryBtn, saving && styles.btnDisabled]}
            onPress={handleSaveProfile}
            disabled={saving}
            haptic
          >
            {saving ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={18} color={colors.white} />
                <Text style={styles.primaryBtnText}>Save Changes</Text>
              </>
            )}
          </PressableScale>
        </View>

        {/* Security Card */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>SECURITY</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>New Password</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="key-outline" size={16} color={colors.runway[400]} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Min 8 characters"
                placeholderTextColor={colors.runway[300]}
                secureTextEntry={!showPassword}
                autoComplete="new-password"
                editable={!changingPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={18} color={colors.runway[400]} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Confirm Password</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={16} color={colors.runway[400]} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Re-enter new password"
                placeholderTextColor={colors.runway[300]}
                secureTextEntry={!showPassword}
                editable={!changingPassword}
              />
            </View>
            {newPassword.length > 0 && newPassword.length < 8 && (
              <Text style={styles.hintError}>Password must be at least 8 characters</Text>
            )}
            {confirmPassword.length > 0 && newPassword !== confirmPassword && (
              <Text style={styles.hintError}>Passwords do not match</Text>
            )}
          </View>

          <PressableScale
            style={[styles.primaryBtn, changingPassword && styles.btnDisabled]}
            onPress={handleChangePassword}
            disabled={changingPassword}
            haptic
          >
            {changingPassword ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <>
                <Ionicons name="shield-outline" size={18} color={colors.white} />
                <Text style={styles.primaryBtnText}>Update Password</Text>
              </>
            )}
          </PressableScale>
        </View>

        {/* Danger Zone */}
        <View style={[styles.card, styles.dangerCard]}>
          <Text style={[styles.cardLabel, { color: colors.red[600] }]}>DANGER ZONE</Text>
          <Text style={styles.dangerText}>
            Permanently delete your account and all associated data including aircraft, flights, and form submissions.
          </Text>
          <PressableScale style={styles.dangerBtn} onPress={handleDeleteAccount} haptic>
            <Ionicons name="trash-outline" size={16} color={colors.red[600]} />
            <Text style={styles.dangerBtnText}>Delete Account</Text>
          </PressableScale>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.runway[50] },
  // Header
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: spacing.md, paddingVertical: 14,
    backgroundColor: colors.white, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.runway[200],
  },
  backBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: fontSize.lg, fontWeight: "700", color: colors.runway[900] },
  // Hero
  heroSection: { alignItems: "center", paddingVertical: spacing.xl, backgroundColor: colors.white, marginBottom: spacing.sm },
  avatarLarge: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: colors.brand[600], alignItems: "center", justifyContent: "center",
    marginBottom: spacing.md,
    shadowColor: colors.brand[600], shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
  },
  avatarText: { fontSize: 28, fontWeight: "700", color: colors.white },
  heroName: { fontSize: fontSize.xl, fontWeight: "700", color: colors.runway[900], marginBottom: 6 },
  rolePill: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: colors.brand[50], paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12,
  },
  roleText: { fontSize: fontSize.xs, fontWeight: "600", color: colors.brand[600], textTransform: "capitalize" },
  // Card
  card: {
    backgroundColor: colors.white, marginHorizontal: spacing.md, marginTop: spacing.md,
    borderRadius: borderRadius.lg, padding: spacing.lg,
    shadowColor: colors.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  cardLabel: { fontSize: 11, fontWeight: "700", color: colors.runway[400], letterSpacing: 1, marginBottom: spacing.lg },
  // Fields
  fieldGroup: { marginBottom: spacing.md },
  fieldLabel: { fontSize: fontSize.xs, fontWeight: "600", color: colors.runway[600], textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },
  readOnlyField: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    backgroundColor: colors.runway[50], borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md, paddingVertical: 14,
    borderWidth: 1, borderColor: colors.runway[100],
  },
  readOnlyText: { flex: 1, fontSize: fontSize.base, color: colors.runway[500] },
  inputWrapper: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: colors.runway[50], borderRadius: borderRadius.md,
    borderWidth: 1, borderColor: colors.runway[200],
    paddingHorizontal: spacing.md,
  },
  inputIcon: { marginRight: spacing.sm },
  input: { flex: 1, fontSize: fontSize.base, color: colors.runway[900], paddingVertical: 14 },
  hintError: { fontSize: fontSize.xs, color: colors.red[600], marginTop: 6 },
  // Buttons
  primaryBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm,
    backgroundColor: colors.brand[600], paddingVertical: 14, borderRadius: borderRadius.md,
    marginTop: spacing.sm,
    shadowColor: colors.brand[600], shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 3,
  },
  btnDisabled: { opacity: 0.6 },
  primaryBtnText: { fontSize: fontSize.base, fontWeight: "600", color: colors.white },
  // Danger
  dangerCard: { borderWidth: 1, borderColor: colors.red[100] },
  dangerText: { fontSize: fontSize.sm, color: colors.runway[500], lineHeight: 20, marginBottom: spacing.md },
  dangerBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm,
    paddingVertical: 12, borderRadius: borderRadius.md,
    borderWidth: 1, borderColor: colors.red[100], backgroundColor: colors.white,
  },
  dangerBtnText: { fontSize: fontSize.sm, fontWeight: "600", color: colors.red[600] },
});
