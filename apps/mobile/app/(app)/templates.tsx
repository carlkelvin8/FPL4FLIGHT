import { useState, useCallback } from "react";
import {
  View, Text, TextInput, FlatList, StyleSheet, RefreshControl, Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTemplates } from "@features/forms/hooks/useTemplates";
import { useForms } from "@features/forms/hooks/useForms";
import { colors, spacing, borderRadius, fontSize, shadows, formTypeColors, type ThemeColors } from "@shared/theme";
import { Card } from "@shared/components/Card";
import { PressableScale } from "@shared/components/PressableScale";
import { SkeletonCard } from "@shared/components/Skeleton";
import { useAppTheme } from "@shared/hooks/useAppTheme";

const FORM_TYPE_ICONS: Record<string, { icon: string }> = {
  "pre-flight": { icon: "airplane-outline" },
  "post-flight": { icon: "checkmark-done-outline" },
  "weight-balance": { icon: "scale-outline" },
  "maintenance": { icon: "construct-outline" },
  "operations": { icon: "people-outline" },
  "planning": { icon: "calculator-outline" },
} satisfies Record<string, { icon: string }>;

const FALLBACK_ICON = { icon: "people-outline" };
const FALLBACK_COLORS = { color: "#0369a1", bg: "#e0f2fe" };

export default function TemplatesScreen() {
  const insets = useSafeAreaInsets();
  const { colors: theme } = useAppTheme();
  const { templates, isLoading, error, refetch } = useTemplates();
  const { createForm } = useForms();
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const styles = createStyles(theme);

  const filtered = templates.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    (t.description ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  async function handleUseTemplate(templateId: string, templateVersion: number, templateName: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("New Form", `Create a new "${templateName}" form?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Create",
        onPress: async () => {
          try {
            await createForm({ templateId, templateVersion, data: {} });
            Alert.alert("Done", `"${templateName}" form created. Check your Forms tab.`);
          } catch (e: unknown) {
            Alert.alert("Error", e instanceof Error ? e.message : "Failed to create form.");
          }
        },
      },
    ]);
  }

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
        <Ionicons name="search-outline" size={18} color={theme.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.search}
          placeholder="Search templates..."
          placeholderTextColor={theme.textMuted}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={16} color={colors.red[600]} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => {
          const formType = item.schema?.metadata?.formType ?? "operations";
          const iconMeta = FORM_TYPE_ICONS[formType] ?? FALLBACK_ICON;
          const colorMeta = formTypeColors[formType] ?? FALLBACK_COLORS;
          const sectionCount = item.schema?.sections?.length ?? 0;
          const fieldCount = item.schema?.sections?.reduce((acc: number, s: { fields?: unknown[] }) => acc + (s.fields?.length ?? 0), 0) ?? 0;
          const estMins = item.schema?.metadata?.estimatedMinutes ?? "—";
          const regulation = item.schema?.metadata?.regulatoryBasis ?? "";

          return (
            <PressableScale
              style={styles.templateCard}
              haptic
              onPress={() => handleUseTemplate(item.id, item.version, item.name)}
            >
              <Card variant="elevated">
                <View style={styles.cardRow}>
                  <View style={[styles.iconBg, { backgroundColor: colorMeta.bg }]}>
                    <Ionicons name={iconMeta.icon as keyof typeof Ionicons.glyphMap} size={22} color={colorMeta.color} />
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardName}>{item.name}</Text>
                    {item.description && (
                      <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
                    )}
                    <View style={styles.cardMeta}>
                      <View style={styles.metaChip}>
                        <Ionicons name="layers-outline" size={12} color={theme.textMuted} />
                        <Text style={styles.metaText}>{sectionCount} sections</Text>
                      </View>
                      <View style={styles.metaChip}>
                        <Ionicons name="list-outline" size={12} color={theme.textMuted} />
                        <Text style={styles.metaText}>{fieldCount} fields</Text>
                      </View>
                      <View style={styles.metaChip}>
                        <Ionicons name="time-outline" size={12} color={theme.textMuted} />
                        <Text style={styles.metaText}>{estMins} min</Text>
                      </View>
                    </View>
                    {regulation ? (
                      <Text style={styles.regulation}>{regulation}</Text>
                    ) : null}
                  </View>
                  <Ionicons name="add-circle" size={24} color={colors.brand[500]} />
                </View>
              </Card>
            </PressableScale>
          );
        }}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand[500]} colors={[colors.brand[500]]} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIconBg}>
              <Ionicons name="layers-outline" size={40} color={theme.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No templates available</Text>
            <Text style={styles.emptySub}>
              {search ? "Try a different search" : "Templates will appear here when added by your admin"}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const createStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    header: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm },
    title: { fontSize: 28, fontWeight: "700", color: theme.textPrimary, letterSpacing: -0.5 },
    count: { fontSize: fontSize.sm, color: theme.textMuted },
    searchRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.lg, marginBottom: spacing.md },
    searchIcon: { position: "absolute", left: spacing.lg + spacing.sm, zIndex: 1 },
    search: { flex: 1, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: borderRadius.md, paddingHorizontal: spacing.lg + spacing.md, paddingVertical: spacing.sm + 2, fontSize: fontSize.base, color: theme.textPrimary, ...shadows.sm },
    errorBanner: { flexDirection: "row", alignItems: "center", gap: spacing.sm, backgroundColor: colors.red[50], marginHorizontal: spacing.lg, marginBottom: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.red[100] },
    errorText: { fontSize: fontSize.sm, color: colors.red[700], flex: 1 },
    list: { paddingHorizontal: spacing.lg },
    templateCard: { marginBottom: spacing.sm },
    cardRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
    iconBg: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
    cardContent: { flex: 1 },
    cardName: { fontSize: fontSize.sm, fontWeight: "700", color: theme.textPrimary },
    cardDesc: { fontSize: fontSize.xs, color: theme.textMuted, marginTop: 2 },
    cardMeta: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.xs },
    metaChip: { flexDirection: "row", alignItems: "center", gap: 3 },
    metaText: { fontSize: 11, color: theme.textMuted },
    regulation: { fontSize: 10, color: colors.brand[600], fontWeight: "600", marginTop: 3 },
    empty: { alignItems: "center", paddingTop: spacing["3xl"] },
    emptyIconBg: { width: 72, height: 72, borderRadius: 36, backgroundColor: theme.borderLight, alignItems: "center", justifyContent: "center", marginBottom: spacing.md },
    emptyTitle: { fontSize: fontSize.lg, fontWeight: "600", color: theme.textSecondary },
    emptySub: { fontSize: fontSize.sm, color: theme.textMuted, marginTop: spacing.xs, textAlign: "center", paddingHorizontal: spacing.xl },
  });
