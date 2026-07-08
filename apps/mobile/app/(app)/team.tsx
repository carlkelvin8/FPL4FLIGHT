import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, borderRadius, fontSize } from "@shared/theme";

export default function TeamScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color={colors.brand[600]} />
          <Text style={styles.backText}>Settings</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Team</Text>
        <View style={{ width: 70 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons name="people-outline" size={48} color={colors.runway[300]} />
          </View>
          <Text style={styles.emptyTitle}>Team Management</Text>
          <Text style={styles.emptySub}>Invite crew members and manage your team. Assign roles and share aircraft data across your organization.</Text>

          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <Ionicons name="person-add-outline" size={20} color={colors.brand[600]} />
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Invite Crew</Text>
                <Text style={styles.featureDesc}>Add pilots, co-pilots, and ground crew by email</Text>
              </View>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="shield-outline" size={20} color={colors.brand[600]} />
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Role Management</Text>
                <Text style={styles.featureDesc}>Assign Captain, First Officer, or Observer roles</Text>
              </View>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="airplane-outline" size={20} color={colors.brand[600]} />
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Shared Aircraft</Text>
                <Text style={styles.featureDesc}>Share aircraft profiles with your entire team</Text>
              </View>
            </View>
          </View>

          <View style={styles.proBanner}>
            <Ionicons name="lock-closed" size={16} color={colors.amber[600]} />
            <Text style={styles.proText}>Available on Team plan ($29.99/month)</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.runway[50] },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.md, paddingVertical: 14, backgroundColor: colors.white, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.runway[200] },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 2, width: 70 },
  backText: { fontSize: fontSize.sm, color: colors.brand[600], fontWeight: "500" },
  headerTitle: { fontSize: fontSize.lg, fontWeight: "700", color: colors.runway[900], letterSpacing: -0.3 },
  emptyState: { alignItems: "center", paddingTop: spacing.xl },
  emptyIcon: { width: 88, height: 88, borderRadius: 44, backgroundColor: colors.runway[100], alignItems: "center", justifyContent: "center", marginBottom: spacing.lg },
  emptyTitle: { fontSize: fontSize.xl, fontWeight: "700", color: colors.runway[900], marginBottom: spacing.sm },
  emptySub: { fontSize: fontSize.sm, color: colors.runway[500], textAlign: "center", lineHeight: 20, marginBottom: spacing.xl, paddingHorizontal: spacing.md },
  featureList: { width: "100%", gap: spacing.md, marginBottom: spacing.xl },
  featureItem: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md, backgroundColor: colors.white, padding: spacing.md, borderRadius: borderRadius.md },
  featureContent: { flex: 1 },
  featureTitle: { fontSize: fontSize.sm, fontWeight: "600", color: colors.runway[900] },
  featureDesc: { fontSize: fontSize.xs, color: colors.runway[500], marginTop: 2 },
  proBanner: { flexDirection: "row", alignItems: "center", gap: spacing.sm, backgroundColor: colors.amber[50], paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.amber[100] },
  proText: { fontSize: fontSize.sm, fontWeight: "500", color: colors.amber[600] },
});
