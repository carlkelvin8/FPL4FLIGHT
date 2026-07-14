import { useState } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker } from "react-native-maps";

import { colors, spacing, borderRadius, fontSize } from "@shared/theme";

import type { ChatMessage } from "../types";

const SCREEN_WIDTH = Dimensions.get("window").width;
const IMAGE_MAX_WIDTH = SCREEN_WIDTH * 0.55;

// ─── Image Message ──────────────────────────────────────────

export function ImageContent({ message }: { message: ChatMessage }) {
  if (!message.imageUrl) return null;
  return (
    <Image
      source={{ uri: message.imageUrl }}
      style={styles.image}
      resizeMode="cover"
    />
  );
}

// ─── Voice Note ─────────────────────────────────────────────

export function VoiceContent({ message }: { message: ChatMessage }) {
  const [playing, setPlaying] = useState(false);

  const duration = message.voiceDuration ? Math.round(message.voiceDuration / 1000) : 0;
  const formatted = `${Math.floor(duration / 60)}:${String(duration % 60).padStart(2, "0")}`;

  const togglePlay = () => {
    setPlaying(!playing);
    // Audio playback would go here with expo-audio in a dev build
  };

  return (
    <TouchableOpacity style={styles.voiceContainer} onPress={togglePlay} activeOpacity={0.8}>
      <View style={styles.voicePlayBtn}>
        <Ionicons name={playing ? "pause" : "play"} size={16} color={colors.white} />
      </View>
      <View style={styles.voiceWave}>
        {Array.from({ length: 12 }).map((_, i) => (
          <View key={i} style={[styles.voiceBar, { height: 6 + (i % 3) * 5 + 2 }]} />
        ))}
      </View>
      <Text style={styles.voiceDuration}>{formatted}</Text>
    </TouchableOpacity>
  );
}

// ─── Location Message ───────────────────────────────────────

export function LocationContent({ message }: { message: ChatMessage }) {
  if (message.latitude == null || message.longitude == null) return null;

  return (
    <View style={styles.locationContainer}>
      <MapView
        style={styles.locationMap}
        initialRegion={{
          latitude: message.latitude,
          longitude: message.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        scrollEnabled={false}
        zoomEnabled={false}
        pitchEnabled={false}
        rotateEnabled={false}
        liteMode={Platform.OS === "android"}
      >
        <Marker
          coordinate={{ latitude: message.latitude, longitude: message.longitude }}
          pinColor={colors.red[500]}
        />
      </MapView>
      <View style={styles.locationInfo}>
        <Ionicons name="location" size={14} color={colors.red[500]} />
        <Text style={styles.locationCoords}>
          {message.latitude.toFixed(4)}, {message.longitude.toFixed(4)}
        </Text>
      </View>
    </View>
  );
}

// ─── METAR Inline Card ──────────────────────────────────────

const ICAO_REGEX = /\b([A-Z]{4})\b/g;

export function MetarInlineContent({ message }: { message: ChatMessage }) {
  if (!message.content) return null;
  const matches = message.content.match(ICAO_REGEX);
  if (!matches || matches.length === 0) return null;

  // Only show for codes that look like airports (common prefixes)
  const validPrefixes = ["K", "E", "L", "R", "Z", "V", "W", "Y", "P", "C", "S", "F", "H", "D", "U", "B", "O"];
  const icaoCodes = matches.filter((m) => validPrefixes.includes(m[0]!));
  if (icaoCodes.length === 0) return null;

  return (
    <View style={styles.metarContainer}>
      {icaoCodes.slice(0, 2).map((code) => (
        <View key={code} style={styles.metarChip}>
          <Ionicons name="cloud-outline" size={12} color={colors.brand[600]} />
          <Text style={styles.metarCode}>{code}</Text>
          <Text style={styles.metarHint}>METAR</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  // Image
  image: {
    width: IMAGE_MAX_WIDTH,
    height: IMAGE_MAX_WIDTH * 0.75,
    borderRadius: borderRadius.md,
    marginTop: 4,
  },
  // Voice
  voiceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.runway[50],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.runway[200],
    marginTop: 4,
    width: IMAGE_MAX_WIDTH,
  },
  voicePlayBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.brand[600],
    alignItems: "center",
    justifyContent: "center",
  },
  voiceWave: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    flex: 1,
  },
  voiceBar: {
    width: 3,
    backgroundColor: colors.brand[300],
    borderRadius: 2,
  },
  voiceDuration: {
    fontSize: fontSize.xs,
    color: colors.runway[500],
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  // Location
  locationContainer: {
    marginTop: 4,
    borderRadius: borderRadius.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.runway[200],
    width: IMAGE_MAX_WIDTH,
  },
  locationMap: {
    width: "100%",
    height: 120,
  },
  locationInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.white,
  },
  locationLabel: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.runway[700],
  },
  locationCoords: {
    fontSize: fontSize.xs,
    color: colors.runway[400],
    fontVariant: ["tabular-nums"] as any,
  },
  // METAR
  metarContainer: {
    flexDirection: "row",
    gap: spacing.xs,
    marginTop: 4,
  },
  metarChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: colors.brand[50],
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.brand[200],
  },
  metarCode: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.brand[700],
  },
  metarHint: {
    fontSize: 9,
    color: colors.brand[400],
    fontWeight: "600",
  },
});
