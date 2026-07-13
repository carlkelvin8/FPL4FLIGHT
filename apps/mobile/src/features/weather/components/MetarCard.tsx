import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors, spacing, borderRadius, fontSize } from "@shared/theme";

import type { MetarData } from "../types";

const CATEGORY_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  VFR: { bg: colors.green[50], text: colors.green[600], label: "VFR" },
  MVFR: { bg: colors.amber[50], text: colors.amber[600], label: "MVFR" },
  IFR: { bg: colors.red[50], text: colors.red[600], label: "IFR" },
  LIFR: { bg: "#fdf2f8", text: "#be185d", label: "LIFR" },
};

interface MetarCardProps {
  metar: MetarData;
}

export function MetarCard({ metar }: MetarCardProps) {
  const cat = CATEGORY_COLORS[metar.flightCategory]!;

  const windStr = metar.windDirection != null && metar.windSpeed != null
    ? `${String(metar.windDirection).padStart(3, "0")}° @ ${metar.windSpeed}kt${metar.windGust ? ` G${metar.windGust}kt` : ""}`
    : "Calm";

  const visStr = metar.visibility != null ? `${metar.visibility} SM` : "—";
  const tempStr = metar.temperature != null ? `${metar.temperature}°C` : "—";
  const dewStr = metar.dewpoint != null ? `${metar.dewpoint}°C` : "—";
  const altStr = metar.altimeter != null ? `${metar.altimeter} inHg` : "—";

  const cloudStr = metar.clouds.length > 0
    ? metar.clouds.map((c) => `${c.coverage}${c.altitude != null ? ` ${c.altitude * 100}ft` : ""}`).join(", ")
    : "Clear";

  return (
    <View style={styles.card}>
      {/* Raw METAR */}
      <View style={styles.rawContainer}>
        <Text style={styles.rawText} selectable>
          {metar.raw}
        </Text>
      </View>

      {/* Flight category badge */}
      <View style={styles.categoryRow}>
        <View style={[styles.categoryBadge, { backgroundColor: cat.bg }]}>
          <View style={[styles.categoryDot, { backgroundColor: cat.text }]} />
          <Text style={[styles.categoryLabel, { color: cat.text }]}>{cat.label}</Text>
        </View>
        <Text style={styles.observedAt}>
          {metar.observedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} Z
        </Text>
      </View>

      {/* Data grid */}
      <View style={styles.grid}>
        <DataItem icon="navigate-outline" label="Wind" value={windStr} />
        <DataItem icon="eye-outline" label="Visibility" value={visStr} />
        <DataItem icon="thermometer-outline" label="Temp" value={tempStr} />
        <DataItem icon="water-outline" label="Dewpoint" value={dewStr} />
        <DataItem icon="speedometer-outline" label="Altimeter" value={altStr} />
        <DataItem icon="cloud-outline" label="Clouds" value={cloudStr} />
      </View>

      {/* Weather phenomena */}
      {metar.weather.length > 0 && (
        <View style={styles.weatherRow}>
          <Ionicons name="rainy-outline" size={14} color={colors.runway[500]} />
          <Text style={styles.weatherText}>{metar.weather.join(" • ")}</Text>
        </View>
      )}
    </View>
  );
}

function DataItem({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.dataItem}>
      <View style={styles.dataItemHeader}>
        <Ionicons name={icon as any} size={14} color={colors.runway[400]} />
        <Text style={styles.dataLabel}>{label}</Text>
      </View>
      <Text style={styles.dataValue} numberOfLines={2}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    marginHorizontal: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.runway[200],
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  rawContainer: {
    backgroundColor: colors.runway[900],
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  rawText: {
    fontFamily: "monospace",
    fontSize: fontSize.xs,
    color: colors.green[500],
    lineHeight: 18,
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  categoryLabel: {
    fontSize: fontSize.sm,
    fontWeight: "700",
  },
  observedAt: {
    fontSize: fontSize.xs,
    color: colors.runway[400],
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  dataItem: {
    width: "47%",
    backgroundColor: colors.runway[50],
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
  },
  dataItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 2,
  },
  dataLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.runway[400],
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  dataValue: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.runway[800],
    marginTop: 2,
  },
  weatherRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.runway[100],
  },
  weatherText: {
    fontSize: fontSize.sm,
    color: colors.runway[600],
    fontWeight: "500",
  },
});
