import { useState, useCallback, useRef } from "react";
import { View, TextInput, StyleSheet, Keyboard } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { colors, spacing, borderRadius, fontSize } from "@shared/theme";
import { PressableScale } from "@shared/components/PressableScale";

interface ChatInputProps {
  onSend: (content: string) => void;
  onTyping?: () => void;
  onStopTyping?: () => void;
  onTextChange?: (text: string) => void;
  sending: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({ onSend, onTyping, onStopTyping, onTextChange, sending, disabled, placeholder }: ChatInputProps) {
  const [text, setText] = useState("");
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChangeText = useCallback(
    (value: string) => {
      setText(value);
      onTextChange?.(value);

      if (value.trim().length > 0) {
        onTyping?.();
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => { onStopTyping?.(); }, 3000);
      } else {
        onStopTyping?.();
      }
    },
    [onTyping, onStopTyping, onTextChange],
  );

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || sending || disabled) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onSend(trimmed);
    setText("");
    onStopTyping?.();
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    Keyboard.dismiss();
  }, [text, sending, disabled, onSend, onStopTyping]);

  return (
    <View style={styles.container}>
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          placeholder={placeholder ?? "Message #community..."}
          placeholderTextColor={colors.runway[400]}
          value={text}
          onChangeText={handleChangeText}
          multiline
          maxLength={2000}
          editable={!sending && !disabled}
          returnKeyType="send"
          blurOnSubmit={false}
          onSubmitEditing={handleSend}
        />
      </View>

      <PressableScale
        onPress={handleSend}
        scaleIn={0.9}
        haptic
        style={[
          styles.sendBtn,
          (!text.trim() || sending || disabled) && styles.sendBtnDisabled,
        ]}
        disabled={!text.trim() || sending || disabled}
        accessibilityLabel="Send message"
      >
        <Ionicons
          name={sending ? "hourglass-outline" : "send"}
          size={18}
          color={!text.trim() || sending || disabled ? colors.runway[400] : colors.white}
        />
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.runway[200],
    gap: spacing.sm,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: colors.runway[50],
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.runway[200],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 40,
    maxHeight: 100,
    justifyContent: "center",
  },
  input: {
    fontSize: fontSize.base,
    color: colors.runway[800],
    padding: 0,
    lineHeight: 20,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.brand[600],
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: {
    backgroundColor: colors.runway[100],
  },
});
