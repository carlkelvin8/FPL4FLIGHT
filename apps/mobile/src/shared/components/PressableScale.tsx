import * as Haptics from "expo-haptics";
import { type ReactNode } from "react";
import { Pressable, Platform, type PressableProps } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Props extends Omit<PressableProps, "children"> {
  children: ReactNode;
  scaleIn?: number;
  haptic?: boolean;
}

function triggerHaptic() {
  if (Platform.OS === "web") return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

export function PressableScale({ children, scaleIn = 0.97, haptic = false, onPress, ...props }: Props) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPressIn={() => {
        scale.value = withSpring(scaleIn, { stiffness: 300, damping: 20 });
        if (haptic) triggerHaptic();
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { stiffness: 300, damping: 20 });
      }}
      onPress={onPress}
      style={[animatedStyle, props.style]}
      {...props}
    >
      {children as any}
    </AnimatedPressable>
  );
}
