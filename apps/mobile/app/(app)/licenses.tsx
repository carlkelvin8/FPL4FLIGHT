import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, borderRadius, fontSize, type ThemeColors } from "@shared/theme";
import { useAppTheme } from "@shared/hooks/useAppTheme";
import { APP_NAME } from "@shared/constants";

const LICENSES = [
  { name: "React Native", version: "0.81.5", license: "MIT", author: "Meta Platforms" },
  { name: "Expo", version: "54.0.0", license: "MIT", author: "Expo" },
  { name: "React", version: "19.1.0", license: "MIT", author: "Meta Platforms" },
  { name: "Supabase JS", version: "2.47.0", license: "MIT", author: "Supabase" },
  { name: "TanStack React Query", version: "5.62.0", license: "MIT", author: "Tanner Linsley" },
  { name: "Zustand", version: "4.5.5", license: "MIT", author: "Daishi Kato" },
  { name: "React Native Maps", version: "1.x", license: "MIT", author: "react-native-maps" },
  { name: "Expo Location", version: "18.x", license: "MIT", author: "Expo" },
  { name: "Expo Router", version: "6.0.24", license: "MIT", author: "Expo" },
  { name: "React Native Reanimated", version: "4.1.1", license: "MIT", author: "Software Mansion" },
  { name: "React Native Gesture Handler", version: "2.28.0", license: "MIT", author: "Software Mansion" },
  { name: "React Native SVG", version: "15.12.1", license: "MIT", author: "react-native-svg" },
  { name: "Expo Haptics", version: "15.0.8", license: "MIT", author: "Expo" },
  { name: "Expo Secure Store", version: "15.0.8", license: "MIT", author: "Expo" },
];

export default function LicensesScreen() {
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
        <Text style={styles.headerTitle}>Licenses</Text>
        <View style={{ width: 70 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: spacing.md, paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.intro}>
          {APP_NAME} is built with the following open source libraries. We are grateful to the authors and communities behind these projects.
        </Text>

        {LICENSES.map((lib, i) => (
          <View key={lib.name} style={styles.licenseCard}>
            <View style={styles.licenseHeader}>
              <Text style={styles.libName}>{lib.name}</Text>
              <Text style={styles.libVersion}>v{lib.version}</Text>
            </View>
            <View style={styles.licenseFooter}>
              <View style={styles.licenseBadge}>
                <Text style={styles.licenseText}>{lib.license}</Text>
              </View>
              <Text style={styles.libAuthor}>{lib.author}</Text>
            </View>
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
  intro: { fontSize: fontSize.sm, color: theme.textMuted, lineHeight: 20, marginBottom: spacing.lg, paddingHorizontal: spacing.xs },
  licenseCard: { backgroundColor: theme.surface, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm, shadowColor: colors.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  licenseHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  libName: { fontSize: fontSize.sm, fontWeight: "600", color: theme.textPrimary },
  libVersion: { fontSize: fontSize.xs, color: theme.textMuted },
  licenseFooter: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  licenseBadge: { backgroundColor: colors.brand[50], paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  licenseText: { fontSize: 10, fontWeight: "700", color: colors.brand[600] },
  libAuthor: { fontSize: fontSize.xs, color: theme.textMuted },
});
