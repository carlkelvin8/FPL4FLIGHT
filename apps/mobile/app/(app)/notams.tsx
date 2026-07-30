import { useState, useCallback } from "react";
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, ActivityIndicator, Modal, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { colors, spacing, borderRadius, fontSize } from "@shared/theme";
import { PressableScale } from "@shared/components/PressableScale";

interface Notam {
  id: string;
  number: string;
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
  const [recentSearches, setRecentSearches] = useState(["RPLL", "RPVM", "RPUB", "RPLC", "RPVP"]);
  const [selectedNotam, setSelectedNotam] = useState<Notam | null>(null);
  const [searchedAirport, setSearchedAirport] = useState("");

  const fetchNotams = useCallback(async (code: string) => {
    const airport = code.trim().toUpperCase();
    if (airport.length !== 4) return;
    setLoading(true); setError(null); setSearchedAirport(airport);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const res = await fetch(`https://aviationweather.gov/api/data/notam?icao=${airport}&format=json`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setNotams(data.slice(0, 50).map((n: any, i: number) => ({
          id: n.notamId ?? String(i),
          number: n.notamNumber ?? n.notamId ?? `${airport}/${i + 1}`,
          text: n.traditionalMessage ?? n.text ?? n.raw ?? "No details",
          type: n.classification ?? n.type ?? "NOTAM",
          effectiveStart: n.effectiveStart ?? n.startDate ?? "",
          effectiveEnd: n.effectiveEnd ?? n.endDate ?? "PERM",
          location: n.icaoLocation ?? airport,
        })));
      } else { setNotams([]); setError(`No active NOTAMs for ${airport}`); }
      setRecentSearches((prev) => [airport, ...prev.filter((s) => s !== airport)].slice(0, 6));
    } catch (e: any) { setError(e.message || "Failed to fetch"); setNotams([]); }
    setLoading(false);
  }, []);

  const formatDate = (d: string) => {
    if (!d) return "—";
    if (d.length === 10 && !d.includes("-")) return `${d.slice(4, 6)}/${d.slice(6, 8)}/${d.slice(0, 4)} ${d.slice(8, 10)}:00Z`;
    return d.length > 16 ? d.slice(0, 16).replace("T", " ") + "Z" : d;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>NOTAM Viewer</Text>
          <Text style={styles.subtitle}>Notices to Airmen</Text>
        </View>
        {notams.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countNum}>{notams.length}</Text>
            <Text style={styles.countLabel}>Active</Text>
          </View>
        )}
      </View>

      {/* Search */}
      <View style={styles.searchSection}>
        <View style={styles.searchRow}>
          <View style={styles.searchInput}>
            <Ionicons name="search" size={16} color={colors.runway[400]} />
            <TextInput style={styles.input} placeholder="Enter ICAO code (e.g. RPLL)" placeholderTextColor={colors.runway[400]} value={icao} onChangeText={setIcao} autoCapitalize="characters" maxLength={4} returnKeyType="search" onSubmitEditing={() => fetchNotams(icao)} />
          </View>
          <PressableScale style={styles.searchBtn} onPress={() => fetchNotams(icao)} haptic disabled={icao.trim().length !== 4}>
            <Ionicons name="arrow-forward" size={18} color={colors.white} />
          </PressableScale>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          {recentSearches.map((code) => (
            <TouchableOpacity key={code} style={[styles.chip, searchedAirport === code && styles.chipActive]} onPress={() => { setIcao(code); fetchNotams(code); }} activeOpacity={0.7}>
              <Text style={[styles.chipText, searchedAirport === code && styles.chipTextActive]}>{code}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading && <ActivityIndicator style={{ marginTop: 40 }} color={colors.brand[500]} size="large" />}
      {error && <View style={styles.errorBox}><Ionicons name="alert-circle" size={16} color={colors.amber[600]} /><Text style={styles.errorText}>{error}</Text></View>}

      {/* NOTAM Cards */}
      <FlatList data={notams} keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: insets.bottom + 20 }}
        renderItem={({ item, index }) => (
          <TouchableOpacity style={styles.card} onPress={() => setSelectedNotam(item)} activeOpacity={0.7}>
            <View style={styles.cardHeader}>
              <View style={styles.cardBadge}><Text style={styles.cardBadgeText}>{item.type}</Text></View>
              <Text style={styles.cardNumber}>{item.number}</Text>
              <Text style={styles.cardLocation}>{item.location}</Text>
            </View>
            <Text style={styles.cardText} numberOfLines={3}>{item.text}</Text>
            <View style={styles.cardFooter}>
              <View style={styles.cardDateItem}>
                <Ionicons name="time-outline" size={12} color={colors.runway[400]} />
                <Text style={styles.cardDateText}>Begin: {formatDate(item.effectiveStart)}</Text>
              </View>
              <View style={styles.cardDateItem}>
                <Ionicons name="flag-outline" size={12} color={colors.runway[400]} />
                <Text style={styles.cardDateText}>End: {formatDate(item.effectiveEnd)}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={!loading && !error ? (
          <View style={styles.empty}><Ionicons name="warning-outline" size={48} color={colors.runway[300]} /><Text style={styles.emptyTitle}>Search for NOTAMs</Text><Text style={styles.emptyText}>Enter an ICAO code to fetch active notices</Text></View>
        ) : null}
      />

      {/* Detail Modal */}
      <Modal visible={!!selectedNotam} transparent animationType="slide">
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setSelectedNotam(null)}>
          <TouchableOpacity activeOpacity={1} style={styles.modal}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <View style={styles.cardBadge}><Text style={styles.cardBadgeText}>{selectedNotam?.type}</Text></View>
              <Text style={styles.modalNumber}>{selectedNotam?.number}</Text>
            </View>
            <View style={styles.modalMeta}>
              <View style={styles.metaRow}><Text style={styles.metaLabel}>Location</Text><Text style={styles.metaValue}>{selectedNotam?.location}</Text></View>
              <View style={styles.metaRow}><Text style={styles.metaLabel}>Begin Effectivity</Text><Text style={styles.metaValue}>{formatDate(selectedNotam?.effectiveStart ?? "")}</Text></View>
              <View style={styles.metaRow}><Text style={styles.metaLabel}>End Effectivity</Text><Text style={styles.metaValue}>{formatDate(selectedNotam?.effectiveEnd ?? "")}</Text></View>
            </View>
            <Text style={styles.modalSectionLabel}>NOTAM TEXT</Text>
            <ScrollView style={styles.modalTextScroll}><Text style={styles.modalText} selectable>{selectedNotam?.text}</Text></ScrollView>
            <PressableScale style={styles.modalCloseBtn} onPress={() => setSelectedNotam(null)} haptic><Text style={styles.modalCloseBtnText}>Close</Text></PressableScale>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.runway[50] },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.runway[200] },
  title: { fontSize: 24, fontWeight: "700", color: colors.runway[900] },
  subtitle: { fontSize: fontSize.sm, color: colors.runway[400], marginTop: 2 },
  countBadge: { alignItems: "center", backgroundColor: colors.brand[50], paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.md },
  countNum: { fontSize: fontSize.xl, fontWeight: "700", color: colors.brand[600] },
  countLabel: { fontSize: 9, fontWeight: "600", color: colors.brand[500] },
  // Search
  searchSection: { padding: spacing.md, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.runway[100] },
  searchRow: { flexDirection: "row", gap: spacing.sm },
  searchInput: { flex: 1, flexDirection: "row", alignItems: "center", gap: spacing.sm, backgroundColor: colors.runway[50], borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.runway[200], paddingHorizontal: spacing.md, height: 44 },
  input: { flex: 1, fontSize: fontSize.base, color: colors.runway[900], fontWeight: "600", letterSpacing: 1 },
  searchBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.brand[600], alignItems: "center", justifyContent: "center" },
  chipsRow: { gap: spacing.xs, marginTop: spacing.sm },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: borderRadius.full, backgroundColor: colors.runway[100] },
  chipActive: { backgroundColor: colors.brand[600] },
  chipText: { fontSize: 11, fontWeight: "600", color: colors.runway[600] },
  chipTextActive: { color: colors.white },
  // Error
  errorBox: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginHorizontal: spacing.md, marginTop: spacing.md, padding: spacing.md, backgroundColor: colors.amber[50], borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.amber[100] },
  errorText: { fontSize: fontSize.sm, color: colors.amber[600], flex: 1 },
  // Cards
  card: { backgroundColor: colors.white, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm, borderLeftWidth: 4, borderLeftColor: colors.amber[500], borderWidth: 1, borderColor: colors.runway[100] },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm },
  cardBadge: { backgroundColor: colors.amber[50], paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  cardBadgeText: { fontSize: 9, fontWeight: "700", color: colors.amber[600] },
  cardNumber: { fontSize: fontSize.sm, fontWeight: "700", color: colors.brand[600], flex: 1 },
  cardLocation: { fontSize: fontSize.xs, fontWeight: "600", color: colors.runway[500], backgroundColor: colors.runway[100], paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  cardText: { fontSize: fontSize.sm, color: colors.runway[700], lineHeight: 18, marginBottom: spacing.sm },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", paddingTop: spacing.xs, borderTopWidth: 1, borderTopColor: colors.runway[100] },
  cardDateItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  cardDateText: { fontSize: 10, color: colors.runway[400] },
  // Empty
  empty: { alignItems: "center", paddingTop: 60 },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: "600", color: colors.runway[600], marginTop: spacing.md },
  emptyText: { fontSize: fontSize.sm, color: colors.runway[400], marginTop: spacing.xs },
  // Modal
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modal: { backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg, maxHeight: "85%", paddingBottom: 40 },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.runway[300], alignSelf: "center", marginBottom: spacing.md },
  modalHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.md },
  modalNumber: { fontSize: fontSize.lg, fontWeight: "700", color: colors.brand[600] },
  modalMeta: { backgroundColor: colors.runway[50], borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.md, gap: spacing.sm },
  metaRow: { flexDirection: "row", justifyContent: "space-between" },
  metaLabel: { fontSize: fontSize.xs, fontWeight: "600", color: colors.runway[500] },
  metaValue: { fontSize: fontSize.xs, fontWeight: "600", color: colors.runway[900] },
  modalSectionLabel: { fontSize: 10, fontWeight: "700", color: colors.brand[600], letterSpacing: 1, marginBottom: spacing.sm },
  modalTextScroll: { maxHeight: 250, marginBottom: spacing.md },
  modalText: { fontSize: fontSize.sm, color: colors.runway[800], lineHeight: 20, fontFamily: "monospace" },
  modalCloseBtn: { backgroundColor: colors.brand[600], paddingVertical: 14, borderRadius: borderRadius.md, alignItems: "center" },
  modalCloseBtnText: { fontSize: fontSize.base, fontWeight: "700", color: colors.white },
});
