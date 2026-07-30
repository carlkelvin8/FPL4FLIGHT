/**
 * FeatureGate Component
 * 
 * Wraps content that requires a specific permission.
 * Shows an upgrade prompt if the user doesn't have access.
 * 
 * Usage:
 *   <FeatureGate feature="form_builder">
 *     <FormBuilderScreen />
 *   </FeatureGate>
 */

import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, borderRadius, fontSize } from "@shared/theme";
import { PressableScale } from "@shared/components/PressableScale";
import { usePermissions } from "@core/usePermissions";
import type { Feature } from "@core/permissions";

interface FeatureGateProps {
  feature: Feature;
  children: React.ReactNode;
  /** Custom message when locked */
  message?: string;
}

export function FeatureGate({ feature, children, message }: FeatureGateProps) {
  const { can, role } = usePermissions();
  const router = useRouter();

  if (can(feature)) {
    return <>{children}</>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.lockIcon}>
        <Ionicons name="lock-closed" size={40} color={colors.brand[400]} />
      </View>
      <Text style={styles.title}>Pro Feature</Text>
      <Text style={styles.message}>
        {message ?? "This feature requires a Pro subscription. Upgrade to unlock all pilot tools."}
      </Text>
      <Text style={styles.currentPlan}>Current plan: {role.toUpperCase()}</Text>
      <PressableScale style={styles.upgradeBtn} haptic onPress={() => router.push("/(app)/billing")}>
        <Ionicons name="rocket-outline" size={18} color={colors.white} />
        <Text style={styles.upgradeBtnText}>Upgrade to Pro</Text>
      </PressableScale>
    </View>
  );
}

/** Inline lock badge for buttons/cards that are restricted */
export function LockBadge() {
  return (
    <View style={styles.badge}>
      <Ionicons name="lock-closed" size={10} color={colors.white} />
      <Text style={styles.badgeText}>PRO</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl },
  lockIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.brand[50], alignItems: "center", justifyContent: "center", marginBottom: spacing.lg },
  title: { fontSize: fontSize.xl, fontWeight: "700", color: colors.runway[900], marginBottom: spacing.sm },
  message: { fontSize: fontSize.sm, color: colors.runway[500], textAlign: "center", lineHeight: 20, marginBottom: spacing.md },
  currentPlan: { fontSize: fontSize.xs, fontWeight: "600", color: colors.runway[400], marginBottom: spacing.lg },
  upgradeBtn: { flexDirection: "row", alignItems: "center", gap: spacing.sm, backgroundColor: colors.brand[600], paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: borderRadius.md },
  upgradeBtnText: { fontSize: fontSize.base, fontWeight: "700", color: colors.white },
  badge: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: colors.brand[600], paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  badgeText: { fontSize: 8, fontWeight: "800", color: colors.white },
});
