import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors, spacing, borderRadius, fontSize } from "@shared/theme";

interface MentionSuggestionsProps {
  suggestions: Array<{ id: string; name: string }>;
  onSelect: (member: { id: string; name: string }) => void;
}

export function MentionSuggestions({ suggestions, onSelect }: MentionSuggestionsProps) {
  if (suggestions.length === 0) return null;

  return (
    <View style={styles.container}>
      <FlatList
        data={suggestions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.item} onPress={() => onSelect(item)} activeOpacity={0.7}>
            <Ionicons name="person-outline" size={14} color={colors.brand[500]} />
            <Text style={styles.name}>{item.name}</Text>
          </TouchableOpacity>
        )}
        keyboardShouldPersistTaps="handled"
        style={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.runway[200],
    maxHeight: 150,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  list: {
    paddingHorizontal: spacing.md,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.runway[100],
  },
  name: {
    fontSize: fontSize.sm,
    fontWeight: "500",
    color: colors.runway[700],
  },
});
