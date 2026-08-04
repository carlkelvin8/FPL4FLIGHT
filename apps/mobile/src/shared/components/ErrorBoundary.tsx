import React, { Component } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { colors, spacing, borderRadius, fontSize } from "@shared/theme";

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
 *
 * Usage:
 *   <ErrorBoundary>
 *     <SomeScreen />
 *   </ErrorBoundary>
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
    // Error reporting (e.g. Sentry) will be wired in Task 28.
    if (__DEV__) console.error("[ErrorBoundary] Caught error:", error, info.componentStack);
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

    return (
      <View style={styles.container}>
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.message}>{error.message}</Text>
        <TouchableOpacity style={styles.button} onPress={this.resetError}>
          <Text style={styles.buttonText}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    backgroundColor: colors.white,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: "600",
    color: colors.runway[900],
    marginBottom: spacing.xs,
  },
  message: {
    fontSize: fontSize.sm,
    color: colors.runway[500],
    textAlign: "center",
    marginBottom: spacing.xl,
  },
  button: {
    backgroundColor: colors.brand[600],
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  buttonText: {
    color: colors.white,
    fontWeight: "600",
    fontSize: fontSize.base,
  },
});

export default ErrorBoundary;
