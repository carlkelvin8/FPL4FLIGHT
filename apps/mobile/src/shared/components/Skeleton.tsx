import { useEffect } from "react";
import { View, type ViewStyle, type StyleProp } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";

import { borderRadius, spacing } from "../theme";
import { useAppTheme } from "../hooks/useAppTheme";

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export function Skeleton({ width = "100%", height = 16, borderRadius: br = borderRadius.sm, style }: SkeletonProps) {
  const { colors: theme } = useAppTheme();
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.7, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        { width: width as any, height, borderRadius: br, backgroundColor: theme.border },
        animStyle,
        style,
      ]}
    />
  );
}

export function SkeletonCard() {
  const { colors: theme } = useAppTheme();
  return (
    <View
      style={{
        padding: spacing.md,
        backgroundColor: theme.surface,
        borderRadius: borderRadius.lg,
        gap: spacing.sm,
      }}
    >
      <Skeleton width="60%" height={18} />
      <Skeleton width="90%" height={14} />
      <Skeleton width="40%" height={12} />
    </View>
  );
}
