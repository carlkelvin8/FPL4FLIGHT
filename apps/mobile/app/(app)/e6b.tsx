import { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { colors, spacing, borderRadius, fontSize } from "@shared/theme";

type CalcMode = "tas" | "wind" | "fuel" | "distance";

export default function E6BScreen() {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<CalcMode>("tas");

  // TAS inputs
  const [ias, setIas] = useState("");
  const [altitude, setAltitude] = useState("");
  const [temp, setTemp] = useState("");

  // Wind inputs
  const [heading, setHeading] = useState("");
  const [windDir, setWindDir] = useState("");
  const [windSpd, setWindSpd] = useState("");
  const [tas2, setTas2] = useState("");

  // Fuel inputs
  const [fuelBurn, setFuelBurn] = useState("");
  const [flightTime, setFlightTime] = useState("");

  // Distance inputs
  const [gs, setGs] = useState("");
  const [time, setTime] = useState("");

  // Calculations
  function calcTAS(): string {
    const i = parseFloat(ias); const alt = parseFloat(altitude); const t = parseFloat(temp);
    if (!i || !alt) return "—";
    // Approximation: TAS ≈ IAS + (IAS × 0.02 × (alt/1000))
    const tasVal = i + (i * 0.02 * (alt / 1000));
    return tasVal.toFixed(0) + " kt";
  }

  function calcWind(): { wca: string; gs: string } {
    const hdg = parseFloat(heading); const wd = parseFloat(windDir); const ws = parseFloat(windSpd); const t = parseFloat(tas2);
    if (!hdg || !wd || !ws || !t) return { wca: "—", gs: "—" };
    const angleRad = ((wd - hdg) * Math.PI) / 180;
    const wca = Math.asin((ws * Math.sin(angleRad)) / t) * (180 / Math.PI);
    const gsVal = t * Math.cos(wca * Math.PI / 180) + ws * Math.cos(angleRad);
    return { wca: wca.toFixed(1) + "°", gs: gsVal.toFixed(0) + " kt" };
  }

  function calcFuel(): string {
    const burn = parseFloat(fuelBurn); const ft = parseFloat(flightTime);
    if (!burn || !ft) return "—";
    return (burn * ft).toFixed(1) + " L";
  }

  function calcDistance(): string {
    const g = parseFloat(gs); const t2 = parseFloat(time);
    if (!g || !t2) return "—";
    return (g * t2).toFixed(1) + " NM";
  }

  const windResult = calcWind();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>E6B Calculator</Text>
        <Text style={styles.subtitle}>Aviation flight computer</Text>
      </View>

      {/* Mode Tabs */}
      <View style={styles.tabs}>
        {([["tas", "TAS"], ["wind", "Wind"], ["fuel", "Fuel"], ["distance", "Dist"]] as [CalcMode, string][]).map(([key, label]) => (
          <TouchableOpacity
            key={key}
            style={[styles.tab, mode === key && styles.tabActive]}
            onPress={() => { setMode(key); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
          >
            <Text style={[styles.tabText, mode === key && styles.tabTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {mode === "tas" && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>True Airspeed (TAS)</Text>
            <Text style={styles.cardDesc}>Calculate TAS from IAS and altitude</Text>
            <CalcInput label="IAS (knots)" value={ias} onChange={setIas} />
            <CalcInput label="Altitude (feet)" value={altitude} onChange={setAltitude} />
            <CalcInput label="OAT (°C)" value={temp} onChange={setTemp} />
            <View style={styles.resultBox}>
              <Text style={styles.resultLabel}>TAS</Text>
              <Text style={styles.resultValue}>{calcTAS()}</Text>
            </View>
          </View>
        )}

        {mode === "wind" && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Wind Correction</Text>
            <Text style={styles.cardDesc}>Calculate WCA and ground speed</Text>
            <CalcInput label="Heading (°)" value={heading} onChange={setHeading} />
            <CalcInput label="Wind Direction (°)" value={windDir} onChange={setWindDir} />
            <CalcInput label="Wind Speed (kt)" value={windSpd} onChange={setWindSpd} />
            <CalcInput label="TAS (kt)" value={tas2} onChange={setTas2} />
            <View style={styles.resultRow}>
              <View style={styles.resultBox}>
                <Text style={styles.resultLabel}>WCA</Text>
                <Text style={styles.resultValue}>{windResult.wca}</Text>
              </View>
              <View style={styles.resultBox}>
                <Text style={styles.resultLabel}>Ground Speed</Text>
                <Text style={styles.resultValue}>{windResult.gs}</Text>
              </View>
            </View>
          </View>
        )}

        {mode === "fuel" && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Fuel Required</Text>
            <Text style={styles.cardDesc}>Calculate total fuel needed</Text>
            <CalcInput label="Fuel Burn (L/hr)" value={fuelBurn} onChange={setFuelBurn} />
            <CalcInput label="Flight Time (hours)" value={flightTime} onChange={setFlightTime} />
            <View style={styles.resultBox}>
              <Text style={styles.resultLabel}>Fuel Required</Text>
              <Text style={styles.resultValue}>{calcFuel()}</Text>
            </View>
          </View>
        )}

        {mode === "distance" && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Distance</Text>
            <Text style={styles.cardDesc}>Calculate distance from speed × time</Text>
            <CalcInput label="Ground Speed (kt)" value={gs} onChange={setGs} />
            <CalcInput label="Time (hours)" value={time} onChange={setTime} />
            <View style={styles.resultBox}>
              <Text style={styles.resultLabel}>Distance</Text>
              <Text style={styles.resultValue}>{calcDistance()}</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function CalcInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput style={styles.input} value={value} onChangeText={onChange} keyboardType="decimal-pad" placeholder="0" placeholderTextColor={colors.runway[300]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.runway[50] },
  header: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.runway[200] },
  title: { fontSize: 24, fontWeight: "700", color: colors.runway[900] },
  subtitle: { fontSize: fontSize.sm, color: colors.runway[400], marginTop: 2 },
  tabs: { flexDirection: "row", paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.xs, backgroundColor: colors.white },
  tab: { flex: 1, paddingVertical: spacing.sm, borderRadius: borderRadius.md, alignItems: "center", backgroundColor: colors.runway[100] },
  tabActive: { backgroundColor: colors.brand[600] },
  tabText: { fontSize: fontSize.sm, fontWeight: "600", color: colors.runway[500] },
  tabTextActive: { color: colors.white },
  content: { padding: spacing.md, paddingBottom: 100 },
  card: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.md },
  cardTitle: { fontSize: fontSize.lg, fontWeight: "700", color: colors.runway[900], marginBottom: 4 },
  cardDesc: { fontSize: fontSize.sm, color: colors.runway[400], marginBottom: spacing.lg },
  inputGroup: { marginBottom: spacing.md },
  inputLabel: { fontSize: fontSize.xs, fontWeight: "600", color: colors.runway[600], marginBottom: 6 },
  input: { backgroundColor: colors.runway[50], borderWidth: 1, borderColor: colors.runway[200], borderRadius: borderRadius.sm, paddingHorizontal: spacing.md, paddingVertical: 12, fontSize: fontSize.base, color: colors.runway[900] },
  resultRow: { flexDirection: "row", gap: spacing.sm },
  resultBox: { flex: 1, backgroundColor: colors.brand[50], borderRadius: borderRadius.md, padding: spacing.md, alignItems: "center", marginTop: spacing.sm },
  resultLabel: { fontSize: fontSize.xs, fontWeight: "600", color: colors.brand[600], marginBottom: 4 },
  resultValue: { fontSize: fontSize["2xl"], fontWeight: "700", color: colors.brand[700] },
});
