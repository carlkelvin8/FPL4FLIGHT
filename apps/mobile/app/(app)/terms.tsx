import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, borderRadius, fontSize } from "@shared/theme";

export default function TermsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color={colors.brand[600]} />
          <Text style={styles.backText}>Settings</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <View style={{ width: 70 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.lastUpdated}>Last updated: July 1, 2026</Text>

        <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
        <Text style={styles.body}>
          By accessing or using FPL4FLIGHT ("the App"), you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the App.
        </Text>

        <Text style={styles.sectionTitle}>2. Description of Service</Text>
        <Text style={styles.body}>
          FPL4FLIGHT provides digital flight planning tools, aircraft management, and form submission services for aviation professionals. The App is intended as a supplementary tool and must not be used as the sole source for flight-critical decisions.
        </Text>

        <Text style={styles.sectionTitle}>3. User Accounts</Text>
        <Text style={styles.body}>
          You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorized use of your account. You must provide accurate and complete information when creating an account.
        </Text>

        <Text style={styles.sectionTitle}>4. Acceptable Use</Text>
        <Text style={styles.body}>
          You agree not to:{"\n"}• Use the App for any unlawful purpose{"\n"}• Attempt to gain unauthorized access to any systems{"\n"}• Transmit any harmful or malicious code{"\n"}• Interfere with other users' use of the App{"\n"}• Use the App's navigation features for actual flight operations
        </Text>

        <Text style={styles.sectionTitle}>5. Intellectual Property</Text>
        <Text style={styles.body}>
          All content, features, and functionality of FPL4FLIGHT are owned by FPL4FLIGHT and are protected by international copyright, trademark, and other intellectual property laws.
        </Text>

        <Text style={styles.sectionTitle}>6. Disclaimer</Text>
        <Text style={styles.body}>
          THE APP IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. FPL4FLIGHT DOES NOT GUARANTEE THE ACCURACY, COMPLETENESS, OR RELIABILITY OF ANY INFORMATION PROVIDED THROUGH THE APP. THE MAP AND NAVIGATION FEATURES MUST NOT BE USED FOR REAL FLIGHT OPERATIONS.
        </Text>

        <Text style={styles.sectionTitle}>7. Limitation of Liability</Text>
        <Text style={styles.body}>
          FPL4FLIGHT shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the App, including but not limited to loss of data, revenue, or profits.
        </Text>

        <Text style={styles.sectionTitle}>8. Changes to Terms</Text>
        <Text style={styles.body}>
          We reserve the right to modify these terms at any time. Continued use of the App after changes constitutes acceptance of the revised terms. We will notify users of significant changes via the App or email.
        </Text>

        <Text style={styles.sectionTitle}>9. Contact</Text>
        <Text style={styles.body}>
          For questions about these Terms, contact us at support@fpl4flight.io
        </Text>
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
  lastUpdated: { fontSize: fontSize.sm, color: colors.runway[400], marginBottom: spacing.lg },
  sectionTitle: { fontSize: fontSize.base, fontWeight: "700", color: colors.runway[900], marginTop: spacing.lg, marginBottom: spacing.sm },
  body: { fontSize: fontSize.sm, color: colors.runway[600], lineHeight: 22 },
});
