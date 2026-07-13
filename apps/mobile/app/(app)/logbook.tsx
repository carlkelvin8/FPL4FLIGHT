import { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput,
  ScrollView, Alert, RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { supabase } from "@core/network";
import { colors, spacing, borderRadius, fontSize } from "@shared/theme";
import { PressableScale } from "@shared/components/PressableScale";

interface LogEntry {
  id: string;
  date: string;
  aircraftId: string;
  aircraftType: string;
  departure: string;
  arrival: string;
  route: string;
  picHours: number;
  sicHours: number;
  dualHours: number;
  nightHours: number;
  ifrHours: number;
  totalHours: number;
  landings: number;
  remarks: string;
}

const EMPTY_ENTRY = {
  date: "", aircraftId: "", aircraftType: "", departure: "", arrival: "",
  route: "", picHours: 0, sicHours: 0, dualHours: 0, nightHours: 0,
  ifrHours: 0, totalHours: 0, landings: 0, remarks: "",
};

export default function LogbookScreen() {
  const insets = useSafeAreaInsets();
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Summary stats
  const totalPIC = entries.reduce((s, e) => s + e.picHours, 0);
  const totalAll = entries.reduce((s, e) => s + e.totalHours, 0);
  const totalLandings = entries.reduce((s, e) => s + e.landings, 0);
  const totalNight = entries.reduce((s, e) => s + e.nightHours, 0);
  const totalIFR = entries.reduce((s, e) => s + e.ifrHours, 0);

  const load = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("pilot_logbook").select("*").eq("user_id", user.id).order("date", { ascending: false });
      if (data) setEntries(data.map((r: any) => ({
        id: r.id, date: r.date, aircraftId: r.aircraft_id, aircraftType: r.aircraft_type,
        departure: r.departure, arrival: r.arrival, route: r.route,
        picHours: r.pic_hours ?? 0, sicHours: r.sic_hours ?? 0, dualHours: r.dual_hours ?? 0,
        nightHours: r.night_hours ?? 0, ifrHours: r.ifr_hours ?? 0, totalHours: r.total_hours ?? 0,
        landings: r.landings ?? 0, remarks: r.remarks ?? "",
      })));
    } catch { /* */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleSave = async (entry: typeof EMPTY_ENTRY) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from("pilot_logbook").insert({
        user_id: user.id, date: entry.date, aircraft_id: entry.aircraftId,
        aircraft_type: entry.aircraftType, departure: entry.departure, arrival: entry.arrival,
        route: entry.route, pic_hours: entry.picHours, sic_hours: entry.sicHours,
        dual_hours: entry.dualHours, night_hours: entry.nightHours, ifr_hours: entry.ifrHours,
        total_hours: entry.totalHours, landings: entry.landings, remarks: entry.remarks,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowForm(false);
      load();
    } catch { Alert.alert("Error", "Failed to save entry."); }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Pilot Logbook</Text>
          <Text style={styles.subtitle}>{entries.length} entries</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowForm(true); }}>
          <Ionicons name="add" size={22} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: colors.brand[50] }]}>
          <Text style={[styles.summaryNum, { color: colors.brand[600] }]}>{totalAll.toFixed(1)}</Text>
          <Text style={styles.summaryLabel}>Total Hrs</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: colors.green[50] }]}>
          <Text style={[styles.summaryNum, { color: colors.green[600] }]}>{totalPIC.toFixed(1)}</Text>
          <Text style={styles.summaryLabel}>PIC</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: colors.amber[50] }]}>
          <Text style={[styles.summaryNum, { color: colors.amber[600] }]}>{totalLandings}</Text>
          <Text style={styles.summaryLabel}>Landings</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: colors.runway[100] }]}>
          <Text style={[styles.summaryNum, { color: colors.runway[700] }]}>{totalNight.toFixed(1)}</Text>
          <Text style={styles.summaryLabel}>Night</Text>
        </View>
      </View>

      {/* Entries List */}
      <FlatList
        data={entries}
        keyExtractor={(i) => i.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand[500]} />}
        contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: insets.bottom + 20 }}
        renderItem={({ item }) => (
          <View style={styles.entryCard}>
            <View style={styles.entryTop}>
              <Text style={styles.entryDate}>{item.date}</Text>
              <Text style={styles.entryHours}>{item.totalHours}h</Text>
            </View>
            <Text style={styles.entryRoute}>{item.departure} → {item.arrival}</Text>
            <Text style={styles.entryAircraft}>{item.aircraftId} ({item.aircraftType})</Text>
            <View style={styles.entryStats}>
              <Text style={styles.entryStat}>PIC: {item.picHours}h</Text>
              <Text style={styles.entryStat}>Ldg: {item.landings}</Text>
              {item.nightHours > 0 && <Text style={styles.entryStat}>Night: {item.nightHours}h</Text>}
              {item.ifrHours > 0 && <Text style={styles.entryStat}>IFR: {item.ifrHours}h</Text>}
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="book-outline" size={48} color={colors.runway[300]} />
            <Text style={styles.emptyText}>No logbook entries yet</Text>
            <Text style={styles.emptySubtext}>Tap + to log your first flight</Text>
          </View>
        }
      />

      {/* New Entry Modal */}
      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet">
        <LogEntryForm onSave={handleSave} onCancel={() => setShowForm(false)} />
      </Modal>
    </View>
  );
}

function LogEntryForm({ onSave, onCancel }: { onSave: (e: typeof EMPTY_ENTRY) => void; onCancel: () => void }) {
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState(EMPTY_ENTRY);
  const update = (k: string, v: string | number) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.formHeader}>
        <TouchableOpacity onPress={onCancel}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
        <Text style={styles.formTitle}>New Log Entry</Text>
        <TouchableOpacity style={styles.saveBtn} onPress={() => onSave(form)}><Text style={styles.saveBtnText}>Save</Text></TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
        <View style={styles.formCard}>
          <Text style={styles.formLabel}>FLIGHT INFO</Text>
          <Input label="Date" value={form.date} onChange={(v) => update("date", v)} placeholder="2026-07-13" />
          <Input label="Aircraft ID" value={form.aircraftId} onChange={(v) => update("aircraftId", v)} placeholder="RP-C1234" />
          <Input label="Aircraft Type" value={form.aircraftType} onChange={(v) => update("aircraftType", v)} placeholder="C172" />
          <Input label="Departure" value={form.departure} onChange={(v) => update("departure", v)} placeholder="RPUX" />
          <Input label="Arrival" value={form.arrival} onChange={(v) => update("arrival", v)} placeholder="RPLL" />
          <Input label="Route" value={form.route} onChange={(v) => update("route", v)} placeholder="Direct" />
        </View>
        <View style={styles.formCard}>
          <Text style={styles.formLabel}>HOURS</Text>
          <View style={styles.hoursRow}>
            <HoursInput label="Total" value={form.totalHours} onChange={(v) => update("totalHours", v)} />
            <HoursInput label="PIC" value={form.picHours} onChange={(v) => update("picHours", v)} />
            <HoursInput label="SIC" value={form.sicHours} onChange={(v) => update("sicHours", v)} />
          </View>
          <View style={styles.hoursRow}>
            <HoursInput label="Dual" value={form.dualHours} onChange={(v) => update("dualHours", v)} />
            <HoursInput label="Night" value={form.nightHours} onChange={(v) => update("nightHours", v)} />
            <HoursInput label="IFR" value={form.ifrHours} onChange={(v) => update("ifrHours", v)} />
          </View>
          <View style={styles.hoursRow}>
            <HoursInput label="Landings" value={form.landings} onChange={(v) => update("landings", v)} />
          </View>
        </View>
        <View style={styles.formCard}>
          <Text style={styles.formLabel}>REMARKS</Text>
          <Input label="" value={form.remarks} onChange={(v) => update("remarks", v)} placeholder="Notes..." multiline />
        </View>
      </ScrollView>
    </View>
  );
}

function Input({ label, value, onChange, placeholder, multiline }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; multiline?: boolean }) {
  return (
    <View style={{ marginBottom: spacing.sm }}>
      {label ? <Text style={styles.inputLabel}>{label}</Text> : null}
      <TextInput style={[styles.input, multiline && { height: 60, textAlignVertical: "top" }]} value={String(value)} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={colors.runway[300]} multiline={multiline} />
    </View>
  );
}

function HoursInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <View style={styles.hoursItem}>
      <Text style={styles.hoursLabel}>{label}</Text>
      <TextInput style={styles.hoursInput} value={value > 0 ? String(value) : ""} onChangeText={(v) => onChange(parseFloat(v) || 0)} placeholder="0" placeholderTextColor={colors.runway[300]} keyboardType="decimal-pad" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.runway[50] },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.runway[200] },
  title: { fontSize: 24, fontWeight: "700", color: colors.runway[900] },
  subtitle: { fontSize: fontSize.sm, color: colors.runway[400], marginTop: 2 },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.brand[600], alignItems: "center", justifyContent: "center" },
  summaryRow: { flexDirection: "row", paddingHorizontal: spacing.md, paddingVertical: spacing.md, gap: spacing.xs },
  summaryCard: { flex: 1, borderRadius: borderRadius.md, padding: spacing.sm, alignItems: "center" },
  summaryNum: { fontSize: fontSize.lg, fontWeight: "700" },
  summaryLabel: { fontSize: 9, fontWeight: "600", color: colors.runway[500], marginTop: 2 },
  entryCard: { backgroundColor: colors.white, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.runway[100] },
  entryTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  entryDate: { fontSize: fontSize.sm, fontWeight: "600", color: colors.runway[900] },
  entryHours: { fontSize: fontSize.sm, fontWeight: "700", color: colors.brand[600] },
  entryRoute: { fontSize: fontSize.base, fontWeight: "700", color: colors.runway[800], marginBottom: 2 },
  entryAircraft: { fontSize: fontSize.xs, color: colors.runway[500] },
  entryStats: { flexDirection: "row", gap: spacing.md, marginTop: spacing.xs, paddingTop: spacing.xs, borderTopWidth: 1, borderTopColor: colors.runway[100] },
  entryStat: { fontSize: fontSize.xs, color: colors.runway[500] },
  empty: { alignItems: "center", paddingTop: spacing["3xl"] },
  emptyText: { fontSize: fontSize.lg, fontWeight: "600", color: colors.runway[600], marginTop: spacing.md },
  emptySubtext: { fontSize: fontSize.sm, color: colors.runway[400], marginTop: spacing.xs },
  // Form
  formHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.runway[200] },
  cancelText: { fontSize: fontSize.base, color: colors.runway[500] },
  formTitle: { fontSize: fontSize.lg, fontWeight: "700", color: colors.runway[900] },
  saveBtn: { backgroundColor: colors.brand[600], paddingHorizontal: 18, paddingVertical: 8, borderRadius: 16 },
  saveBtnText: { fontSize: fontSize.sm, fontWeight: "700", color: colors.white },
  formCard: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.md },
  formLabel: { fontSize: 10, fontWeight: "700", color: colors.brand[600], letterSpacing: 1, marginBottom: spacing.sm },
  inputLabel: { fontSize: fontSize.xs, fontWeight: "600", color: colors.runway[600], marginBottom: 4 },
  input: { backgroundColor: colors.runway[50], borderWidth: 1, borderColor: colors.runway[200], borderRadius: borderRadius.sm, paddingHorizontal: spacing.sm, paddingVertical: 10, fontSize: fontSize.sm, color: colors.runway[900] },
  hoursRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.sm },
  hoursItem: { flex: 1 },
  hoursLabel: { fontSize: 10, fontWeight: "600", color: colors.runway[500], marginBottom: 4 },
  hoursInput: { backgroundColor: colors.runway[50], borderWidth: 1, borderColor: colors.runway[200], borderRadius: borderRadius.sm, paddingHorizontal: spacing.sm, paddingVertical: 10, fontSize: fontSize.sm, color: colors.runway[900], textAlign: "center" },
});
