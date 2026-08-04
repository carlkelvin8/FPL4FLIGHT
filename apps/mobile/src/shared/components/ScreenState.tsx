import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, borderRadius, fontSize } from "@shared/theme";

interface LoadingStateProps {
  message?: string;
}

/** Full-screen loading state */
export function LoadingState({ message = "Loading..." }: LoadingStateProps) {
  return (
    <View style={styles.container} accessibilityRole="progressbar" accessibilityLabel={message}>
      <ActivityIndicator size="large" color={colors.brand[600]} />
      <Text style={styles.loadingText}>{message}</Text>
    </View>
  );
}

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

/** Full-screen error state with retry */
export function ErrorState({ title = "Something went wrong", message, onRetry }: ErrorStateProps) {
  return (
    <View style={styles.container} accessibilityRole="alert" accessibilityLabel={`${title}: ${message}`}>
      <View style={styles.errorIconBg}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.red[500]} />
      </View>
      <Text style={styles.errorTitle}>{title}</Text>
      <Text style={styles.errorMessage}>{message}</Text>
      {onRetry && (
        <TouchableOpacity style={styles.retryBtn} onPress={onRetry} activeOpacity={0.7} accessibilityLabel="Retry">
          <Ionicons name="refresh" size={16} color={colors.white} />
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

interface EmptyStateProps {
  icon?: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

/** Full-screen empty state with optional action */
export function EmptyState({ icon = "folder-open-outline", title, subtitle, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.container} accessibilityRole="summary" accessibilityLabel={`${title}${subtitle ? `: ${subtitle}` : ""}`}>
      <View style={styles.emptyIconBg}>
        <Ionicons name={icon as any} size={48} color={colors.runway[400]} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle && <Text style={styles.emptySubtitle}>{subtitle}</Text>}
      {actionLabel && onAction && (
        <TouchableOpacity style={styles.actionBtn} onPress={onAction} activeOpacity={0.7} accessibilityLabel={actionLabel}>
          <Text style={styles.actionText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl },
  // Loading
  loadingText: { marginTop: spacing.md, fontSize: fontSize.sm, color: colors.runway[500] },
  // Error
  errorIconBg: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.red[50], alignItems: "center", justifyContent: "center", marginBottom: spacing.md },
  errorTitle: { fontSize: fontSize.lg, fontWeight: "700", color: colors.runway[900], marginBottom: spacing.xs },
  errorMessage: { fontSize: fontSize.sm, color: colors.runway[500], textAlign: "center", marginBottom: spacing.lg, lineHeight: 20 },
  retryBtn: { flexDirection: "row", alignItems: "center", gap: spacing.xs, backgroundColor: colors.brand[600], paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: borderRadius.md },
  retryText: { fontSize: fontSize.sm, fontWeight: "600", color: colors.white },
  // Empty
  emptyIconBg: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.runway[100], alignItems: "center", justifyContent: "center", marginBottom: spacing.md },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: "600", color: colors.runway[700], marginBottom: spacing.xs },
  emptySubtitle: { fontSize: fontSize.sm, color: colors.runway[400], textAlign: "center", marginBottom: spacing.lg, lineHeight: 20 },
  actionBtn: { backgroundColor: colors.brand[600], paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: borderRadius.md },
  actionText: { fontSize: fontSize.sm, fontWeight: "600", color: colors.white },
});
