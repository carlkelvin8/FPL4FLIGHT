import { useState } from "react";
import {
  View, Text, TextInput, FlatList, StyleSheet, ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTemplates } from "../../src/features/forms/hooks/useTemplates";
import { colors, spacing, borderRadius, fontSize, shadows } from "../../src/shared/theme";
import { Card } from "../../src/shared/components/Card";
import { PressableScale } from "../../src/shared/components/PressableScale";
import { SkeletonCard } from "../../src/shared/components/Skeleton";

const ICONS = ["🛡️", "⚙️", "✅", "☣️", "📋", "🔍", "🚨", "🔧", "📝", "📊", "🔬", "📑"];

export default function TemplatesScreen() {
  const insets = useSafeAreaInsets();
  const { templates, isLoading, error } = useTemplates();
  const [search, setSearch] = useState("");

  const filtered = templates.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}><Text style={styles.title}>Templates</Text></View>
        <View style={styles.list}>
          <SkeletonCard />
          <SkeletonCard />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Templates</Text>
        <Text style={styles.count}>{filtered.length} available</Text>
      </View>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.search}
          placeholder="Search templates..."
          placeholderTextColor={colors.runway[400]}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel="Search templates"
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
        numColumns={2}
        columnWrapperStyle={styles.colWrap}
        renderItem={({ item, index }) => {
          const sectionCount = item.schema.sections?.length ?? 0;
          const fieldCount = item.schema.sections?.reduce((acc, s) => acc + (s.fields?.length ?? 0), 0) ?? 0;
          const icon = ICONS[index % ICONS.length];

          return (
            <PressableScale style={styles.templateCard} haptic>
              <Card variant="elevated" style={styles.cardInner}>
                <Text style={styles.icon}>{icon}</Text>
                <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
                <View style={styles.metaRow}>
                  <Text style={styles.meta}>{sectionCount} sections</Text>
                  <Text style={styles.meta}>{fieldCount} fields</Text>
                </View>
                {item.description && (
                  <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>
                )}
              </Card>
            </PressableScale>
          );
        }}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📁</Text>
            <Text style={styles.emptyTitle}>No templates found</Text>
            <Text style={styles.emptySub}>
              {search ? "Try a different search term" : "No templates available yet"}
            </Text>
          </View>
        }
      />
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
  list: { paddingHorizontal: spacing.lg },
  colWrap: { gap: spacing.sm },
  templateCard: { width: "48%", marginBottom: spacing.sm },
  cardInner: { alignItems: "center", paddingVertical: spacing.md },
  icon: { fontSize: 36, marginBottom: spacing.sm },
  name: { fontSize: fontSize.sm, fontWeight: "600", color: colors.runway[900], textAlign: "center", marginBottom: spacing.xs },
  metaRow: { flexDirection: "row", gap: spacing.xs, marginBottom: spacing.xs },
  meta: { fontSize: fontSize.xs, color: colors.runway[400] },
  desc: { fontSize: fontSize.xs, color: colors.runway[500], textAlign: "center", paddingHorizontal: spacing.xs },
  empty: { alignItems: "center", paddingTop: spacing["3xl"] },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: "600", color: colors.runway[700] },
  emptySub: { fontSize: fontSize.sm, color: colors.runway[400], marginTop: spacing.xs, textAlign: "center" },
});
