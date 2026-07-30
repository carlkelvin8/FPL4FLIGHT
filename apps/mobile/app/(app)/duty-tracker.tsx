import { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, ScrollView, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { supabase } from "@core/network";
import { colors, spacing, borderRadius, fontSize } from "@shared/theme";
import { PressableScale } from "@shared/components/PressableScale";
import { FeatureGate } from "@shared/components/FeatureGate";

interface DutyEntry {
  id: string;
  date: string;
  dutyStart: string;
  dutyEnd: string;
  flightTime: number;
  restBefore: number;
  remarks: string;
}

// CAAP/ICAO FRMS limits (simplified)
const LIMITS = {
  maxDutyHours: 14,        // Max duty period
  maxFlightTime24h: 8,     // Max flight time in 24 hours
  minRestPeriod: 10,       // Minimum rest before next duty
  maxFlightTime7d: 30,     // Max flight time in 7 days
  maxFlightTime28d: 100,   // Max flight time in 28 days
};

export default function DutyTrackerScreen() {
  return (
    <FeatureGate feature="duty_tracker" message="Track duty periods and FRMS compliance. Upgrade to Pro to unlock.">
      <DutyTrackerContent />
    </FeatureGate>
  );
}

function DutyTrackerContent() {
  const insets = useSafeAreaInsets();
  const [entries, setEntries] = useState<DutyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("duty_tracker").select("*").eq("user_id", user.id).order("date", { ascending: false }).limit(30);
      if (data) setEntries(data.map((r: any) => ({
        id: r.id, date: r.date, dutyStart: r.duty_start, dutyEnd: r.duty_end,
        flightTime: r.flight_time ?? 0, restBefore: r.rest_before ?? 0, remarks: r.remarks ?? "",
      })));
    } catch { /* */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Calculate stats
  const last24hFlight = entries.filter((e) => {
    const d = new Date(e.date);
    return Date.now() - d.getTime() < 24 * 60 * 60 * 1000;
  }).reduce((s, e) => s + e.flightTime, 0);

  const last7dFlight = entries.filter((e) => {
    const d = new Date(e.date);
    return Date.now() - d.getTime() < 7 * 24 * 60 * 60 * 1000;
  }).reduce((s, e) => s + e.flightTime, 0);

  const last28dFlight = entries.filter((e) => {
    const d = new Date(e.date);
    return Date.now() - d.getTime() < 28 * 24 * 60 * 60 * 1000;
  }).reduce((s, e) => s + e.flightTime, 0);

  const lastDutyHours = entries.length > 0 ? (() => {
    const e = entries[0]!;
    if (!e.dutyStart || !e.dutyEnd) return 0;
    const [sh, sm] = e.dutyStart.split(":").map(Number);
    const [eh, em] = e.dutyEnd.split(":").map(Number);
    return ((eh ?? 0) + (em ?? 0) / 60) - ((sh ?? 0) + (sm ?? 0) / 60);
  })() : 0;

  const handleSave = async (entry: Omit<DutyEntry, "id">) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from("duty_tracker").insert({
        user_id: user.id, date: entry.date, duty_start: entry.dutyStart,
        duty_end: entry.dutyEnd, flight_time: entry.flightTime,
        rest_before: entry.restBefore, remarks: entry.remarks,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowForm(false);
      load();
    } catch { Alert.alert("Error", "Failed to save."); }
  };

  function getStatusColor(value: number, limit: number): string {
    const pct = value / limit;
    if (pct >= 0.9) return colors.red[500];
    if (pct >= 0.7) return colors.amber[500];
    return colors.green[500];
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Duty & FRMS</Text>
          <Text style={styles.subtitle}>Fatigue Risk Management</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowForm(true); }}>
          <Ionicons name="add" size={22} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* FRMS Status Cards */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Last 24h Flight</Text>
          <Text style={[styles.statValue, { color: getStatusColor(last24hFlight, LIMITS.maxFlightTime24h) }]}>{last24hFlight.toFixed(1)}h</Text>
          <Text style={styles.statLimit}>/ {LIMITS.maxFlightTime24h}h max</Text>
          <View style={styles.progressBar}><View style={[styles.progressFill, { width: `${Math.min(100, (last24hFlight / LIMITS.maxFlightTime24h) * 100)}%`, backgroundColor: getStatusColor(last24hFlight, LIMITS.maxFlightTime24h) }]} /></View>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Last 7 Days</Text>
          <Text style={[styles.statValue, { color: getStatusColor(last7dFlight, LIMITS.maxFlightTime7d) }]}>{last7dFlight.toFixed(1)}h</Text>
          <Text style={styles.statLimit}>/ {LIMITS.maxFlightTime7d}h max</Text>
          <View style={styles.progressBar}><View style={[styles.progressFill, { width: `${Math.min(100, (last7dFlight / LIMITS.maxFlightTime7d) * 100)}%`, backgroundColor: getStatusColor(last7dFlight, LIMITS.maxFlightTime7d) }]} /></View>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Last 28 Days</Text>
          <Text style={[styles.statValue, { color: getStatusColor(last28dFlight, LIMITS.maxFlightTime28d) }]}>{last28dFlight.toFixed(1)}h</Text>
          <Text style={styles.statLimit}>/ {LIMITS.maxFlightTime28d}h max</Text>
          <View style={styles.progressBar}><View style={[styles.progressFill, { width: `${Math.min(100, (last28dFlight / LIMITS.maxFlightTime28d) * 100)}%`, backgroundColor: getStatusColor(last28dFlight, LIMITS.maxFlightTime28d) }]} /></View>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Last Duty Period</Text>
          <Text style={[styles.statValue, { color: getStatusColor(lastDutyHours, LIMITS.maxDutyHours) }]}>{lastDutyHours.toFixed(1)}h</Text>
          <Text style={styles.statLimit}>/ {LIMITS.maxDutyHours}h max</Text>
          <View style={styles.progressBar}><View style={[styles.progressFill, { width: `${Math.min(100, (lastDutyHours / LIMITS.maxDutyHours) * 100)}%`, backgroundColor: getStatusColor(lastDutyHours, LIMITS.maxDutyHours) }]} /></View>
        </View>
      </ScrollView>

      {/* Entries */}
      <FlatList
        data={entries}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: insets.bottom + 20 }}
        renderItem={({ item }) => (
          <View style={styles.entryCard}>
            <View style={styles.entryRow}>
              <Text style={styles.entryDate}>{item.date}</Text>
              <Text style={styles.entryFlight}>{item.flightTime}h flight</Text>
            </View>
            <Text style={styles.entryDuty}>Duty: {item.dutyStart} — {item.dutyEnd}</Text>
            {item.remarks ? <Text style={styles.entryRemarks}>{item.remarks}</Text> : null}
          </View>
        )}
        ListEmptyComponent={<View style={styles.empty}><Ionicons name="time-outline" size={40} color={colors.runway[300]} /><Text style={styles.emptyText}>No duty entries yet</Text></View>}
      />

      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet">
        <DutyForm onSave={handleSave} onCancel={() => setShowForm(false)} />
      </Modal>
    </View>
  );
}

function DutyForm({ onSave, onCancel }: { onSave: (e: Omit<DutyEntry, "id">) => void; onCancel: () => void }) {
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState({ date: "", dutyStart: "", dutyEnd: "", flightTime: 0, restBefore: 0, remarks: "" });
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.formHeader}>
        <TouchableOpacity onPress={onCancel}><Text style={{ color: colors.runway[500] }}>Cancel</Text></TouchableOpacity>
        <Text style={styles.formTitle}>Log Duty Period</Text>
        <TouchableOpacity style={styles.saveBtn} onPress={() => onSave(form)}><Text style={{ color: colors.white, fontWeight: "700", fontSize: fontSize.sm }}>Save</Text></TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.md }}>
        <View style={styles.formCard}><Text style={styles.formLabel}>Date</Text><TextInput style={styles.formInput} value={form.date} onChangeText={(v) => setForm((p) => ({ ...p, date: v }))} placeholder="2026-07-13" placeholderTextColor={colors.runway[300]} /></View>
        <View style={styles.formCard}><Text style={styles.formLabel}>Duty Start (HH:MM)</Text><TextInput style={styles.formInput} value={form.dutyStart} onChangeText={(v) => setForm((p) => ({ ...p, dutyStart: v }))} placeholder="06:00" placeholderTextColor={colors.runway[300]} /></View>
        <View style={styles.formCard}><Text style={styles.formLabel}>Duty End (HH:MM)</Text><TextInput style={styles.formInput} value={form.dutyEnd} onChangeText={(v) => setForm((p) => ({ ...p, dutyEnd: v }))} placeholder="18:00" placeholderTextColor={colors.runway[300]} /></View>
        <View style={styles.formCard}><Text style={styles.formLabel}>Flight Time (hours)</Text><TextInput style={styles.formInput} value={form.flightTime > 0 ? String(form.flightTime) : ""} onChangeText={(v) => setForm((p) => ({ ...p, flightTime: parseFloat(v) || 0 }))} placeholder="4.5" keyboardType="decimal-pad" placeholderTextColor={colors.runway[300]} /></View>
        <View style={styles.formCard}><Text style={styles.formLabel}>Rest Before Duty (hours)</Text><TextInput style={styles.formInput} value={form.restBefore > 0 ? String(form.restBefore) : ""} onChangeText={(v) => setForm((p) => ({ ...p, restBefore: parseFloat(v) || 0 }))} placeholder="12" keyboardType="decimal-pad" placeholderTextColor={colors.runway[300]} /></View>
        <View style={styles.formCard}><Text style={styles.formLabel}>Remarks</Text><TextInput style={[styles.formInput, { height: 60 }]} value={form.remarks} onChangeText={(v) => setForm((p) => ({ ...p, remarks: v }))} placeholder="Notes..." multiline placeholderTextColor={colors.runway[300]} /></View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.runway[50] },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.runway[200] },
  title: { fontSize: 24, fontWeight: "700", color: colors.runway[900] },
  subtitle: { fontSize: fontSize.sm, color: colors.runway[400], marginTop: 2 },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.brand[600], alignItems: "center", justifyContent: "center" },
  statsRow: { paddingHorizontal: spacing.md, paddingVertical: spacing.md, gap: spacing.sm },
  statCard: { width: 140, backgroundColor: colors.white, borderRadius: borderRadius.md, padding: spacing.sm, borderWidth: 1, borderColor: colors.runway[100] },
  statLabel: { fontSize: 9, fontWeight: "600", color: colors.runway[500], marginBottom: 4 },
  statValue: { fontSize: fontSize.xl, fontWeight: "700" },
  statLimit: { fontSize: 9, color: colors.runway[400], marginTop: 2 },
  progressBar: { height: 3, backgroundColor: colors.runway[200], borderRadius: 2, marginTop: 6, overflow: "hidden" },
  progressFill: { height: 3, borderRadius: 2 },
  entryCard: { backgroundColor: colors.white, borderRadius: borderRadius.sm, padding: spacing.sm, marginBottom: spacing.xs, borderWidth: 1, borderColor: colors.runway[100] },
  entryRow: { flexDirection: "row", justifyContent: "space-between" },
  entryDate: { fontSize: fontSize.sm, fontWeight: "600", color: colors.runway[900] },
  entryFlight: { fontSize: fontSize.sm, fontWeight: "600", color: colors.brand[600] },
  entryDuty: { fontSize: fontSize.xs, color: colors.runway[500], marginTop: 2 },
  entryRemarks: { fontSize: fontSize.xs, color: colors.runway[400], marginTop: 2, fontStyle: "italic" },
  empty: { alignItems: "center", paddingTop: spacing["3xl"] },
  emptyText: { fontSize: fontSize.sm, color: colors.runway[400], marginTop: spacing.md },
  formHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.runway[200] },
  formTitle: { fontSize: fontSize.lg, fontWeight: "700", color: colors.runway[900] },
  saveBtn: { backgroundColor: colors.brand[600], paddingHorizontal: 16, paddingVertical: 8, borderRadius: 14 },
  formCard: { marginBottom: spacing.md },
  formLabel: { fontSize: fontSize.xs, fontWeight: "600", color: colors.runway[600], marginBottom: 6 },
  formInput: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.runway[200], borderRadius: borderRadius.sm, paddingHorizontal: spacing.sm, paddingVertical: 10, fontSize: fontSize.sm, color: colors.runway[900] },
});
