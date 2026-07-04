import { useState, useCallback } from "react";
import {
  View, Text, TextInput, FlatList, StyleSheet, RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useForms } from "../../src/features/forms/hooks/useForms";
import { colors, spacing, borderRadius, fontSize, shadows } from "../../src/shared/theme";
import { Card } from "../../src/shared/components/Card";
import { PressableScale } from "../../src/shared/components/PressableScale";
import { SkeletonCard } from "../../src/shared/components/Skeleton";

const STATUS_MAP = {
  draft: { label: "Draft", color: colors.amber[600], bg: colors.amber[50] },
  completed: { label: "Completed", color: colors.brand[600], bg: colors.brand[50] },
  synced: { label: "Synced", color: colors.green[600], bg: colors.green[50] },
} as const;

function relativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

export default function FormsScreen() {
  const insets = useSafeAreaInsets();
  const { forms, isLoading, isRefetching, error, refetch } = useForms();
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const filtered = forms.filter((f) =>
    f.id.toLowerCase().includes(search.toLowerCase())
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}><Text style={styles.title}>Forms</Text></View>
        <View style={styles.list}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Forms</Text>
        <Text style={styles.count}>{filtered.length} total</Text>
      </View>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.search}
          placeholder="Search forms..."
          placeholderTextColor={colors.runway[400]}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel="Search forms"
        />
      </View>

      {error && (
        <View style={styles.errorBanner} accessibilityRole="alert">
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => {
          const s = STATUS_MAP[item.status as keyof typeof STATUS_MAP];
          return (
            <PressableScale style={styles.formCard} haptic>
              <Card variant="elevated">
                <View style={styles.cardTop}>
                  <View style={[styles.statusDot, { backgroundColor: s.color }]} />
                  <Text style={styles.cardTitle} numberOfLines={2}>
                    Form #{item.id.slice(0, 8)}
                  </Text>
                </View>
                <View style={styles.cardMeta}>
                  <Text style={styles.metaItem}>v{item.templateVersion}</Text>
                  <Text style={styles.metaDot}>·</Text>
                  <Text style={styles.metaItem}>{relativeTime(item.updatedAt)}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
                    <Text style={[styles.statusLabel, { color: s.color }]}>{s.label}</Text>
                  </View>
                </View>
              </Card>
            </PressableScale>
          );
        }}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || isRefetching}
            onRefresh={onRefresh}
            tintColor={colors.brand[500]}
            colors={[colors.brand[500]]}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No forms yet</Text>
            <Text style={styles.emptySub}>
              {search ? "Try a different search term" : "Tap + to start a new form"}
            </Text>
          </View>
        }
      />

      <PressableScale style={styles.fab} haptic>
        <Text style={styles.fabText}>+</Text>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.runway[50] },
  header: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm },
  title: { fontSize: 28, fontWeight: "700", color: colors.runway[900], letterSpacing: -0.5 },
  count: { fontSize: fontSize.sm, color: colors.runway[400] },
  searchRow: { paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  search: {
    backgroundColor: colors.white, borderWidth: 1, borderColor: colors.runway[200],
    borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2,
    fontSize: fontSize.base, color: colors.runway[900], ...shadows.sm,
  },
  errorBanner: { backgroundColor: colors.red[50], marginHorizontal: spacing.lg, marginBottom: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.red[100] },
  errorText: { fontSize: fontSize.sm, color: colors.red[700] },
  list: { paddingHorizontal: spacing.lg, gap: spacing.sm, paddingBottom: 100 },
  formCard: { marginBottom: spacing.sm },
  cardTop: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  cardTitle: { flex: 1, fontSize: fontSize.base, fontWeight: "600", color: colors.runway[900] },
  cardMeta: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  metaItem: { fontSize: fontSize.sm, color: colors.runway[400] },
  metaDot: { fontSize: fontSize.sm, color: colors.runway[300] },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.sm, marginLeft: "auto" },
  statusLabel: { fontSize: fontSize.xs, fontWeight: "600" },
  empty: { alignItems: "center", paddingTop: spacing["3xl"] },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: "600", color: colors.runway[700] },
  emptySub: { fontSize: fontSize.sm, color: colors.runway[400], marginTop: spacing.xs, textAlign: "center" },
  fab: {
    position: "absolute", bottom: 90, right: spacing.lg,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: colors.brand[600], alignItems: "center", justifyContent: "center",
    ...shadows.lg,
  },
  fabText: { fontSize: 28, color: colors.white, fontWeight: "300", marginTop: -2 },
});
