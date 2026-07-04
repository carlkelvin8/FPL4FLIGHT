import { View, type ViewStyle, type StyleProp } from "react-native";
import { colors, borderRadius, shadows, spacing } from "../theme";
import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: "default" | "elevated" | "outlined";
  padded?: boolean;
}

const variantStyles: Record<string, ViewStyle> = {
  default: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.runway[200],
    ...shadows.sm,
  },
  elevated: {
    backgroundColor: colors.white,
    ...shadows.md,
  },
  outlined: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.runway[200],
  },
};

export function Card({ children, style, variant = "default", padded = true }: CardProps) {
  return (
    <View
      style={[
        {
          borderRadius: borderRadius.lg,
          padding: padded ? spacing.md : 0,
        },
        variantStyles[variant],
        style,
      ]}
    >
      {children}
    </View>
  );
}
