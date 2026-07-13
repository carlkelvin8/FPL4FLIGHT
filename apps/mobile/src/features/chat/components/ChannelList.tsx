import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, LayoutAnimation, Platform, UIManager } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors, spacing, borderRadius, fontSize } from "@shared/theme";

import type { ChatChannel } from "../types";

// Enable LayoutAnimation on Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface ChannelListProps {
  channels: ChatChannel[];
  activeChannelId: string;
  unreadCounts?: Map<string, number>;
  onSelectChannel: (channel: ChatChannel) => void;
  onCreateChannel: () => void;
}

export function ChannelList({
  channels,
  activeChannelId,
  unreadCounts,
  onSelectChannel,
  onCreateChannel,
}: ChannelListProps) {
  const [collapsed, setCollapsed] = useState(false);

  const toggleCollapse = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCollapsed(!collapsed);
  };

  return (
    <View style={styles.container}>
      {/* Header — always visible, tappable to collapse/expand */}
      <TouchableOpacity onPress={toggleCollapse} style={styles.header} activeOpacity={0.7}>
        <View style={styles.headerLeft}>
          <Ionicons
            name={collapsed ? "chevron-forward" : "chevron-down"}
            size={14}
            color={colors.runway[400]}
          />
          <Text style={styles.headerTitle}>Channels</Text>
        </View>
        <TouchableOpacity
          onPress={(e) => { e.stopPropagation(); onCreateChannel(); }}
          style={styles.addBtn}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="add" size={16} color={colors.brand[600]} />
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Channel items — hidden when collapsed */}
      {!collapsed && (
        <View style={styles.list}>
          {channels.map((channel) => {
            const isActive = channel.id === activeChannelId;
            const unread = unreadCounts?.get(channel.id) ?? 0;
            return (
              <TouchableOpacity
                key={channel.id}
                style={[styles.channelItem, isActive && styles.channelItemActive]}
                onPress={() => onSelectChannel(channel)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={channel.icon as any}
                  size={16}
                  color={isActive ? colors.brand[600] : colors.runway[400]}
                />
                <Text
                  style={[
                    styles.channelName,
                    isActive && styles.channelNameActive,
                    unread > 0 && !isActive && styles.channelNameUnread,
                  ]}
                  numberOfLines={1}
                >
                  {channel.name}
                </Text>
                {unread > 0 && !isActive && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>{unread > 99 ? "99+" : unread}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.runway[100],
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  headerTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.runway[400],
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  addBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.brand[50],
    alignItems: "center",
    justifyContent: "center",
  },
  list: {
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
  },
  channelItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
    borderRadius: borderRadius.sm,
  },
  channelItemActive: {
    backgroundColor: colors.brand[50],
  },
  channelName: {
    fontSize: fontSize.sm,
    fontWeight: "500",
    color: colors.runway[600],
    flex: 1,
  },
  channelNameActive: {
    fontWeight: "700",
    color: colors.brand[700],
  },
  channelNameUnread: {
    fontWeight: "700",
    color: colors.runway[900],
  },
  unreadBadge: {
    backgroundColor: colors.brand[600],
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  unreadText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.white,
  },
});
