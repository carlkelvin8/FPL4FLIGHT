import { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "@shared/components/Card";
import { PressableScale } from "@shared/components/PressableScale";
import { colors, spacing, borderRadius, fontSize } from "@shared/theme";
import { getFlag } from "@shared/utils";
import { type FlightSchedule, type FlightStatus } from "../types";

const STATUS_CONFIG: Record<FlightStatus, { label: string; color: string; bg: string }> = {
  scheduled: { label: "Scheduled", color: colors.brand[600], bg: colors.brand[50] },
  boarding: { label: "Boarding", color: "#d97706", bg: "#fef3c7" },
  departed: { label: "Departed", color: colors.green[600], bg: colors.green[50] },
  arrived: { label: "Arrived", color: "#166534", bg: "#dcfce7" },
  delayed: { label: "Delayed", color: colors.red[600], bg: colors.red[50] },
  cancelled: { label: "Cancelled", color: "#991b1b", bg: "#fee2e2" },
};

export const FlightCard = memo(function FlightCard({ flight, onPress, onDelete }: {
  flight: FlightSchedule;
  onPress: (f: FlightSchedule) => void;
  onDelete: (id: string) => void;
}) {
  const status = STATUS_CONFIG[flight.status];
  return (
    <PressableScale
      style={styles.flightCard}
      haptic
      onPress={() => onPress(flight)}
      onLongPress={() => onDelete(flight.id)}
    >
      <Card variant="elevated">
        <View style={styles.flightHeader}>
          <Text style={styles.flightNumber}>{flight.flightNumber}</Text>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>
        <View style={styles.routeRow}>
          <View style={styles.airport}>
            <Text style={styles.flag}>{getFlag(flight.departure.country)}</Text>
            <Text style={styles.airportCode}>{flight.departure.code}</Text>
            <Text style={styles.airportCity}>{flight.departure.city}</Text>
            <Text style={styles.time}>{flight.departure.time}</Text>
          </View>
          <View style={styles.flightLine}>
            <View style={styles.dot} />
            <View style={styles.dashLine} />
            <Ionicons name="airplane" size={16} color={colors.brand[500]} />
            <View style={styles.dashLine} />
            <View style={styles.dot} />
          </View>
          <View style={[styles.airport, styles.airportRight]}>
            <Text style={styles.flag}>{getFlag(flight.arrival.country)}</Text>
            <Text style={styles.airportCode}>{flight.arrival.code}</Text>
            <Text style={styles.airportCity}>{flight.arrival.city}</Text>
            <Text style={styles.time}>{flight.arrival.time}</Text>
          </View>
        </View>
        <View style={styles.flightFooter}>
          <View style={styles.footerChip}>
            <Ionicons name="airplane-outline" size={12} color={colors.runway[500]} />
            <Text style={styles.footerText}>{flight.aircraft}</Text>
          </View>
          {flight.gate && (
            <View style={styles.footerChip}>
              <Ionicons name="navigate-outline" size={12} color={colors.runway[500]} />
              <Text style={styles.footerText}>Gate {flight.gate}</Text>
            </View>
          )}
        </View>
      </Card>
    </PressableScale>
  );
});

const styles = StyleSheet.create({
  flightCard: { marginBottom: spacing.sm },
  flightHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm },
  flightNumber: { fontSize: fontSize.lg, fontWeight: "700", color: colors.runway[900], letterSpacing: -0.5 },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: borderRadius.full },
  statusText: { fontSize: fontSize.xs, fontWeight: "600" },
  routeRow: { flexDirection: "row", alignItems: "center" },
  airport: { flex: 1, alignItems: "center" },
  airportRight: { alignItems: "center" },
  flag: { fontSize: 22, marginBottom: 4 },
  airportCode: { fontSize: fontSize.sm, fontWeight: "700", color: colors.runway[900] },
  airportCity: { fontSize: fontSize.xs, color: colors.runway[500], marginTop: 1 },
  time: { fontSize: fontSize.xs, fontWeight: "600", color: colors.runway[700], marginTop: 4 },
  flightLine: { flexDirection: "row", alignItems: "center", marginHorizontal: spacing.sm },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.runway[300] },
  dashLine: { width: 20, height: 1, backgroundColor: colors.runway[200] },
  flightFooter: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.runway[100], paddingTop: spacing.sm },
  footerChip: { flexDirection: "row", alignItems: "center", gap: 4 },
  footerText: { fontSize: fontSize.xs, color: colors.runway[500] },
});
