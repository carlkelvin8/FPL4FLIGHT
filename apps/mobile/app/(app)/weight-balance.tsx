import { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { colors, spacing, borderRadius, fontSize } from "@shared/theme";

interface WBItem {
  id: string;
  label: string;
  weight: string;
  arm: string;
}

export default function WeightBalanceScreen() {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<WBItem[]>([
    { id: "1", label: "Empty Weight", weight: "", arm: "" },
    { id: "2", label: "Front Seats", weight: "", arm: "" },
    { id: "3", label: "Rear Seats", weight: "", arm: "" },
    { id: "4", label: "Fuel", weight: "", arm: "" },
    { id: "5", label: "Baggage", weight: "", arm: "" },
  ]);
  const [maxWeight, setMaxWeight] = useState("2550");
  const [fwdLimit, setFwdLimit] = useState("35.0");
  const [aftLimit, setAftLimit] = useState("47.3");

  function updateItem(id: string, field: "weight" | "arm", value: string) {
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, [field]: value } : i));
  }

  function addItem() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setItems((prev) => [...prev, { id: Date.now().toString(), label: "New Item", weight: "", arm: "" }]);
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  // Calculations
  const totalWeight = items.reduce((s, i) => s + (parseFloat(i.weight) || 0), 0);
  const totalMoment = items.reduce((s, i) => s + ((parseFloat(i.weight) || 0) * (parseFloat(i.arm) || 0)), 0);
  const cg = totalWeight > 0 ? totalMoment / totalWeight : 0;
  const maxW = parseFloat(maxWeight) || 0;
  const fwd = parseFloat(fwdLimit) || 0;
  const aft = parseFloat(aftLimit) || 0;

  const isOverweight = totalWeight > maxW && maxW > 0;
  const isCGForward = cg > 0 && cg < fwd;
  const isCGAft = cg > aft;
  const isWithinLimits = !isOverweight && !isCGForward && !isCGAft && totalWeight > 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Weight & Balance</Text>
        <Text style={styles.subtitle}>CG Calculator</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Limits Card */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>AIRCRAFT LIMITS</Text>
          <View style={styles.limitsRow}>
            <View style={styles.limitItem}>
              <Text style={styles.limitLabel}>Max Weight (lbs)</Text>
              <TextInput style={styles.limitInput} value={maxWeight} onChangeText={setMaxWeight} keyboardType="decimal-pad" />
            </View>
            <View style={styles.limitItem}>
              <Text style={styles.limitLabel}>Fwd CG Limit</Text>
              <TextInput style={styles.limitInput} value={fwdLimit} onChangeText={setFwdLimit} keyboardType="decimal-pad" />
            </View>
            <View style={styles.limitItem}>
              <Text style={styles.limitLabel}>Aft CG Limit</Text>
              <TextInput style={styles.limitInput} value={aftLimit} onChangeText={setAftLimit} keyboardType="decimal-pad" />
            </View>
          </View>
        </View>

        {/* Items */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardLabel}>WEIGHT ITEMS</Text>
            <TouchableOpacity onPress={addItem}>
              <Ionicons name="add-circle" size={24} color={colors.brand[600]} />
            </TouchableOpacity>
          </View>

          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.colHeader, { flex: 1.5 }]}>Item</Text>
            <Text style={[styles.colHeader, { flex: 1 }]}>Weight (lbs)</Text>
            <Text style={[styles.colHeader, { flex: 1 }]}>Arm (in)</Text>
            <Text style={[styles.colHeader, { flex: 1 }]}>Moment</Text>
            <View style={{ width: 28 }} />
          </View>

          {items.map((item) => {
            const w = parseFloat(item.weight) || 0;
            const a = parseFloat(item.arm) || 0;
            const moment = w * a;
            return (
              <View key={item.id} style={styles.tableRow}>
                <TextInput
                  style={[styles.tableCell, { flex: 1.5 }]}
                  value={item.label}
                  onChangeText={(v) => setItems((p) => p.map((i) => i.id === item.id ? { ...i, label: v } : i))}
                  placeholder="Item"
                  placeholderTextColor={colors.runway[300]}
                />
                <TextInput
                  style={[styles.tableCell, { flex: 1 }]}
                  value={item.weight}
                  onChangeText={(v) => updateItem(item.id, "weight", v)}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={colors.runway[300]}
                />
                <TextInput
                  style={[styles.tableCell, { flex: 1 }]}
                  value={item.arm}
                  onChangeText={(v) => updateItem(item.id, "arm", v)}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={colors.runway[300]}
                />
                <Text style={[styles.momentText, { flex: 1 }]}>{moment > 0 ? moment.toFixed(0) : "—"}</Text>
                <TouchableOpacity onPress={() => removeItem(item.id)} style={{ width: 28, alignItems: "center" }}>
                  <Ionicons name="close-circle" size={18} color={colors.red[500]} />
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {/* Results */}
        <View style={[styles.resultCard, isWithinLimits ? styles.resultGood : isOverweight || isCGAft || isCGForward ? styles.resultBad : styles.resultNeutral]}>
          <View style={styles.resultRow}>
            <View style={styles.resultItem}>
              <Text style={styles.resultLabel}>Total Weight</Text>
              <Text style={[styles.resultValue, isOverweight && { color: colors.red[600] }]}>{totalWeight.toFixed(0)} lbs</Text>
            </View>
            <View style={styles.resultItem}>
              <Text style={styles.resultLabel}>CG Position</Text>
              <Text style={[styles.resultValue, (isCGForward || isCGAft) && { color: colors.red[600] }]}>{cg > 0 ? cg.toFixed(2) + " in" : "—"}</Text>
            </View>
            <View style={styles.resultItem}>
              <Text style={styles.resultLabel}>Total Moment</Text>
              <Text style={styles.resultValue}>{totalMoment > 0 ? totalMoment.toFixed(0) : "—"}</Text>
            </View>
          </View>

          <View style={styles.statusRow}>
            <Ionicons name={isWithinLimits ? "checkmark-circle" : totalWeight > 0 ? "warning" : "information-circle"} size={20} color={isWithinLimits ? colors.green[600] : totalWeight > 0 ? colors.red[600] : colors.runway[400]} />
            <Text style={[styles.statusText, { color: isWithinLimits ? colors.green[600] : totalWeight > 0 ? colors.red[600] : colors.runway[500] }]}>
              {totalWeight === 0 ? "Enter weights to calculate" : isWithinLimits ? "Within limits ✓" : isOverweight ? `Overweight by ${(totalWeight - maxW).toFixed(0)} lbs` : isCGForward ? "CG too far forward" : isCGAft ? "CG too far aft" : "Check limits"}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.runway[50] },
  header: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.runway[200] },
  title: { fontSize: 24, fontWeight: "700", color: colors.runway[900] },
  subtitle: { fontSize: fontSize.sm, color: colors.runway[400], marginTop: 2 },
  content: { padding: spacing.md, paddingBottom: 100 },
  card: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.md },
  cardLabel: { fontSize: 10, fontWeight: "700", color: colors.brand[600], letterSpacing: 1, marginBottom: spacing.sm },
  cardHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm },
  limitsRow: { flexDirection: "row", gap: spacing.sm },
  limitItem: { flex: 1 },
  limitLabel: { fontSize: 9, fontWeight: "600", color: colors.runway[500], marginBottom: 4 },
  limitInput: { backgroundColor: colors.runway[50], borderWidth: 1, borderColor: colors.runway[200], borderRadius: borderRadius.sm, paddingHorizontal: spacing.sm, paddingVertical: 8, fontSize: fontSize.sm, color: colors.runway[900], textAlign: "center" },
  tableHeader: { flexDirection: "row", alignItems: "center", paddingBottom: spacing.xs, borderBottomWidth: 1, borderBottomColor: colors.runway[200], marginBottom: spacing.xs },
  colHeader: { fontSize: 9, fontWeight: "700", color: colors.runway[500], textTransform: "uppercase" },
  tableRow: { flexDirection: "row", alignItems: "center", paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.runway[50] },
  tableCell: { fontSize: fontSize.sm, color: colors.runway[900], paddingHorizontal: 4, paddingVertical: 4 },
  momentText: { fontSize: fontSize.sm, color: colors.runway[500], textAlign: "center" },
  resultCard: { borderRadius: borderRadius.lg, padding: spacing.md },
  resultGood: { backgroundColor: colors.green[50], borderWidth: 1, borderColor: colors.green[100] },
  resultBad: { backgroundColor: colors.red[50], borderWidth: 1, borderColor: colors.red[100] },
  resultNeutral: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.runway[200] },
  resultRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md },
  resultItem: { flex: 1, alignItems: "center" },
  resultLabel: { fontSize: 9, fontWeight: "600", color: colors.runway[500], marginBottom: 4 },
  resultValue: { fontSize: fontSize.lg, fontWeight: "700", color: colors.runway[900] },
  statusRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, justifyContent: "center" },
  statusText: { fontSize: fontSize.sm, fontWeight: "600" },
});
