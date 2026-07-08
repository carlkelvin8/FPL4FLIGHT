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
import { colors, spacing, borderRadius, fontSize } from "@shared/theme";
import { PressableScale } from "@shared/components/PressableScale";
import { aircraftRepository, type AircraftData, type CreateAircraftDto } from "@features/aircraft/repositories/AircraftRepository";

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
  const [aircraftList, setAircraftList] = useState<AircraftData[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingAircraft, setEditingAircraft] = useState<AircraftData | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const successScale = useRef(new Animated.Value(0)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;

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
        <TouchableOpacity style={styles.addBtn} onPress={handleAdd} accessibilityLabel="Add aircraft">
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
          renderItem={({ item }) => (
            <PressableScale
              style={styles.aircraftCard}
              onPress={() => handleEdit(item)}
              onLongPress={() => handleDelete(item.id)}
              haptic
            >
              <View style={styles.cardIcon}>
                <Ionicons name="airplane" size={20} color={colors.brand[600]} />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardId}>{item.aircraftId || "No ID"}</Text>
                <Text style={styles.cardType}>
                  {item.typeOfAircraft || "Unknown type"} · WTC: {item.wakeTurbulenceCategory}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.runway[300]} />
            </PressableScale>
          )}
        />
      )}

      {/* Form Modal */}
      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet">
        <AircraftForm
          initialData={editingAircraft ?? undefined}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditingAircraft(null); }}
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
}: {
  initialData?: CreateAircraftDto | undefined;
  onSave: (data: CreateAircraftDto) => void;
  onCancel: () => void;
}) {
  const insets = useSafeAreaInsets();
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
    <View style={[formStyles.container, { paddingTop: insets.top }]}>
      {/* Form Header */}
      <View style={formStyles.header}>
        <TouchableOpacity onPress={onCancel} accessibilityLabel="Cancel">
          <Text style={formStyles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={formStyles.headerTitle}>
          {initialData ? "Edit Aircraft" : "New Aircraft"}
        </Text>
        <TouchableOpacity onPress={handleSave} style={formStyles.saveBtn} accessibilityLabel="Save aircraft">
          <Text style={formStyles.saveBtnText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Identification Card */}
        <View style={formStyles.card}>
          <Text style={formStyles.cardLabel}>IDENTIFICATION</Text>

          <View style={formStyles.inputGroup}>
            <Text style={formStyles.inputLabel}>Aircraft ID</Text>
            <TextInput
              style={formStyles.textInput}
              value={form.aircraftId}
              onChangeText={(v) => updateField("aircraftId", v)}
              placeholder="e.g. RP-C1234"
              placeholderTextColor={colors.runway[300]}
              autoCapitalize="characters"
            />
          </View>

          <View style={formStyles.inputGroup}>
            <Text style={formStyles.inputLabel}>Type of aircraft</Text>
            <TextInput
              style={formStyles.textInput}
              value={form.typeOfAircraft}
              onChangeText={(v) => updateField("typeOfAircraft", v)}
              placeholder="e.g. C172"
              placeholderTextColor={colors.runway[300]}
              autoCapitalize="characters"
            />
          </View>

          <View style={formStyles.inputGroup}>
            <Text style={formStyles.inputLabel}>Wake turbulence category</Text>
            <View style={formStyles.segmentedControl}>
              {(["L", "M", "H"] as WakeTurbulenceCategory[]).map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    formStyles.segment,
                    form.wakeTurbulenceCategory === cat && formStyles.segmentActive,
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    updateField("wakeTurbulenceCategory", cat);
                  }}
                >
                  <Text
                    style={[
                      formStyles.segmentText,
                      form.wakeTurbulenceCategory === cat && formStyles.segmentTextActive,
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
        <View style={formStyles.card}>
          <Text style={formStyles.cardLabel}>EQUIPMENT</Text>

          <View style={formStyles.inputGroup}>
            <View style={formStyles.inputLabelRow}>
              <Text style={formStyles.inputLabel}>Equipment</Text>
              <TouchableOpacity onPress={() => showHelp("Equipment")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="information-circle-outline" size={18} color={colors.runway[400]} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={formStyles.textInput}
              value={form.equipment}
              onChangeText={(v) => updateField("equipment", v)}
              placeholder="e.g. SDFGR"
              placeholderTextColor={colors.runway[300]}
              autoCapitalize="characters"
            />
          </View>

          <View style={formStyles.inputGroup}>
            <View style={formStyles.inputLabelRow}>
              <Text style={formStyles.inputLabel}>Surveillance</Text>
              <TouchableOpacity onPress={() => showHelp("Surveillance")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="information-circle-outline" size={18} color={colors.runway[400]} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={formStyles.textInput}
              value={form.surveillance}
              onChangeText={(v) => updateField("surveillance", v)}
              placeholder="e.g. SC"
              placeholderTextColor={colors.runway[300]}
              autoCapitalize="characters"
            />
          </View>
        </View>

        {/* Emergency & Survival Card */}
        <View style={formStyles.card}>
          <Text style={formStyles.cardLabel}>EMERGENCY & SURVIVAL</Text>

          <Text style={formStyles.subSectionTitle}>Emergency radio</Text>
          <View style={formStyles.chipRow}>
            <ChipToggle label="UHF" active={form.emergencyRadio.uhf} onPress={() => toggleNested("emergencyRadio", "uhf")} />
            <ChipToggle label="VHF" active={form.emergencyRadio.vhf} onPress={() => toggleNested("emergencyRadio", "vhf")} />
            <ChipToggle label="ELT" active={form.emergencyRadio.elt} onPress={() => toggleNested("emergencyRadio", "elt")} />
          </View>

          <View style={formStyles.divider} />

          <Text style={formStyles.subSectionTitle}>Survival equipment</Text>
          <View style={formStyles.chipRow}>
            <ChipToggle label="Polar" active={form.survivalEquipment.polar} onPress={() => toggleNested("survivalEquipment", "polar")} />
            <ChipToggle label="Maritime" active={form.survivalEquipment.maritime} onPress={() => toggleNested("survivalEquipment", "maritime")} />
            <ChipToggle label="Desert" active={form.survivalEquipment.desert} onPress={() => toggleNested("survivalEquipment", "desert")} />
            <ChipToggle label="Jungle" active={form.survivalEquipment.jungle} onPress={() => toggleNested("survivalEquipment", "jungle")} />
          </View>

          <View style={formStyles.divider} />

          <Text style={formStyles.subSectionTitle}>Jackets</Text>
          <View style={formStyles.chipRow}>
            <ChipToggle label="Light" active={form.jackets.light} onPress={() => toggleNested("jackets", "light")} />
            <ChipToggle label="Fluores" active={form.jackets.fluores} onPress={() => toggleNested("jackets", "fluores")} />
            <ChipToggle label="UHF" active={form.jackets.uhf} onPress={() => toggleNested("jackets", "uhf")} />
            <ChipToggle label="VHF" active={form.jackets.vhf} onPress={() => toggleNested("jackets", "vhf")} />
          </View>

          <View style={formStyles.divider} />

          <Text style={formStyles.subSectionTitle}>Dinghies</Text>
          <View style={formStyles.chipRow}>
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
  return (
    <TouchableOpacity
      style={[formStyles.chip, active && formStyles.chipActive]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
    >
      {active && <Ionicons name="checkmark" size={14} color={colors.white} style={{ marginRight: 4 }} />}
      <Text style={[formStyles.chipText, active && formStyles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── List Styles ───────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.runway[50],
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.runway[200],
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.runway[900],
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: fontSize.sm,
    color: colors.runway[400],
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
    backgroundColor: colors.runway[100],
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: "600",
    color: colors.runway[700],
    marginBottom: spacing.xs,
  },
  emptySub: {
    fontSize: fontSize.sm,
    color: colors.runway[400],
    textAlign: "center",
    lineHeight: 20,
  },
  // Aircraft card
  aircraftCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginTop: spacing.sm,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
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
  cardContent: {
    flex: 1,
  },
  cardId: {
    fontSize: fontSize.base,
    fontWeight: "700",
    color: colors.runway[900],
  },
  cardType: {
    fontSize: fontSize.sm,
    color: colors.runway[500],
    marginTop: 2,
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
const formStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.runway[50],
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.runway[200],
  },
  cancelText: {
    fontSize: fontSize.base,
    color: colors.runway[500],
    fontWeight: "500",
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.runway[900],
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
    backgroundColor: colors.white,
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
    color: colors.runway[700],
    marginBottom: 8,
  },
  inputLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.runway[200],
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontSize: fontSize.base,
    color: colors.runway[900],
  },
  segmentedControl: {
    flexDirection: "row",
    backgroundColor: colors.runway[100],
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
    color: colors.runway[400],
  },
  segmentTextActive: {
    color: colors.white,
  },
  subSectionTitle: {
    fontSize: fontSize.base,
    fontWeight: "700",
    color: colors.runway[900],
    marginBottom: 12,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.runway[200],
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
    backgroundColor: colors.runway[100],
    borderWidth: 1.5,
    borderColor: colors.runway[200],
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
    color: colors.runway[500],
  },
  chipTextActive: {
    color: colors.white,
    fontWeight: "700",
  },
});
