import { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { colors, spacing, borderRadius, fontSize } from "@shared/theme";
import { PressableScale } from "@shared/components/PressableScale";

type BillingCycle = "monthly" | "yearly";

const PLANS = {
  monthly: [
    { id: "free", name: "Starter", price: "₱0", sub: "Forever free", popular: false, features: ["5 aircraft profiles", "10 scheduled flights", "Basic form templates", "Map view (reference only)"], cta: "Current Plan", current: true },
    { id: "pro", name: "Pro", price: "₱499", sub: "/month", popular: true, features: ["Unlimited aircraft", "Unlimited flights", "All form templates", "Offline mode & sync", "Export to PDF", "Priority email support"], cta: "Upgrade to Pro", current: false },
    { id: "team", name: "Team", price: "₱1,499", sub: "/month", popular: false, features: ["Everything in Pro", "Up to 10 crew members", "Role-based access", "Shared aircraft fleet", "Audit trail & logs", "Dedicated account manager"], cta: "Upgrade to Team", current: false },
  ],
  yearly: [
    { id: "free", name: "Starter", price: "₱0", sub: "Forever free", popular: false, features: ["5 aircraft profiles", "10 scheduled flights", "Basic form templates", "Map view (reference only)"], cta: "Current Plan", current: true },
    { id: "pro", name: "Pro", price: "₱4,199", sub: "/year", popular: true, features: ["Unlimited aircraft", "Unlimited flights", "All form templates", "Offline mode & sync", "Export to PDF", "Priority email support"], cta: "Upgrade to Pro", current: false },
    { id: "team", name: "Team", price: "₱12,499", sub: "/year", popular: false, features: ["Everything in Pro", "Up to 10 crew members", "Role-based access", "Shared aircraft fleet", "Audit trail & logs", "Dedicated account manager"], cta: "Upgrade to Team", current: false },
  ],
};

export default function BillingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [cycle, setCycle] = useState<BillingCycle>("monthly");

  const plans = PLANS[cycle];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color={colors.brand[600]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Plans & Billing</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Billing cycle toggle */}
        <View style={styles.toggleWrapper}>
          <View style={styles.toggle}>
            <TouchableOpacity
              style={[styles.toggleBtn, cycle === "monthly" && styles.toggleBtnActive]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setCycle("monthly"); }}
            >
              <Text style={[styles.toggleText, cycle === "monthly" && styles.toggleTextActive]}>Monthly</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, cycle === "yearly" && styles.toggleBtnActive]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setCycle("yearly"); }}
            >
              <Text style={[styles.toggleText, cycle === "yearly" && styles.toggleTextActive]}>Yearly</Text>
              <View style={styles.saveBadge}><Text style={styles.saveBadgeText}>-30%</Text></View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Plans */}
        {plans.map((plan) => (
          <View key={plan.id} style={[styles.planCard, plan.popular && styles.planCardPopular]}>
            {plan.popular && (
              <View style={styles.popularTag}>
                <Text style={styles.popularTagText}>Most Popular</Text>
              </View>
            )}

            <View style={styles.planTop}>
              <Text style={styles.planName}>{plan.name}</Text>
              <View style={styles.priceRow}>
                <Text style={styles.planPrice}>{plan.price}</Text>
                <Text style={styles.planSub}>{plan.sub}</Text>
              </View>
            </View>

            <View style={styles.featuresList}>
              {plan.features.map((f) => (
                <View key={f} style={styles.featureRow}>
                  <Ionicons name="checkmark" size={16} color={plan.popular ? colors.brand[600] : colors.green[500]} />
                  <Text style={styles.featureText}>{f}</Text>
                </View>
              ))}
            </View>

            <PressableScale
              style={[styles.ctaBtn, plan.current && styles.ctaBtnCurrent, plan.popular && !plan.current && styles.ctaBtnPopular]}
              haptic
              disabled={plan.current}
            >
              <Text style={[styles.ctaText, plan.current && styles.ctaTextCurrent, plan.popular && !plan.current && styles.ctaTextPopular]}>
                {plan.cta}
              </Text>
            </PressableScale>
          </View>
        ))}

        {/* Footer */}
        <Text style={styles.footer}>All plans include SSL encryption, 99.9% uptime, and automatic backups. Cancel anytime.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.runway[50] },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: spacing.md, paddingVertical: 14,
    backgroundColor: colors.white, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.runway[200],
  },
  backBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: fontSize.lg, fontWeight: "700", color: colors.runway[900] },
  // Toggle
  toggleWrapper: { alignItems: "center", paddingVertical: spacing.lg },
  toggle: {
    flexDirection: "row", backgroundColor: colors.runway[100],
    borderRadius: 24, padding: 3,
  },
  toggleBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: 22,
  },
  toggleBtnActive: { backgroundColor: colors.white, shadowColor: colors.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  toggleText: { fontSize: fontSize.sm, fontWeight: "600", color: colors.runway[500] },
  toggleTextActive: { color: colors.runway[900] },
  saveBadge: { backgroundColor: colors.green[500], paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  saveBadgeText: { fontSize: 9, fontWeight: "700", color: colors.white },
  // Plan Card
  planCard: {
    backgroundColor: colors.white, marginHorizontal: spacing.md, marginBottom: spacing.md,
    borderRadius: borderRadius.lg, padding: spacing.lg,
    borderWidth: 1, borderColor: colors.runway[200],
  },
  planCardPopular: { borderColor: colors.brand[400], borderWidth: 2 },
  popularTag: {
    position: "absolute", top: -11, alignSelf: "center",
    backgroundColor: colors.brand[600], paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10,
  },
  popularTagText: { fontSize: 10, fontWeight: "700", color: colors.white, letterSpacing: 0.3 },
  planTop: { marginBottom: spacing.md },
  planName: { fontSize: fontSize.sm, fontWeight: "600", color: colors.runway[500], textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  priceRow: { flexDirection: "row", alignItems: "baseline", gap: 4 },
  planPrice: { fontSize: 32, fontWeight: "800", color: colors.runway[900], letterSpacing: -1 },
  planSub: { fontSize: fontSize.sm, color: colors.runway[400] },
  // Features
  featuresList: { gap: 8, marginBottom: spacing.lg },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  featureText: { fontSize: fontSize.sm, color: colors.runway[700] },
  // CTA
  ctaBtn: {
    alignItems: "center", paddingVertical: 14, borderRadius: borderRadius.md,
    backgroundColor: colors.runway[100],
  },
  ctaBtnCurrent: { backgroundColor: colors.runway[50], borderWidth: 1, borderColor: colors.runway[200] },
  ctaBtnPopular: { backgroundColor: colors.brand[600] },
  ctaText: { fontSize: fontSize.sm, fontWeight: "700", color: colors.runway[600] },
  ctaTextCurrent: { color: colors.runway[400] },
  ctaTextPopular: { color: colors.white },
  // Footer
  footer: { textAlign: "center", fontSize: fontSize.xs, color: colors.runway[400], paddingHorizontal: spacing.xl, marginTop: spacing.sm, lineHeight: 18 },
});
