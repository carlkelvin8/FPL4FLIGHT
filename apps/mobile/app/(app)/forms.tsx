import { useState, useCallback, useMemo } from "react";
import {
  View, Text, TextInput, FlatList, StyleSheet, RefreshControl,
  Alert, Modal, TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Swipeable } from "react-native-gesture-handler";
import { useForms } from "@features/forms/hooks/useForms";
import { useTemplates } from "@features/forms/hooks/useTemplates";
import { colors, spacing, borderRadius, fontSize, shadows, type ThemeColors } from "@shared/theme";
import { Card } from "@shared/components/Card";
import { PressableScale } from "@shared/components/PressableScale";
import { SkeletonCard } from "@shared/components/Skeleton";
import { relativeTime } from "@shared/utils";
import { useAppTheme } from "@shared/hooks/useAppTheme";

const STATUS_MAP = {
  draft: { label: "Draft", color: colors.amber[600], bg: colors.amber[50], icon: "create-outline" as const },
  completed: { label: "Completed", color: colors.brand[600], bg: colors.brand[50], icon: "checkmark-circle-outline" as const },
  synced: { label: "Synced", color: colors.green[600], bg: colors.green[50], icon: "cloud-done-outline" as const },
} as const;

type SortOption = "recent" | "oldest" | "status";
type FilterOption = "all" | "draft" | "completed";

export default function FormsScreen() {
  const insets = useSafeAreaInsets();
  const { colors: theme } = useAppTheme();
  const { forms, isLoading, isRefetching, error, refetch, createForm, deleteForm } = useForms();
  const { templates } = useTemplates();
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [filterBy, setFilterBy] = useState<FilterOption>("all");
  const router = useRouter();
  const styles = createStyles(theme);

  // Dashboard stats
  const stats = useMemo(() => {
    const total = forms.length;
    const drafts = forms.filter((f) => f.status === "draft").length;
    const today = new Date();
    const completedToday = forms.filter((f) => f.status === "completed" && f.updatedAt.toDateString() === today.toDateString()).length;
    return { total, drafts, completedToday };
  }, [forms]);

  // Filter + sort + search
  const filtered = useMemo(() => {
    let result = forms.filter((f) => {
      if (filterBy !== "all" && f.status !== filterBy) return false;
      if (search) {
        const q = search.toLowerCase();
        const tName = templates.find((t) => t.id === f.templateId)?.name ?? "";
        return tName.toLowerCase().includes(q) || f.status.includes(q);
      }
      return true;
    });

    if (sortBy === "recent") result.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    else if (sortBy === "oldest") result.sort((a, b) => a.updatedAt.getTime() - b.updatedAt.getTime());
    else if (sortBy === "status") result.sort((a, b) => a.status.localeCompare(b.status));

    return result;
  }, [forms, templates, search, sortBy, filterBy]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  async function handleCreateForm(templateId: string, templateVersion: number, templateName: string) {
    setCreating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await createForm({ templateId, templateVersion, data: {} });
      setShowNewForm(false);
      Alert.alert("Form Created", `New "${templateName}" form created as draft.`);
    } catch { Alert.alert("Error", "Failed to create form."); }
    finally { setCreating(false); }
  }

  function handleDeleteForm(id: string) {
    Alert.alert("Delete Form", "Are you sure? This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        try { await deleteForm(id); } catch { Alert.alert("Error", "Failed to delete."); }
      }},
    ]);
  }

  function handleFormPress(formId: string) {
    router.push({ pathname: "/(app)/form-editor", params: { id: formId } });
  }

  /** Calculate form completion % based on filled fields */
  function getProgress(formData: Record<string, unknown>, templateId: string): number {
    const template = templates.find((t) => t.id === templateId);
    if (!template) return 0;
    const allFields = template.schema.sections?.flatMap((s: any) => s.fields ?? []) ?? [];
    const requiredFields = allFields.filter((f: any) => f.required);
    if (requiredFields.length === 0) return 0;
    const filled = requiredFields.filter((f: any) => {
      const val = formData[f.id];
      return val !== undefined && val !== null && val !== "";
    });
    return Math.round((filled.length / requiredFields.length) * 100);
  }

  // Swipeable delete action
  function renderRightActions(id: string) {
    return (
      <TouchableOpacity style={styles.swipeDelete} onPress={() => handleDeleteForm(id)} activeOpacity={0.8}>
        <Ionicons name="trash" size={22} color={colors.white} />
        <Text style={styles.swipeDeleteText}>Delete</Text>
      </TouchableOpacity>
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}><Text style={styles.title}>Forms</Text></View>
        <View style={styles.list}><SkeletonCard /><SkeletonCard /><SkeletonCard /></View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Forms</Text>
        <PressableScale onPress={() => router.push("/(app)/notifications")} haptic>
          <Ionicons name="notifications-outline" size={22} color={theme.textSecondary} />
        </PressableScale>
      </View>

      {/* Dashboard Summary Cards */}
      <View style={styles.dashRow}>
        <TouchableOpacity style={[styles.dashCard, { backgroundColor: colors.brand[50] }, filterBy === "all" && styles.dashCardActive]} onPress={() => { setFilterBy("all"); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }} activeOpacity={0.7}>
          <Text style={[styles.dashNum, { color: colors.brand[600] }]}>{stats.total}</Text>
          <Text style={styles.dashLabel}>Total</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.dashCard, { backgroundColor: colors.green[50] }, filterBy === "completed" && styles.dashCardActive]} onPress={() => { setFilterBy("completed"); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }} activeOpacity={0.7}>
          <Text style={[styles.dashNum, { color: colors.green[600] }]}>{stats.completedToday}</Text>
          <Text style={styles.dashLabel}>Done Today</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.dashCard, { backgroundColor: colors.amber[50] }, filterBy === "draft" && styles.dashCardActive]} onPress={() => { setFilterBy("draft"); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }} activeOpacity={0.7}>
          <Text style={[styles.dashNum, { color: colors.amber[600] }]}>{stats.drafts}</Text>
          <Text style={styles.dashLabel}>Drafts</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={18} color={theme.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.search}
          placeholder="Search forms..."
          placeholderTextColor={theme.textMuted}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {/* Sort & Filter Row */}
      <View style={styles.filterRow}>
        {/* Filter chips */}
        {(["all", "draft", "completed"] as FilterOption[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filterBy === f && styles.filterChipActive]}
            onPress={() => setFilterBy(f)}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterChipText, filterBy === f && styles.filterChipTextActive]}>
              {f === "all" ? "All" : f === "draft" ? "Drafts" : "Completed"}
            </Text>
          </TouchableOpacity>
        ))}
        {/* Sort button */}
        <TouchableOpacity
          style={styles.sortBtn}
          onPress={() => {
            const next: SortOption = sortBy === "recent" ? "oldest" : sortBy === "oldest" ? "status" : "recent";
            setSortBy(next);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="swap-vertical" size={14} color={theme.textMuted} />
          <Text style={styles.sortBtnText}>
            {sortBy === "recent" ? "Newest" : sortBy === "oldest" ? "Oldest" : "Status"}
          </Text>
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={16} color={colors.red[600]} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Form List */}
      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => {
          const s = STATUS_MAP[item.status as keyof typeof STATUS_MAP] ?? STATUS_MAP.draft;
          const templateName = templates.find((t) => t.id === item.templateId)?.name ?? "Unknown Template";
          const progress = getProgress(item.data, item.templateId);

          return (
            <Swipeable renderRightActions={() => renderRightActions(item.id)} overshootRight={false}>
              <PressableScale style={styles.formCard} haptic onPress={() => handleFormPress(item.id)}>
                <Card variant="elevated">
                  <View style={styles.cardTop}>
                    <View style={[styles.statusIconBg, { backgroundColor: s.bg }]}>
                      <Ionicons name={s.icon} size={16} color={s.color} />
                    </View>
                    <View style={styles.cardTitleWrap}>
                      <Text style={styles.cardTitle} numberOfLines={1}>{templateName}</Text>
                      <Text style={styles.cardSub}>{relativeTime(item.updatedAt)}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
                      <Text style={[styles.statusLabel, { color: s.color }]}>{s.label}</Text>
                    </View>
                  </View>

                  {/* Progress bar */}
                  <View style={styles.progressRow}>
                    <View style={styles.progressBar}>
                      <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: progress === 100 ? colors.green[500] : colors.brand[500] }]} />
                    </View>
                    <Text style={styles.progressText}>{progress}%</Text>
                  </View>
                </Card>
              </PressableScale>
            </Swipeable>
          );
        }}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing || isRefetching} onRefresh={onRefresh} tintColor={colors.brand[500]} colors={[colors.brand[500]]} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIconBg}><Ionicons name="document-text-outline" size={40} color={theme.textMuted} /></View>
            <Text style={styles.emptyTitle}>No forms yet</Text>
            <Text style={styles.emptySub}>{search ? "Try a different search" : "Tap + to start a new form"}</Text>
          </View>
        }
      />

      {/* FAB */}
      <PressableScale style={styles.fab} haptic onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowNewForm(true); }}>
        <Ionicons name="add" size={28} color={colors.white} />
      </PressableScale>

      {/* New Form Modal */}
      <Modal visible={showNewForm} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowNewForm(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>New Form</Text>
            <Text style={styles.modalSubtitle}>Select a template to start</Text>
            {templates.length === 0 ? (
              <View style={styles.modalEmpty}>
                <Ionicons name="layers-outline" size={32} color={theme.textMuted} />
                <Text style={styles.modalEmptyText}>No templates available</Text>
              </View>
            ) : (
              <FlatList
                data={templates}
                keyExtractor={(t) => t.id}
                style={styles.templateList}
                renderItem={({ item }) => {
                  const sectionCount = item.schema.sections?.length ?? 0;
                  const fieldCount = item.schema.sections?.reduce((acc: number, s: any) => acc + (s.fields?.length ?? 0), 0) ?? 0;
                  return (
                    <PressableScale style={styles.templateRow} haptic onPress={() => handleCreateForm(item.id, item.version, item.name)} disabled={creating}>
                      <View style={styles.templateIconBg}><Ionicons name="document-text" size={20} color={colors.brand[600]} /></View>
                      <View style={styles.templateInfo}>
                        <Text style={styles.templateName}>{item.name}</Text>
                        <Text style={styles.templateMeta}>{sectionCount} sections · {fieldCount} fields</Text>
                      </View>
                      <Ionicons name="add-circle-outline" size={22} color={colors.brand[600]} />
                    </PressableScale>
                  );
                }}
              />
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const createStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm },
    title: { fontSize: 28, fontWeight: "700", color: theme.textPrimary, letterSpacing: -0.5 },
    // Dashboard
    dashRow: { flexDirection: "row", paddingHorizontal: spacing.lg, gap: spacing.sm, marginBottom: spacing.md },
    dashCard: { flex: 1, borderRadius: borderRadius.md, padding: spacing.sm, alignItems: "center", borderWidth: 2, borderColor: "transparent" },
    dashCardActive: { borderColor: colors.brand[400] },
    dashNum: { fontSize: fontSize["2xl"], fontWeight: "700" },
    dashLabel: { fontSize: 10, fontWeight: "600", color: theme.textMuted, marginTop: 2 },
    // Search
    searchRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
    searchIcon: { position: "absolute", left: spacing.lg + spacing.sm, zIndex: 1 },
    search: { flex: 1, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: borderRadius.md, paddingHorizontal: spacing.lg + spacing.md, paddingVertical: spacing.sm, fontSize: fontSize.base, color: theme.textPrimary },
    // Filter & Sort
    filterRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.lg, marginBottom: spacing.md, gap: spacing.xs },
    filterChip: { paddingHorizontal: spacing.sm, paddingVertical: 5, borderRadius: borderRadius.full, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border },
    filterChipActive: { backgroundColor: colors.brand[600], borderColor: colors.brand[600] },
    filterChipText: { fontSize: 11, fontWeight: "600", color: theme.textMuted },
    filterChipTextActive: { color: colors.white },
    sortBtn: { flexDirection: "row", alignItems: "center", gap: 3, marginLeft: "auto", paddingHorizontal: spacing.sm, paddingVertical: 5, borderRadius: borderRadius.full, backgroundColor: theme.borderLight },
    sortBtnText: { fontSize: 11, fontWeight: "600", color: theme.textMuted },
    // Error
    errorBanner: { flexDirection: "row", alignItems: "center", gap: spacing.sm, backgroundColor: colors.red[50], marginHorizontal: spacing.lg, marginBottom: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.red[100] },
    errorText: { fontSize: fontSize.sm, color: colors.red[700], flex: 1 },
    // Cards
    list: { paddingHorizontal: spacing.lg },
    formCard: { marginBottom: spacing.sm },
    cardTop: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm },
    statusIconBg: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
    cardTitleWrap: { flex: 1 },
    cardTitle: { fontSize: fontSize.sm, fontWeight: "600", color: theme.textPrimary },
    cardSub: { fontSize: fontSize.xs, color: theme.textMuted, marginTop: 1 },
    statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: borderRadius.sm },
    statusLabel: { fontSize: fontSize.xs, fontWeight: "600" },
    // Progress bar
    progressRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.xs },
    progressBar: { flex: 1, height: 4, backgroundColor: theme.border, borderRadius: 2, overflow: "hidden" },
    progressFill: { height: 4, borderRadius: 2 },
    progressText: { fontSize: 10, fontWeight: "700", color: theme.textMuted, width: 30, textAlign: "right" },
    // Swipe delete
    swipeDelete: { backgroundColor: colors.red[500], justifyContent: "center", alignItems: "center", width: 80, borderRadius: borderRadius.md, marginBottom: spacing.sm, marginLeft: spacing.xs },
    swipeDeleteText: { color: colors.white, fontSize: 10, fontWeight: "700", marginTop: 2 },
    // Empty
    empty: { alignItems: "center", paddingTop: spacing["3xl"] },
    emptyIconBg: { width: 72, height: 72, borderRadius: 36, backgroundColor: theme.borderLight, alignItems: "center", justifyContent: "center", marginBottom: spacing.md },
    emptyTitle: { fontSize: fontSize.lg, fontWeight: "600", color: theme.textSecondary },
    emptySub: { fontSize: fontSize.sm, color: theme.textMuted, marginTop: spacing.xs, textAlign: "center", paddingHorizontal: spacing.xl },
    // FAB
    fab: { position: "absolute", bottom: 90, right: spacing.lg, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.brand[600], alignItems: "center", justifyContent: "center", ...shadows.lg },
    // Modal
    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
    modalContent: { backgroundColor: theme.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg, maxHeight: "70%", paddingBottom: 100 },
    modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.runway[300], alignSelf: "center", marginBottom: spacing.md },
    modalTitle: { fontSize: fontSize.lg, fontWeight: "700", color: theme.textPrimary, textAlign: "center" },
    modalSubtitle: { fontSize: fontSize.sm, color: theme.textMuted, textAlign: "center", marginBottom: spacing.lg },
    modalEmpty: { alignItems: "center", paddingVertical: spacing.xl },
    modalEmptyText: { fontSize: fontSize.base, fontWeight: "600", color: theme.textSecondary, marginTop: spacing.sm },
    templateList: { maxHeight: 300 },
    templateRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: spacing.sm + 4, borderBottomWidth: 1, borderBottomColor: theme.borderLight },
    templateIconBg: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.brand[50], alignItems: "center", justifyContent: "center" },
    templateInfo: { flex: 1 },
    templateName: { fontSize: fontSize.sm, fontWeight: "600", color: theme.textPrimary },
    templateMeta: { fontSize: fontSize.xs, color: theme.textMuted, marginTop: 2 },
  });
