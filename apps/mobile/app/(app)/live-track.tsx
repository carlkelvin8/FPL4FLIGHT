import { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import * as Haptics from "expo-haptics";
import MapView, { Marker, Polyline } from "react-native-maps";
import { colors, spacing, borderRadius, fontSize } from "@shared/theme";
import { FeatureGate } from "@shared/components/FeatureGate";

interface TrackPoint {
  latitude: number;
  longitude: number;
  altitude: number | null;
  speed: number | null;
  heading: number | null;
  timestamp: number;
}

export default function LiveTrackScreen() {
  return (
    <FeatureGate feature="live_tracking" message="Track your flights in real-time with GPS. Upgrade to Pro to unlock.">
      <LiveTrackContent />
    </FeatureGate>
  );
}

function LiveTrackContent() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const [tracking, setTracking] = useState(false);
  const [currentPos, setCurrentPos] = useState<TrackPoint | null>(null);
  const [trackHistory, setTrackHistory] = useState<TrackPoint[]>([]);
  const [elapsedTime, setElapsedTime] = useState(0);
  const locationSub = useRef<Location.LocationSubscription | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      locationSub.current?.remove();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startTracking = async () => {
    // Request foreground first, then background for in-flight tracking
    const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
    if (fgStatus !== "granted") {
      Alert.alert("Permission Denied", "Location access is required for live tracking.");
      return;
    }

    const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
    if (bgStatus !== "granted") {
      Alert.alert(
        "Background Location",
        "Background location was not granted. Tracking will pause when the app is in the background.",
        [{ text: "Continue Anyway" }]
      );
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTracking(true);
    setTrackHistory([]);
    setElapsedTime(0);

    timerRef.current = setInterval(() => setElapsedTime((t) => t + 1), 1000);

    locationSub.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.BestForNavigation, distanceInterval: 5, timeInterval: 2000 },
      (loc) => {
        const point: TrackPoint = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          altitude: loc.coords.altitude,
          speed: loc.coords.speed,
          heading: loc.coords.heading,
          timestamp: loc.timestamp,
        };
        setCurrentPos(point);
        setTrackHistory((prev) => {
          const updated = [...prev, point];
          return updated.length > 3600 ? updated.slice(-3600) : updated;
        });

        mapRef.current?.animateToRegion({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }, 500);
      },
    );
  };

  const stopTracking = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    locationSub.current?.remove();
    locationSub.current = null;
    if (timerRef.current) clearInterval(timerRef.current);
    setTracking(false);
  };

  const formatTime = (s: number) => `${Math.floor(s / 3600).toString().padStart(2, "0")}:${Math.floor((s % 3600) / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
  const speedKts = currentPos?.speed ? (currentPos.speed * 1.944).toFixed(0) : "—";
  const altFt = currentPos?.altitude ? (currentPos.altitude * 3.281).toFixed(0) : "—";
  const hdg = currentPos?.heading ? currentPos.heading.toFixed(0) + "°" : "—";
  const distNm = trackHistory.length > 1 ? (calculateDistance(trackHistory) * 0.000539957).toFixed(1) : "0.0";

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{ latitude: 14.5995, longitude: 120.9842, latitudeDelta: 0.05, longitudeDelta: 0.05 }}
        showsUserLocation={!tracking}
        showsCompass
        mapType="standard"
      >
        {currentPos && (
          <Marker coordinate={{ latitude: currentPos.latitude, longitude: currentPos.longitude }} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={[styles.aircraftMarker, { transform: [{ rotate: `${currentPos.heading ?? 0}deg` }] }]}>
              <Ionicons name="airplane" size={24} color={colors.brand[600]} />
            </View>
          </Marker>
        )}
        {trackHistory.length > 1 && (
          <Polyline coordinates={trackHistory.map((p) => ({ latitude: p.latitude, longitude: p.longitude }))} strokeColor={colors.brand[600]} strokeWidth={3} />
        )}
      </MapView>

      {/* Overlay: Flight Data */}
      <View style={[styles.dataPanel, { top: insets.top + spacing.md }]}>
        <View style={styles.backRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={colors.brand[600]} />
          </TouchableOpacity>
          <Text style={styles.panelTitle}>Live Track</Text>
        </View>
        <View style={styles.dataRow}>
          <DataItem label="SPD" value={`${speedKts} kt`} />
          <DataItem label="ALT" value={`${altFt} ft`} />
          <DataItem label="HDG" value={hdg} />
          <DataItem label="DIST" value={`${distNm} NM`} />
        </View>
        <View style={styles.timerRow}>
          <Ionicons name="time-outline" size={14} color={colors.runway[500]} />
          <Text style={styles.timerText}>{formatTime(elapsedTime)}</Text>
          <Text style={styles.pointsText}>{trackHistory.length} pts</Text>
        </View>
      </View>

      {/* Start/Stop Button */}
      <View style={[styles.controlPanel, { bottom: insets.bottom + spacing.lg }]}>
        <TouchableOpacity
          style={[styles.trackBtn, tracking && styles.trackBtnStop]}
          onPress={tracking ? stopTracking : startTracking}
          activeOpacity={0.8}
        >
          <Ionicons name={tracking ? "stop" : "play"} size={22} color={colors.white} />
          <Text style={styles.trackBtnText}>{tracking ? "Stop Tracking" : "Start Tracking"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function DataItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.dataItem}>
      <Text style={styles.dataLabel}>{label}</Text>
      <Text style={styles.dataValue}>{value}</Text>
    </View>
  );
}

/** Calculate total distance in meters from track history */
function calculateDistance(points: TrackPoint[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const p1 = points[i - 1]!;
    const p2 = points[i]!;
    const R = 6371000;
    const dLat = ((p2.latitude - p1.latitude) * Math.PI) / 180;
    const dLon = ((p2.longitude - p1.longitude) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos((p1.latitude * Math.PI) / 180) * Math.cos((p2.latitude * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    total += R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
  return total;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  aircraftMarker: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  dataPanel: { position: "absolute", left: spacing.md, right: spacing.md, backgroundColor: "rgba(255,255,255,0.95)", borderRadius: borderRadius.lg, padding: spacing.sm, shadowColor: colors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  backRow: { flexDirection: "row", alignItems: "center", marginBottom: spacing.xs },
  backBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  panelTitle: { fontSize: fontSize.sm, fontWeight: "700", color: colors.runway[900] },
  dataRow: { flexDirection: "row", justifyContent: "space-around" },
  dataItem: { alignItems: "center" },
  dataLabel: { fontSize: 9, fontWeight: "700", color: colors.runway[400], letterSpacing: 0.5 },
  dataValue: { fontSize: fontSize.base, fontWeight: "700", color: colors.runway[900], marginTop: 2 },
  timerRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, marginTop: spacing.xs, paddingTop: spacing.xs, borderTopWidth: 1, borderTopColor: colors.runway[100] },
  timerText: { fontSize: fontSize.sm, fontWeight: "700", color: colors.runway[700], fontVariant: ["tabular-nums"] },
  pointsText: { fontSize: fontSize.xs, color: colors.runway[400] },
  controlPanel: { position: "absolute", left: spacing.lg, right: spacing.lg },
  trackBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, backgroundColor: colors.brand[600], paddingVertical: spacing.md, borderRadius: borderRadius.md, shadowColor: colors.brand[600], shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  trackBtnStop: { backgroundColor: colors.red[500] },
  trackBtnText: { fontSize: fontSize.base, fontWeight: "700", color: colors.white },
});
