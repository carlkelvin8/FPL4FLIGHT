import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { colors, spacing, borderRadius, fontSize } from "@shared/theme";

const AIP_SECTIONS = [
  { id: "gen", title: "GEN - General", desc: "General rules & procedures", icon: "book-outline", url: "https://aim-ph.caap.gov.ph" },
  { id: "enr", title: "ENR - En Route", desc: "Airways, navigation aids, airspace", icon: "navigate-outline", url: "https://aim-ph.caap.gov.ph" },
  { id: "ad", title: "AD - Aerodromes", desc: "Airport charts, procedures", icon: "airplane-outline", url: "https://aim-ph.caap.gov.ph" },
  { id: "sup", title: "AIP Supplements", desc: "Temporary changes to AIP", icon: "document-text-outline", url: "https://aim-ph.caap.gov.ph" },
  { id: "aic", title: "AIC - Circulars", desc: "Aeronautical Information Circulars", icon: "megaphone-outline", url: "https://aim-ph.caap.gov.ph" },
  { id: "charts", title: "Aeronautical Charts", desc: "VFR & IFR charts", icon: "map-outline", url: "https://aim-ph.caap.gov.ph" },
  { id: "notam", title: "NOTAM Bulletin", desc: "Current NOTAMs for Philippines", icon: "warning-outline", url: "https://www.notams.faa.gov" },
  { id: "weather", title: "Aviation Weather", desc: "METAR, TAF, SIGMET", icon: "cloud-outline", url: "https://aviationweather.gov" },
  { id: "caap", title: "CAAP Website", desc: "Civil Aviation Authority of the Philippines", icon: "globe-outline", url: "https://caap.gov.ph" },
  { id: "icao", title: "ICAO Doc Reference", desc: "International standards & procedures", icon: "library-outline", url: "https://www.icao.int" },
];

export default function AIPScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>AIP Reference</Text>
        <Text style={styles.subtitle}>Aeronautical Information Publication</Text>
      </View>

      <FlatList
        data={AIP_SECTIONS}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: insets.bottom + 20 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => Linking.openURL(item.url)}
            activeOpacity={0.7}
          >
            <View style={styles.cardIcon}>
              <Ionicons name={item.icon as any} size={22} color={colors.brand[600]} />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardDesc}>{item.desc}</Text>
            </View>
            <Ionicons name="open-outline" size={16} color={colors.runway[400]} />
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.runway[50] },
  header: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.runway[200] },
  title: { fontSize: 24, fontWeight: "700", color: colors.runway[900] },
  subtitle: { fontSize: fontSize.sm, color: colors.runway[400], marginTop: 2 },
  card: { flexDirection: "row", alignItems: "center", backgroundColor: colors.white, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.runway[100] },
  cardIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.brand[50], alignItems: "center", justifyContent: "center", marginRight: spacing.md },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: fontSize.sm, fontWeight: "700", color: colors.runway[900] },
  cardDesc: { fontSize: fontSize.xs, color: colors.runway[500], marginTop: 2 },
});
