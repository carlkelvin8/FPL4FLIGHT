import { useState, useCallback } from "react";
import {
  View, Text, TextInput, FlatList, StyleSheet, RefreshControl,
  Alert, Modal, TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useForms } from "@features/forms/hooks/useForms";
import { useTemplates } from "@features/forms/hooks/useTemplates";
import { colors, spacing, borderRadius, fontSize, shadows } from "@shared/theme";
import { Card } from "@shared/components/Card";
import { PressableScale } from "@shared/components/PressableScale";
import { SkeletonCard } from "@shared/components/Skeleton";
import { relativeTime } from "@shared/utils";

const STATUS_MAP = {
  draft: { label: "Draft", color: colors.amber[600], bg: colors.amber[50], icon: "create-outline" as const },
  completed: { label: "Completed", color: colors.brand[600], bg: colors.brand[50], icon: "checkmark-circle-outline" as const },
  synced: { label: "Synced", color: colors.green[600], bg: colors.green[50], icon: "cloud-done-outline" as const },
} as const;

export default function FormsScreen() {
  const insets = useSafeAreaInsets();
  const { forms, isLoading, isRefetching, error, refetch, createForm, deleteForm } = useForms();
  const { templates } = useTemplates();
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  const filtered = forms.filter((f) => {
    const q = search.toLowerCase();
    return f.id.toLowerCase().includes(q) || f.status.includes(q);
  });

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
    } catch {
      Alert.alert("Error", "Failed to create form.");
    } finally {
      setCreating(false);
    }
  }

  function handleDeleteForm(id: string) {
    Alert.alert("Delete Form", "Are you sure you want to delete this form? This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          try {
            await deleteForm(id);
          } catch {
            Alert.alert("Error", "Failed to delete form.");
          }
        },
      },
    ]);
  }

  function handleFormPress(formId: string) {
    router.push({ pathname: "/(app)/form-editor", params: { id: formId } });
  }

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
        <View style={styles.headerRight}>
          <PressableScale
            onPress={() => router.push("/(app)/notifications")}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            haptic
          >
            <Ionicons name="notifications-outline" size={22} color={colors.runway[600]} />
          </PressableScale>
          <Text style={styles.count}>{filtered.length} total</Text>
        </View>
      </View>

      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={18} color={colors.runway[400]} style={styles.searchIcon} />
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
          <Ionicons name="alert-circle" size={16} color={colors.red[600]} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => {
          const s = STATUS_MAP[item.status as keyof typeof STATUS_MAP] ?? STATUS_MAP.draft;
          return (
            <PressableScale
              style={styles.formCard}
              haptic
              onPress={() => handleFormPress(item.id)}
              onLongPress={() => handleDeleteForm(item.id)}
            >
              <Card variant="elevated">
                <View style={styles.cardTop}>
                  <View style={[styles.statusIconBg, { backgroundColor: s.bg }]}>
                    <Ionicons name={s.icon} size={16} color={s.color} />
                  </View>
                  <View style={styles.cardTitleWrap}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      Form #{item.id.slice(0, 8)}
                    </Text>
                    <Text style={styles.cardSub}>v{item.templateVersion}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
                    <Text style={[styles.statusLabel, { color: s.color }]}>{s.label}</Text>
                  </View>
                </View>
                <View style={styles.cardBottom}>
                  <Ionicons name="time-outline" size={12} color={colors.runway[400]} />
                  <Text style={styles.metaItem}>{relativeTime(item.updatedAt)}</Text>
                  <Text style={styles.metaDot}>·</Text>
                  <Ionicons name="document-outline" size={12} color={colors.runway[400]} />
                  <Text style={styles.metaItem}>Template {item.templateId.slice(0, 6)}</Text>
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
            <View style={styles.emptyIconBg}>
              <Ionicons name="document-text-outline" size={40} color={colors.runway[400]} />
            </View>
            <Text style={styles.emptyTitle}>No forms yet</Text>
            <Text style={styles.emptySub}>
              {search ? "Try a different search term" : "Tap + to start a new form from a template"}
            </Text>
          </View>
        }
      />

      {/* FAB */}
      <PressableScale style={styles.fab} haptic onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setShowNewForm(true);
      }}>
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
                <Ionicons name="layers-outline" size={32} color={colors.runway[400]} />
                <Text style={styles.modalEmptyText}>No templates available</Text>
                <Text style={styles.modalEmptyDesc}>Templates will appear here when your admin adds them.</Text>
              </View>
            ) : (
              <FlatList
                data={templates}
                keyExtractor={(t) => t.id}
                style={styles.templateList}
                renderItem={({ item }) => {
                  const sectionCount = item.schema.sections?.length ?? 0;
                  const fieldCount = item.schema.sections?.reduce((acc, s) => acc + (s.fields?.length ?? 0), 0) ?? 0;
                  return (
                    <PressableScale
                      style={styles.templateRow}
                      haptic
                      onPress={() => handleCreateForm(item.id, item.version, item.name)}
                      disabled={creating}
                    >
                      <View style={styles.templateIconBg}>
                        <Ionicons name="document-text" size={20} color={colors.brand[600]} />
                      </View>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.runway[50] },
  header: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm },
  headerRight: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  title: { fontSize: 28, fontWeight: "700", color: colors.runway[900], letterSpacing: -0.5 },
  count: { fontSize: fontSize.sm, color: colors.runway[400] },
  searchRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  searchIcon: { position: "absolute", left: spacing.lg + spacing.sm, zIndex: 1 },
  search: {
    flex: 1, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.runway[200],
    borderRadius: borderRadius.md, paddingHorizontal: spacing.lg + spacing.md, paddingVertical: spacing.sm + 2,
    fontSize: fontSize.base, color: colors.runway[900], ...shadows.sm,
  },
  errorBanner: { flexDirection: "row", alignItems: "center", gap: spacing.sm, backgroundColor: colors.red[50], marginHorizontal: spacing.lg, marginBottom: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.red[100] },
  errorText: { fontSize: fontSize.sm, color: colors.red[700], flex: 1 },
  list: { paddingHorizontal: spacing.lg, paddingBottom: 100 },
  formCard: { marginBottom: spacing.sm },
  cardTop: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm },
  statusIconBg: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  cardTitleWrap: { flex: 1 },
  cardTitle: { fontSize: fontSize.sm, fontWeight: "600", color: colors.runway[900] },
  cardSub: { fontSize: fontSize.xs, color: colors.runway[400], marginTop: 1 },
  cardBottom: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaItem: { fontSize: fontSize.xs, color: colors.runway[400] },
  metaDot: { fontSize: fontSize.xs, color: colors.runway[300] },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: borderRadius.sm },
  statusLabel: { fontSize: fontSize.xs, fontWeight: "600" },
  empty: { alignItems: "center", paddingTop: spacing["3xl"] },
  emptyIconBg: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.runway[100], alignItems: "center", justifyContent: "center", marginBottom: spacing.md },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: "600", color: colors.runway[700] },
  emptySub: { fontSize: fontSize.sm, color: colors.runway[400], marginTop: spacing.xs, textAlign: "center", paddingHorizontal: spacing.xl },
  fab: {
    position: "absolute", bottom: 90, right: spacing.lg,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: colors.brand[600], alignItems: "center", justifyContent: "center",
    ...shadows.lg,
  },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg, maxHeight: "70%", paddingBottom: 100 },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.runway[300], alignSelf: "center", marginBottom: spacing.md },
  modalTitle: { fontSize: fontSize.lg, fontWeight: "700", color: colors.runway[900], textAlign: "center" },
  modalSubtitle: { fontSize: fontSize.sm, color: colors.runway[500], textAlign: "center", marginBottom: spacing.lg },
  modalEmpty: { alignItems: "center", paddingVertical: spacing.xl },
  modalEmptyText: { fontSize: fontSize.base, fontWeight: "600", color: colors.runway[600], marginTop: spacing.sm },
  modalEmptyDesc: { fontSize: fontSize.sm, color: colors.runway[400], textAlign: "center", marginTop: spacing.xs, paddingHorizontal: spacing.lg },
  templateList: { maxHeight: 300 },
  templateRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: spacing.sm + 4, borderBottomWidth: 1, borderBottomColor: colors.runway[100] },
  templateIconBg: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.brand[50], alignItems: "center", justifyContent: "center" },
  templateInfo: { flex: 1 },
  templateName: { fontSize: fontSize.sm, fontWeight: "600", color: colors.runway[900] },
  templateMeta: { fontSize: fontSize.xs, color: colors.runway[400], marginTop: 2 },
});
