import { useState, useEffect, useRef, useMemo } from "react";
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, FlatList, Keyboard,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import { colors, spacing, borderRadius, fontSize } from "@shared/theme";

// Philippine airports with ICAO codes, names, and coordinates
interface Airport {
  icao: string;
  name: string;
  latitude: number;
  longitude: number;
}

const PH_AIRPORTS: Airport[] = [
  { icao: "RPLL", name: "Ninoy Aquino International Airport", latitude: 14.5086, longitude: 121.0194 },
  { icao: "RPVM", name: "Mactan-Cebu International Airport", latitude: 10.3075, longitude: 123.9794 },
  { icao: "RPVP", name: "Puerto Princesa International Airport", latitude: 9.7421, longitude: 118.7587 },
  { icao: "RPUO", name: "Baguio Airport (Loakan)", latitude: 16.3751, longitude: 120.6203 },
  { icao: "RPUX", name: "Tuguegarao Airport", latitude: 17.6434, longitude: 121.7331 },
  { icao: "RPLB", name: "Subic Bay International Airport", latitude: 14.7944, longitude: 120.2714 },
  { icao: "RPLC", name: "Clark International Airport", latitude: 15.1860, longitude: 120.5603 },
  { icao: "RPLI", name: "Laoag International Airport", latitude: 18.1781, longitude: 120.5316 },
  { icao: "RPVF", name: "Daniel Z. Romualdez Airport (Tacloban)", latitude: 11.2280, longitude: 125.0278 },
  { icao: "RPVJ", name: "Silay-Bacolod Airport", latitude: 10.7764, longitude: 123.0145 },
  { icao: "RPMR", name: "Cagayan de Oro (Laguindingan) Airport", latitude: 8.6121, longitude: 124.4564 },
  { icao: "RPMD", name: "Francisco Bangoy International Airport (Davao)", latitude: 7.1255, longitude: 125.6456 },
  { icao: "RPMP", name: "General Santos International Airport", latitude: 6.0580, longitude: 125.0949 },
  { icao: "RPMZ", name: "Zamboanga International Airport", latitude: 6.9224, longitude: 122.0597 },
  { icao: "RPMS", name: "Cotabato Airport", latitude: 7.1654, longitude: 124.2096 },
  { icao: "RPMN", name: "Dipolog Airport", latitude: 8.6020, longitude: 123.3422 },
  { icao: "RPUB", name: "Busuanga Airport (Coron)", latitude: 12.1095, longitude: 120.1004 },
  { icao: "RPUG", name: "Caticlan Airport (Boracay)", latitude: 11.9244, longitude: 121.9543 },
  { icao: "RPUP", name: "San Jose Airport (Mindoro)", latitude: 12.3614, longitude: 121.0467 },
  { icao: "RPVK", name: "Kalibo International Airport", latitude: 11.6794, longitude: 122.3762 },
];

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
  const [searchResults, setSearchResults] = useState<Airport[]>([]);
  const [showResults, setShowResults] = useState(false);

  const filteredAirports = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.trim().toLowerCase();
    return PH_AIRPORTS.filter(
      (a) => a.icao.toLowerCase().includes(q) || a.name.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  function handleSearchSubmit() {
    Keyboard.dismiss();
    if (filteredAirports.length > 0) {
      setSearchResults(filteredAirports);
      setShowResults(true);
    } else {
      setSearchResults([]);
      setShowResults(true);
    }
  }

  function handleSelectAirport(airport: Airport) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowResults(false);
    setSearchQuery(airport.icao);
    mapRef.current?.animateToRegion(
      { latitude: airport.latitude, longitude: airport.longitude, latitudeDelta: 0.02, longitudeDelta: 0.02 },
      800
    );
  }

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
              tracksViewChanges={false}
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
              onChangeText={(text) => {
                setSearchQuery(text);
                if (text.trim()) setShowResults(true);
                else setShowResults(false);
              }}
              onSubmitEditing={handleSearchSubmit}
              returnKeyType="search"
              autoCapitalize="characters"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => { setSearchQuery(""); setShowResults(false); }}>
                <Ionicons name="close-circle" size={18} color={colors.runway[300]} />
              </TouchableOpacity>
            )}
          </View>

          {/* Search results dropdown */}
          {showResults && searchQuery.trim().length > 0 && (
            <View style={styles.searchResults}>
              {filteredAirports.length === 0 ? (
                <View style={styles.searchEmpty}>
                  <Text style={styles.searchEmptyText}>No airports found</Text>
                </View>
              ) : (
                <FlatList
                  data={filteredAirports.slice(0, 5)}
                  keyExtractor={(item) => item.icao}
                  keyboardShouldPersistTaps="handled"
                  renderItem={({ item }) => (
                    <TouchableOpacity style={styles.searchResultItem} onPress={() => handleSelectAirport(item)}>
                      <View style={styles.searchResultIcon}>
                        <Ionicons name="airplane" size={14} color={colors.brand[600]} />
                      </View>
                      <View style={styles.searchResultInfo}>
                        <Text style={styles.searchResultCode}>{item.icao}</Text>
                        <Text style={styles.searchResultName} numberOfLines={1}>{item.name}</Text>
                      </View>
                    </TouchableOpacity>
                  )}
                />
              )}
            </View>
          )}
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
  // Search results
  searchResults: { backgroundColor: colors.white, borderRadius: 12, marginTop: 6, maxHeight: 220, shadowColor: colors.black, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 8 },
  searchEmpty: { padding: 16, alignItems: "center" },
  searchEmptyText: { fontSize: fontSize.sm, color: colors.runway[400] },
  searchResultItem: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 12, gap: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.runway[100] },
  searchResultIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.brand[50], alignItems: "center", justifyContent: "center" },
  searchResultInfo: { flex: 1 },
  searchResultCode: { fontSize: fontSize.sm, fontWeight: "700", color: colors.runway[900] },
  searchResultName: { fontSize: 11, color: colors.runway[500], marginTop: 1 },
  // Data strip
  dataStrip: { position: "absolute", left: spacing.sm, top: 130, gap: 6 },
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
