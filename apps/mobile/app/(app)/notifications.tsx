import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNotifications } from "../../src/features/notifications/hooks/useNotifications";
import { colors, spacing, borderRadius, fontSize, shadows } from "../../src/shared/theme";
import { Card } from "../../src/shared/components/Card";
import { PressableScale } from "../../src/shared/components/PressableScale";
import { SkeletonCard } from "../../src/shared/components/Skeleton";

const TYPE_ICON: Record<string, string> = {
  form: "📝",
  template: "📁",
  sync: "🔄",
  system: "🔔",
};

function relativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const { notifications, isLoading, error, unreadCount, markRead, markAllRead } = useNotifications();

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}><Text style={styles.title}>Notifications</Text></View>
        <View style={styles.list}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Notifications</Text>
          {unreadCount > 0 && (
            <Text style={styles.sub}>{unreadCount} unread</Text>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={() => markAllRead()} accessibilityLabel="Mark all as read">
            <Text style={styles.markAll}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {error && (
        <View style={styles.errorBanner} accessibilityRole="alert">
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <FlatList
        data={notifications}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => {
          const icon = TYPE_ICON[item.type] ?? "🔔";
          return (
            <PressableScale onPress={() => markRead(item.id)} haptic>
              <Card variant={!item.read ? "elevated" : "default"} style={styles.notifCard}>
                <View style={styles.notifRow}>
                  <Text style={styles.notifIcon}>{icon}</Text>
                  <View style={styles.notifContent}>
                    <View style={styles.notifTitleRow}>
                      <Text style={[styles.notifTitle, !item.read && styles.notifTitleUnread]}>
                        {item.title}
                      </Text>
                      {!item.read && <View style={styles.unreadDot} />}
                    </View>
                    <Text style={styles.notifBody} numberOfLines={2}>{item.body}</Text>
                    <Text style={styles.notifTime}>{relativeTime(item.createdAt)}</Text>
                  </View>
                </View>
              </Card>
            </PressableScale>
          );
        }}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyTitle}>All caught up!</Text>
            <Text style={styles.emptySub}>No new notifications</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.runway[50] },
  header: {
    flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between",
    paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm,
  },
  title: { fontSize: 28, fontWeight: "700", color: colors.runway[900], letterSpacing: -0.5 },
  sub: { fontSize: fontSize.sm, color: colors.runway[400], marginTop: 2 },
  markAll: { fontSize: fontSize.sm, fontWeight: "600", color: colors.brand[600] },
  errorBanner: { backgroundColor: colors.red[50], marginHorizontal: spacing.lg, marginBottom: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.red[100] },
  errorText: { fontSize: fontSize.sm, color: colors.red[700] },
  list: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  notifCard: { marginBottom: spacing.sm },
  notifRow: { flexDirection: "row", gap: spacing.md, alignItems: "flex-start" },
  notifIcon: { fontSize: 28, marginTop: 2 },
  notifContent: { flex: 1 },
  notifTitleRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  notifTitle: { fontSize: fontSize.base, fontWeight: "500", color: colors.runway[700], flex: 1 },
  notifTitleUnread: { fontWeight: "700", color: colors.runway[900] },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.brand[500] },
  notifBody: { fontSize: fontSize.sm, color: colors.runway[500], marginTop: 2, lineHeight: 20 },
  notifTime: { fontSize: fontSize.xs, color: colors.runway[400], marginTop: spacing.xs },
  empty: { alignItems: "center", paddingTop: spacing["3xl"] },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: "600", color: colors.runway[700] },
  emptySub: { fontSize: fontSize.sm, color: colors.runway[400], marginTop: spacing.xs },
});
