import { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { colors, spacing, borderRadius, fontSize } from "@shared/theme";
import { FeatureGate } from "@shared/components/FeatureGate";
import { APP_NAME } from "@shared/constants";

type FlightRule = "VFR" | "IFR";

export default function FlightPlanningScreen() {
  return (
    <FeatureGate feature="flight_planning" message="Plan VFR and IFR routes with fuel calculations. Upgrade to Pro to unlock.">
      <FlightPlanningContent />
    </FeatureGate>
  );
}

function FlightPlanningContent() {
  const insets = useSafeAreaInsets();
  const [rule, setRule] = useState<FlightRule>("VFR");
  const [departure, setDeparture] = useState("");
  const [destination, setDestination] = useState("");
  const [alternate, setAlternate] = useState("");
  const [cruiseAlt, setCruiseAlt] = useState("");
  const [cruiseSpeed, setCruiseSpeed] = useState("");
  const [route, setRoute] = useState("");
  const [fuelOnBoard, setFuelOnBoard] = useState("");
  const [fuelBurn, setFuelBurn] = useState("");
  const [remarks, setRemarks] = useState("");

  // Estimated calculations
  const burn = parseFloat(fuelBurn) || 0;
  const fuel = parseFloat(fuelOnBoard) || 0;
  const endurance = burn > 0 ? (fuel / burn) : 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Flight Planning</Text>
        <Text style={styles.subtitle}>VFR & IFR route planning</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
        {/* Flight Rules Toggle */}
        <View style={styles.ruleRow}>
          {(["VFR", "IFR"] as FlightRule[]).map((r) => (
            <TouchableOpacity key={r} style={[styles.ruleBtn, rule === r && styles.ruleBtnActive]} onPress={() => { setRule(r); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}>
              <Text style={[styles.ruleBtnText, rule === r && styles.ruleBtnTextActive]}>{r}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Route Card */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>ROUTE</Text>
          <View style={styles.row}>
            <View style={styles.flex1}><Text style={styles.fieldLabel}>Departure</Text><TextInput style={styles.fieldInput} value={departure} onChangeText={setDeparture} placeholder="RPLL" autoCapitalize="characters" placeholderTextColor={colors.runway[300]} /></View>
            <View style={{ alignItems: "center", justifyContent: "flex-end", paddingBottom: 10 }}><Ionicons name="arrow-forward" size={18} color={colors.runway[400]} /></View>
            <View style={styles.flex1}><Text style={styles.fieldLabel}>Destination</Text><TextInput style={styles.fieldInput} value={destination} onChangeText={setDestination} placeholder="RPVM" autoCapitalize="characters" placeholderTextColor={colors.runway[300]} /></View>
          </View>
          <View style={styles.row}>
            <View style={styles.flex1}><Text style={styles.fieldLabel}>Alternate</Text><TextInput style={styles.fieldInput} value={alternate} onChangeText={setAlternate} placeholder="RPUB" autoCapitalize="characters" placeholderTextColor={colors.runway[300]} /></View>
          </View>
          <Text style={styles.fieldLabel}>Route / Airway</Text>
          <TextInput style={[styles.fieldInput, { height: 60, textAlignVertical: "top" }]} value={route} onChangeText={setRoute} placeholder={rule === "IFR" ? "e.g. ANITO A461 RASED" : "e.g. Direct / Visual landmarks"} multiline placeholderTextColor={colors.runway[300]} />
        </View>

        {/* Performance Card */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>PERFORMANCE</Text>
          <View style={styles.row}>
            <View style={styles.flex1}><Text style={styles.fieldLabel}>Cruise Altitude</Text><TextInput style={styles.fieldInput} value={cruiseAlt} onChangeText={setCruiseAlt} placeholder={rule === "VFR" ? "4500" : "FL120"} keyboardType="default" placeholderTextColor={colors.runway[300]} /></View>
            <View style={styles.flex1}><Text style={styles.fieldLabel}>Cruise Speed (kt)</Text><TextInput style={styles.fieldInput} value={cruiseSpeed} onChangeText={setCruiseSpeed} placeholder="110" keyboardType="numeric" placeholderTextColor={colors.runway[300]} /></View>
          </View>
        </View>

        {/* Fuel Card */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>FUEL</Text>
          <View style={styles.row}>
            <View style={styles.flex1}><Text style={styles.fieldLabel}>Fuel on Board (L)</Text><TextInput style={styles.fieldInput} value={fuelOnBoard} onChangeText={setFuelOnBoard} placeholder="150" keyboardType="decimal-pad" placeholderTextColor={colors.runway[300]} /></View>
            <View style={styles.flex1}><Text style={styles.fieldLabel}>Burn Rate (L/hr)</Text><TextInput style={styles.fieldInput} value={fuelBurn} onChangeText={setFuelBurn} placeholder="30" keyboardType="decimal-pad" placeholderTextColor={colors.runway[300]} /></View>
          </View>
          {endurance > 0 && (
            <View style={styles.enduranceBox}>
              <Ionicons name="time-outline" size={16} color={colors.green[600]} />
              <Text style={styles.enduranceText}>Endurance: {endurance.toFixed(1)} hours ({(endurance * 60).toFixed(0)} min)</Text>
            </View>
          )}
        </View>

        {/* Remarks */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>REMARKS</Text>
          <TextInput style={[styles.fieldInput, { height: 60, textAlignVertical: "top" }]} value={remarks} onChangeText={setRemarks} placeholder="Additional notes, DOF, RMK..." multiline placeholderTextColor={colors.runway[300]} />
        </View>

        {/* VFR/IFR specific tips */}
        <View style={styles.tipCard}>
          <Ionicons name="information-circle" size={16} color={colors.brand[600]} />
          <Text style={styles.tipText}>
            {rule === "VFR" ? "VFR: Maintain visual contact with ground. Cruise altitudes: Odd thousands +500 (heading 000-179), Even thousands +500 (heading 180-359)." : "IFR: File via ATC. Cruise altitudes: Odd thousands (heading 000-179), Even thousands (heading 180-359). Requires instrument rating."}
          </Text>
        </View>

        {/* Save & Export Buttons */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.exportBtn} onPress={async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            if (!departure || !destination) { Alert.alert("Required", "Enter departure and destination."); return; }
            const html = `<html><body style="font-family:sans-serif;padding:20px;">
              <h1 style="color:#1e3a5f;">FLIGHT PLAN — ${rule}</h1>
              <table style="width:100%;border-collapse:collapse;" border="1" cellpadding="8">
                <tr><td><b>Departure</b></td><td>${departure}</td></tr>
                <tr><td><b>Destination</b></td><td>${destination}</td></tr>
                <tr><td><b>Alternate</b></td><td>${alternate || "—"}</td></tr>
                <tr><td><b>Route</b></td><td>${route || "Direct"}</td></tr>
                <tr><td><b>Cruise Altitude</b></td><td>${cruiseAlt || "—"}</td></tr>
                <tr><td><b>Cruise Speed</b></td><td>${cruiseSpeed ? cruiseSpeed + " kt" : "—"}</td></tr>
                <tr><td><b>Fuel on Board</b></td><td>${fuelOnBoard ? fuelOnBoard + " L" : "—"}</td></tr>
                <tr><td><b>Burn Rate</b></td><td>${fuelBurn ? fuelBurn + " L/hr" : "—"}</td></tr>
                <tr><td><b>Endurance</b></td><td>${endurance > 0 ? endurance.toFixed(1) + " hrs" : "—"}</td></tr>
                <tr><td><b>Remarks</b></td><td>${remarks || "—"}</td></tr>
              </table>
              <p style="color:#666;font-size:11px;margin-top:20px;">Generated by ${APP_NAME} • ${new Date().toISOString().slice(0, 10)}</p>
            </body></html>`;
            try {
              const { uri } = await Print.printToFileAsync({ html });
              await Sharing.shareAsync(uri, { mimeType: "application/pdf", dialogTitle: "Share Flight Plan" });
            } catch { Alert.alert("Error", "Failed to export PDF."); }
          }} activeOpacity={0.7}>
            <Ionicons name="download-outline" size={18} color={colors.white} />
            <Text style={styles.exportBtnText}>Export PDF</Text>
          </TouchableOpacity>
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
  ruleRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md },
  ruleBtn: { flex: 1, paddingVertical: spacing.md, borderRadius: borderRadius.md, alignItems: "center", backgroundColor: colors.white, borderWidth: 2, borderColor: colors.runway[200] },
  ruleBtnActive: { backgroundColor: colors.brand[600], borderColor: colors.brand[600] },
  ruleBtnText: { fontSize: fontSize.lg, fontWeight: "700", color: colors.runway[500] },
  ruleBtnTextActive: { color: colors.white },
  card: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.md },
  cardLabel: { fontSize: 10, fontWeight: "700", color: colors.brand[600], letterSpacing: 1, marginBottom: spacing.sm },
  row: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.sm },
  flex1: { flex: 1 },
  fieldLabel: { fontSize: 9, fontWeight: "600", color: colors.runway[500], marginBottom: 4 },
  fieldInput: { backgroundColor: colors.runway[50], borderWidth: 1, borderColor: colors.runway[200], borderRadius: 8, paddingHorizontal: 10, paddingVertical: 10, fontSize: fontSize.sm, color: colors.runway[900] },
  enduranceBox: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.sm, padding: spacing.sm, backgroundColor: colors.green[50], borderRadius: borderRadius.sm },
  enduranceText: { fontSize: fontSize.sm, fontWeight: "600", color: colors.green[600] },
  tipCard: { flexDirection: "row", gap: spacing.sm, padding: spacing.md, backgroundColor: colors.brand[50], borderRadius: borderRadius.md, alignItems: "flex-start" },
  tipText: { flex: 1, fontSize: fontSize.xs, color: colors.brand[700], lineHeight: 16 },
  actionsRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
  exportBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, backgroundColor: colors.brand[600], paddingVertical: 14, borderRadius: borderRadius.md },
  exportBtnText: { fontSize: fontSize.sm, fontWeight: "700", color: colors.white },
});
