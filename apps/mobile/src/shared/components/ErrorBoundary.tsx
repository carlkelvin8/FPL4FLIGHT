import React, { Component } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

import { colors, spacing, borderRadius } from "../theme";
import { useAppTheme } from "../hooks/useAppTheme";

interface Props {
  children: React.ReactNode;
  fallback?: (error: Error, resetError: () => void) => React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary — catches unhandled render errors in any child subtree
 * and displays a recoverable fallback UI instead of crashing the app.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error("[ErrorBoundary] Caught error:", error, info.componentStack);
  }

  private resetError = (): void => {
    this.setState({ hasError: false, error: null });
  };

  override render(): React.ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    if (!hasError || !error) {
      return children;
    }

    if (fallback) {
      return fallback(error, this.resetError);
    }

    return <ThemedErrorFallback message={error.message} onRetry={this.resetError} />;
  }
}

function ThemedErrorFallback({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { colors: theme } = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.textPrimary }]}>Something went wrong</Text>
      <Text style={[styles.message, { color: theme.textMuted }]}>{message}</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={onRetry}
        accessibilityRole="button"
        accessibilityLabel="Try again"
      >
        <Text style={styles.buttonText}>Try again</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: spacing.sm,
  },
  message: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  button: {
    backgroundColor: colors.brand[600],
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  buttonText: {
    color: colors.white,
    fontWeight: "600",
    fontSize: 16,
  },
});

export default ErrorBoundary;
