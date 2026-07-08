import { View, Text, FlatList, StyleSheet, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useNotifications } from "@features/notifications/hooks/useNotifications";
import { colors, spacing, borderRadius, fontSize } from "@shared/theme";
import { Card } from "@shared/components/Card";
import { PressableScale } from "@shared/components/PressableScale";
import { SkeletonCard } from "@shared/components/Skeleton";
import { relativeTime } from "@shared/utils";

const TYPE_CONFIG: Record<string, { icon: string; color: string; bg: string }> = {
  form: { icon: "document-text-outline", color: colors.brand[600], bg: colors.brand[50] },
  template: { icon: "layers-outline", color: "#7c3aed", bg: "#f3e8ff" },
  sync: { icon: "sync-outline", color: colors.green[600], bg: colors.green[50] },
  system: { icon: "information-circle-outline", color: colors.runway[600], bg: colors.runway[100] },
};

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const { notifications, isLoading, error, unreadCount, markRead, markAllRead } = useNotifications();

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}><Text style={styles.title}>Alerts</Text></View>
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
          <Text style={styles.title}>Alerts</Text>
          {unreadCount > 0 && (
            <Text style={styles.sub}>{unreadCount} unread</Text>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); markAllRead(); }}
            style={styles.markAllBtn}
          >
            <Ionicons name="checkmark-done" size={16} color={colors.brand[600]} />
            <Text style={styles.markAll}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={16} color={colors.red[600]} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <FlatList
        data={notifications}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => {
          const config = (TYPE_CONFIG[item.type] || TYPE_CONFIG.system) as NonNullable<typeof TYPE_CONFIG[string]>;
          return (
            <PressableScale onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); markRead(item.id); }} haptic>
              <Card variant={!item.read ? "elevated" : "default"} style={styles.notifCard}>
                <View style={styles.notifRow}>
                    <View style={[styles.notifIconBg, { backgroundColor: config.bg }]}>
                      <Ionicons name={config.icon as keyof typeof Ionicons.glyphMap} size={20} color={config.color} />
                  </View>
                  <View style={styles.notifContent}>
                    <View style={styles.notifTitleRow}>
                      <Text style={[styles.notifTitle, !item.read && styles.notifTitleUnread]} numberOfLines={1}>
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
            <View style={styles.emptyIconBg}>
              <Ionicons name="notifications-off-outline" size={40} color={colors.runway[400]} />
            </View>
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
  header: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm },
  title: { fontSize: 28, fontWeight: "700", color: colors.runway[900], letterSpacing: -0.5 },
  sub: { fontSize: fontSize.sm, color: colors.runway[400], marginTop: 2 },
  markAllBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: spacing.xs, paddingHorizontal: spacing.sm, borderRadius: borderRadius.sm, backgroundColor: colors.brand[50] },
  markAll: { fontSize: fontSize.sm, fontWeight: "600", color: colors.brand[600] },
  errorBanner: { flexDirection: "row", alignItems: "center", gap: spacing.sm, backgroundColor: colors.red[50], marginHorizontal: spacing.lg, marginBottom: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.red[100] },
  errorText: { fontSize: fontSize.sm, color: colors.red[700], flex: 1 },
  list: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  notifCard: { marginBottom: spacing.xs },
  notifRow: { flexDirection: "row", gap: spacing.sm, alignItems: "flex-start" },
  notifIconBg: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", marginTop: 2 },
  notifContent: { flex: 1 },
  notifTitleRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  notifTitle: { fontSize: fontSize.sm, fontWeight: "500", color: colors.runway[700], flex: 1 },
  notifTitleUnread: { fontWeight: "700", color: colors.runway[900] },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.brand[500] },
  notifBody: { fontSize: fontSize.xs, color: colors.runway[500], marginTop: 2, lineHeight: 18 },
  notifTime: { fontSize: fontSize.xs, color: colors.runway[400], marginTop: spacing.xs },
  empty: { alignItems: "center", paddingTop: spacing["3xl"] },
  emptyIconBg: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.runway[100], alignItems: "center", justifyContent: "center", marginBottom: spacing.md },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: "600", color: colors.runway[700] },
  emptySub: { fontSize: fontSize.sm, color: colors.runway[400], marginTop: spacing.xs },
});
