import { useState, useRef, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming } from "react-native-reanimated";

import { colors, spacing, fontSize } from "@shared/theme";

interface VoiceRecorderProps {
  onSend: (uri: string, durationMs: number) => void;
  onCancel: () => void;
}

export function VoiceRecorder({ onSend, onCancel }: VoiceRecorderProps) {
  const [duration, setDuration] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulse = useSharedValue(1);

  useEffect(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    pulse.value = withRepeat(withTiming(1.3, { duration: 800 }), -1, true);
    intervalRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  const handleSend = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    // In a dev build with expo-audio, this would save the recording
    // For Expo Go, we simulate
    Alert.alert("Voice Note", "Voice recording requires a development build. Simulating send.");
    onSend("", duration * 1000);
  };

  const handleCancel = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    onCancel();
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handleCancel} style={styles.cancelBtn} activeOpacity={0.7}>
        <Ionicons name="trash-outline" size={20} color={colors.red[500]} />
      </TouchableOpacity>
      <View style={styles.center}>
        <Animated.View style={[styles.recordDot, pulseStyle]} />
        <Text style={styles.time}>{formatTime(duration)}</Text>
        <Text style={styles.label}>Recording...</Text>
      </View>
      <TouchableOpacity onPress={handleSend} style={styles.sendBtn} activeOpacity={0.7}>
        <Ionicons name="send" size={18} color={colors.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.runway[200] },
  cancelBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.red[50], alignItems: "center", justifyContent: "center" },
  center: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm },
  recordDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.red[500] },
  time: { fontSize: fontSize.lg, fontWeight: "700", color: colors.runway[800], fontVariant: ["tabular-nums"] },
  label: { fontSize: fontSize.xs, color: colors.runway[400] },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.brand[600], alignItems: "center", justifyContent: "center" },
});
