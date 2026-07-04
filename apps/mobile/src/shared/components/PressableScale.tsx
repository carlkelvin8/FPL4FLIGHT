import { type ReactNode } from "react";
import { Pressable, type PressableProps } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Props extends PressableProps {
  children: ReactNode;
  scaleIn?: number;
  haptic?: boolean;
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
        if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { stiffness: 300, damping: 20 });
      }}
      onPress={onPress}
      style={[animatedStyle, props.style]}
      {...props}
    >
      {children}
    </AnimatedPressable>
  );
}
