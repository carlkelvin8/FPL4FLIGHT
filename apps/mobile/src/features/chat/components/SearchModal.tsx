import { useState, useCallback } from "react";
import { View, Text, StyleSheet, TextInput, FlatList, Modal, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors, spacing, borderRadius, fontSize } from "@shared/theme";

import { chatRepository } from "../repositories/ChatRepository";
import type { ChatMessage } from "../types";

interface SearchModalProps {
  visible: boolean;
  channelId: string;
  onClose: () => void;
  onSelectMessage?: (message: ChatMessage) => void;
}

export function SearchModal({ visible, channelId, onClose, onSelectMessage }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = useCallback(async () => {
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    const result = await chatRepository.searchMessages(channelId, q);
    if (result.success) setResults(result.data);
    setLoading(false);
  }, [query, channelId]);

  const handleClose = () => {
    setQuery("");
    setResults([]);
    onClose();
  };

  const handleTapResult = (message: ChatMessage) => {
    handleClose();
    onSelectMessage?.(message);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Search Messages</Text>
            <TouchableOpacity onPress={handleClose} activeOpacity={0.7}>
              <Ionicons name="close" size={24} color={colors.runway[500]} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchRow}>
            <Ionicons name="search" size={18} color={colors.runway[400]} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by keyword..."
              placeholderTextColor={colors.runway[400]}
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
              onSubmitEditing={handleSearch}
              autoFocus
            />
          </View>

          {loading && <ActivityIndicator style={styles.loader} color={colors.brand[500]} />}

          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.resultItem} onPress={() => handleTapResult(item)} activeOpacity={0.7}>
                <View style={styles.resultHeader}>
                  <Text style={styles.resultName}>{item.displayName ?? item.userId.substring(0, 8)}</Text>
                  <Text style={styles.resultTime}>
                    {item.createdAt.toLocaleDateString([], { month: "short", day: "numeric" })}
                  </Text>
                </View>
                <Text style={styles.resultContent} numberOfLines={2}>{item.content}</Text>
                <Text style={styles.tapHint}>Tap to jump to message</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              !loading && query.trim() ? (
                <Text style={styles.empty}>No results found</Text>
              ) : null
            }
            contentContainerStyle={styles.listContent}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  container: { backgroundColor: colors.white, borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl, maxHeight: "80%", paddingBottom: spacing["2xl"] },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: spacing.lg },
  title: { fontSize: fontSize.xl, fontWeight: "700", color: colors.runway[900] },
  searchRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginHorizontal: spacing.lg, backgroundColor: colors.runway[50], borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.runway[200], paddingHorizontal: spacing.md, height: 44 },
  searchInput: { flex: 1, fontSize: fontSize.base, color: colors.runway[800] },
  loader: { marginTop: spacing.lg },
  listContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  resultItem: { paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.runway[100] },
  resultHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 2 },
  resultName: { fontSize: fontSize.sm, fontWeight: "600", color: colors.runway[800] },
  resultTime: { fontSize: fontSize.xs, color: colors.runway[400] },
  resultContent: { fontSize: fontSize.sm, color: colors.runway[600], lineHeight: 20 },
  tapHint: { fontSize: 10, color: colors.brand[500], marginTop: 3 },
  empty: { textAlign: "center", color: colors.runway[400], marginTop: spacing.lg },
});
