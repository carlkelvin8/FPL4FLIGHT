import { useEffect } from "react";
import { View, type ViewStyle, type StyleProp } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { colors, borderRadius } from "../theme";

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export function Skeleton({ width = "100%", height = 16, borderRadius: br = borderRadius.sm, style }: SkeletonProps) {
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
        { width: width as any, height, borderRadius: br, backgroundColor: colors.runway[200] },
        animStyle,
        style,
      ]}
    />
  );
}

export function SkeletonCard() {
  return (
    <View style={{ padding: 16, backgroundColor: colors.white, borderRadius: borderRadius.lg, gap: 12 }}>
      <Skeleton width="60%" height={18} />
      <Skeleton width="90%" height={14} />
      <Skeleton width="40%" height={12} />
    </View>
  );
}
