import { useState, useEffect, useRef } from "react";
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity, Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import { colors, spacing, borderRadius, fontSize } from "@shared/theme";

interface LocationData {
  latitude: number;
  longitude: number;
  altitude: number | null;
  speed: number | null;
  heading: number | null;
  accuracy: number | null;
}

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);

  const [location, setLocation] = useState<LocationData | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [heading, setHeading] = useState<number>(0);
  const [gpsSignalWeak, setGpsSignalWeak] = useState(false);

  useEffect(() => {
    let locationSub: Location.LocationSubscription | null = null;
    let headingSub: Location.LocationSubscription | null = null;
    let mounted = true;

    async function start() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (!mounted) return;
        if (status !== "granted") {
          Alert.alert("Permission Required", "Location permission is needed for the map.");
          return;
        }

        const initial = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        if (!mounted) return;
        const { latitude, longitude, altitude, speed, heading: hdg, accuracy } = initial.coords;
        setLocation({ latitude, longitude, altitude, speed, heading: hdg, accuracy });
        if (hdg !== null && hdg >= 0) setHeading(hdg);
        setGpsSignalWeak((accuracy ?? 999) > 50);

        mapRef.current?.animateToRegion({ latitude, longitude, latitudeDelta: 0.008, longitudeDelta: 0.008 }, 600);

        locationSub = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.BestForNavigation, timeInterval: 1000, distanceInterval: 1 },
          (loc) => {
            if (!mounted) return;
            const c = loc.coords;
            setLocation({ latitude: c.latitude, longitude: c.longitude, altitude: c.altitude, speed: c.speed, heading: c.heading, accuracy: c.accuracy });
            setGpsSignalWeak((c.accuracy ?? 999) > 50);
            if (c.heading !== null && c.heading >= 0) setHeading(c.heading);
          }
        );

        headingSub = await Location.watchHeadingAsync((h) => {
          if (mounted) setHeading(Math.round(h.trueHeading));
        });
      } catch {
        if (mounted) Alert.alert("Error", "Failed to start GPS location services.");
      }
    }

    start();
    return () => {
      mounted = false;
      locationSub?.remove();
      headingSub?.remove();
    };
  }, []);

  const speedKn = location?.speed ? Math.max(0, Math.round(location.speed * 1.94384)) : 0;
  const altFt = location?.altitude ? Math.round(location.altitude * 3.28084) : 0;
  const hdgDeg = Math.round(heading);
  const [mapType, setMapType] = useState<"standard" | "satellite" | "hybrid">("standard");

  function centerOnMe() {
    if (location) mapRef.current?.animateToRegion({ latitude: location.latitude, longitude: location.longitude, latitudeDelta: 0.008, longitudeDelta: 0.008 }, 500);
  }

  function toggleMapType() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const types = ["standard", "satellite", "hybrid"] as const;
    const idx = types.indexOf(mapType);
    const next = types[(idx + 1) % types.length] ?? "standard";
    setMapType(next);
  }

  const coordsText = location ? `${location.latitude.toFixed(4)}°, ${location.longitude.toFixed(4)}°` : "---";

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Full-screen map */}
      <View style={styles.mapWrap}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFillObject}
          provider={undefined}
          showsUserLocation={false}
          showsCompass={false}
          showsScale={false}
          mapType={mapType}
          initialRegion={{ latitude: 14.5995, longitude: 120.9842, latitudeDelta: 0.01, longitudeDelta: 0.01 }}
        >
          {location && (
            <Marker
              coordinate={{ latitude: location.latitude, longitude: location.longitude }}
              anchor={{ x: 0.5, y: 0.5 }}
              rotation={hdgDeg}
              flat
              tracksViewChanges={true}
            >
              <View style={styles.markerWrap}>
                <View style={styles.markerPulse} />
                <View style={styles.markerCore}>
                  <Ionicons name="paper-plane" size={20} color={colors.white} />
                </View>
              </View>
            </Marker>
          )}
        </MapView>

        {/* Floating search bar */}
        <View style={[styles.searchFloat, { top: spacing.sm }]}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={16} color={colors.runway[400]} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search airports..."
              placeholderTextColor={colors.runway[400]}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="characters"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={18} color={colors.runway[300]} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Flight data strip — left side */}
        <View style={styles.dataStrip}>
          <DataChip label="SPD" value={`${speedKn}`} unit="kn" />
          <DataChip label="ALT" value={`${altFt}`} unit="ft" />
          <DataChip label="HDG" value={`${hdgDeg}`} unit="°" />
        </View>

        {/* Controls — right side */}
        <View style={styles.controls}>
          <TouchableOpacity style={styles.ctrlBtn} onPress={toggleMapType} accessibilityLabel="Toggle map type">
            <Ionicons name={mapType === "standard" ? "globe-outline" : mapType === "satellite" ? "earth" : "layers-outline"} size={20} color={colors.brand[600]} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.ctrlBtn} onPress={centerOnMe} accessibilityLabel="Center">
            <Ionicons name="locate" size={20} color={colors.brand[600]} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.ctrlBtn} onPress={() => mapRef.current?.getCamera().then(c => { if (c.zoom !== undefined) mapRef.current?.animateCamera({ zoom: c.zoom + 1 }, { duration: 200 }); })} accessibilityLabel="Zoom in">
            <Ionicons name="add" size={20} color={colors.runway[700]} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.ctrlBtn} onPress={() => mapRef.current?.getCamera().then(c => { if (c.zoom !== undefined) mapRef.current?.animateCamera({ zoom: Math.max(1, c.zoom - 1) }, { duration: 200 }); })} accessibilityLabel="Zoom out">
            <Ionicons name="remove" size={20} color={colors.runway[700]} />
          </TouchableOpacity>
        </View>

        {/* Compass indicator — top left below search */}
        <View style={styles.compassWrap}>
          <View style={[styles.compassNeedle, { transform: [{ rotate: `${-hdgDeg}deg` }] }]}>
            <View style={styles.compassN} />
          </View>
          <Text style={styles.compassText}>{hdgDeg}°</Text>
        </View>
      </View>

      {/* Bottom bar */}
      <View style={styles.bottomBar}>
        <Text style={styles.coordsText}>{coordsText}</Text>
        <View style={styles.bottomRight}>
          {gpsSignalWeak && (
            <View style={styles.gpsChip}>
              <View style={styles.gpsDot} />
              <Text style={styles.gpsText}>WEAK GPS</Text>
            </View>
          )}
          <Text style={styles.disclaimer}>⚠️ Not for real navigation</Text>
        </View>
      </View>
    </View>
  );
}

function DataChip({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <View style={styles.dataChip}>
      <Text style={styles.dataLabel}>{label}</Text>
      <View style={styles.dataRow}>
        <Text style={styles.dataValue}>{value}</Text>
        <Text style={styles.dataUnit}>{unit}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.runway[900] },
  mapWrap: { flex: 1, position: "relative" },
  // Marker
  markerWrap: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  markerPulse: { position: "absolute", width: 44, height: 44, borderRadius: 22, backgroundColor: colors.brand[400], opacity: 0.2 },
  markerCore: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.brand[600], alignItems: "center", justifyContent: "center", shadowColor: colors.brand[600], shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 6, elevation: 4 },
  // Search
  searchFloat: { position: "absolute", left: spacing.md, right: spacing.md },
  searchBar: { flexDirection: "row", alignItems: "center", backgroundColor: colors.white, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, gap: 10, shadowColor: colors.black, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 6 },
  searchInput: { flex: 1, fontSize: fontSize.sm, color: colors.runway[900], padding: 0 },
  // Data strip
  dataStrip: { position: "absolute", left: spacing.sm, top: 70, gap: 6 },
  dataChip: { backgroundColor: "rgba(255,255,255,0.95)", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, minWidth: 64, shadowColor: colors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3 },
  dataLabel: { fontSize: 9, fontWeight: "700", color: colors.runway[400], letterSpacing: 0.5 },
  dataRow: { flexDirection: "row", alignItems: "baseline", gap: 2 },
  dataValue: { fontSize: fontSize.lg, fontWeight: "800", color: colors.runway[900] },
  dataUnit: { fontSize: fontSize.xs, fontWeight: "600", color: colors.runway[400] },
  // Controls
  controls: { position: "absolute", right: spacing.sm, bottom: spacing.md, gap: 8 },
  ctrlBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.95)", alignItems: "center", justifyContent: "center", shadowColor: colors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3 },
  // Compass
  compassWrap: { position: "absolute", left: spacing.sm, top: 65, alignItems: "center", backgroundColor: "rgba(255,255,255,0.95)", borderRadius: 10, padding: 8, shadowColor: colors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3 },
  compassNeedle: { width: 28, height: 28, alignItems: "center", justifyContent: "flex-start" },
  compassN: { width: 4, height: 12, backgroundColor: colors.red[600], borderRadius: 2 },
  compassText: { fontSize: 9, fontWeight: "700", color: colors.runway[600], marginTop: 2 },
  // Bottom bar
  bottomBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 8, paddingHorizontal: spacing.md, backgroundColor: colors.white, gap: spacing.md },
  coordsText: { fontSize: 10, fontWeight: "600", color: colors.runway[500], fontFamily: "monospace" },
  bottomRight: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  disclaimer: { fontSize: fontSize.xs, fontWeight: "600", color: colors.runway[400] },
  gpsChip: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.amber[50], paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  gpsDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.amber[500] },
  gpsText: { fontSize: 9, fontWeight: "700", color: colors.amber[600] },
});
