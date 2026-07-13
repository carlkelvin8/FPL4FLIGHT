import { useState, useCallback } from "react";
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { colors, spacing, borderRadius, fontSize } from "@shared/theme";
import { PressableScale } from "@shared/components/PressableScale";

interface Notam {
  id: string;
  text: string;
  type: string;
  effectiveStart: string;
  effectiveEnd: string;
  location: string;
}

export default function NotamScreen() {
  const insets = useSafeAreaInsets();
  const [icao, setIcao] = useState("");
  const [notams, setNotams] = useState<Notam[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState(["RPLL", "RPVM", "RPUX", "RPLC"]);

  const fetchNotams = useCallback(async (code: string) => {
    const airport = code.trim().toUpperCase();
    if (airport.length !== 4) return;
    setLoading(true);
    setError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const response = await fetch(`https://aviationweather.gov/api/data/notam?icao=${airport}&format=json`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();

      if (Array.isArray(data) && data.length > 0) {
        setNotams(data.slice(0, 30).map((n: any, i: number) => ({
          id: n.notamId ?? String(i),
          text: n.traditionalMessage ?? n.text ?? n.raw ?? "No details",
          type: n.classification ?? n.type ?? "NOTAM",
          effectiveStart: n.effectiveStart ?? n.startDate ?? "",
          effectiveEnd: n.effectiveEnd ?? n.endDate ?? "PERM",
          location: airport,
        })));
      } else {
        setNotams([]);
        setError(`No NOTAMs found for ${airport}`);
      }

      // Add to recent
      setRecentSearches((prev) => [airport, ...prev.filter((s) => s !== airport)].slice(0, 6));
    } catch (e: any) {
      setError(e.message || "Failed to fetch NOTAMs");
      setNotams([]);
    }
    setLoading(false);
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>NOTAM Viewer</Text>
        <Text style={styles.subtitle}>Notices to Airmen</Text>
      </View>

      {/* Search */}
      <View style={styles.searchSection}>
        <View style={styles.searchRow}>
          <View style={styles.searchInput}>
            <Ionicons name="search" size={18} color={colors.runway[400]} />
            <TextInput
              style={styles.input}
              placeholder="ICAO code (e.g. RPLL)"
              placeholderTextColor={colors.runway[400]}
              value={icao}
              onChangeText={setIcao}
              autoCapitalize="characters"
              maxLength={4}
              returnKeyType="search"
              onSubmitEditing={() => fetchNotams(icao)}
            />
          </View>
          <PressableScale style={styles.searchBtn} onPress={() => fetchNotams(icao)} haptic disabled={icao.trim().length !== 4}>
            <Ionicons name="arrow-forward" size={18} color={colors.white} />
          </PressableScale>
        </View>

        {/* Recent Searches */}
        <View style={styles.recentRow}>
          {recentSearches.map((code) => (
            <TouchableOpacity key={code} style={styles.recentChip} onPress={() => { setIcao(code); fetchNotams(code); }} activeOpacity={0.7}>
              <Text style={styles.recentText}>{code}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading && <ActivityIndicator style={{ marginTop: spacing.xl }} color={colors.brand[500]} size="large" />}

      {error && (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={16} color={colors.amber[600]} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <FlatList
        data={notams}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: insets.bottom + 20 }}
        renderItem={({ item }) => (
          <View style={styles.notamCard}>
            <View style={styles.notamHeader}>
              <View style={styles.notamBadge}>
                <Text style={styles.notamBadgeText}>{item.type}</Text>
              </View>
              <Text style={styles.notamId}>{item.id}</Text>
            </View>
            <Text style={styles.notamText} selectable>{item.text}</Text>
            <View style={styles.notamFooter}>
              <Text style={styles.notamDate}>Effective: {item.effectiveStart || "—"}</Text>
              <Text style={styles.notamDate}>Until: {item.effectiveEnd || "PERM"}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={!loading && !error ? (
          <View style={styles.empty}>
            <Ionicons name="warning-outline" size={48} color={colors.runway[300]} />
            <Text style={styles.emptyText}>Search for an airport to view NOTAMs</Text>
          </View>
        ) : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.runway[50] },
  header: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.runway[200] },
  title: { fontSize: 24, fontWeight: "700", color: colors.runway[900] },
  subtitle: { fontSize: fontSize.sm, color: colors.runway[400], marginTop: 2 },
  searchSection: { padding: spacing.md, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.runway[100] },
  searchRow: { flexDirection: "row", gap: spacing.sm },
  searchInput: { flex: 1, flexDirection: "row", alignItems: "center", gap: spacing.sm, backgroundColor: colors.runway[50], borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.runway[200], paddingHorizontal: spacing.md, height: 44 },
  input: { flex: 1, fontSize: fontSize.base, color: colors.runway[900], fontWeight: "600", letterSpacing: 1 },
  searchBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.brand[600], alignItems: "center", justifyContent: "center" },
  recentRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginTop: spacing.sm },
  recentChip: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: borderRadius.full, backgroundColor: colors.runway[100] },
  recentText: { fontSize: fontSize.xs, fontWeight: "600", color: colors.runway[600] },
  errorBox: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginHorizontal: spacing.md, marginTop: spacing.md, padding: spacing.md, backgroundColor: colors.amber[50], borderRadius: borderRadius.md },
  errorText: { fontSize: fontSize.sm, color: colors.amber[600], flex: 1 },
  notamCard: { backgroundColor: colors.white, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm, borderLeftWidth: 3, borderLeftColor: colors.amber[500] },
  notamHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm },
  notamBadge: { backgroundColor: colors.amber[50], paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  notamBadgeText: { fontSize: 9, fontWeight: "700", color: colors.amber[600] },
  notamId: { fontSize: fontSize.xs, color: colors.runway[400] },
  notamText: { fontSize: fontSize.sm, color: colors.runway[800], lineHeight: 18, fontFamily: "monospace" },
  notamFooter: { flexDirection: "row", justifyContent: "space-between", marginTop: spacing.sm, paddingTop: spacing.xs, borderTopWidth: 1, borderTopColor: colors.runway[100] },
  notamDate: { fontSize: 10, color: colors.runway[400] },
  empty: { alignItems: "center", paddingTop: spacing["3xl"] },
  emptyText: { fontSize: fontSize.sm, color: colors.runway[400], marginTop: spacing.md },
});
