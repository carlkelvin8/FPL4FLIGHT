import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, borderRadius, fontSize } from "@shared/theme";

export default function PrivacyScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color={colors.brand[600]} />
          <Text style={styles.backText}>Settings</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 70 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.lastUpdated}>Last updated: July 1, 2026</Text>

        <Text style={styles.sectionTitle}>1. Information We Collect</Text>
        <Text style={styles.body}>
          We collect information you provide directly:{"\n"}• Account information (email, name){"\n"}• Aircraft registration data{"\n"}• Flight planning data and form submissions{"\n"}• Device information for app functionality
        </Text>

        <Text style={styles.sectionTitle}>2. Location Data</Text>
        <Text style={styles.body}>
          The App collects location data only when the Map feature is actively in use. This data is used solely to display your position on the map and is not stored on our servers or shared with third parties.
        </Text>

        <Text style={styles.sectionTitle}>3. How We Use Your Information</Text>
        <Text style={styles.body}>
          We use collected information to:{"\n"}• Provide and maintain the App{"\n"}• Sync your data across devices{"\n"}• Improve our services{"\n"}• Send important service notifications{"\n"}• Ensure account security
        </Text>

        <Text style={styles.sectionTitle}>4. Data Storage & Security</Text>
        <Text style={styles.body}>
          Your data is stored securely using industry-standard encryption. We use Supabase for data storage with Row Level Security ensuring only you can access your own data. We do not sell or rent your personal information to third parties.
        </Text>

        <Text style={styles.sectionTitle}>5. Data Sharing</Text>
        <Text style={styles.body}>
          We do not share your personal data with third parties except:{"\n"}• When required by law{"\n"}• To protect our rights or safety{"\n"}• With your explicit consent{"\n"}• With service providers who assist in operating the App (under strict confidentiality)
        </Text>

        <Text style={styles.sectionTitle}>6. Your Rights</Text>
        <Text style={styles.body}>
          You have the right to:{"\n"}• Access your personal data{"\n"}• Correct inaccurate data{"\n"}• Request deletion of your data{"\n"}• Export your data{"\n"}• Withdraw consent at any time
        </Text>

        <Text style={styles.sectionTitle}>7. Data Retention</Text>
        <Text style={styles.body}>
          We retain your data for as long as your account is active. Upon account deletion, all personal data is permanently removed within 30 days. Anonymized analytics data may be retained for service improvement.
        </Text>

        <Text style={styles.sectionTitle}>8. Children's Privacy</Text>
        <Text style={styles.body}>
          FPL4FLIGHT is not intended for use by individuals under the age of 18. We do not knowingly collect personal information from children.
        </Text>

        <Text style={styles.sectionTitle}>9. Contact Us</Text>
        <Text style={styles.body}>
          For privacy-related inquiries, contact our Data Protection Officer at privacy@fpl4flight.io
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
