import type { ReactNode } from "react";
import { View, type ViewStyle, type StyleProp } from "react-native";

import { borderRadius, shadows, spacing } from "../theme";
import { useAppTheme } from "../hooks/useAppTheme";

interface CardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: "default" | "elevated" | "outlined";
  padded?: boolean;
}

export function Card({ children, style, variant = "default", padded = true }: CardProps) {
  const { colors: theme } = useAppTheme();

  const variantStyles: Record<string, ViewStyle> = {
    default: {
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      ...shadows.sm,
    },
    elevated: {
      backgroundColor: theme.surface,
      ...shadows.md,
    },
    outlined: {
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
  };

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
      {children as any}
    </View>
  );
}
