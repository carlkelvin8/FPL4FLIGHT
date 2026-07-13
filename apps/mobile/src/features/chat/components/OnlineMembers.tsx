import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from "react-native";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";

import { colors, spacing, borderRadius, fontSize } from "@shared/theme";

import type { OnlineMember } from "../types";

interface OnlineMembersProps {
  members: OnlineMember[];
}

export function OnlineMembers({ members }: OnlineMembersProps) {
  const [showList, setShowList] = useState(false);

  if (members.length === 0) return null;

  return (
    <>
      <TouchableOpacity
        style={styles.badge}
        onPress={() => setShowList(true)}
        activeOpacity={0.7}
      >
        <View style={styles.dot} />
        <Text style={styles.count}>{members.length} online</Text>
      </TouchableOpacity>

      <Modal visible={showList} transparent animationType="fade" onRequestClose={() => setShowList(false)}>
        <TouchableOpacity
          style={styles.overlay}
          onPress={() => setShowList(false)}
          activeOpacity={1}
        >
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Online Now</Text>
              <Text style={styles.modalCount}>{members.length} pilots</Text>
            </View>
            <ScrollView style={styles.memberList} showsVerticalScrollIndicator={false}>
              {members.map((m) => (
                <View key={m.userId} style={styles.memberRow}>
                  <View style={styles.memberDot} />
                  <Text style={styles.memberName} numberOfLines={1}>
                    {m.displayName}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.green[50],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.green[500],
  },
  count: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.green[600],
  },
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modal: {
    width: "80%",
    maxHeight: 400,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.runway[900],
  },
  modalCount: {
    fontSize: fontSize.sm,
    color: colors.runway[400],
  },
  memberList: {
    maxHeight: 300,
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.runway[100],
  },
  memberDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.green[500],
  },
  memberName: {
    fontSize: fontSize.sm,
    fontWeight: "500",
    color: colors.runway[700],
    flex: 1,
  },
});
