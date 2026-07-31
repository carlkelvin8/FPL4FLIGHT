import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, borderRadius, fontSize, type ThemeColors } from "@shared/theme";
import { PressableScale } from "@shared/components/PressableScale";
import { useAppTheme } from "@shared/hooks/useAppTheme";
import { APP_NAME } from "@shared/constants";

const FAQ = [
  { q: "How do I add a new aircraft?", a: "Go to the Aircraft tab and tap the + button. Fill in your aircraft details and tap Save." },
  { q: "Can I use the map for real navigation?", a: "No. The map feature is for reference only and must not be used for real flight navigation. Always use certified navigation equipment." },
  { q: "How do I schedule a flight?", a: "Go to the Flights tab and tap the + button. Fill in departure, arrival, aircraft, and crew information." },
  { q: "Is my data synced across devices?", a: "Yes. All your data is stored securely in the cloud and syncs automatically when you're connected to the internet." },
  { q: "How do I change my password?", a: "Go to Settings > Account and use the Change Password section to update your password." },
  { q: "What happens if I lose internet?", a: `${APP_NAME} works offline for basic features. Your data will sync when you reconnect.` },
  { q: "How do I delete my account?", a: "Go to Settings > Account and scroll to the Danger Zone section. Contact support for account deletion." },
];

export default function HelpScreen() {
  const insets = useSafeAreaInsets();
  const { colors: theme } = useAppTheme();
  const router = useRouter();
  const styles = createStyles(theme);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color={colors.brand[600]} />
          <Text style={styles.backText}>Settings</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 70 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
        {/* Contact */}
        <Text style={styles.sectionLabel}>CONTACT US</Text>
        <View style={styles.contactCard}>
          <PressableScale style={styles.contactRow} haptic>
            <View style={styles.contactIcon}>
              <Ionicons name="mail-outline" size={20} color={colors.brand[600]} />
            </View>
            <View style={styles.contactContent}>
              <Text style={styles.contactTitle}>Email Support</Text>
              <Text style={styles.contactDesc}>support@fpl4flight.io</Text>
            </View>
          </PressableScale>
          <View style={styles.divider} />
          <PressableScale style={styles.contactRow} haptic>
            <View style={styles.contactIcon}>
              <Ionicons name="chatbubble-outline" size={20} color={colors.brand[600]} />
            </View>
            <View style={styles.contactContent}>
              <Text style={styles.contactTitle}>Live Chat</Text>
              <Text style={styles.contactDesc}>Available Mon-Fri, 9AM-5PM PHT</Text>
            </View>
          </PressableScale>
        </View>

        {/* FAQ */}
        <Text style={[styles.sectionLabel, { marginTop: spacing.lg }]}>FREQUENTLY ASKED QUESTIONS</Text>
        {FAQ.map((item, i) => (
          <View key={i} style={styles.faqCard}>
            <Text style={styles.faqQuestion}>{item.q}</Text>
            <Text style={styles.faqAnswer}>{item.a}</Text>
          </View>
        ))}
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
  sectionLabel: { fontSize: fontSize.xs, fontWeight: "700", color: theme.textMuted, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: spacing.sm, paddingHorizontal: spacing.xs },
  contactCard: { backgroundColor: theme.surface, borderRadius: borderRadius.lg, overflow: "hidden", shadowColor: colors.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  contactRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md },
  contactIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.brand[50], alignItems: "center", justifyContent: "center" },
  contactContent: { flex: 1 },
  contactTitle: { fontSize: fontSize.sm, fontWeight: "600", color: theme.textPrimary },
  contactDesc: { fontSize: fontSize.xs, color: theme.textMuted, marginTop: 2 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: theme.border, marginLeft: 68 },
  faqCard: { backgroundColor: theme.surface, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm, shadowColor: colors.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  faqQuestion: { fontSize: fontSize.sm, fontWeight: "600", color: theme.textPrimary, marginBottom: 6 },
  faqAnswer: { fontSize: fontSize.sm, color: theme.textMuted, lineHeight: 20 },
});
