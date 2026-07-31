import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, borderRadius, fontSize } from "@shared/theme";
import { useAppTheme } from "@shared/hooks/useAppTheme";

interface LoadingStateProps {
  message?: string;
}

/** Full-screen loading state */
export function LoadingState({ message = "Loading..." }: LoadingStateProps) {
  const { colors: theme } = useAppTheme();
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.brand[600]} />
      <Text style={[styles.loadingText, { color: theme.textMuted }]}>{message}</Text>
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
  const { colors: theme } = useAppTheme();
  return (
    <View style={styles.container}>
      <View style={[styles.errorIconBg, { backgroundColor: theme.borderLight }]}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.red[500]} />
      </View>
      <Text style={[styles.errorTitle, { color: theme.textPrimary }]}>{title}</Text>
      <Text style={[styles.errorMessage, { color: theme.textMuted }]}>{message}</Text>
      {onRetry && (
        <TouchableOpacity style={styles.retryBtn} onPress={onRetry} activeOpacity={0.7}>
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
  const { colors: theme } = useAppTheme();
  return (
    <View style={styles.container}>
      <View style={[styles.emptyIconBg, { backgroundColor: theme.borderLight }]}>
        <Ionicons name={icon as any} size={48} color={theme.textMuted} />
      </View>
      <Text style={[styles.emptyTitle, { color: theme.textSecondary }]}>{title}</Text>
      {subtitle && <Text style={[styles.emptySubtitle, { color: theme.textMuted }]}>{subtitle}</Text>}
      {actionLabel && onAction && (
        <TouchableOpacity style={styles.actionBtn} onPress={onAction} activeOpacity={0.7}>
          <Text style={styles.actionText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl },
  // Loading
  loadingText: { marginTop: spacing.md, fontSize: fontSize.sm },
  // Error
  errorIconBg: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: spacing.md },
  errorTitle: { fontSize: fontSize.lg, fontWeight: "700", marginBottom: spacing.xs },
  errorMessage: { fontSize: fontSize.sm, textAlign: "center", marginBottom: spacing.lg, lineHeight: 20 },
  retryBtn: { flexDirection: "row", alignItems: "center", gap: spacing.xs, backgroundColor: colors.brand[600], paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: borderRadius.md },
  retryText: { fontSize: fontSize.sm, fontWeight: "600", color: colors.white },
  // Empty
  emptyIconBg: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: spacing.md },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: "600", marginBottom: spacing.xs },
  emptySubtitle: { fontSize: fontSize.sm, textAlign: "center", marginBottom: spacing.lg, lineHeight: 20 },
  actionBtn: { backgroundColor: colors.brand[600], paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: borderRadius.md },
  actionText: { fontSize: fontSize.sm, fontWeight: "600", color: colors.white },
});
