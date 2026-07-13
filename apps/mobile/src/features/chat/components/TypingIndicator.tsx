import { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
} from "react-native-reanimated";

import { colors, spacing, borderRadius, fontSize } from "@shared/theme";

import type { TypingUser } from "../types";

interface TypingIndicatorProps {
  typingUsers: TypingUser[];
}

function TypingDot({ delay }: { delay: number }) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0.3, { duration: 400 }),
        ),
        -1,
        false,
      ),
    );
  }, [delay, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return <Animated.View style={[styles.dot, animatedStyle]} />;
}

export function TypingIndicator({ typingUsers }: TypingIndicatorProps) {
  if (typingUsers.length === 0) return null;

  const label =
    typingUsers.length === 1
      ? `${typingUsers[0]!.displayName} is typing`
      : typingUsers.length === 2
        ? `${typingUsers[0]!.displayName} and ${typingUsers[1]!.displayName} are typing`
        : `${typingUsers[0]!.displayName} and ${typingUsers.length - 1} others are typing`;

  return (
    <View style={styles.container}>
      <View style={styles.dots}>
        <TypingDot delay={0} />
        <TypingDot delay={150} />
        <TypingDot delay={300} />
      </View>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  dots: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: colors.runway[100],
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.lg,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.runway[500],
  },
  label: {
    fontSize: fontSize.xs,
    color: colors.runway[400],
    fontStyle: "italic",
    flex: 1,
  },
});
