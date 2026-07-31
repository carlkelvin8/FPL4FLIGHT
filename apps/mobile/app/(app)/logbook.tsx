import { useState, useEffect, useCallback, useMemo } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput,
  ScrollView, Alert, RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";
import { supabase } from "@core/network";
import { colors, spacing, borderRadius, fontSize } from "@shared/theme";
import { APP_NAME } from "@shared/constants";

interface LogEntry {
  id: string;
  date: string;
  aircraftMakeModel: string;
  aircraftIdent: string;
  from: string;
  to: string;
  selLand: number;
  melLand: number;
  helicopter: number;
  dualReceived: number;
  pilotInCommand: number;
  secondInCommand: number;
  groundTrainer: number;
  day: number;
  night: number;
  crossCountry: number;
  actualInstrument: number;
  simulatedInstrument: number;
  instrumentApproaches: number;
  landingsDay: number;
  landingsNight: number;
  totalFlightTime: number;
  remarks: string;
}

const EMPTY_ENTRY: Omit<LogEntry, "id"> = {
  date: "", aircraftMakeModel: "", aircraftIdent: "", from: "", to: "",
  selLand: 0, melLand: 0, helicopter: 0,
  dualReceived: 0, pilotInCommand: 0, secondInCommand: 0,
  groundTrainer: 0, day: 0, night: 0, crossCountry: 0,
  actualInstrument: 0, simulatedInstrument: 0, instrumentApproaches: 0,
  landingsDay: 0, landingsNight: 0, totalFlightTime: 0, remarks: "",
};

// ─── Currency Tracker Logic ─────────────────────────────────────
interface CurrencyStatus {
  label: string;
  current: boolean;
  detail: string;
  icon: string;
}

function calculateCurrency(entries: LogEntry[]): CurrencyStatus[] {
  const now = new Date();
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
  const ninetyDayStr = ninetyDaysAgo.toISOString().slice(0, 10);
  const sixMonthStr = sixMonthsAgo.toISOString().slice(0, 10);

  const recent90 = entries.filter((e) => e.date >= ninetyDayStr);
  const recent6mo = entries.filter((e) => e.date >= sixMonthStr);

  // Day currency: 3 landings in 90 days
  const dayLandings90 = recent90.reduce((s, e) => s + e.landingsDay, 0);
  const dayCurrenty: CurrencyStatus = {
    label: "Day Passenger",
    current: dayLandings90 >= 3,
    detail: `${dayLandings90}/3 landings in 90 days`,
    icon: "sunny-outline",
  };

  // Night currency: 3 night landings to full stop in 90 days
  const nightLandings90 = recent90.reduce((s, e) => s + e.landingsNight, 0);
  const nightCurrency: CurrencyStatus = {
    label: "Night Passenger",
    current: nightLandings90 >= 3,
    detail: `${nightLandings90}/3 night landings in 90 days`,
    icon: "moon-outline",
  };

  // IFR currency: 6 approaches + holding in 6 months
  const approaches6mo = recent6mo.reduce((s, e) => s + e.instrumentApproaches, 0);
  const ifrHours6mo = recent6mo.reduce((s, e) => s + e.actualInstrument + e.simulatedInstrument, 0);
  const ifrCurrency: CurrencyStatus = {
    label: "IFR Currency",
    current: approaches6mo >= 6 && ifrHours6mo > 0,
    detail: `${approaches6mo}/6 approaches in 6 months`,
    icon: "cloud-outline",
  };

  // Flight Review: any flight in last 24 months (simplified)
  const twoYearsAgo = new Date(now.getTime() - 730 * 24 * 60 * 60 * 1000);
  const twoYearStr = twoYearsAgo.toISOString().slice(0, 10);
  const hasRecentFlight = entries.some((e) => e.date >= twoYearStr && e.dualReceived > 0);
  const flightReview: CurrencyStatus = {
    label: "Flight Review",
    current: hasRecentFlight,
    detail: hasRecentFlight ? "Dual received within 24 months" : "No dual received in 24 months",
    icon: "checkmark-circle-outline",
  };

  return [dayCurrenty, nightCurrency, ifrCurrency, flightReview];
}

// ─── PDF Export Logic ───────────────────────────────────────────
function generateLogbookPDF(entries: LogEntry[]): string {
  const ENTRIES_PER_PAGE = 10;
  let pages = "";
  for (let p = 0; p < entries.length; p += ENTRIES_PER_PAGE) {
    const pageEntries = entries.slice(p, p + ENTRIES_PER_PAGE);
    const pageTotal = (field: keyof LogEntry) => pageEntries.reduce((s, e) => s + (Number(e[field]) || 0), 0);
    const amtFwd = (field: keyof LogEntry) => entries.slice(0, p).reduce((s, e) => s + (Number(e[field]) || 0), 0);
    const totalToDate = (field: keyof LogEntry) => entries.slice(0, p + ENTRIES_PER_PAGE).reduce((s, e) => s + (Number(e[field]) || 0), 0);

    const rows = pageEntries.map((e) => `
      <tr>
        <td>${e.date}</td><td>${e.aircraftMakeModel}</td><td>${e.aircraftIdent}</td>
        <td>${e.from}</td><td>${e.to}</td>
        <td>${e.selLand || ""}</td><td>${e.melLand || ""}</td>
        <td>${e.pilotInCommand || ""}</td><td>${e.secondInCommand || ""}</td><td>${e.dualReceived || ""}</td>
        <td>${e.day || ""}</td><td>${e.night || ""}</td><td>${e.crossCountry || ""}</td>
        <td>${e.actualInstrument || ""}</td><td>${e.simulatedInstrument || ""}</td>
        <td>${e.instrumentApproaches || ""}</td>
        <td>${e.landingsDay || ""}</td><td>${e.landingsNight || ""}</td>
        <td><b>${e.totalFlightTime || ""}</b></td>
        <td style="font-size:8px;">${e.remarks || ""}</td>
      </tr>`).join("");

    pages += `
    <div style="page-break-after:always;padding:10px;">
      <h3 style="text-align:center;margin:4px 0;color:#1e3a5f;">PILOT LOGBOOK — Page ${Math.floor(p / ENTRIES_PER_PAGE) + 1}</h3>
      <table border="1" cellpadding="3" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:9px;">
        <tr style="background:#e2e8f0;font-weight:bold;text-align:center;">
          <th>Date</th><th>Make/Model</th><th>Ident</th><th>From</th><th>To</th>
          <th>SEL</th><th>MEL</th><th>PIC</th><th>SIC</th><th>Dual</th>
          <th>Day</th><th>Night</th><th>XC</th><th>Act.Inst</th><th>Sim.Inst</th>
          <th>Appr</th><th>Ldg.D</th><th>Ldg.N</th><th>Total</th><th>Remarks</th>
        </tr>
        ${rows}
        <tr style="background:#f8fafc;font-weight:bold;">
          <td colspan="5" style="text-align:right;">PAGE TOTAL</td>
          <td>${pageTotal("selLand").toFixed(1)}</td><td>${pageTotal("melLand").toFixed(1)}</td>
          <td>${pageTotal("pilotInCommand").toFixed(1)}</td><td>${pageTotal("secondInCommand").toFixed(1)}</td><td>${pageTotal("dualReceived").toFixed(1)}</td>
          <td>${pageTotal("day").toFixed(1)}</td><td>${pageTotal("night").toFixed(1)}</td><td>${pageTotal("crossCountry").toFixed(1)}</td>
          <td>${pageTotal("actualInstrument").toFixed(1)}</td><td>${pageTotal("simulatedInstrument").toFixed(1)}</td>
          <td>${pageTotal("instrumentApproaches")}</td>
          <td>${pageTotal("landingsDay")}</td><td>${pageTotal("landingsNight")}</td>
          <td><b>${pageTotal("totalFlightTime").toFixed(1)}</b></td><td></td>
        </tr>
        <tr style="background:#f1f5f9;">
          <td colspan="5" style="text-align:right;">AMT. FORWARD</td>
          <td>${amtFwd("selLand").toFixed(1)}</td><td>${amtFwd("melLand").toFixed(1)}</td>
          <td>${amtFwd("pilotInCommand").toFixed(1)}</td><td>${amtFwd("secondInCommand").toFixed(1)}</td><td>${amtFwd("dualReceived").toFixed(1)}</td>
          <td>${amtFwd("day").toFixed(1)}</td><td>${amtFwd("night").toFixed(1)}</td><td>${amtFwd("crossCountry").toFixed(1)}</td>
          <td>${amtFwd("actualInstrument").toFixed(1)}</td><td>${amtFwd("simulatedInstrument").toFixed(1)}</td>
          <td>${amtFwd("instrumentApproaches")}</td>
          <td>${amtFwd("landingsDay")}</td><td>${amtFwd("landingsNight")}</td>
          <td>${amtFwd("totalFlightTime").toFixed(1)}</td><td></td>
        </tr>
        <tr style="background:#e2e8f0;font-weight:bold;">
          <td colspan="5" style="text-align:right;">TOTAL TO DATE</td>
          <td>${totalToDate("selLand").toFixed(1)}</td><td>${totalToDate("melLand").toFixed(1)}</td>
          <td>${totalToDate("pilotInCommand").toFixed(1)}</td><td>${totalToDate("secondInCommand").toFixed(1)}</td><td>${totalToDate("dualReceived").toFixed(1)}</td>
          <td>${totalToDate("day").toFixed(1)}</td><td>${totalToDate("night").toFixed(1)}</td><td>${totalToDate("crossCountry").toFixed(1)}</td>
          <td>${totalToDate("actualInstrument").toFixed(1)}</td><td>${totalToDate("simulatedInstrument").toFixed(1)}</td>
          <td>${totalToDate("instrumentApproaches")}</td>
          <td>${totalToDate("landingsDay")}</td><td>${totalToDate("landingsNight")}</td>
          <td><b>${totalToDate("totalFlightTime").toFixed(1)}</b></td><td></td>
        </tr>
      </table>
      <p style="font-size:8px;color:#64748b;text-align:center;margin-top:6px;">I certify that the statements made by me on this form are true. — PILOT'S SIGNATURE</p>
    </div>`;
  }
  return `<html><head><style>body{font-family:sans-serif;margin:0;}table{font-size:9px;}td,th{padding:3px 4px;text-align:center;}@page{size:landscape;margin:8mm;}</style></head><body>${pages}<p style="text-align:center;font-size:9px;color:#94a3b8;">Generated by ${APP_NAME} • ${new Date().toISOString().slice(0, 10)}</p></body></html>`;
}

// ─── Main Screen ────────────────────────────────────────────────
export default function LogbookScreen() {
  const insets = useSafeAreaInsets();
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showCurrency, setShowCurrency] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [editEntry, setEditEntry] = useState<LogEntry | null>(null);

  const totalAll = entries.reduce((s, e) => s + e.totalFlightTime, 0);
  const totalPIC = entries.reduce((s, e) => s + e.pilotInCommand, 0);
  const totalLandingsDay = entries.reduce((s, e) => s + e.landingsDay, 0);
  const totalLandingsNight = entries.reduce((s, e) => s + e.landingsNight, 0);
  const totalNight = entries.reduce((s, e) => s + e.night, 0);
  const totalXC = entries.reduce((s, e) => s + e.crossCountry, 0);
  const totalInstrument = entries.reduce((s, e) => s + e.actualInstrument + e.simulatedInstrument, 0);

  const currency = useMemo(() => calculateCurrency(entries), [entries]);

  const load = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("pilot_logbook").select("*").eq("user_id", user.id).order("date", { ascending: false });
      if (data) setEntries(data.map((r: any) => ({
        id: r.id, date: r.date, aircraftMakeModel: r.aircraft_type ?? "", aircraftIdent: r.aircraft_id ?? "",
        from: r.departure ?? "", to: r.arrival ?? "",
        selLand: r.sel_land ?? r.total_hours ?? 0, melLand: r.mel_land ?? 0, helicopter: r.helicopter ?? 0,
        dualReceived: r.dual_hours ?? 0, pilotInCommand: r.pic_hours ?? 0, secondInCommand: r.sic_hours ?? 0,
        groundTrainer: r.ground_trainer ?? 0, day: r.day_hours ?? (r.total_hours ?? 0) - (r.night_hours ?? 0), night: r.night_hours ?? 0, crossCountry: r.cross_country ?? 0,
        actualInstrument: r.ifr_hours ?? 0, simulatedInstrument: r.sim_instrument ?? 0, instrumentApproaches: r.instrument_approaches ?? 0,
        landingsDay: r.landings ?? 0, landingsNight: r.landings_night ?? 0,
        totalFlightTime: r.total_hours ?? 0, remarks: r.remarks ?? "",
      })));
    } catch { /* */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleSave = async (entry: Omit<LogEntry, "id">) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const payload = {
        user_id: user.id, date: entry.date, aircraft_id: entry.aircraftIdent,
        aircraft_type: entry.aircraftMakeModel, departure: entry.from, arrival: entry.to,
        route: `${entry.from}-${entry.to}`, sel_land: entry.selLand, mel_land: entry.melLand,
        helicopter: entry.helicopter, dual_hours: entry.dualReceived, pic_hours: entry.pilotInCommand,
        sic_hours: entry.secondInCommand, ground_trainer: entry.groundTrainer, day_hours: entry.day,
        night_hours: entry.night, cross_country: entry.crossCountry, ifr_hours: entry.actualInstrument,
        sim_instrument: entry.simulatedInstrument, instrument_approaches: entry.instrumentApproaches,
        landings: entry.landingsDay, landings_night: entry.landingsNight,
        total_hours: entry.totalFlightTime, remarks: entry.remarks,
      };
      if (editEntry) { await supabase.from("pilot_logbook").update(payload).eq("id", editEntry.id); }
      else { await supabase.from("pilot_logbook").insert(payload); }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowForm(false); setEditEntry(null); load();
    } catch { Alert.alert("Error", "Failed to save entry."); }
  };

  const handleDelete = (id: string) => {
    Alert.alert("Delete Entry", "Delete this logbook entry?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        await supabase.from("pilot_logbook").delete().eq("id", id);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); load();
      }},
    ]);
  };

  const handleExportPDF = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (entries.length === 0) { Alert.alert("No Entries", "Add logbook entries before exporting."); return; }
    const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
    const html = generateLogbookPDF(sorted);
    try {
      const { uri } = await Print.printToFileAsync({ html, width: 842, height: 595 });
      await Sharing.shareAsync(uri, { mimeType: "application/pdf", dialogTitle: "Share Pilot Logbook" });
    } catch { Alert.alert("Error", "Failed to generate PDF."); }
  };

  const handleImportCSV = async () => {
    try {
      const DocumentPicker = require("expo-document-picker");
      const result = await DocumentPicker.getDocumentAsync({ type: "text/csv", copyToCacheDirectory: true });
      if (result.canceled || !result.assets || !result.assets[0]) return;
      const content = await FileSystem.readAsStringAsync(result.assets[0].uri);
      const lines = content.split("\n").filter((l: string) => l.trim());
      if (lines.length < 2) { Alert.alert("Error", "CSV file is empty or has no data rows."); return; }
      const headerLine = lines[0] ?? "";
      const headers = headerLine.toLowerCase().split(",").map((h: string) => h.trim().replace(/"/g, ""));
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let imported = 0;
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i] ?? "";
        const cols = line.split(",").map((c: string) => c.trim().replace(/"/g, ""));
        const get = (name: string) => cols[headers.indexOf(name)] ?? "";
        const getNum = (name: string) => parseFloat(get(name)) || 0;
        const date = get("date") || get("flight_date") || get("year");
        if (!date) continue;
        await supabase.from("pilot_logbook").insert({
          user_id: user.id, date, aircraft_id: get("aircraft_ident") || get("ident") || get("registration"),
          aircraft_type: get("aircraft_type") || get("make_model") || get("type"),
          departure: get("from") || get("departure") || get("origin"),
          arrival: get("to") || get("arrival") || get("destination"),
          route: `${get("from") || get("departure")}-${get("to") || get("arrival")}`,
          pic_hours: getNum("pic") || getNum("pilot_in_command"), sic_hours: getNum("sic") || getNum("second_in_command"),
          dual_hours: getNum("dual") || getNum("dual_received"), night_hours: getNum("night"),
          ifr_hours: getNum("actual_instrument") || getNum("instrument"), total_hours: getNum("total") || getNum("total_time") || getNum("total_flight_time"),
          landings: Math.round(getNum("landings_day") || getNum("landings") || getNum("day_landings")),
          landings_night: Math.round(getNum("landings_night") || getNum("night_landings")),
          cross_country: getNum("cross_country") || getNum("xc"),
          remarks: get("remarks") || get("comments") || get("notes"),
        });
        imported++;
      }
      Alert.alert("Import Complete", `Successfully imported ${imported} logbook entries.`);
      load();
    } catch (e) { Alert.alert("Error", "Failed to import CSV. Make sure it's a valid CSV file."); }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Pilot Logbook</Text>
          <Text style={styles.subtitle}>{entries.length} entries • {totalAll.toFixed(1)} total hours</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => setShowCurrency(true)}>
            <Ionicons name="shield-checkmark-outline" size={20} color={currency.every((c) => c.current) ? colors.green[600] : colors.amber[600]} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={() => Alert.alert("Options", "Choose an action", [
            { text: "Export PDF", onPress: handleExportPDF },
            { text: "Import CSV", onPress: handleImportCSV },
            { text: "Cancel", style: "cancel" },
          ])}>
            <Ionicons name="ellipsis-horizontal" size={20} color={colors.runway[600]} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.addBtn} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setEditEntry(null); setShowForm(true); }}>
            <Ionicons name="add" size={22} color={colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Currency Status Banner */}
      <TouchableOpacity style={[styles.currencyBanner, currency.every((c) => c.current) ? styles.currencyGood : styles.currencyWarn]} onPress={() => setShowCurrency(true)} activeOpacity={0.7}>
        <Ionicons name={currency.every((c) => c.current) ? "checkmark-circle" : "warning"} size={16} color={currency.every((c) => c.current) ? colors.green[600] : colors.amber[600]} />
        <Text style={[styles.currencyBannerText, { color: currency.every((c) => c.current) ? colors.green[600] : colors.amber[600] }]}>
          {currency.every((c) => c.current) ? "All currencies current ✓" : `${currency.filter((c) => !c.current).length} currency item(s) expired`}
        </Text>
        <Ionicons name="chevron-forward" size={14} color={currency.every((c) => c.current) ? colors.green[500] : colors.amber[500]} />
      </TouchableOpacity>

      {/* Summary Cards */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.summaryScroll}>
        <View style={[styles.summaryCard, { backgroundColor: colors.brand[50] }]}><Text style={[styles.summaryNum, { color: colors.brand[600] }]}>{totalAll.toFixed(1)}</Text><Text style={styles.summaryLabel}>Total</Text></View>
        <View style={[styles.summaryCard, { backgroundColor: colors.green[50] }]}><Text style={[styles.summaryNum, { color: colors.green[600] }]}>{totalPIC.toFixed(1)}</Text><Text style={styles.summaryLabel}>PIC</Text></View>
        <View style={[styles.summaryCard, { backgroundColor: colors.amber[50] }]}><Text style={[styles.summaryNum, { color: colors.amber[600] }]}>{totalXC.toFixed(1)}</Text><Text style={styles.summaryLabel}>XC</Text></View>
        <View style={[styles.summaryCard, { backgroundColor: "#f0f9ff" }]}><Text style={[styles.summaryNum, { color: "#0369a1" }]}>{totalNight.toFixed(1)}</Text><Text style={styles.summaryLabel}>Night</Text></View>
        <View style={[styles.summaryCard, { backgroundColor: "#faf5ff" }]}><Text style={[styles.summaryNum, { color: "#7c3aed" }]}>{totalInstrument.toFixed(1)}</Text><Text style={styles.summaryLabel}>Instr</Text></View>
        <View style={[styles.summaryCard, { backgroundColor: colors.runway[100] }]}><Text style={[styles.summaryNum, { color: colors.runway[700] }]}>{totalLandingsDay + totalLandingsNight}</Text><Text style={styles.summaryLabel}>Ldg</Text></View>
      </ScrollView>

      {/* Entries */}
      <FlatList data={entries} keyExtractor={(i) => i.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand[500]} />}
        contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: insets.bottom + 20 }}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.entryCard} onPress={() => { setEditEntry(item); setShowForm(true); }} onLongPress={() => handleDelete(item.id)} activeOpacity={0.7}>
            <View style={styles.entryTop}><Text style={styles.entryDate}>{item.date}</Text><Text style={styles.entryHours}>{item.totalFlightTime.toFixed(1)}h</Text></View>
            <Text style={styles.entryRoute}>{item.from} → {item.to}</Text>
            <Text style={styles.entryAircraft}>{item.aircraftIdent} • {item.aircraftMakeModel}</Text>
            <View style={styles.entryStats}>
              {item.pilotInCommand > 0 && <Text style={styles.entryStat}>PIC:{item.pilotInCommand}h</Text>}
              {item.secondInCommand > 0 && <Text style={styles.entryStat}>SIC:{item.secondInCommand}h</Text>}
              {item.night > 0 && <Text style={styles.entryStat}>Night:{item.night}h</Text>}
              {item.crossCountry > 0 && <Text style={styles.entryStat}>XC:{item.crossCountry}h</Text>}
              {item.actualInstrument > 0 && <Text style={styles.entryStat}>IFR:{item.actualInstrument}h</Text>}
              <Text style={styles.entryStat}>Ldg:{item.landingsDay}D/{item.landingsNight}N</Text>
            </View>
            {item.remarks ? <Text style={styles.entryRemarks} numberOfLines={1}>💬 {item.remarks}</Text> : null}
          </TouchableOpacity>
        )}
        ListEmptyComponent={<View style={styles.empty}><Ionicons name="book-outline" size={48} color={colors.runway[300]} /><Text style={styles.emptyText}>No logbook entries yet</Text><Text style={styles.emptySubtext}>Tap + to log your first flight</Text></View>}
      />

      {/* Currency Modal */}
      <Modal visible={showCurrency} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowCurrency(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.currencyModal}>
            <View style={styles.modalHandle} />
            <Text style={styles.currencyTitle}>Currency Status</Text>
            <Text style={styles.currencySubtitle}>Based on FAR 61.57 / CAAP requirements</Text>
            {currency.map((c, i) => (
              <View key={i} style={[styles.currencyItem, c.current ? styles.currencyItemGood : styles.currencyItemBad]}>
                <Ionicons name={c.icon as any} size={20} color={c.current ? colors.green[600] : colors.red[500]} />
                <View style={styles.currencyItemContent}>
                  <Text style={styles.currencyItemLabel}>{c.label}</Text>
                  <Text style={styles.currencyItemDetail}>{c.detail}</Text>
                </View>
                <Ionicons name={c.current ? "checkmark-circle" : "close-circle"} size={20} color={c.current ? colors.green[500] : colors.red[500]} />
              </View>
            ))}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Form Modal */}
      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet">
        <LogEntryForm entry={editEntry} onSave={handleSave} onCancel={() => { setShowForm(false); setEditEntry(null); }} />
      </Modal>
    </View>
  );
}

// ─── Entry Form with Date Picker ────────────────────────────────
function LogEntryForm({ entry, onSave, onCancel }: { entry: LogEntry | null; onSave: (e: Omit<LogEntry, "id">) => void; onCancel: () => void }) {
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState<Omit<LogEntry, "id">>(entry ? { ...entry } : { ...EMPTY_ENTRY, date: new Date().toISOString().slice(0, 10) });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerDate, setPickerDate] = useState(new Date());
  const update = (k: string, v: string | number) => setForm((p) => ({ ...p, [k]: v }));
  const numUpdate = (k: string, v: string) => {
    const val = parseFloat(v) || 0;
    const newForm = { ...form, [k]: val };
    // Auto-calculate total flight time
    if (["day", "night"].includes(k)) {
      newForm.totalFlightTime = (k === "day" ? val : newForm.day) + (k === "night" ? val : newForm.night);
    }
    setForm(newForm);
  };

  const confirmDate = (d: Date) => {
    const dateStr = d.toISOString().slice(0, 10);
    update("date", dateStr);
    setShowDatePicker(false);
  };

  // Simple date picker (year/month/day spinners)
  const [pickYear, setPickYear] = useState(pickerDate.getFullYear());
  const [pickMonth, setPickMonth] = useState(pickerDate.getMonth());
  const [pickDay, setPickDay] = useState(pickerDate.getDate());

  useEffect(() => {
    if (form.date) {
      const [y, m, d] = form.date.split("-").map(Number);
      if (y && m && d) { setPickYear(y); setPickMonth(m - 1); setPickDay(d); }
    }
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.formHeader}>
        <TouchableOpacity onPress={onCancel}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
        <Text style={styles.formTitle}>{entry ? "Edit Entry" : "New Entry"}</Text>
        <TouchableOpacity style={styles.saveBtn} onPress={() => onSave(form)}><Text style={styles.saveBtnText}>Save</Text></TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Flight Info */}
        <View style={styles.formCard}>
          <Text style={styles.formLabel}>FLIGHT INFO</Text>
          {/* Date Picker Button */}
          <Text style={styles.inputLabel}>Date</Text>
          <TouchableOpacity style={styles.datePickerBtn} onPress={() => setShowDatePicker(true)}>
            <Ionicons name="calendar-outline" size={16} color={colors.brand[600]} />
            <Text style={form.date ? styles.datePickerValue : styles.datePickerPlaceholder}>{form.date || "Select date"}</Text>
            <Ionicons name="chevron-down" size={14} color={colors.runway[400]} />
          </TouchableOpacity>
          <Field label="Aircraft Make & Model" value={form.aircraftMakeModel} onChange={(v) => update("aircraftMakeModel", v)} placeholder="Cessna 172S" />
          <Field label="Aircraft Identification" value={form.aircraftIdent} onChange={(v) => update("aircraftIdent", v)} placeholder="RP-C2289" />
          <View style={styles.row}>
            <View style={styles.flex1}><Field label="From" value={form.from} onChange={(v) => update("from", v)} placeholder="RPLL" /></View>
            <View style={styles.flex1}><Field label="To" value={form.to} onChange={(v) => update("to", v)} placeholder="RPVM" /></View>
          </View>
        </View>

        {/* Aircraft Category */}
        <View style={styles.formCard}>
          <Text style={styles.formLabel}>AIRCRAFT CATEGORY & CLASSIFICATION</Text>
          <View style={styles.row}>
            <View style={styles.flex1}><NumField label="SEL" value={form.selLand} onChange={(v) => numUpdate("selLand", v)} /></View>
            <View style={styles.flex1}><NumField label="MEL" value={form.melLand} onChange={(v) => numUpdate("melLand", v)} /></View>
            <View style={styles.flex1}><NumField label="Helicopter" value={form.helicopter} onChange={(v) => numUpdate("helicopter", v)} /></View>
          </View>
        </View>

        {/* Piloting Time */}
        <View style={styles.formCard}>
          <Text style={styles.formLabel}>TYPE OF PILOTING TIME</Text>
          <View style={styles.row}>
            <View style={styles.flex1}><NumField label="Dual Rcvd" value={form.dualReceived} onChange={(v) => numUpdate("dualReceived", v)} /></View>
            <View style={styles.flex1}><NumField label="PIC" value={form.pilotInCommand} onChange={(v) => numUpdate("pilotInCommand", v)} /></View>
            <View style={styles.flex1}><NumField label="SIC" value={form.secondInCommand} onChange={(v) => numUpdate("secondInCommand", v)} /></View>
          </View>
        </View>

        {/* Conditions */}
        <View style={styles.formCard}>
          <Text style={styles.formLabel}>CONDITIONS OF FLIGHT</Text>
          <View style={styles.row}>
            <View style={styles.flex1}><NumField label="Day" value={form.day} onChange={(v) => numUpdate("day", v)} /></View>
            <View style={styles.flex1}><NumField label="Night" value={form.night} onChange={(v) => numUpdate("night", v)} /></View>
            <View style={styles.flex1}><NumField label="Cross-Country" value={form.crossCountry} onChange={(v) => numUpdate("crossCountry", v)} /></View>
          </View>
          <NumField label="Ground Trainer" value={form.groundTrainer} onChange={(v) => numUpdate("groundTrainer", v)} />
        </View>

        {/* Instrument */}
        <View style={styles.formCard}>
          <Text style={styles.formLabel}>INSTRUMENT</Text>
          <View style={styles.row}>
            <View style={styles.flex1}><NumField label="Actual" value={form.actualInstrument} onChange={(v) => numUpdate("actualInstrument", v)} /></View>
            <View style={styles.flex1}><NumField label="Simulated" value={form.simulatedInstrument} onChange={(v) => numUpdate("simulatedInstrument", v)} /></View>
            <View style={styles.flex1}><NumField label="Approaches" value={form.instrumentApproaches} onChange={(v) => numUpdate("instrumentApproaches", v)} /></View>
          </View>
        </View>

        {/* Landings & Total */}
        <View style={styles.formCard}>
          <Text style={styles.formLabel}>LANDINGS & TOTAL</Text>
          <View style={styles.row}>
            <View style={styles.flex1}><NumField label="Ldg Day" value={form.landingsDay} onChange={(v) => numUpdate("landingsDay", v)} /></View>
            <View style={styles.flex1}><NumField label="Ldg Night" value={form.landingsNight} onChange={(v) => numUpdate("landingsNight", v)} /></View>
            <View style={styles.flex1}><NumField label="Total Time" value={form.totalFlightTime} onChange={(v) => numUpdate("totalFlightTime", v)} /></View>
          </View>
          <Text style={styles.autoCalcHint}>💡 Total auto-calculates from Day + Night</Text>
        </View>

        {/* Remarks */}
        <View style={styles.formCard}>
          <Text style={styles.formLabel}>REMARKS / ENDORSEMENTS</Text>
          <Field label="" value={form.remarks} onChange={(v) => update("remarks", v)} placeholder="Procedures, maneuvers, endorsements..." multiline />
        </View>
      </ScrollView>

      {/* Date Picker Modal */}
      <Modal visible={showDatePicker} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowDatePicker(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.dateModal}>
            <Text style={styles.dateModalTitle}>Select Date</Text>
            <View style={styles.dateSpinners}>
              <View style={styles.spinner}>
                <TouchableOpacity onPress={() => setPickYear((y) => y + 1)}><Ionicons name="chevron-up" size={22} color={colors.runway[600]} /></TouchableOpacity>
                <Text style={styles.spinnerValue}>{pickYear}</Text>
                <TouchableOpacity onPress={() => setPickYear((y) => y - 1)}><Ionicons name="chevron-down" size={22} color={colors.runway[600]} /></TouchableOpacity>
                <Text style={styles.spinnerLabel}>Year</Text>
              </View>
              <View style={styles.spinner}>
                <TouchableOpacity onPress={() => setPickMonth((m) => (m + 1) % 12)}><Ionicons name="chevron-up" size={22} color={colors.runway[600]} /></TouchableOpacity>
                <Text style={styles.spinnerValue}>{String(pickMonth + 1).padStart(2, "0")}</Text>
                <TouchableOpacity onPress={() => setPickMonth((m) => (m - 1 + 12) % 12)}><Ionicons name="chevron-down" size={22} color={colors.runway[600]} /></TouchableOpacity>
                <Text style={styles.spinnerLabel}>Month</Text>
              </View>
              <View style={styles.spinner}>
                <TouchableOpacity onPress={() => setPickDay((d) => Math.min(d + 1, 31))}><Ionicons name="chevron-up" size={22} color={colors.runway[600]} /></TouchableOpacity>
                <Text style={styles.spinnerValue}>{String(pickDay).padStart(2, "0")}</Text>
                <TouchableOpacity onPress={() => setPickDay((d) => Math.max(d - 1, 1))}><Ionicons name="chevron-down" size={22} color={colors.runway[600]} /></TouchableOpacity>
                <Text style={styles.spinnerLabel}>Day</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.dateConfirmBtn} onPress={() => confirmDate(new Date(pickYear, pickMonth, pickDay))}>
              <Text style={styles.dateConfirmText}>Confirm</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// ─── Shared Components ──────────────────────────────────────────
function Field({ label, value, onChange, placeholder, multiline }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; multiline?: boolean }) {
  return (
    <View style={{ marginBottom: spacing.sm }}>
      {label ? <Text style={styles.inputLabel}>{label}</Text> : null}
      <TextInput style={[styles.input, multiline && { height: 80, textAlignVertical: "top" }]} value={String(value)} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={colors.runway[300]} multiline={multiline} autoCapitalize="characters" />
    </View>
  );
}

function NumField({ label, value, onChange }: { label: string; value: number; onChange: (v: string) => void }) {
  return (
    <View style={{ marginBottom: spacing.sm }}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput style={styles.input} value={value > 0 ? String(value) : ""} onChangeText={onChange} placeholder="0" placeholderTextColor={colors.runway[300]} keyboardType="decimal-pad" />
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.runway[50] },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.runway[200] },
  title: { fontSize: 24, fontWeight: "700", color: colors.runway[900] },
  subtitle: { fontSize: fontSize.sm, color: colors.runway[400], marginTop: 2 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  headerBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.runway[100], alignItems: "center", justifyContent: "center" },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.brand[600], alignItems: "center", justifyContent: "center" },
  // Currency banner
  currencyBanner: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginHorizontal: spacing.md, marginTop: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.md },
  currencyGood: { backgroundColor: colors.green[50], borderWidth: 1, borderColor: colors.green[100] },
  currencyWarn: { backgroundColor: colors.amber[50], borderWidth: 1, borderColor: colors.amber[100] },
  currencyBannerText: { flex: 1, fontSize: fontSize.xs, fontWeight: "600" },
  // Summary
  summaryScroll: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.xs },
  summaryCard: { borderRadius: borderRadius.md, padding: spacing.sm, alignItems: "center", minWidth: 70, paddingHorizontal: spacing.sm },
  summaryNum: { fontSize: fontSize.base, fontWeight: "700" },
  summaryLabel: { fontSize: 8, fontWeight: "600", color: colors.runway[500], marginTop: 1 },
  // Entries
  entryCard: { backgroundColor: colors.white, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.runway[100] },
  entryTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  entryDate: { fontSize: fontSize.sm, fontWeight: "600", color: colors.runway[900] },
  entryHours: { fontSize: fontSize.sm, fontWeight: "700", color: colors.brand[600] },
  entryRoute: { fontSize: fontSize.base, fontWeight: "700", color: colors.runway[800], marginBottom: 2 },
  entryAircraft: { fontSize: fontSize.xs, color: colors.runway[500], marginBottom: spacing.xs },
  entryStats: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, paddingTop: spacing.xs, borderTopWidth: 1, borderTopColor: colors.runway[100] },
  entryStat: { fontSize: fontSize.xs, color: colors.runway[500] },
  entryRemarks: { fontSize: fontSize.xs, color: colors.runway[400], marginTop: spacing.xs, fontStyle: "italic" },
  empty: { alignItems: "center", paddingTop: 60 },
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
  row: { flexDirection: "row", gap: spacing.sm },
  flex1: { flex: 1 },
  inputLabel: { fontSize: fontSize.xs, fontWeight: "600", color: colors.runway[600], marginBottom: 4 },
  input: { backgroundColor: colors.runway[50], borderWidth: 1, borderColor: colors.runway[200], borderRadius: borderRadius.sm, paddingHorizontal: spacing.sm, paddingVertical: 10, fontSize: fontSize.sm, color: colors.runway[900] },
  autoCalcHint: { fontSize: 10, color: colors.runway[400], marginTop: 4 },
  // Date picker
  datePickerBtn: { flexDirection: "row", alignItems: "center", gap: spacing.sm, backgroundColor: colors.runway[50], borderWidth: 1, borderColor: colors.runway[200], borderRadius: borderRadius.sm, paddingHorizontal: spacing.sm, paddingVertical: 12, marginBottom: spacing.sm },
  datePickerValue: { flex: 1, fontSize: fontSize.sm, color: colors.runway[900], fontWeight: "600" },
  datePickerPlaceholder: { flex: 1, fontSize: fontSize.sm, color: colors.runway[300] },
  // Modals
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.runway[300], alignSelf: "center", marginBottom: spacing.md },
  currencyModal: { backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg, paddingBottom: 40 },
  currencyTitle: { fontSize: fontSize.lg, fontWeight: "700", color: colors.runway[900], textAlign: "center" },
  currencySubtitle: { fontSize: fontSize.xs, color: colors.runway[500], textAlign: "center", marginBottom: spacing.lg },
  currencyItem: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md, borderRadius: borderRadius.md, marginBottom: spacing.sm },
  currencyItemGood: { backgroundColor: colors.green[50], borderWidth: 1, borderColor: colors.green[100] },
  currencyItemBad: { backgroundColor: colors.red[50], borderWidth: 1, borderColor: colors.red[100] },
  currencyItemContent: { flex: 1 },
  currencyItemLabel: { fontSize: fontSize.sm, fontWeight: "700", color: colors.runway[900] },
  currencyItemDetail: { fontSize: fontSize.xs, color: colors.runway[500], marginTop: 2 },
  dateModal: { backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg, paddingBottom: 40, alignItems: "center" },
  dateModalTitle: { fontSize: fontSize.lg, fontWeight: "700", color: colors.runway[900], marginBottom: spacing.lg },
  dateSpinners: { flexDirection: "row", gap: spacing.xl, marginBottom: spacing.lg },
  spinner: { alignItems: "center", gap: spacing.xs },
  spinnerValue: { fontSize: 24, fontWeight: "700", color: colors.runway[900], fontVariant: ["tabular-nums"] },
  spinnerLabel: { fontSize: fontSize.xs, color: colors.runway[400], marginTop: 4 },
  dateConfirmBtn: { backgroundColor: colors.brand[600], paddingHorizontal: spacing["2xl"], paddingVertical: 14, borderRadius: borderRadius.md, width: "100%", alignItems: "center" },
  dateConfirmText: { fontSize: fontSize.base, fontWeight: "700", color: colors.white },
});
