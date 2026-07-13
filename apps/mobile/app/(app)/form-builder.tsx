import { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Modal, FlatList } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { supabase } from "@core/network";
import { colors, spacing, borderRadius, fontSize } from "@shared/theme";
import { PressableScale } from "@shared/components/PressableScale";

type FieldType = "text" | "textarea" | "select" | "checkbox";

interface BuilderField {
  id: string;
  label: string;
  type: FieldType;
  required: boolean;
  options?: string[] | undefined;
}

interface BuilderSection {
  id: string;
  title: string;
  fields: BuilderField[];
}

const FIELD_TYPES: { type: FieldType; label: string; icon: string }[] = [
  { type: "text", label: "Text Input", icon: "create-outline" },
  { type: "textarea", label: "Text Area", icon: "document-text-outline" },
  { type: "select", label: "Dropdown/Select", icon: "list-outline" },
  { type: "checkbox", label: "Checkbox", icon: "checkbox-outline" },
];

export default function FormBuilderScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [templateName, setTemplateName] = useState("");
  const [templateDesc, setTemplateDesc] = useState("");
  const [sections, setSections] = useState<BuilderSection[]>([
    { id: "1", title: "Section 1", fields: [] },
  ]);
  const [saving, setSaving] = useState(false);
  const [showFieldPicker, setShowFieldPicker] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<{ sectionId: string; field: BuilderField } | null>(null);
  const [showFieldEditor, setShowFieldEditor] = useState(false);

  function addSection() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSections((prev) => [...prev, { id: Date.now().toString(), title: `Section ${prev.length + 1}`, fields: [] }]);
  }

  function removeSection(id: string) {
    if (sections.length <= 1) { Alert.alert("Cannot Remove", "At least one section is required."); return; }
    setSections((prev) => prev.filter((s) => s.id !== id));
  }

  function updateSectionTitle(id: string, title: string) {
    setSections((prev) => prev.map((s) => s.id === id ? { ...s, title } : s));
  }

  function addFieldToSection(sectionId: string, type: FieldType) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newField: BuilderField = {
      id: Date.now().toString(),
      label: `New ${type} field`,
      type,
      required: false,
      options: type === "select" ? ["Option 1", "Option 2"] : undefined,
    };
    setSections((prev) => prev.map((s) => s.id === sectionId ? { ...s, fields: [...s.fields, newField] } : s));
    setShowFieldPicker(false);

    // Open field editor immediately
    setEditingField({ sectionId, field: newField });
    setShowFieldEditor(true);
  }

  function updateField(sectionId: string, fieldId: string, updates: Partial<BuilderField>) {
    setSections((prev) => prev.map((s) => s.id === sectionId ? {
      ...s,
      fields: s.fields.map((f) => f.id === fieldId ? { ...f, ...updates } : f),
    } : s));
  }

  function removeField(sectionId: string, fieldId: string) {
    setSections((prev) => prev.map((s) => s.id === sectionId ? {
      ...s,
      fields: s.fields.filter((f) => f.id !== fieldId),
    } : s));
  }

  function moveField(sectionId: string, fieldId: string, direction: "up" | "down") {
    setSections((prev) => prev.map((s) => {
      if (s.id !== sectionId) return s;
      const idx = s.fields.findIndex((f) => f.id === fieldId);
      if (idx < 0) return s;
      const newIdx = direction === "up" ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= s.fields.length) return s;
      const fields = [...s.fields];
      [fields[idx], fields[newIdx]] = [fields[newIdx]!, fields[idx]!];
      return { ...s, fields };
    }));
  }

  async function handleSave() {
    if (!templateName.trim()) { Alert.alert("Required", "Template name is required."); return; }
    const totalFields = sections.reduce((s, sec) => s + sec.fields.length, 0);
    if (totalFields === 0) { Alert.alert("Required", "Add at least one field."); return; }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { Alert.alert("Error", "Not authenticated."); setSaving(false); return; }

      const slug = templateName.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      const schema = {
        sections: sections.map((s) => ({
          title: s.title,
          fields: s.fields.map((f) => ({
            id: f.id,
            label: f.label,
            type: f.type,
            required: f.required,
            ...(f.options ? { options: f.options } : {}),
          })),
        })),
      };

      const { error } = await supabase.from("form_templates").insert({
        slug,
        name: templateName.trim(),
        description: templateDesc.trim(),
        version: 1,
        schema,
        is_active: true,
        created_by: user.id,
      });

      if (error) {
        Alert.alert("Error", error.message);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("Success", `Template "${templateName}" created!`, [{ text: "OK", onPress: () => router.back() }]);
      }
    } catch {
      Alert.alert("Error", "Failed to save template.");
    }
    setSaving(false);
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={colors.brand[600]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Form Builder</Text>
        <PressableScale style={styles.saveBtn} onPress={handleSave} haptic disabled={saving}>
          <Text style={styles.saveBtnText}>{saving ? "Saving..." : "Save"}</Text>
        </PressableScale>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
        {/* Template Info */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>TEMPLATE INFO</Text>
          <TextInput style={styles.nameInput} value={templateName} onChangeText={setTemplateName} placeholder="Template Name *" placeholderTextColor={colors.runway[300]} />
          <TextInput style={styles.descInput} value={templateDesc} onChangeText={setTemplateDesc} placeholder="Description (optional)" placeholderTextColor={colors.runway[300]} />
        </View>

        {/* Sections */}
        {sections.map((section, sIdx) => (
          <View key={section.id} style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <TextInput
                style={styles.sectionTitleInput}
                value={section.title}
                onChangeText={(v) => updateSectionTitle(section.id, v)}
                placeholder="Section title"
                placeholderTextColor={colors.runway[300]}
              />
              <TouchableOpacity onPress={() => removeSection(section.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="trash-outline" size={18} color={colors.red[500]} />
              </TouchableOpacity>
            </View>

            {/* Fields in this section */}
            {section.fields.map((field, fIdx) => (
              <View key={field.id} style={styles.fieldRow}>
                <View style={styles.fieldInfo}>
                  <Ionicons name={FIELD_TYPES.find((t) => t.type === field.type)?.icon as any ?? "create-outline"} size={16} color={colors.brand[500]} />
                  <View style={styles.fieldMeta}>
                    <Text style={styles.fieldLabel} numberOfLines={1}>{field.label}</Text>
                    <Text style={styles.fieldType}>{field.type}{field.required ? " • required" : ""}</Text>
                  </View>
                </View>
                <View style={styles.fieldActions}>
                  <TouchableOpacity onPress={() => moveField(section.id, field.id, "up")} style={styles.fieldActionBtn}>
                    <Ionicons name="chevron-up" size={14} color={colors.runway[400]} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => moveField(section.id, field.id, "down")} style={styles.fieldActionBtn}>
                    <Ionicons name="chevron-down" size={14} color={colors.runway[400]} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => { setEditingField({ sectionId: section.id, field }); setShowFieldEditor(true); }} style={styles.fieldActionBtn}>
                    <Ionicons name="pencil" size={14} color={colors.brand[500]} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => removeField(section.id, field.id)} style={styles.fieldActionBtn}>
                    <Ionicons name="close-circle" size={14} color={colors.red[500]} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {/* Add field button */}
            <TouchableOpacity
              style={styles.addFieldBtn}
              onPress={() => { setActiveSection(section.id); setShowFieldPicker(true); }}
              activeOpacity={0.7}
            >
              <Ionicons name="add-circle-outline" size={18} color={colors.brand[600]} />
              <Text style={styles.addFieldText}>Add Field</Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* Add Section */}
        <TouchableOpacity style={styles.addSectionBtn} onPress={addSection} activeOpacity={0.7}>
          <Ionicons name="add" size={20} color={colors.brand[600]} />
          <Text style={styles.addSectionText}>Add Section</Text>
        </TouchableOpacity>

        {/* Preview summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Summary</Text>
          <Text style={styles.summaryText}>{sections.length} sections • {sections.reduce((s, sec) => s + sec.fields.length, 0)} fields</Text>
        </View>
      </ScrollView>

      {/* Field Type Picker Modal */}
      <Modal visible={showFieldPicker} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowFieldPicker(false)}>
          <View style={styles.pickerModal}>
            <Text style={styles.pickerTitle}>Add Field</Text>
            {FIELD_TYPES.map((ft) => (
              <TouchableOpacity key={ft.type} style={styles.pickerRow} onPress={() => activeSection && addFieldToSection(activeSection, ft.type)} activeOpacity={0.7}>
                <Ionicons name={ft.icon as any} size={20} color={colors.brand[600]} />
                <Text style={styles.pickerRowText}>{ft.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Field Editor Modal */}
      <Modal visible={showFieldEditor} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowFieldEditor(false)}>
          <View style={styles.editorModal}>
            <Text style={styles.pickerTitle}>Edit Field</Text>
            {editingField && (
              <>
                <Text style={styles.editorLabel}>Label</Text>
                <TextInput
                  style={styles.editorInput}
                  value={editingField.field.label}
                  onChangeText={(v) => { updateField(editingField.sectionId, editingField.field.id, { label: v }); setEditingField({ ...editingField, field: { ...editingField.field, label: v } }); }}
                  placeholder="Field label"
                  placeholderTextColor={colors.runway[300]}
                />
                <View style={styles.editorRow}>
                  <Text style={styles.editorLabel}>Required</Text>
                  <TouchableOpacity onPress={() => { const newVal = !editingField.field.required; updateField(editingField.sectionId, editingField.field.id, { required: newVal }); setEditingField({ ...editingField, field: { ...editingField.field, required: newVal } }); }}>
                    <Ionicons name={editingField.field.required ? "checkbox" : "square-outline"} size={24} color={colors.brand[600]} />
                  </TouchableOpacity>
                </View>
                {editingField.field.type === "select" && (
                  <>
                    <Text style={styles.editorLabel}>Options (one per line)</Text>
                    <TextInput
                      style={[styles.editorInput, { height: 80 }]}
                      value={(editingField.field.options ?? []).join("\n")}
                      onChangeText={(v) => { const opts = v.split("\n").filter(Boolean); updateField(editingField.sectionId, editingField.field.id, { options: opts }); setEditingField({ ...editingField, field: { ...editingField.field, options: opts } }); }}
                      multiline
                      placeholder="Option 1\nOption 2"
                      placeholderTextColor={colors.runway[300]}
                    />
                  </>
                )}
                <PressableScale style={styles.editorDoneBtn} onPress={() => setShowFieldEditor(false)} haptic>
                  <Text style={styles.editorDoneText}>Done</Text>
                </PressableScale>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.runway[50] },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.runway[200] },
  headerTitle: { fontSize: fontSize.lg, fontWeight: "700", color: colors.runway[900] },
  saveBtn: { backgroundColor: colors.brand[600], paddingHorizontal: 16, paddingVertical: 8, borderRadius: 14 },
  saveBtnText: { fontSize: fontSize.sm, fontWeight: "700", color: colors.white },
  card: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.md },
  cardLabel: { fontSize: 10, fontWeight: "700", color: colors.brand[600], letterSpacing: 1, marginBottom: spacing.sm },
  nameInput: { backgroundColor: colors.runway[50], borderWidth: 1, borderColor: colors.runway[200], borderRadius: borderRadius.sm, paddingHorizontal: spacing.md, paddingVertical: 12, fontSize: fontSize.base, fontWeight: "600", color: colors.runway[900], marginBottom: spacing.sm },
  descInput: { backgroundColor: colors.runway[50], borderWidth: 1, borderColor: colors.runway[200], borderRadius: borderRadius.sm, paddingHorizontal: spacing.md, paddingVertical: 10, fontSize: fontSize.sm, color: colors.runway[700] },
  sectionCard: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.sm, borderLeftWidth: 3, borderLeftColor: colors.brand[300] },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.sm },
  sectionTitleInput: { flex: 1, fontSize: fontSize.base, fontWeight: "700", color: colors.runway[900], marginRight: spacing.sm },
  fieldRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: spacing.xs, paddingHorizontal: spacing.xs, backgroundColor: colors.runway[50], borderRadius: borderRadius.sm, marginBottom: spacing.xs },
  fieldInfo: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flex: 1 },
  fieldMeta: { flex: 1 },
  fieldLabel: { fontSize: fontSize.sm, fontWeight: "500", color: colors.runway[800] },
  fieldType: { fontSize: 10, color: colors.runway[400] },
  fieldActions: { flexDirection: "row", gap: 2 },
  fieldActionBtn: { width: 26, height: 26, alignItems: "center", justifyContent: "center" },
  addFieldBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.xs, paddingVertical: spacing.sm, borderWidth: 1, borderColor: colors.brand[200], borderRadius: borderRadius.sm, borderStyle: "dashed", marginTop: spacing.xs },
  addFieldText: { fontSize: fontSize.sm, fontWeight: "600", color: colors.brand[600] },
  addSectionBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, paddingVertical: spacing.md, backgroundColor: colors.white, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.runway[200], marginBottom: spacing.md },
  addSectionText: { fontSize: fontSize.sm, fontWeight: "600", color: colors.brand[600] },
  summaryCard: { backgroundColor: colors.brand[50], borderRadius: borderRadius.md, padding: spacing.md, alignItems: "center" },
  summaryTitle: { fontSize: fontSize.xs, fontWeight: "600", color: colors.brand[600] },
  summaryText: { fontSize: fontSize.sm, fontWeight: "700", color: colors.brand[700], marginTop: 4 },
  // Modals
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center", padding: spacing.lg },
  pickerModal: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.lg, width: "100%", maxWidth: 300 },
  pickerTitle: { fontSize: fontSize.lg, fontWeight: "700", color: colors.runway[900], marginBottom: spacing.md },
  pickerRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.runway[100] },
  pickerRowText: { fontSize: fontSize.base, color: colors.runway[700] },
  editorModal: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.lg, width: "100%", maxWidth: 320 },
  editorLabel: { fontSize: fontSize.xs, fontWeight: "600", color: colors.runway[600], marginBottom: 4, marginTop: spacing.sm },
  editorInput: { backgroundColor: colors.runway[50], borderWidth: 1, borderColor: colors.runway[200], borderRadius: borderRadius.sm, paddingHorizontal: spacing.md, paddingVertical: 10, fontSize: fontSize.sm, color: colors.runway[900] },
  editorRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: spacing.sm },
  editorDoneBtn: { backgroundColor: colors.brand[600], paddingVertical: spacing.sm, borderRadius: borderRadius.md, alignItems: "center", marginTop: spacing.lg },
  editorDoneText: { fontSize: fontSize.base, fontWeight: "700", color: colors.white },
});
