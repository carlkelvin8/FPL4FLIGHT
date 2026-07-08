import { useState, useEffect } from "react";
import {
  View, Text, TextInput, StyleSheet, ScrollView, Alert,
  TouchableOpacity, Switch, ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { supabase } from "@core/network";
import { formRepository } from "@features/forms/repositories/FormRepository";
import { colors, spacing, borderRadius, fontSize } from "@shared/theme";
import { PressableScale } from "@shared/components/PressableScale";
import { formatDateStr, getCalendarDays, MONTH_NAMES } from "@shared/utils";

interface FormField {
  id: string;
  label: string;
  type: "text" | "textarea" | "number" | "select" | "checkbox";
  options?: string[];
  required?: boolean;
  placeholder?: string;
}

interface FormSection {
  title: string;
  fields: FormField[];
}

export default function FormEditorScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [sections, setSections] = useState<FormSection[]>([]);
  const [templateName, setTemplateName] = useState("");
  const [formStatus, setFormStatus] = useState("draft");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadForm();
  }, [id]);

  async function loadForm() {
    if (!id) return;
    setLoading(true);
    try {
      const result = await formRepository.findById(id);
      if (!result.success) {
        Alert.alert("Error", result.error.message);
        router.back();
        return;
      }

      const form = result.data;
      setFormData(form.data);
      setFormStatus(form.status);

      // Load template schema from Supabase directly since templates don't have a repository hook yet
      const { data: template } = await supabase
        .from("form_templates")
        .select("name, schema")
        .eq("id", form.templateId)
        .single();

      if (template) {
        setTemplateName(template.name);
        setSections(template.schema?.sections || []);
      }
    } catch {
      Alert.alert("Error", "Network error loading form.");
    }
    setLoading(false);
  }

  function updateField(fieldId: string, value: unknown) {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
  }

  async function handleSave() {
    if (!id) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSaving(true);
    try {
      const result = await formRepository.update(id, { data: formData });
      if (result.success) {
        Alert.alert("Saved", "Form saved successfully.");
      } else {
        Alert.alert("Error", result.error.message);
      }
    } catch {
      Alert.alert("Error", "Failed to save form.");
    }
    setSaving(false);
  }

  async function handleSubmit() {
    if (!id) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSaving(true);
    try {
      const result = await formRepository.update(id, { data: formData, status: "completed", submittedAt: new Date() });
      if (result.success) {
        Alert.alert("Submitted", "Form marked as completed.", [{ text: "OK", onPress: () => router.back() }]);
      } else {
        Alert.alert("Error", result.error.message);
      }
    } catch {
      Alert.alert("Error", "Failed to submit form.");
    }
    setSaving(false);
  }

  async function handleExportPDF() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const html = generatePDFHtml(templateName, sections, formData);

    try {
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      await Sharing.shareAsync(uri, { mimeType: "application/pdf", dialogTitle: `${templateName} - FPL4FLIGHT` });
    } catch {
      Alert.alert("Error", "Failed to generate PDF.");
    }
  }

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={colors.brand[600]} />
        <Text style={{ marginTop: spacing.md, color: colors.runway[500] }}>Loading form...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color={colors.brand[600]} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>{templateName}</Text>
          <View style={[styles.statusPill, formStatus === "completed" && styles.statusCompleted]}>
            <Text style={[styles.statusText, formStatus === "completed" && styles.statusTextCompleted]}>
              {formStatus === "completed" ? "Completed" : "Draft"}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleExportPDF} style={styles.saveHeaderBtn}>
          <Ionicons name="download-outline" size={20} color={colors.brand[600]} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.saveHeaderBtn}>
          <Ionicons name="cloud-upload-outline" size={20} color={colors.brand[600]} />
        </TouchableOpacity>
      </View>

      {/* Form Content */}
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {sections.map((section, sIdx) => (
          <View key={sIdx} style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.fields.map((field) => (
              <FieldRenderer
                key={field.id}
                field={field}
                value={formData[field.id]}
                onChange={(v) => updateField(field.id, v)}
                disabled={formStatus === "completed"}
              />
            ))}
          </View>
        ))}
      </ScrollView>

      {/* Bottom Actions */}
      {formStatus !== "completed" && (
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.md }]}>
          <PressableScale style={styles.saveDraftBtn} onPress={handleSave} disabled={saving} haptic>
            <Ionicons name="save-outline" size={18} color={colors.runway[700]} />
            <Text style={styles.saveDraftText}>Save Draft</Text>
          </PressableScale>
          <PressableScale style={styles.submitBtn} onPress={handleSubmit} disabled={saving} haptic>
            <Ionicons name="checkmark-circle" size={18} color={colors.white} />
            <Text style={styles.submitText}>Submit</Text>
          </PressableScale>
        </View>
      )}
    </View>
  );
}

/** Field Renderer */
function FieldRenderer({ field, value, onChange, disabled }: { field: FormField; value: unknown; onChange: (v: unknown) => void; disabled: boolean }) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [pickerHour, setPickerHour] = useState(8);
  const [pickerMinute, setPickerMinute] = useState(0);
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  const isDateField = field.id.includes("date") || field.label.toLowerCase().includes("date");
  const isTimeField = field.id.includes("time") || field.label.toLowerCase().includes("time");
  const isDateTimeField = field.label.toLowerCase().includes("date/time") || field.label.toLowerCase().includes("date & time");

  const monthNames = MONTH_NAMES;

  // Date/Time field — show both pickers
  if ((isDateField || isDateTimeField) && field.type === "text") {
    return (
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>
          {field.label}{field.required && <Text style={styles.requiredStar}> *</Text>}
        </Text>
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => { if (!disabled) setShowDatePicker(true); }}
          disabled={disabled}
        >
          <Ionicons name="calendar-outline" size={18} color={colors.brand[600]} />
          <Text style={value ? styles.pickerValueText : styles.pickerPlaceholderText}>
            {typeof value === "string" && value ? value : "Select date..."}
          </Text>
          <Ionicons name="chevron-down" size={16} color={colors.runway[400]} />
        </TouchableOpacity>

        {showDatePicker && (
          <View style={styles.inlineCalendar}>
            <View style={styles.calHeader}>
              <TouchableOpacity onPress={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}>
                <Ionicons name="chevron-back" size={20} color={colors.runway[700]} />
              </TouchableOpacity>
                    <Text style={styles.calMonthText}>{MONTH_NAMES[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}</Text>
              <TouchableOpacity onPress={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}>
                <Ionicons name="chevron-forward" size={20} color={colors.runway[700]} />
              </TouchableOpacity>
            </View>
            <View style={styles.calWeekRow}>
              {["Su","Mo","Tu","We","Th","Fr","Sa"].map((d) => <Text key={d} style={styles.calWeekDay}>{d}</Text>)}
            </View>
            <View style={styles.calGrid}>
              {getCalendarDays(calendarMonth).map((day, i) => {
                if (!day) return <View key={`e-${i}`} style={styles.calDayEmpty} />;
                const ds = formatDateStr(day);
                const strValue = typeof value === "string" ? value : "";
                const selected = strValue === ds || strValue.startsWith(ds);
                return (
                  <TouchableOpacity key={ds} style={[styles.calDay, selected && styles.calDaySelected]} onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    if (isDateTimeField) {
                      onChange(ds + " ");
                      setShowDatePicker(false);
                      setShowTimePicker(true);
                    } else {
                      onChange(ds);
                      setShowDatePicker(false);
                    }
                  }}>
                    <Text style={[styles.calDayText, selected && styles.calDayTextSelected]}>{day.getDate()}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {showTimePicker && (
          <View style={styles.inlineTimePicker}>
            <Text style={styles.timePickerLabel}>Select Time</Text>
            <View style={styles.timeRow}>
              <View style={styles.timeCol}>
                <TouchableOpacity onPress={() => setPickerHour((pickerHour + 1) % 24)} style={styles.timeArrow}><Ionicons name="chevron-up" size={22} color={colors.runway[600]} /></TouchableOpacity>
                <View style={styles.timeBox}><Text style={styles.timeVal}>{String(pickerHour).padStart(2, "0")}</Text></View>
                <TouchableOpacity onPress={() => setPickerHour((pickerHour - 1 + 24) % 24)} style={styles.timeArrow}><Ionicons name="chevron-down" size={22} color={colors.runway[600]} /></TouchableOpacity>
              </View>
              <Text style={styles.timeColon}>:</Text>
              <View style={styles.timeCol}>
                <TouchableOpacity onPress={() => setPickerMinute((pickerMinute + 5) % 60)} style={styles.timeArrow}><Ionicons name="chevron-up" size={22} color={colors.runway[600]} /></TouchableOpacity>
                <View style={styles.timeBox}><Text style={styles.timeVal}>{String(pickerMinute).padStart(2, "0")}</Text></View>
                <TouchableOpacity onPress={() => setPickerMinute((pickerMinute - 5 + 60) % 60)} style={styles.timeArrow}><Ionicons name="chevron-down" size={22} color={colors.runway[600]} /></TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity style={styles.timeConfirm} onPress={() => {
              const timeStr = `${String(pickerHour).padStart(2, "0")}:${String(pickerMinute).padStart(2, "0")}`;
              const datePrefix = typeof value === "string" && value ? value.trim().split(" ")[0] : formatDateStr(new Date());
              onChange(`${datePrefix} ${timeStr}`);
              setShowTimePicker(false);
            }}>
              <Text style={styles.timeConfirmText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  // Time-only field
  if (isTimeField && !isDateField && field.type === "text") {
    return (
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>
          {field.label}{field.required && <Text style={styles.requiredStar}> *</Text>}
        </Text>
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => { if (!disabled) setShowTimePicker(true); }}
          disabled={disabled}
        >
          <Ionicons name="time-outline" size={18} color={colors.brand[600]} />
          <Text style={value ? styles.pickerValueText : styles.pickerPlaceholderText}>
            {typeof value === "string" && value ? value : "Select time..."}
          </Text>
          <Ionicons name="chevron-down" size={16} color={colors.runway[400]} />
        </TouchableOpacity>

        {showTimePicker && (
          <View style={styles.inlineTimePicker}>
            <View style={styles.timeRow}>
              <View style={styles.timeCol}>
                <TouchableOpacity onPress={() => setPickerHour((pickerHour + 1) % 24)} style={styles.timeArrow}><Ionicons name="chevron-up" size={22} color={colors.runway[600]} /></TouchableOpacity>
                <View style={styles.timeBox}><Text style={styles.timeVal}>{String(pickerHour).padStart(2, "0")}</Text></View>
                <TouchableOpacity onPress={() => setPickerHour((pickerHour - 1 + 24) % 24)} style={styles.timeArrow}><Ionicons name="chevron-down" size={22} color={colors.runway[600]} /></TouchableOpacity>
              </View>
              <Text style={styles.timeColon}>:</Text>
              <View style={styles.timeCol}>
                <TouchableOpacity onPress={() => setPickerMinute((pickerMinute + 5) % 60)} style={styles.timeArrow}><Ionicons name="chevron-up" size={22} color={colors.runway[600]} /></TouchableOpacity>
                <View style={styles.timeBox}><Text style={styles.timeVal}>{String(pickerMinute).padStart(2, "0")}</Text></View>
                <TouchableOpacity onPress={() => setPickerMinute((pickerMinute - 5 + 60) % 60)} style={styles.timeArrow}><Ionicons name="chevron-down" size={22} color={colors.runway[600]} /></TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity style={styles.timeConfirm} onPress={() => {
              onChange(`${String(pickerHour).padStart(2, "0")}:${String(pickerMinute).padStart(2, "0")}`);
              setShowTimePicker(false);
            }}>
              <Text style={styles.timeConfirmText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }
  if (field.type === "checkbox") {
    return (
      <View style={styles.checkboxRow}>
        <Switch
          value={!!value}
          onValueChange={onChange}
          disabled={disabled}
          trackColor={{ false: colors.runway[300], true: colors.brand[400] }}
          thumbColor={value ? colors.brand[600] : colors.runway[400]}
        />
        <Text style={[styles.checkboxLabel, !!value && styles.checkboxLabelChecked]}>{field.label}</Text>
        {field.required && <Text style={styles.requiredStar}>*</Text>}
      </View>
    );
  }

  if (field.type === "select" && field.options) {
    return (
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>
          {field.label}{field.required && <Text style={styles.requiredStar}> *</Text>}
        </Text>
        <View style={styles.selectRow}>
          {field.options.map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[styles.selectChip, value === opt && styles.selectChipActive]}
              onPress={() => { if (!disabled) { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onChange(opt); } }}
              disabled={disabled}
            >
              <Text style={[styles.selectChipText, value === opt && styles.selectChipTextActive]}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }

  if (field.type === "textarea") {
    return (
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>
          {field.label}{field.required && <Text style={styles.requiredStar}> *</Text>}
        </Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          value={typeof value === "string" ? value : ""}
          onChangeText={onChange}
          placeholder={field.placeholder || ""}
          placeholderTextColor={colors.runway[300]}
          multiline
          textAlignVertical="top"
          editable={!disabled}
        />
      </View>
    );
  }

  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>
        {field.label}{field.required && <Text style={styles.requiredStar}> *</Text>}
      </Text>
      <TextInput
        style={styles.textInput}
        value={typeof value === "string" ? value : ""}
        onChangeText={onChange}
        placeholder={field.placeholder || ""}
        placeholderTextColor={colors.runway[300]}
        keyboardType={field.type === "number" ? "numeric" : "default"}
        editable={!disabled}
      />
    </View>
  );
}

/** Generate PDF HTML matching the PNP checklist template layout */
function generatePDFHtml(title: string, sections: FormSection[], data: Record<string, unknown>): string {
  const sectionRows = sections.map((section) => {
    const isChecklist = section.fields.some((f) => f.type === "select" && f.options?.includes("COMPLIED"));
    const isFlightDetails = section.title.toLowerCase().includes("flight");

    if (isChecklist) {
      const rows = section.fields
        .filter((f) => f.type === "select")
        .map((f, i) => {
          const remarksField = section.fields.find((rf) => rf.id === f.id.replace(/_(?:check|visual|monitor|action|suspected|id|profiling)/, "_remarks") || rf.id === f.id + "_remarks");
          const remarksValue = remarksField ? (data[remarksField.id] || "") : "";
          return `<tr>
            <td class="complied">${data[f.id] === "COMPLIED" ? "✓" : ""}</td>
            <td class="item">${f.label}</td>
            <td class="remarks">${remarksValue}</td>
          </tr>`;
        }).join("");

      return `<div class="section">
        <table>
          <thead><tr><th class="complied-h">COMPLIED</th><th class="item-h">${section.title.toUpperCase()}</th><th class="remarks-h">REMARKS</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
    }

    if (isFlightDetails) {
      const fieldRows = section.fields.map((f) => {
        return `<div class="detail-row"><span class="detail-label">${f.label}:</span><span class="detail-value">${data[f.id] || ""}</span></div>`;
      }).join("");
      return `<div class="details-section">${fieldRows}</div>`;
    }

    return "";
  }).join("");

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  body { font-family: Arial, sans-serif; font-size: 11px; padding: 20px; margin: 0; }
  .header { text-align: center; margin-bottom: 15px; border-bottom: 2px solid #000; padding-bottom: 10px; }
  .header h1 { font-size: 12px; margin: 2px 0; }
  .header h2 { font-size: 14px; margin: 5px 0; }
  .header p { margin: 2px 0; font-size: 10px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
  th, td { border: 1px solid #333; padding: 6px 8px; text-align: left; vertical-align: top; }
  th { background: #f0f0f0; font-weight: bold; font-size: 10px; }
  .complied, .complied-h { width: 60px; text-align: center; }
  .remarks, .remarks-h { width: 120px; }
  .item { font-size: 10px; line-height: 1.4; }
  .section { margin-bottom: 10px; }
  .details-section { margin-top: 15px; }
  .detail-row { display: flex; margin-bottom: 8px; border-bottom: 1px solid #ccc; padding-bottom: 4px; }
  .detail-label { font-weight: bold; min-width: 180px; }
  .detail-value { flex: 1; }
  .footer { margin-top: 20px; font-size: 9px; text-align: center; color: #666; }
</style></head><body>
  <div class="header">
    <h1>Republic of the Philippines</h1>
    <h1>NATIONAL POLICE COMMISSION</h1>
    <h1>Philippine National Police, Aviation Security Group</h1>
    <h2>AVIATION SECURITY UNIT 3</h2>
    <h2>PLARIDEL AIRPORT POLICE STATION</h2>
    <p>Plaridel Airport, Brgy. Lumang Bayan, Plaridel, Bulacan</p>
    <h2 style="margin-top:10px">${title.toUpperCase()}</h2>
  </div>
  ${sectionRows}
  <div class="footer">Generated by FPL4FLIGHT • ${new Date().toLocaleDateString()}</div>
</body></html>`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.runway[50] },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.md, paddingVertical: 12, backgroundColor: colors.white, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.runway[200] },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: fontSize.base, fontWeight: "700", color: colors.runway[900] },
  statusPill: { marginTop: 4, backgroundColor: colors.amber[50], paddingHorizontal: 10, paddingVertical: 2, borderRadius: 8 },
  statusCompleted: { backgroundColor: colors.green[50] },
  statusText: { fontSize: 10, fontWeight: "700", color: colors.amber[600] },
  statusTextCompleted: { color: colors.green[600] },
  saveHeaderBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  // Sections
  sectionCard: { backgroundColor: colors.white, marginHorizontal: spacing.md, marginTop: spacing.md, borderRadius: 16, padding: spacing.lg, shadowColor: colors.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  sectionTitle: { fontSize: fontSize.base, fontWeight: "700", color: colors.brand[600], marginBottom: spacing.lg, letterSpacing: 0.3 },
  // Fields
  fieldGroup: { marginBottom: spacing.md },
  fieldLabel: { fontSize: fontSize.sm, fontWeight: "600", color: colors.runway[700], marginBottom: 8 },
  requiredStar: { color: colors.red[500] },
  textInput: { backgroundColor: colors.runway[50], borderWidth: 1.5, borderColor: colors.runway[200], borderRadius: 12, paddingHorizontal: spacing.md, paddingVertical: 14, fontSize: fontSize.base, color: colors.runway[900] },
  textArea: { height: 80, textAlignVertical: "top" },
  // Checkbox
  checkboxRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.runway[100] },
  checkboxLabel: { flex: 1, fontSize: fontSize.sm, color: colors.runway[600] },
  checkboxLabelChecked: { color: colors.runway[900], fontWeight: "600" },
  // Select
  selectRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  selectChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, backgroundColor: colors.runway[100], borderWidth: 1.5, borderColor: colors.runway[200] },
  selectChipActive: { backgroundColor: colors.brand[600], borderColor: colors.brand[600] },
  selectChipText: { fontSize: fontSize.sm, fontWeight: "600", color: colors.runway[500] },
  selectChipTextActive: { color: colors.white },
  // Bottom bar
  bottomBar: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", gap: spacing.sm, paddingHorizontal: spacing.md, paddingTop: spacing.md, backgroundColor: colors.white, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.runway[200] },
  saveDraftBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 14, borderRadius: 12, backgroundColor: colors.runway[100] },
  saveDraftText: { fontSize: fontSize.sm, fontWeight: "600", color: colors.runway[700] },
  submitBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 14, borderRadius: 12, backgroundColor: colors.brand[600], shadowColor: colors.brand[600], shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 3 },
  submitText: { fontSize: fontSize.sm, fontWeight: "700", color: colors.white },
  // Picker styles
  pickerButton: { flexDirection: "row", alignItems: "center", backgroundColor: colors.runway[50], borderWidth: 1.5, borderColor: colors.runway[200], borderRadius: 12, paddingHorizontal: spacing.md, paddingVertical: 14, gap: spacing.sm },
  pickerValueText: { flex: 1, fontSize: fontSize.base, fontWeight: "600", color: colors.runway[900] },
  pickerPlaceholderText: { flex: 1, fontSize: fontSize.base, color: colors.runway[300] },
  // Inline calendar
  inlineCalendar: { backgroundColor: colors.white, borderRadius: 14, padding: spacing.md, marginTop: spacing.sm, borderWidth: 1, borderColor: colors.runway[200] },
  calHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm },
  calMonthText: { fontSize: fontSize.sm, fontWeight: "700", color: colors.runway[900] },
  calWeekRow: { flexDirection: "row", marginBottom: 4 },
  calWeekDay: { flex: 1, textAlign: "center", fontSize: 10, fontWeight: "600", color: colors.runway[400] },
  calGrid: { flexDirection: "row", flexWrap: "wrap" },
  calDayEmpty: { width: "14.28%", height: 36 },
  calDay: { width: "14.28%", height: 36, alignItems: "center", justifyContent: "center", borderRadius: 18 },
  calDaySelected: { backgroundColor: colors.brand[600] },
  calDayText: { fontSize: fontSize.sm, color: colors.runway[800] },
  calDayTextSelected: { color: colors.white, fontWeight: "700" },
  // Inline time picker
  inlineTimePicker: { backgroundColor: colors.white, borderRadius: 14, padding: spacing.md, marginTop: spacing.sm, borderWidth: 1, borderColor: colors.runway[200], alignItems: "center" },
  timePickerLabel: { fontSize: fontSize.sm, fontWeight: "600", color: colors.runway[700], marginBottom: spacing.sm },
  timeRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.md },
  timeCol: { alignItems: "center" },
  timeArrow: { padding: 6 },
  timeBox: { width: 56, height: 56, borderRadius: 12, backgroundColor: colors.runway[50], borderWidth: 1, borderColor: colors.runway[200], alignItems: "center", justifyContent: "center" },
  timeVal: { fontSize: 24, fontWeight: "800", color: colors.runway[900] },
  timeColon: { fontSize: 24, fontWeight: "800", color: colors.runway[400] },
  timeConfirm: { backgroundColor: colors.brand[600], paddingHorizontal: spacing.xl, paddingVertical: 10, borderRadius: 10, width: "100%", alignItems: "center" },
  timeConfirmText: { fontSize: fontSize.sm, fontWeight: "700", color: colors.white },
});
