import { useState } from "react";
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, Modal, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useNotams, type Notam } from "@features/notams";
import { colors, spacing, borderRadius, fontSize, type ThemeColors } from "@shared/theme";
import { PressableScale } from "@shared/components/PressableScale";
import { LoadingState, ErrorState, EmptyState } from "@shared/components/ScreenState";
import { useAppTheme } from "@shared/hooks/useAppTheme";

export default function NotamScreen() {
  const insets = useSafeAreaInsets();
  const { colors: theme } = useAppTheme();
  const { icao, setIcao, activeAirport, notams, isLoading, error, recentSearches, search, refresh } = useNotams();
  const [selectedNotam, setSelectedNotam] = useState<Notam | null>(null);
  const styles = createStyles(theme);

  const handleSearch = (code: string) => {
    if (code.trim().length !== 4) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    search(code);
  };

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
            <Ionicons name="search" size={16} color={theme.textMuted} />
            <TextInput style={styles.input} placeholder="Enter ICAO code (e.g. RPLL)" placeholderTextColor={theme.textMuted} value={icao} onChangeText={setIcao} autoCapitalize="characters" maxLength={4} returnKeyType="search" onSubmitEditing={() => handleSearch(icao)} />
          </View>
          <PressableScale style={styles.searchBtn} onPress={() => handleSearch(icao)} haptic disabled={icao.trim().length !== 4}>
            <Ionicons name="arrow-forward" size={18} color={colors.white} />
          </PressableScale>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          {recentSearches.map((code) => (
            <TouchableOpacity key={code} style={[styles.chip, activeAirport === code && styles.chipActive]} onPress={() => { setIcao(code); handleSearch(code); }} activeOpacity={0.7}>
              <Text style={[styles.chipText, activeAirport === code && styles.chipTextActive]}>{code}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content states */}
      {isLoading ? (
        <LoadingState message={`Fetching NOTAMs for ${activeAirport ?? "..."}`} />
      ) : error ? (
        <ErrorState title="Could not load NOTAMs" message={error} onRetry={refresh} />
      ) : (
        <FlatList
          data={notams}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing.md, paddingBottom: insets.bottom + 20 }}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => setSelectedNotam(item)} activeOpacity={0.7}>
              <View style={styles.cardHeader}>
                <View style={styles.cardBadge}><Text style={styles.cardBadgeText}>{item.type}</Text></View>
                <Text style={styles.cardNumber}>{item.number}</Text>
                <Text style={styles.cardLocation}>{item.location}</Text>
              </View>
              <Text style={styles.cardText} numberOfLines={3}>{item.text}</Text>
              <View style={styles.cardFooter}>
                <View style={styles.cardDateItem}>
                  <Ionicons name="time-outline" size={12} color={theme.textMuted} />
                  <Text style={styles.cardDateText}>Begin: {formatDate(item.effectiveStart)}</Text>
                </View>
                <View style={styles.cardDateItem}>
                  <Ionicons name="flag-outline" size={12} color={theme.textMuted} />
                  <Text style={styles.cardDateText}>End: {formatDate(item.effectiveEnd)}</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <EmptyState
              icon="warning-outline"
              title="Search for NOTAMs"
              subtitle="Enter an ICAO code to fetch active notices"
            />
          }
        />
      )}

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

const createStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: theme.surface, borderBottomWidth: 1, borderBottomColor: theme.border },
    title: { fontSize: 24, fontWeight: "700", color: theme.textPrimary },
    subtitle: { fontSize: fontSize.sm, color: theme.textMuted, marginTop: 2 },
    countBadge: { alignItems: "center", backgroundColor: colors.brand[50], paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.md },
    countNum: { fontSize: fontSize.xl, fontWeight: "700", color: colors.brand[600] },
    countLabel: { fontSize: 9, fontWeight: "600", color: colors.brand[500] },
    // Search
    searchSection: { padding: spacing.md, backgroundColor: theme.surface, borderBottomWidth: 1, borderBottomColor: theme.borderLight },
    searchRow: { flexDirection: "row", gap: spacing.sm },
    searchInput: { flex: 1, flexDirection: "row", alignItems: "center", gap: spacing.sm, backgroundColor: theme.background, borderRadius: borderRadius.md, borderWidth: 1, borderColor: theme.border, paddingHorizontal: spacing.md, height: 44 },
    input: { flex: 1, fontSize: fontSize.base, color: theme.textPrimary, fontWeight: "600", letterSpacing: 1 },
    searchBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.brand[600], alignItems: "center", justifyContent: "center" },
    chipsRow: { gap: spacing.xs, marginTop: spacing.sm },
    chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: borderRadius.full, backgroundColor: theme.borderLight },
    chipActive: { backgroundColor: colors.brand[600] },
    chipText: { fontSize: 11, fontWeight: "600", color: theme.textSecondary },
    chipTextActive: { color: colors.white },
    // Cards
    card: { backgroundColor: theme.surface, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm, borderLeftWidth: 4, borderLeftColor: colors.amber[500], borderWidth: 1, borderColor: theme.borderLight },
    cardHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm },
    cardBadge: { backgroundColor: colors.amber[50], paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
    cardBadgeText: { fontSize: 9, fontWeight: "700", color: colors.amber[600] },
    cardNumber: { fontSize: fontSize.sm, fontWeight: "700", color: colors.brand[600], flex: 1 },
    cardLocation: { fontSize: fontSize.xs, fontWeight: "600", color: theme.textSecondary, backgroundColor: theme.borderLight, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    cardText: { fontSize: fontSize.sm, color: theme.textSecondary, lineHeight: 18, marginBottom: spacing.sm },
    cardFooter: { flexDirection: "row", justifyContent: "space-between", paddingTop: spacing.xs, borderTopWidth: 1, borderTopColor: theme.borderLight },
    cardDateItem: { flexDirection: "row", alignItems: "center", gap: 4 },
    cardDateText: { fontSize: 10, color: theme.textMuted },
    // Modal
    overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
    modal: { backgroundColor: theme.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg, maxHeight: "85%", paddingBottom: 40 },
    modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: theme.border, alignSelf: "center", marginBottom: spacing.md },
    modalHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.md },
    modalNumber: { fontSize: fontSize.lg, fontWeight: "700", color: colors.brand[600] },
    modalMeta: { backgroundColor: theme.background, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.md, gap: spacing.sm },
    metaRow: { flexDirection: "row", justifyContent: "space-between" },
    metaLabel: { fontSize: fontSize.xs, fontWeight: "600", color: theme.textMuted },
    metaValue: { fontSize: fontSize.xs, fontWeight: "600", color: theme.textPrimary },
    modalSectionLabel: { fontSize: 10, fontWeight: "700", color: colors.brand[600], letterSpacing: 1, marginBottom: spacing.sm },
    modalTextScroll: { maxHeight: 250, marginBottom: spacing.md },
    modalText: { fontSize: fontSize.sm, color: theme.textPrimary, lineHeight: 20, fontFamily: "monospace" },
    modalCloseBtn: { backgroundColor: colors.brand[600], paddingVertical: 14, borderRadius: borderRadius.md, alignItems: "center" },
    modalCloseBtnText: { fontSize: fontSize.base, fontWeight: "700", color: colors.white },
  });
