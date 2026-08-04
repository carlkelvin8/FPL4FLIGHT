import { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { supabase } from "@core/network";
import { colors, spacing, borderRadius, fontSize } from "@shared/theme";
import { FeatureGate } from "@shared/components/FeatureGate";
import { APP_NAME } from "@shared/constants";

interface Waypoint {
  id: string;
  name: string;
  course: string;
  distance: string;
  altitude: string;
  groundSpeed: string;
  ete: string;
  fuel: string;
  remarks: string;
}

export default function NavLogScreen() {
  return (
    <FeatureGate feature="navlog" message="Plan waypoint-by-waypoint navigation. Upgrade to Pro to unlock.">
      <NavLogContent />
    </FeatureGate>
  );
}

function NavLogContent() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [flightInfo, setFlightInfo] = useState({ departure: "", destination: "", aircraft: "", date: "", cruiseAlt: "", cruiseTAS: "" });
  const [waypoints, setWaypoints] = useState<Waypoint[]>([
    { id: "1", name: "", course: "", distance: "", altitude: "", groundSpeed: "", ete: "", fuel: "", remarks: "" },
  ]);
  const [saving, setSaving] = useState(false);
  const [navlogId, setNavlogId] = useState<string | null>(null);

  // Load last saved navlog on mount
  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase.from("navlogs").select("*").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(1).single();
        if (data) {
          setNavlogId(data.id);
          setFlightInfo({
            departure: data.departure ?? "", destination: data.destination ?? "",
            aircraft: data.aircraft ?? "", date: data.date ?? "",
            cruiseAlt: data.cruise_alt ?? "", cruiseTAS: data.cruise_tas ?? "",
          });
          if (Array.isArray(data.waypoints) && data.waypoints.length > 0) {
            setWaypoints(data.waypoints);
          }
        }
      } catch { /* first time — no saved navlog */ }
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { Alert.alert("Error", "Not authenticated."); setSaving(false); return; }
      const payload = {
        user_id: user.id, departure: flightInfo.departure, destination: flightInfo.destination,
        aircraft: flightInfo.aircraft, date: flightInfo.date,
        cruise_alt: flightInfo.cruiseAlt, cruise_tas: flightInfo.cruiseTAS,
        waypoints, updated_at: new Date().toISOString(),
      };
      if (navlogId) {
        await supabase.from("navlogs").update(payload).eq("id", navlogId);
      } else {
        const { data } = await supabase.from("navlogs").insert(payload).select("id").single();
        if (data) setNavlogId(data.id);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch { Alert.alert("Error", "Failed to save navigation log."); }
    setSaving(false);
  };

  function addWaypoint() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setWaypoints((prev) => [...prev, { id: Date.now().toString(), name: "", course: "", distance: "", altitude: "", groundSpeed: "", ete: "", fuel: "", remarks: "" }]);
  }

  function removeWaypoint(id: string) {
    if (waypoints.length <= 1) return;
    setWaypoints((prev) => prev.filter((w) => w.id !== id));
  }

  function updateWaypoint(id: string, field: keyof Waypoint, value: string) {
    setWaypoints((prev) => prev.map((w) => w.id === id ? { ...w, [field]: value } : w));
  }

  // Totals
  const totalDist = waypoints.reduce((s, w) => s + (parseFloat(w.distance) || 0), 0);
  const totalFuel = waypoints.reduce((s, w) => s + (parseFloat(w.fuel) || 0), 0);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: spacing.sm }}>
          <Ionicons name="chevron-back" size={22} color={colors.brand[600]} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Navigation Log</Text>
          <Text style={styles.subtitle}>Waypoint-by-waypoint planning</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
        {/* Flight Info */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>FLIGHT INFO</Text>
          <View style={styles.row}>
            <View style={styles.flex1}><Text style={styles.fieldLabel}>From</Text><TextInput style={styles.fieldInput} value={flightInfo.departure} onChangeText={(v) => setFlightInfo((p) => ({ ...p, departure: v }))} placeholder="RPLL" autoCapitalize="characters" placeholderTextColor={colors.runway[300]} /></View>
            <View style={styles.flex1}><Text style={styles.fieldLabel}>To</Text><TextInput style={styles.fieldInput} value={flightInfo.destination} onChangeText={(v) => setFlightInfo((p) => ({ ...p, destination: v }))} placeholder="RPVM" autoCapitalize="characters" placeholderTextColor={colors.runway[300]} /></View>
          </View>
          <View style={styles.row}>
            <View style={styles.flex1}><Text style={styles.fieldLabel}>Aircraft</Text><TextInput style={styles.fieldInput} value={flightInfo.aircraft} onChangeText={(v) => setFlightInfo((p) => ({ ...p, aircraft: v }))} placeholder="C172" placeholderTextColor={colors.runway[300]} /></View>
            <View style={styles.flex1}><Text style={styles.fieldLabel}>Cruise Alt</Text><TextInput style={styles.fieldInput} value={flightInfo.cruiseAlt} onChangeText={(v) => setFlightInfo((p) => ({ ...p, cruiseAlt: v }))} placeholder="5500" keyboardType="numeric" placeholderTextColor={colors.runway[300]} /></View>
            <View style={styles.flex1}><Text style={styles.fieldLabel}>TAS</Text><TextInput style={styles.fieldInput} value={flightInfo.cruiseTAS} onChangeText={(v) => setFlightInfo((p) => ({ ...p, cruiseTAS: v }))} placeholder="110" keyboardType="numeric" placeholderTextColor={colors.runway[300]} /></View>
          </View>
        </View>

        {/* Waypoints Table */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardLabel}>WAYPOINTS</Text>
            <TouchableOpacity onPress={addWaypoint}><Ionicons name="add-circle" size={24} color={colors.brand[600]} /></TouchableOpacity>
          </View>

          {/* Column headers */}
          <View style={styles.tableHeader}>
            <Text style={[styles.colH, { flex: 1.2 }]}>Fix/WPT</Text>
            <Text style={[styles.colH, { flex: 0.7 }]}>CRS°</Text>
            <Text style={[styles.colH, { flex: 0.7 }]}>Dist</Text>
            <Text style={[styles.colH, { flex: 0.7 }]}>Alt</Text>
            <Text style={[styles.colH, { flex: 0.7 }]}>GS</Text>
            <Text style={[styles.colH, { flex: 0.7 }]}>ETE</Text>
            <Text style={[styles.colH, { flex: 0.7 }]}>Fuel</Text>
            <View style={{ width: 24 }} />
          </View>

          {waypoints.map((wp, idx) => (
            <View key={wp.id} style={styles.tableRow}>
              <TextInput style={[styles.cell, { flex: 1.2 }]} value={wp.name} onChangeText={(v) => updateWaypoint(wp.id, "name", v)} placeholder={idx === 0 ? "DEP" : `WPT${idx}`} placeholderTextColor={colors.runway[300]} />
              <TextInput style={[styles.cell, { flex: 0.7 }]} value={wp.course} onChangeText={(v) => updateWaypoint(wp.id, "course", v)} placeholder="—" keyboardType="numeric" placeholderTextColor={colors.runway[300]} />
              <TextInput style={[styles.cell, { flex: 0.7 }]} value={wp.distance} onChangeText={(v) => updateWaypoint(wp.id, "distance", v)} placeholder="—" keyboardType="decimal-pad" placeholderTextColor={colors.runway[300]} />
              <TextInput style={[styles.cell, { flex: 0.7 }]} value={wp.altitude} onChangeText={(v) => updateWaypoint(wp.id, "altitude", v)} placeholder="—" keyboardType="numeric" placeholderTextColor={colors.runway[300]} />
              <TextInput style={[styles.cell, { flex: 0.7 }]} value={wp.groundSpeed} onChangeText={(v) => updateWaypoint(wp.id, "groundSpeed", v)} placeholder="—" keyboardType="numeric" placeholderTextColor={colors.runway[300]} />
              <TextInput style={[styles.cell, { flex: 0.7 }]} value={wp.ete} onChangeText={(v) => updateWaypoint(wp.id, "ete", v)} placeholder="—" placeholderTextColor={colors.runway[300]} />
              <TextInput style={[styles.cell, { flex: 0.7 }]} value={wp.fuel} onChangeText={(v) => updateWaypoint(wp.id, "fuel", v)} placeholder="—" keyboardType="decimal-pad" placeholderTextColor={colors.runway[300]} />
              <TouchableOpacity onPress={() => removeWaypoint(wp.id)} style={{ width: 24, alignItems: "center" }}>
                <Ionicons name="close-circle" size={16} color={colors.red[500]} />
              </TouchableOpacity>
            </View>
          ))}

          {/* Totals */}
          <View style={styles.totalsRow}>
            <Text style={styles.totalLabel}>TOTALS</Text>
            <Text style={styles.totalValue}>Dist: {totalDist.toFixed(0)} NM</Text>
            <Text style={styles.totalValue}>Fuel: {totalFuel.toFixed(1)} L</Text>
          </View>
        </View>

        {/* Save & Export Buttons */}
        <TouchableOpacity style={[styles.exportBtn, { backgroundColor: colors.green[600], marginBottom: spacing.sm }]} onPress={handleSave} disabled={saving} activeOpacity={0.7}>
          <Ionicons name="save-outline" size={18} color={colors.white} />
          <Text style={styles.exportBtnText}>{saving ? "Saving..." : "Save Nav Log"}</Text>
        </TouchableOpacity>

        {/* Export Button */}
        <TouchableOpacity style={styles.exportBtn} onPress={async () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          if (waypoints.filter((w) => w.name).length === 0) { Alert.alert("Required", "Add at least one waypoint."); return; }
          const rows = waypoints.filter((w) => w.name).map((w) => `<tr><td>${w.name}</td><td>${w.course || "—"}</td><td>${w.distance || "—"}</td><td>${w.altitude || "—"}</td><td>${w.groundSpeed || "—"}</td><td>${w.ete || "—"}</td><td>${w.fuel || "—"}</td></tr>`).join("");
          const html = `<html><body style="font-family:sans-serif;padding:20px;">
            <h1 style="color:#1e3a5f;">NAVIGATION LOG</h1>
            <p><b>From:</b> ${flightInfo.departure || "—"} <b>To:</b> ${flightInfo.destination || "—"} <b>Aircraft:</b> ${flightInfo.aircraft || "—"} <b>Cruise Alt:</b> ${flightInfo.cruiseAlt || "—"} <b>TAS:</b> ${flightInfo.cruiseTAS || "—"}</p>
            <table style="width:100%;border-collapse:collapse;" border="1" cellpadding="6">
              <tr style="background:#f1f5f9;"><th>Fix/WPT</th><th>CRS°</th><th>Dist</th><th>Alt</th><th>GS</th><th>ETE</th><th>Fuel</th></tr>
              ${rows}
              <tr style="font-weight:bold;"><td>TOTALS</td><td></td><td>${totalDist.toFixed(0)} NM</td><td></td><td></td><td></td><td>${totalFuel.toFixed(1)} L</td></tr>
            </table>
            <p style="color:#666;font-size:11px;margin-top:20px;">Generated by ${APP_NAME} • ${new Date().toISOString().slice(0, 10)}</p>
          </body></html>`;
          try {
            const { uri } = await Print.printToFileAsync({ html });
            await Sharing.shareAsync(uri, { mimeType: "application/pdf", dialogTitle: "Share Nav Log" });
          } catch { Alert.alert("Error", "Failed to export PDF."); }
        }} activeOpacity={0.7}>
          <Ionicons name="download-outline" size={18} color={colors.white} />
          <Text style={styles.exportBtnText}>Export Nav Log PDF</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.runway[50] },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.runway[200] },
  title: { fontSize: 24, fontWeight: "700", color: colors.runway[900] },
  subtitle: { fontSize: fontSize.sm, color: colors.runway[400], marginTop: 2 },
  card: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.md },
  cardLabel: { fontSize: 10, fontWeight: "700", color: colors.brand[600], letterSpacing: 1, marginBottom: spacing.sm },
  cardHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm },
  row: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.sm },
  flex1: { flex: 1 },
  fieldLabel: { fontSize: 9, fontWeight: "600", color: colors.runway[500], marginBottom: 4 },
  fieldInput: { backgroundColor: colors.runway[50], borderWidth: 1, borderColor: colors.runway[200], borderRadius: 8, paddingHorizontal: 8, paddingVertical: 8, fontSize: fontSize.sm, color: colors.runway[900] },
  tableHeader: { flexDirection: "row", alignItems: "center", paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: colors.runway[200] },
  colH: { fontSize: 8, fontWeight: "700", color: colors.runway[500], textTransform: "uppercase" },
  tableRow: { flexDirection: "row", alignItems: "center", paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: colors.runway[50] },
  cell: { fontSize: fontSize.xs, color: colors.runway[900], paddingHorizontal: 2, paddingVertical: 4, textAlign: "center" },
  totalsRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.runway[200] },
  totalLabel: { fontSize: 9, fontWeight: "700", color: colors.runway[500] },
  totalValue: { fontSize: fontSize.xs, fontWeight: "600", color: colors.brand[600] },
  exportBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, backgroundColor: colors.brand[600], paddingVertical: 14, borderRadius: borderRadius.md, marginTop: spacing.sm },
  exportBtnText: { fontSize: fontSize.sm, fontWeight: "700", color: colors.white },
});
