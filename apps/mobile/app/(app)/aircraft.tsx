import { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  FlatList,
  Alert,
  TouchableOpacity,
  Modal,
  Animated,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { colors, spacing, borderRadius, fontSize, type ThemeColors } from "@shared/theme";
import { PressableScale } from "@shared/components/PressableScale";
import { aircraftRepository, type AircraftData, type CreateAircraftDto } from "@features/aircraft/repositories/AircraftRepository";
import { useAppTheme } from "@shared/hooks/useAppTheme";

type WakeTurbulenceCategory = "L" | "M" | "H";

const EMPTY_FORM: CreateAircraftDto = {
  aircraftId: "",
  typeOfAircraft: "",
  wakeTurbulenceCategory: "L",
  equipment: "",
  surveillance: "",
  emergencyRadio: { uhf: false, vhf: false, elt: false },
  survivalEquipment: { polar: false, maritime: false, desert: false, jungle: false },
  jackets: { light: false, fluores: false, uhf: false, vhf: false },
  dinghies: { dinghies: false, cover: false },
};

export default function AircraftScreen() {
  const insets = useSafeAreaInsets();
  const { colors: theme } = useAppTheme();
  const [aircraftList, setAircraftList] = useState<AircraftData[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingAircraft, setEditingAircraft] = useState<AircraftData | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const successScale = useRef(new Animated.Value(0)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;
  const styles = createStyles(theme);
  const formStyles = createFormStyles(theme);

  const loadAircraft = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await aircraftRepository.findAll();
      setAircraftList(result.success ? result.data : []);
    } catch {
      setAircraftList([]);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadAircraft();
  }, [loadAircraft]);

  function playSuccessAnimation() {
    setShowSuccess(true);
    successScale.setValue(0);
    successOpacity.setValue(1);

    Animated.sequence([
      Animated.spring(successScale, {
        toValue: 1,
        friction: 4,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.delay(800),
      Animated.timing(successOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowSuccess(false);
    });
  }

  function handleAdd() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setEditingAircraft(null);
    setShowForm(true);
  }

  function handleEdit(aircraft: AircraftData) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingAircraft(aircraft);
    setShowForm(true);
  }

  function handleDelete(id: string) {
    Alert.alert("Delete Aircraft", "Are you sure you want to remove this aircraft?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          try {
            const result = await aircraftRepository.delete(id);
            if (!result.success) {
              Alert.alert("Error", result.error.message);
            } else {
              setAircraftList((prev) => prev.filter((a) => a.id !== id));
            }
          } catch {
            Alert.alert("Error", "Failed to delete aircraft.");
          }
        },
      },
    ]);
  }

  async function handleSave(data: CreateAircraftDto) {
    setIsSaving(true);
    try {
      if (editingAircraft) {
        const result = await aircraftRepository.update(editingAircraft.id, data);
        if (!result.success) {
          Alert.alert("Error", result.error.message);
          setIsSaving(false);
          return;
        }
      } else {
        const result = await aircraftRepository.create(data);
        if (!result.success) {
          Alert.alert("Error", result.error.message);
          setIsSaving(false);
          return;
        }
      }
      await loadAircraft();
      setShowForm(false);
      setEditingAircraft(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      playSuccessAnimation();
    } catch {
      Alert.alert("Error", "An unexpected error occurred.");
    }
    setIsSaving(false);
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Aircraft</Text>
          <Text style={styles.headerSub}>{aircraftList.length} registered</Text>
        </View>
        <TouchableOpacity style={[styles.addBtn, isSaving && { opacity: 0.5 }]} onPress={handleAdd} disabled={isSaving} accessibilityLabel="Add aircraft">
          <Ionicons name="add" size={22} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* List */}
      {isLoading ? (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color={colors.brand[600]} />
          <Text style={[styles.emptySub, { marginTop: spacing.md }]}>Loading aircraft...</Text>
        </View>
      ) : aircraftList.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons name="airplane-outline" size={48} color={colors.runway[300]} />
          </View>
          <Text style={styles.emptyTitle}>No aircraft yet</Text>
          <Text style={styles.emptySub}>
            Tap the + button to register your first aircraft
          </Text>
        </View>
      ) : (
        <FlatList
          data={aircraftList}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: insets.bottom + 80 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const wtcColor = item.wakeTurbulenceCategory === "H" ? colors.red[500] : item.wakeTurbulenceCategory === "M" ? colors.amber[600] : colors.brand[600];
            const wtcLabel = item.wakeTurbulenceCategory === "H" ? "Heavy" : item.wakeTurbulenceCategory === "M" ? "Medium" : "Light";
            return (
              <PressableScale
                style={styles.aircraftCard}
                onPress={() => handleEdit(item)}
                onLongPress={() => handleDelete(item.id)}
                haptic
              >
                <View style={styles.cardTop}>
                  <View style={styles.cardIcon}>
                    <Ionicons name="airplane" size={22} color={colors.brand[600]} />
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardId}>{item.aircraftId || "No ID"}</Text>
                    <Text style={styles.cardType}>{item.typeOfAircraft || "Unknown Type"}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDelete(item.id)}
                    style={styles.deleteBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityLabel={`Delete ${item.aircraftId}`}
                  >
                    <Ionicons name="trash-outline" size={18} color={colors.red[500]} />
                  </TouchableOpacity>
                  <View style={[styles.wtcBadge, { backgroundColor: wtcColor + "15", borderColor: wtcColor + "30" }]}>
                    <Text style={[styles.wtcText, { color: wtcColor }]}>{item.wakeTurbulenceCategory}</Text>
                  </View>
                </View>
                <View style={styles.cardDetails}>
                  <View style={styles.detailChip}><Ionicons name="hardware-chip-outline" size={12} color={theme.textMuted} /><Text style={styles.detailText}>EQP: {item.equipment || "—"}</Text></View>
                  <View style={styles.detailChip}><Ionicons name="radio-outline" size={12} color={theme.textMuted} /><Text style={styles.detailText}>SURV: {item.surveillance || "—"}</Text></View>
                  <View style={styles.detailChip}><Ionicons name="fitness-outline" size={12} color={theme.textMuted} /><Text style={styles.detailText}>WTC: {wtcLabel}</Text></View>
                </View>
              </PressableScale>
            );
          }}
        />
      )}

      {/* Form Modal */}
      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet">
        <AircraftForm
          initialData={editingAircraft ?? undefined}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditingAircraft(null); }}
          styles={formStyles}
        />
      </Modal>

      {/* Success Animation Overlay */}
      {showSuccess && (
        <Animated.View style={[styles.successOverlay, { opacity: successOpacity }]}>
          <Animated.View
            style={[
              styles.successCircle,
              { transform: [{ scale: successScale }] },
            ]}
          >
            <Ionicons name="checkmark" size={44} color={colors.white} />
          </Animated.View>
          <Animated.Text
            style={[
              styles.successText,
              { opacity: successOpacity, transform: [{ scale: successScale }] },
            ]}
          >
            Saved!
          </Animated.Text>
        </Animated.View>
      )}
    </View>
  );
}

/** Aircraft Form */
function AircraftForm({
  initialData,
  onSave,
  onCancel,
  styles,
}: {
  initialData?: CreateAircraftDto | undefined;
  onSave: (data: CreateAircraftDto) => void;
  onCancel: () => void;
  styles: ReturnType<typeof createFormStyles>;
}) {
  const insets = useSafeAreaInsets();
  const { colors: theme } = useAppTheme();
  const [form, setForm] = useState<CreateAircraftDto>(initialData ?? EMPTY_FORM);

  function updateField<K extends keyof CreateAircraftDto>(key: K, value: CreateAircraftDto[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleNested<G extends "emergencyRadio" | "survivalEquipment" | "jackets" | "dinghies">(
    group: G,
    key: keyof AircraftData[G]
  ) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setForm((prev) => ({
      ...prev,
      [group]: {
        ...(prev[group] as Record<string, boolean>),
        [key]: !(prev[group] as Record<string, boolean>)[key as string],
      },
    }));
  }

  function handleSave() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!form.aircraftId.trim()) {
      Alert.alert("Validation", "Aircraft ID is required.");
      return;
    }
    if (!form.typeOfAircraft.trim()) {
      Alert.alert("Validation", "Type of aircraft is required.");
      return;
    }
    onSave(form);
  }

  function showHelp(field: string) {
    const helpTexts: Record<string, string> = {
      Equipment:
        "Enter the COM/NAV/approach aid equipment carried.\n\nExamples: S (Standard), M (ILS), O (VOR), R (PBN approved)",
      Surveillance:
        "Enter surveillance equipment and capabilities.\n\nExamples: A (Transponder Mode A), C (Mode A + C), S (Mode S)",
    };
    Alert.alert(field, helpTexts[field] ?? "No help available.");
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Form Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} accessibilityLabel="Cancel">
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {initialData ? "Edit Aircraft" : "New Aircraft"}
        </Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveBtn} accessibilityLabel="Save aircraft">
          <Text style={styles.saveBtnText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Identification Card */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>IDENTIFICATION</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Aircraft ID</Text>
            <TextInput
              style={styles.textInput}
              value={form.aircraftId}
              onChangeText={(v) => updateField("aircraftId", v)}
              placeholder="e.g. RP-C1234"
              placeholderTextColor={colors.runway[300]}
              autoCapitalize="characters"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Type of aircraft</Text>
            <TextInput
              style={styles.textInput}
              value={form.typeOfAircraft}
              onChangeText={(v) => updateField("typeOfAircraft", v)}
              placeholder="e.g. C172"
              placeholderTextColor={colors.runway[300]}
              autoCapitalize="characters"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Wake turbulence category</Text>
            <View style={styles.segmentedControl}>
              {(["L", "M", "H"] as WakeTurbulenceCategory[]).map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.segment,
                    form.wakeTurbulenceCategory === cat && styles.segmentActive,
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    updateField("wakeTurbulenceCategory", cat);
                  }}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      form.wakeTurbulenceCategory === cat && styles.segmentTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Equipment Card */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>EQUIPMENT</Text>

          <View style={styles.inputGroup}>
            <View style={styles.inputLabelRow}>
              <Text style={styles.inputLabel}>Equipment</Text>
              <TouchableOpacity onPress={() => showHelp("Equipment")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="information-circle-outline" size={18} color={theme.textMuted} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.textInput}
              value={form.equipment}
              onChangeText={(v) => updateField("equipment", v)}
              placeholder="e.g. SDFGR"
              placeholderTextColor={colors.runway[300]}
              autoCapitalize="characters"
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputLabelRow}>
              <Text style={styles.inputLabel}>Surveillance</Text>
              <TouchableOpacity onPress={() => showHelp("Surveillance")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="information-circle-outline" size={18} color={theme.textMuted} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.textInput}
              value={form.surveillance}
              onChangeText={(v) => updateField("surveillance", v)}
              placeholder="e.g. SC"
              placeholderTextColor={colors.runway[300]}
              autoCapitalize="characters"
            />
          </View>
        </View>

        {/* Emergency & Survival Card */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>EMERGENCY & SURVIVAL</Text>

          <Text style={styles.subSectionTitle}>Emergency radio</Text>
          <View style={styles.chipRow}>
            <ChipToggle label="UHF" active={form.emergencyRadio.uhf} onPress={() => toggleNested("emergencyRadio", "uhf")} />
            <ChipToggle label="VHF" active={form.emergencyRadio.vhf} onPress={() => toggleNested("emergencyRadio", "vhf")} />
            <ChipToggle label="ELT" active={form.emergencyRadio.elt} onPress={() => toggleNested("emergencyRadio", "elt")} />
          </View>

          <View style={styles.divider} />

          <Text style={styles.subSectionTitle}>Survival equipment</Text>
          <View style={styles.chipRow}>
            <ChipToggle label="Polar" active={form.survivalEquipment.polar} onPress={() => toggleNested("survivalEquipment", "polar")} />
            <ChipToggle label="Maritime" active={form.survivalEquipment.maritime} onPress={() => toggleNested("survivalEquipment", "maritime")} />
            <ChipToggle label="Desert" active={form.survivalEquipment.desert} onPress={() => toggleNested("survivalEquipment", "desert")} />
            <ChipToggle label="Jungle" active={form.survivalEquipment.jungle} onPress={() => toggleNested("survivalEquipment", "jungle")} />
          </View>

          <View style={styles.divider} />

          <Text style={styles.subSectionTitle}>Jackets</Text>
          <View style={styles.chipRow}>
            <ChipToggle label="Light" active={form.jackets.light} onPress={() => toggleNested("jackets", "light")} />
            <ChipToggle label="Fluores" active={form.jackets.fluores} onPress={() => toggleNested("jackets", "fluores")} />
            <ChipToggle label="UHF" active={form.jackets.uhf} onPress={() => toggleNested("jackets", "uhf")} />
            <ChipToggle label="VHF" active={form.jackets.vhf} onPress={() => toggleNested("jackets", "vhf")} />
          </View>

          <View style={styles.divider} />

          <Text style={styles.subSectionTitle}>Dinghies</Text>
          <View style={styles.chipRow}>
            <ChipToggle label="Dinghies" active={form.dinghies.dinghies} onPress={() => toggleNested("dinghies", "dinghies")} />
            <ChipToggle label="Cover" active={form.dinghies.cover} onPress={() => toggleNested("dinghies", "cover")} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

/** Chip toggle */
function ChipToggle({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const { colors: theme } = useAppTheme();
  const styles = createFormStyles(theme);
  return (
    <TouchableOpacity
      style={[styles.chip, active && styles.chipActive]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
    >
      {active && <Ionicons name="checkmark" size={14} color={colors.white} style={{ marginRight: 4 }} />}
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── List Styles ───────────────────────────────────────────
const createStyles = (theme: ThemeColors) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: theme.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.border,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: theme.textPrimary,
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: fontSize.sm,
    color: theme.textMuted,
    marginTop: 2,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.brand[600],
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.brand[600],
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  // Empty state
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: theme.borderLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: "600",
    color: theme.textSecondary,
    marginBottom: spacing.xs,
  },
  emptySub: {
    fontSize: fontSize.sm,
    color: theme.textMuted,
    textAlign: "center",
    lineHeight: 20,
  },
  // Aircraft card
  aircraftCard: {
    backgroundColor: theme.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginTop: spacing.sm,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: theme.borderLight,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.brand[50],
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  cardInfo: {
    flex: 1,
  },
  cardId: {
    fontSize: fontSize.lg,
    fontWeight: "800",
    color: theme.textPrimary,
    letterSpacing: 0.5,
  },
  cardType: {
    fontSize: fontSize.sm,
    color: theme.textMuted,
    marginTop: 2,
  },
  wtcBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
  wtcText: {
    fontSize: 13,
    fontWeight: "800",
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.red[50],
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },
  cardDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.borderLight,
  },
  detailChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: theme.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  detailText: {
    fontSize: fontSize.xs,
    color: theme.textSecondary,
    fontWeight: "500",
  },
  // Success overlay
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
  },
  successCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.green[500],
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.green[500],
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  successText: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.white,
    marginTop: spacing.md,
    letterSpacing: 0.5,
  },
});

// ─── Form Styles ───────────────────────────────────────────
const createFormStyles = (theme: ThemeColors) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: theme.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.border,
  },
  cancelText: {
    fontSize: fontSize.base,
    color: theme.textMuted,
    fontWeight: "500",
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: theme.textPrimary,
    letterSpacing: -0.3,
  },
  saveBtn: {
    backgroundColor: colors.brand[600],
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 20,
    shadowColor: colors.brand[600],
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  saveBtnText: {
    fontSize: fontSize.sm,
    fontWeight: "700",
    color: colors.white,
  },
  card: {
    backgroundColor: theme.surface,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: 16,
    padding: spacing.lg,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.brand[600],
    letterSpacing: 1.2,
    marginBottom: spacing.lg,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: theme.textSecondary,
    marginBottom: 8,
  },
  inputLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: theme.surface,
    borderWidth: 1.5,
    borderColor: theme.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontSize: fontSize.base,
    color: theme.textPrimary,
  },
  segmentedControl: {
    flexDirection: "row",
    backgroundColor: theme.borderLight,
    borderRadius: 12,
    padding: 4,
  },
  segment: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 10,
  },
  segmentActive: {
    backgroundColor: colors.brand[600],
    shadowColor: colors.brand[600],
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  segmentText: {
    fontSize: fontSize.base,
    fontWeight: "700",
    color: theme.textMuted,
  },
  segmentTextActive: {
    color: colors.white,
  },
  subSectionTitle: {
    fontSize: fontSize.base,
    fontWeight: "700",
    color: theme.textPrimary,
    marginBottom: 12,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.border,
    marginVertical: spacing.lg,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: theme.borderLight,
    borderWidth: 1.5,
    borderColor: theme.border,
  },
  chipActive: {
    backgroundColor: colors.brand[600],
    borderColor: colors.brand[600],
    shadowColor: colors.brand[600],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  chipText: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: theme.textMuted,
  },
  chipTextActive: {
    color: colors.white,
    fontWeight: "700",
  },
});
