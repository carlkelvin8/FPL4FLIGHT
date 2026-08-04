import { useState, useEffect } from "react";
import {
  View, Text, TextInput, StyleSheet, ScrollView, Alert,
  TouchableOpacity, Switch, ActivityIndicator, Modal,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as MailComposer from "expo-mail-composer";
import { WebView } from "react-native-webview";
import { supabase } from "@core/network";
import { formRepository } from "@features/forms/repositories/FormRepository";
import { colors, spacing, borderRadius, fontSize } from "@shared/theme";
import { PressableScale } from "@shared/components/PressableScale";
import { APP_NAME } from "@shared/constants";
import { formatDateStr, getCalendarDays, MONTH_NAMES } from "@shared/utils";
import { QRShareModal } from "@shared/components/QRShareModal";
import { hasPdfTemplates, fillCaapFlightPlan, fillManifestPdf, sharePdf } from "@features/forms/pdf-filler";
import { loadPdfTemplates } from "@features/forms/pdf-template-loader";

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
    loadPdfTemplates(); // Load blank PDF templates for pdf-lib filling
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
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Unable to load form. Check your internet connection.");
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
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to save form. Check your connection.");
    }
    setSaving(false);
  }

  async function handleSubmit() {
    if (!id) return;

    // Validate required fields before submitting
    const missingFields: string[] = [];
    for (const section of sections) {
      for (const field of section.fields) {
        if (field.required) {
          const val = formData[field.id];
          if (val === undefined || val === null || val === "") {
            missingFields.push(field.label);
          }
        }
      }
    }
    if (missingFields.length > 0) {
      Alert.alert(
        "Required Fields Missing",
        `Please fill in: ${missingFields.slice(0, 5).join(", ")}${missingFields.length > 5 ? ` and ${missingFields.length - 5} more` : ""}`,
      );
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSaving(true);
    try {
      const result = await formRepository.update(id, { data: formData, status: "completed", submittedAt: new Date() });
      if (result.success) {
        Alert.alert("Submitted", "Form marked as completed.", [{ text: "OK", onPress: () => router.back() }]);
      } else {
        Alert.alert("Error", result.error.message);
      }
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to submit form. Check your connection.");
    }
    setSaving(false);
  }

  async function handleExportPDF() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Ensure templates are loaded (retry on each export in case first load failed)
    try {
      await loadPdfTemplates();
    } catch (loadErr) {
      Alert.alert("Template Load Error", String(loadErr));
    }

    // Try pdf-lib (pixel-perfect) first if templates are loaded
    const templates = hasPdfTemplates();
    const isCaap = templateName.toLowerCase().includes("caap") || templateName.toLowerCase().includes("flight plan");
    const isManifest = templateName.toLowerCase().includes("manifest") || templateName.toLowerCase().includes("passenger");

    if (isCaap && templates.caap) {
      try {
        const uri = await fillCaapFlightPlan(formData);
        if (uri) { await sharePdf(uri, templateName); return; }
      } catch (fillErr) {
        // Fall through to HTML fallback
      }
    }
    if (isManifest && templates.manifest) {
      try {
        const uri = await fillManifestPdf(formData);
        if (uri) { await sharePdf(uri, templateName); return; }
      } catch (fillErr) {
        // Fall through to HTML fallback
      }
    }

    // Fallback: HTML-based PDF
    const html = generatePDFHtml(templateName, sections, formData);

    try {
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      await Sharing.shareAsync(uri, { mimeType: "application/pdf", dialogTitle: `${templateName} - ${APP_NAME}` });
    } catch {
      Alert.alert("Error", "Failed to generate PDF.");
    }
  }

  async function handleEmailForm() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const html = generatePDFHtml(templateName, sections, formData);
    try {
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      const isAvailable = await MailComposer.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert("Email Unavailable", "No email client is configured on this device.");
        return;
      }
      await MailComposer.composeAsync({
        subject: `${templateName} - ${APP_NAME}`,
        body: `Please find attached the completed ${templateName} form.\n\nGenerated by ${APP_NAME}.`,
        attachments: [uri],
      });
    } catch {
      Alert.alert("Error", "Failed to compose email.");
    }
  }

  const [showPreview, setShowPreview] = useState(false);
  const [showQR, setShowQR] = useState(false);

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
        <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowPreview(true); }} style={styles.saveHeaderBtn}>
          <Ionicons name="eye-outline" size={20} color={colors.brand[600]} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleExportPDF} style={styles.saveHeaderBtn}>
          <Ionicons name="download-outline" size={20} color={colors.brand[600]} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleEmailForm} style={styles.saveHeaderBtn}>
          <Ionicons name="mail-outline" size={20} color={colors.brand[600]} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowQR(true)} style={styles.saveHeaderBtn}>
          <Ionicons name="qr-code-outline" size={20} color={colors.brand[600]} />
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

      {/* Preview Modal — renders exact same HTML as PDF export */}
      <Modal visible={showPreview} animationType="slide" onRequestClose={() => setShowPreview(false)}>
        <View style={{ flex: 1, backgroundColor: colors.white, paddingTop: insets.top }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.runway[200] }}>
            <Text style={{ fontSize: fontSize.lg, fontWeight: "700", color: colors.runway[900] }}>Preview</Text>
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              <TouchableOpacity onPress={handleExportPDF} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.brand[50], alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="download-outline" size={18} color={colors.brand[600]} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowPreview(false)} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.runway[100], alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="close" size={20} color={colors.runway[600]} />
              </TouchableOpacity>
            </View>
          </View>
          <WebView
            originWhitelist={["about:*", "data:*"]}
            source={{ html: generatePDFHtml(templateName, sections, formData) }}
            style={{ flex: 1 }}
            scalesPageToFit={false}
            javaScriptEnabled={false}
            injectedJavaScript={`document.querySelector('meta[name="viewport"]') || document.head.insertAdjacentHTML('beforeend', '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=3">'); true;`}
          />
        </View>
      </Modal>

      {/* QR Share Modal */}
      <QRShareModal visible={showQR} onClose={() => setShowQR(false)} formId={id ?? ""} formName={templateName} />
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

/** Generate PDF HTML — pixel-perfect replica of PNP Plaridel Airport checklist.
 * Uses the exact original document layout with data overlaid at precise positions.
 * The background is the blank form; we just fill in the values.
 */
function generatePDFHtml(title: string, sections: FormSection[], data: Record<string, unknown>): string {
  // Detect CAAP Flight Plan template
  if (title.toLowerCase().includes("caap") || title.toLowerCase().includes("flight plan")) {
    return generateCaapFlightPlanHtml(data);
  }
  // Detect Passenger Manifest template
  if (title.toLowerCase().includes("manifest") || title.toLowerCase().includes("passenger")) {
    return generatePassengerManifestHtml(data);
  }
  // Default: PNP Checklist
  return generatePnpChecklistHtml(title, data);
}

/** CAAP Flight Plan ATS 2019-1 — Pure HTML/CSS table layout (no image overlay) */
/** Escape HTML entities to prevent XSS in WebView previews */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function generateCaapFlightPlanHtml(data: Record<string, unknown>): string {
  const d = (key: string) => escapeHtml(String(data[key] || ""));
  const chk = (key: string) => data[key] === "Yes" ? "✗" : "";

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
@page { size: A4 portrait; margin: 8mm; }
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Courier New', monospace; font-size: 9px; color: #000; padding: 4px; }
table { border-collapse: collapse; width: 100%; }
td, th { border: 1px solid #000; padding: 2px 3px; vertical-align: top; font-size: 9px; }
.no-border { border: none; }
.center { text-align: center; }
.bold { font-weight: bold; }
.small { font-size: 7px; }
.tiny { font-size: 6.5px; }
.field-label { font-size: 7px; color: #333; }
.field-num { font-size: 7px; font-weight: bold; }
.field-value { font-size: 10px; font-weight: bold; font-family: 'Courier New', monospace; min-height: 14px; }
.header-text { text-align: center; font-size: 8px; }
.section-label { font-size: 7px; background: #f5f5f5; }
.box { display: inline-block; width: 12px; height: 12px; border: 1px solid #000; text-align: center; line-height: 12px; font-size: 9px; margin: 0 1px; vertical-align: middle; }
.check-mark { font-weight: bold; font-size: 11px; }
h2 { font-size: 11px; text-align: center; margin: 2px 0; font-weight: bold; }
h3 { font-size: 9px; text-align: center; margin: 1px 0; }
.grey-row { background: #eee; }
</style></head><body>

<!-- CAAP Header -->
<div style="text-align:center;margin-bottom:4px;">
  <div style="font-size:8px;">CAAP Form ATS 2019-1</div>
  <div style="font-size:10px;font-weight:bold;">Flight Plan</div>
  <div style="font-size:7px;">Republic of the Philippines</div>
  <div style="font-size:8px;font-weight:bold;">CIVIL AVIATION AUTHORITY OF THE PHILIPPINES</div>
  <div style="font-size:7px;">Old MIA Rd. Pasay City, Metro Manila 1300</div>
</div>

<table>
  <!-- FLIGHT PLAN title row -->
  <tr class="grey-row"><td colspan="12" class="center bold" style="font-size:10px;padding:3px;">FLIGHT PLAN</td></tr>

  <!-- Row: PRIORITY / ADDRESSEE(S) -->
  <tr>
    <td colspan="2" class="section-label"><span class="field-num">PRIORITY</span><br/><span class="small">&lt;&lt; FF &gt;&gt;</span></td>
    <td colspan="10"><span class="field-label">ADDRESSEE(S)</span><br/><span class="field-value">${d("addressees")}</span></td>
  </tr>

  <!-- Row: FILING TIME / ORIGINATOR -->
  <tr>
    <td colspan="3"><span class="field-label">DATE/TIME OF FILING</span><br/><span class="field-value">${d("date_of_filing")}</span></td>
    <td colspan="3"><span class="field-label">ORIGINATOR</span><br/><span class="field-value">${d("originator")}</span></td>
    <td colspan="6" class="no-border"></td>
  </tr>

  <!-- Row: SPECIFIC IDENTIFICATION -->
  <tr>
    <td colspan="12"><span class="field-label">SPECIFIC IDENTIFICATION OF ADDRESSEE(S) AND/OR ORIGINATOR</span><br/><span class="field-value">${d("specific_id") || ""}</span></td>
  </tr>

  <!-- Row 3: MESSAGE TYPE / AIRCRAFT ID / FLIGHT RULES / TYPE OF FLIGHT -->
  <tr class="grey-row">
    <td colspan="2"><span class="field-num">3.</span> <span class="field-label">MESSAGE TYPE</span></td>
    <td colspan="4"><span class="field-num">7.</span> <span class="field-label">AIRCRAFT IDENTIFICATION</span></td>
    <td colspan="3"><span class="field-num">8.</span> <span class="field-label">FLIGHT RULES</span></td>
    <td colspan="3"><span class="field-label">TYPE OF FLIGHT</span></td>
  </tr>
  <tr>
    <td colspan="2"><span class="field-value">&lt;&lt; ${d("message_type") || "FPL"} &gt;&gt;</span></td>
    <td colspan="4"><span class="field-value">${d("aircraft_id")}</span></td>
    <td colspan="3" class="center"><span class="field-value">${d("flight_rules")}</span></td>
    <td colspan="3" class="center"><span class="field-value">${d("type_of_flight")}</span></td>
  </tr>

  <!-- Row 9: NUMBER / TYPE OF AIRCRAFT / WAKE TURBULENCE / 10. EQUIPMENT -->
  <tr class="grey-row">
    <td colspan="1"><span class="field-num">9.</span> <span class="field-label">NUMBER</span></td>
    <td colspan="3"><span class="field-label">TYPE OF AIRCRAFT</span></td>
    <td colspan="2"><span class="field-label">WAKE TURBULENCE CATEGORY</span></td>
    <td colspan="6"><span class="field-num">10.</span> <span class="field-label">EQUIPMENT</span></td>
  </tr>
  <tr>
    <td colspan="1" class="center"><span class="field-value">${d("number_aircraft")}</span></td>
    <td colspan="3"><span class="field-value">${d("type_of_aircraft")}</span></td>
    <td colspan="2" class="center"><span class="field-value">${d("wake_turbulence")}</span></td>
    <td colspan="6"><span class="field-value">${d("equipment")}${d("surveillance") ? " / " + d("surveillance") : ""}</span></td>
  </tr>

  <!-- Row 13: DEPARTURE AERODROME / TIME -->
  <tr class="grey-row">
    <td colspan="6"><span class="field-num">13.</span> <span class="field-label">DEPARTURE AERODROME</span></td>
    <td colspan="6"><span class="field-label">TIME</span></td>
  </tr>
  <tr>
    <td colspan="6"><span class="field-value">${d("departure_aerodrome")}</span></td>
    <td colspan="6"><span class="field-value">${d("departure_time")}</span></td>
  </tr>

  <!-- Row 15: CRUISING SPEED / LEVEL / ROUTE -->
  <tr class="grey-row">
    <td colspan="2"><span class="field-num">15.</span> <span class="field-label">CRUISING SPEED</span></td>
    <td colspan="2"><span class="field-label">LEVEL</span></td>
    <td colspan="8"><span class="field-label">ROUTE</span></td>
  </tr>
  <tr>
    <td colspan="2"><span class="field-value">${d("cruising_speed")}</span></td>
    <td colspan="2"><span class="field-value">${d("level")}</span></td>
    <td colspan="8"><span class="field-value">${d("route")}</span></td>
  </tr>

  <!-- Extra route row if long -->
  ${d("route").length > 40 ? `<tr><td colspan="12" style="min-height:20px;"><span class="field-value" style="font-size:8px;">${d("route")}</span></td></tr>` : ""}

  <!-- Row 16: DESTINATION / TOTAL EET / ALTN / 2ND ALTN -->
  <tr class="grey-row">
    <td colspan="3"><span class="field-num">16.</span> <span class="field-label">DESTINATION AERODROME</span></td>
    <td colspan="3"><span class="field-label">TOTAL EET</span></td>
    <td colspan="3"><span class="field-label">ALTN AERODROME</span></td>
    <td colspan="3"><span class="field-label">2<sup>ND</sup> ALTN AERODROME</span></td>
  </tr>
  <tr>
    <td colspan="3"><span class="field-value">${d("destination_aerodrome")}</span></td>
    <td colspan="3"><span class="field-value">${d("total_eet")}</span></td>
    <td colspan="3"><span class="field-value">${d("altn_aerodrome")}</span></td>
    <td colspan="3"><span class="field-value">${d("altn_aerodrome_2")}</span></td>
  </tr>

  <!-- Row 18: OTHER INFORMATION -->
  <tr class="grey-row">
    <td colspan="12"><span class="field-num">18.</span> <span class="field-label">OTHER INFORMATION</span></td>
  </tr>
  <tr>
    <td colspan="12" style="min-height:28px;"><span class="field-value" style="font-size:8px;">${d("other_info")}</span></td>
  </tr>

  <!-- SUPPLEMENTARY INFORMATION header -->
  <tr class="grey-row">
    <td colspan="12" class="center" style="font-size:8px;font-weight:bold;padding:3px;">SUPPLEMENTARY INFORMATION (NOT TO BE TRANSMITTED IN FPL MESSAGES)</td>
  </tr>

  <!-- Row 19: ENDURANCE / PERSONS ON BOARD / EMERGENCY RADIO -->
  <tr class="grey-row">
    <td colspan="3"><span class="field-num">19.</span> <span class="field-label">ENDURANCE</span></td>
    <td colspan="3"><span class="field-label">PERSONS ON BOARD</span></td>
    <td colspan="6"><span class="field-label">EMERGENCY RADIO &nbsp;&nbsp; UHF &nbsp; VHF &nbsp; ELT</span></td>
  </tr>
  <tr>
    <td colspan="3"><span class="field-value">E/ ${d("endurance_hr")}:${d("endurance_min")}</span></td>
    <td colspan="3"><span class="field-value">P/ ${d("persons_on_board")}</span></td>
    <td colspan="2" class="center"><span class="box ${chk("emergency_radio_uhf") ? "check-mark" : ""}">${chk("emergency_radio_uhf")}</span> UHF</td>
    <td colspan="2" class="center"><span class="box ${chk("emergency_radio_vhf") ? "check-mark" : ""}">${chk("emergency_radio_vhf")}</span> VHF</td>
    <td colspan="2" class="center"><span class="box ${chk("emergency_radio_elt") ? "check-mark" : ""}">${chk("emergency_radio_elt")}</span> ELT</td>
  </tr>

  <!-- SURVIVAL EQUIPMENT / JACKETS -->
  <tr class="grey-row">
    <td colspan="6"><span class="field-label">SURVIVAL EQUIPMENT &nbsp; POLAR &nbsp; DESERT &nbsp; MARITIME &nbsp; JUNGLE</span></td>
    <td colspan="6"><span class="field-label">JACKETS &nbsp; LIGHT &nbsp; FLUORES &nbsp; UHF &nbsp; VHF</span></td>
  </tr>
  <tr>
    <td colspan="6">
      <span class="field-value">S/</span>
      <span class="box">${chk("survival_polar")}</span> P
      <span class="box">${chk("survival_desert")}</span> D
      <span class="box">${chk("survival_maritime")}</span> M
      <span class="box">${chk("survival_jungle")}</span> J
    </td>
    <td colspan="6">
      <span class="box">${chk("jackets_light")}</span> L
      <span class="box">${chk("jackets_fluores")}</span> F
      <span class="box">${chk("jackets_uhf")}</span> UHF
      <span class="box">${chk("jackets_vhf")}</span> VHF
    </td>
  </tr>

  <!-- DINGHIES -->
  <tr class="grey-row">
    <td colspan="2"><span class="field-label">DINGHIES NUMBER</span></td>
    <td colspan="2"><span class="field-label">CAPACITY</span></td>
    <td colspan="2"><span class="field-label">COVER</span></td>
    <td colspan="6"><span class="field-label">COLOUR</span></td>
  </tr>
  <tr>
    <td colspan="2"><span class="field-value">D/ ${d("dinghies_number")}</span></td>
    <td colspan="2"><span class="field-value">${d("dinghies_capacity")}</span></td>
    <td colspan="2" class="center"><span class="box">${chk("dinghies_cover")}</span></td>
    <td colspan="6"><span class="field-value">${d("dinghies_colour")}</span></td>
  </tr>

  <!-- AIRCRAFT COLOUR AND MARKINGS -->
  <tr class="grey-row">
    <td colspan="12"><span class="field-label">AIRCRAFT COLOUR AND MARKINGS</span></td>
  </tr>
  <tr>
    <td colspan="12"><span class="field-value">A/ ${d("aircraft_colour")}</span></td>
  </tr>

  <!-- REMARKS (field N/) -->
  <tr class="grey-row">
    <td colspan="12"><span class="field-label">REMARKS</span></td>
  </tr>
  <tr>
    <td colspan="12" style="min-height:20px;"><span class="field-value">N/ ${d("remarks")}</span></td>
  </tr>

  <!-- PILOT IN COMMAND -->
  <tr class="grey-row">
    <td colspan="12"><span class="field-label">PILOT-IN-COMMAND</span></td>
  </tr>
  <tr>
    <td colspan="12"><span class="field-value">C/ ${d("pilot_in_command")}</span></td>
  </tr>

  <!-- FILED BY -->
  <tr class="grey-row">
    <td colspan="6"><span class="field-label">FILED BY</span></td>
    <td colspan="6"></td>
  </tr>
  <tr>
    <td colspan="6"><span class="field-value">${d("filed_by")}</span></td>
    <td colspan="6"></td>
  </tr>

  <!-- CERTIFICATION -->
  <tr>
    <td colspan="12" style="padding:4px;">
      <div style="font-size:7px;text-align:center;margin-bottom:4px;"><b>CERTIFICATION</b></div>
      <div class="tiny" style="text-align:justify;">This is to certify that the above entries are true and correct and that, pilot-in-command of this aircraft, pledge not to fly over prohibited and restricted areas, will not willfully deviate from the filed flight plan, except when necessary in the interest of safety; will operate only in the Philippines Airspace and will not operate in any manner inimical to the security of the Republic of the Philippines. That the flight route or commercial schedule by the route mentioned in this Flight Plan.</div>
    </td>
  </tr>

  <!-- Signature section -->
  <tr>
    <td colspan="6"><span class="field-label">PILOT-IN-COMMAND NAME</span><br/><span class="field-value">${d("pilot_name_signature")}</span></td>
    <td colspan="6"><span class="field-label">LICENSE NO. & EXPIRY DATE</span><br/><span class="field-value">${d("license_no")}</span></td>
  </tr>
  <tr>
    <td colspan="6"><span class="box"></span> <span class="tiny">PILOT/OWNER</span> &nbsp;&nbsp; <span class="box"></span> <span class="tiny">DULY AUTHORIZED REPRESENTATIVE</span></td>
    <td colspan="6"></td>
  </tr>

  <!-- CAAP ACCEPTANCE -->
  <tr class="grey-row">
    <td colspan="12" class="center bold" style="font-size:9px;padding:3px;">CAAP ACCEPTANCE</td>
  </tr>
  <tr>
    <td colspan="4"><span class="field-label">Received by:</span></td>
    <td colspan="4"><span class="field-label">Date/Time Filed</span></td>
    <td colspan="4"><span class="field-label">Facility/Airport</span></td>
  </tr>
  <tr>
    <td colspan="4" style="min-height:18px;"></td>
    <td colspan="4" style="min-height:18px;"></td>
    <td colspan="4" style="min-height:18px;"></td>
  </tr>

  <!-- Footer -->
  <tr>
    <td colspan="12" class="center tiny no-border" style="padding-top:4px;">(PLEASE SEE BACK PAGE FOR GUIDANCE AND INSTRUCTION)</td>
  </tr>
</table>

</body></html>`;
}


/** CAAP Flight Manifest Form (ATS-FLTMN-FL TMANIFEST) — pixel-perfect table replica */
function generatePassengerManifestHtml(data: Record<string, unknown>): string {
  const d = (key: string) => escapeHtml(String(data[key] || ""));

  // Build passenger rows (up to 25)
  let passengerRows = "";
  for (let i = 1; i <= 25; i++) {
    const name = d(`passenger_${i}_name`) || d(`pax_${i}`) || d(`passenger${i}`) || "";
    const nationality = d(`passenger_${i}_nationality`) || d(`nationality_${i}`) || d(`nat${i}`) || "";
    passengerRows += `<tr><td class="row-num">${i}.</td><td class="pax-name">${name}</td><td class="pax-nat">${nationality}</td></tr>\n`;
  }

  const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
@page { size: A4 portrait; margin: 10mm; }
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Times New Roman', Times, serif; font-size: 10px; color: #000; padding: 0; }

.page { width: 100%; max-width: 210mm; margin: 0 auto; }

/* Header */
.form-header { text-align: left; font-size: 8px; margin-bottom: 2px; }
.header-block { display: flex; align-items: center; justify-content: center; margin-bottom: 6px; }
.header-block .logo { width: 45px; height: 45px; margin-right: 10px; }
.header-text { text-align: center; width: 100%; }
.header-text .republic { font-size: 9px; font-style: italic; }
.header-text .caap { font-size: 11px; font-weight: bold; font-variant: small-caps; letter-spacing: 0.5px; }
.form-title { text-align: center; font-size: 12px; font-weight: bold; margin: 6px 0 8px 0; border-bottom: 2px solid #000; padding-bottom: 4px; }

/* Info table */
.info-table { width: 100%; border-collapse: collapse; margin-bottom: 4px; }
.info-table td { border: 1px solid #000; padding: 2px 4px; vertical-align: top; }
.info-table .lbl { font-size: 8px; font-weight: bold; }
.info-table .val { font-size: 11px; font-weight: normal; min-height: 16px; }

/* Passenger table */
.pax-table { width: 100%; border-collapse: collapse; margin-bottom: 6px; }
.pax-table th { border: 1px solid #000; padding: 3px 4px; font-size: 8.5px; font-weight: bold; text-align: left; background: #f8f8f8; }
.pax-table td { border: 1px solid #000; padding: 1.5px 4px; font-size: 10px; height: 16px; }
.pax-table .row-num { width: 24px; text-align: center; font-size: 9px; }
.pax-table .pax-name { width: auto; }
.pax-table .pax-nat { width: 90px; text-align: center; }

/* Declaration */
.declaration { font-size: 8.5px; line-height: 1.4; margin: 8px 0; text-align: justify; }

/* Signature section */
.sig-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
.sig-table td { padding: 2px 4px; vertical-align: bottom; border: none; }
.sig-name { font-size: 11px; font-weight: bold; text-align: center; border-bottom: 1px solid #000; padding-bottom: 2px; min-height: 20px; }
.sig-label { font-size: 8px; text-align: center; padding-top: 2px; font-style: italic; }
.sig-license { font-size: 10px; text-align: center; border-bottom: 1px solid #000; padding-bottom: 2px; min-height: 20px; }

/* Footer */
.footer { font-size: 7px; text-align: center; margin-top: 6px; color: #555; }
</style></head><body>
<div class="page">

<!-- Form ID -->
<div class="form-header">CAAP Form ATS 2025-01</div>

<!-- Logo + Agency Header -->
<div style="text-align:center;margin-bottom:4px;">
  <table style="margin:0 auto;border:none;"><tr style="border:none;">
    <td style="border:none;vertical-align:middle;padding-right:8px;">
      <div style="width:40px;height:40px;border:2px solid #000;border-radius:50%;text-align:center;line-height:38px;font-size:7px;font-weight:bold;">CAA</div>
    </td>
    <td style="border:none;vertical-align:middle;text-align:left;">
      <div style="font-size:9px;font-style:italic;">Republic of the Philippines</div>
      <div style="font-size:11px;font-weight:bold;font-variant:small-caps;letter-spacing:0.5px;">CIVIL AVIATION AUTHORITY OF THE PHILIPPINES</div>
    </td>
  </tr></table>
</div>

<!-- Form Title -->
<div class="form-title">Flight Manifest Form</div>

<!-- Aircraft Info Section -->
<table class="info-table">
  <tr>
    <td style="width:33%;"><span class="lbl">AIRCRAFT IDENTIFICATION:</span><br/><span class="val">${d("aircraft_id") || d("aircraft_identification")}</span></td>
    <td style="width:33%;"><span class="lbl">TYPE OF AIRCRAFT:</span><br/><span class="val">${d("type_of_aircraft") || d("aircraft_type")}</span></td>
    <td style="width:34%;"><span class="lbl">DATE OF FLIGHT:</span><br/><span class="val">${d("date_of_flight") || d("flight_date") || ""}</span></td>
  </tr>
  <tr>
    <td><span class="lbl">HOME BASE/HANGAR</span><br/><span class="val">${d("home_base") || d("base_hangar")}</span></td>
    <td><span class="lbl">OWNER AND PHONE NUMBER:</span><br/><span class="val">${d("owner_phone") || d("owner_name")}</span></td>
    <td><span class="lbl">EXPIRY DATE TO OPERATE (COA):</span><br/><span class="val">${d("coa_expiry") || d("expiry_date")}</span></td>
  </tr>
  <tr>
    <td><span class="lbl">TYPE OF CARGO:</span><br/><span class="val">${d("type_of_cargo") || "N/A"}</span></td>
    <td><span class="lbl">QUALITY OF CARGO:</span><br/><span class="val">${d("quality_of_cargo") || "N/A"}</span></td>
    <td><span class="lbl">TOTAL WEIGHT OF CARGO:</span><br/><span class="val">${d("total_weight_cargo") || "N/A"}</span></td>
  </tr>
</table>

<!-- Passenger List -->
<table class="pax-table">
  <tr>
    <th colspan="2">NAME OF PASSENGER/CREW (If Foreigner, Indicate NATIONALITY)</th>
    <th>NATIONALITY</th>
  </tr>
  ${passengerRows}
</table>

<!-- Declaration -->
<div class="declaration">
  I declare that all statements and particulars contained in this General Declaration, and in any supplementary forms required to be presented with this General Declaration are complete, exact and true to the best of my knowledge and that all through passengers will continue/have continued on the flight.
</div>

<!-- Signature Section -->
<table class="sig-table">
  <tr>
    <td style="width:50%;">
      <div class="sig-name">${d("pilot_name") || d("pilot_in_command") || ""}</div>
      <div class="sig-label">Pilot's Name and Signature</div>
    </td>
    <td style="width:50%;">
      <div class="sig-license">${d("license_no") || d("pilot_license") || ""}</div>
      <div class="sig-label">Pilot's License No./Rating/Expiry Date</div>
    </td>
  </tr>
</table>

<!-- Footer -->
<div class="footer">CAAP-ATS-FLTNG-FL TMANIFEST v1 r0<br/>${today}<br/>Page 1</div>

</div>
</body></html>`;
}


/** PNP Plaridel Airport Checklist (Arrival / Pre-Flight) */
function generatePnpChecklistHtml(title: string, data: Record<string, unknown>): string {
  const q1 = data["q1"] === "COMPLIED" ? "✓" : "";
  const q2 = data["q2"] === "COMPLIED" ? "✓" : "";
  const q3 = data["q3"] === "COMPLIED" ? "✓" : "";
  const q4 = data["q4"] === "COMPLIED" ? "✓" : "";
  const q5 = data["q5"] === "COMPLIED" ? "✓" : "";
  const q6 = data["q6"] === "COMPLIED" ? "✓" : "";
  const q7 = data["q7"] === "COMPLIED" ? "✓" : "";
  const q8 = data["q8"] === "COMPLIED" ? "✓" : "";
  const q9 = data["q9"] === "COMPLIED" ? "✓" : "";
  const q1r = escapeHtml(String(data["q1r"] || ""));
  const q2r = escapeHtml(String(data["q2r"] || ""));
  const q3r = escapeHtml(String(data["q3r"] || ""));
  const q4r = escapeHtml(String(data["q4r"] || ""));
  const q5r = escapeHtml(String(data["q5r"] || ""));
  const q6r = escapeHtml(String(data["q6r"] || ""));
  const q7r = escapeHtml(String(data["q7r"] || ""));
  const q8r = escapeHtml(String(data["q8r"] || ""));
  const q9r = escapeHtml(String(data["q9r"] || ""));
  const acId = escapeHtml(String(data["ac_id"] || ""));
  const dateTime = escapeHtml(String(data["date_time"] || ""));
  const acType = escapeHtml(String(data["ac_type"] || ""));
  const itinerary = escapeHtml(String(data["itinerary"] || ""));
  const pax = escapeHtml(String(data["pax"] || ""));
  const pilot = data["pilot"] || "";
  const duty = data["duty"] || "";

  const isArrival = title.toLowerCase().includes("arrival");
  const formTitle = isArrival ? "ARRIVAL FLIGHT INSPECTION CHECKLIST" : "PRE - FLIGHT INSPECTION CHECKLIST";

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
@page{size:A4 portrait;margin:10mm;}
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:"Times New Roman",Times,serif;font-size:9.5px;padding:12px 18px;color:#000;line-height:1.2;}

/* HEADER */
.hdr{width:100%;display:table;margin-bottom:6px;}
.hdr-logo{display:table-cell;width:60px;vertical-align:middle;text-align:center;}
.hdr-logo img{width:50px;height:50px;}
.hdr-center{display:table-cell;text-align:center;vertical-align:middle;padding:0 6px;}
.hdr-center p{margin:0;padding:0;}
.h-rp{font-size:10px;}
.h-npc{font-size:10px;font-weight:bold;}
.h-pnp{font-size:9px;font-weight:bold;}
.h-asu{font-size:11px;font-weight:bold;}
.h-paps{font-size:11px;font-weight:bold;}
.h-addr{font-size:8.5px;font-style:italic;}
.h-title{font-size:10.5px;font-weight:bold;margin-top:8px;margin-bottom:10px;}

/* TABLES */
table{width:100%;border-collapse:collapse;margin-bottom:4px;}
th,td{border:1px solid #000;padding:2px 4px;vertical-align:top;font-size:9px;text-align:left;}
th{font-weight:bold;text-align:center;font-size:9px;}
.col-c{width:52px;text-align:center;font-weight:bold;font-size:12px;}
.col-r{width:82px;}
.col-d{line-height:1.3;}

/* FLIGHT DETAILS */
.fd{margin-top:6px;font-size:9.5px;}
.fd-row{display:flex;align-items:flex-end;margin-bottom:4px;}
.fd-label{min-width:155px;font-size:9.5px;}
.fd-val{flex:1;border-bottom:1px solid #000;min-height:14px;padding-left:4px;font-size:9.5px;}
.fd-row-tall{margin-bottom:18px;}
</style></head><body>

<div class="hdr">
<div class="hdr-logo"><img src="" alt="PNP"/></div>
<div class="hdr-center">
<p class="h-rp">Republic of the Philippines</p>
<p class="h-npc">NATIONAL POLICE COMMISSION</p>
<p class="h-pnp">PHILIPPINE NATIONAL POLICE, AVIATION SECURITY GROUP</p>
<p class="h-asu">AVIATION SECURITY UNIT 3</p>
<p class="h-paps">PLARIDEL AIRPORT POLICE STATION</p>
<p class="h-addr">Plaridel Airport, Brgy. Lumang Bayan, Plaridel, Bulacan</p>
</div>
<div class="hdr-logo"><img src="" alt="NAPOLCOM"/></div>
</div>
<p class="h-title">${formTitle}</p>
</div>

<!-- AIRCRAFT SECTION -->
<table>
<tr><th class="col-c">COMPLIED</th><th class="col-d">AIRCRAFT</th><th class="col-r">REMARKS</th></tr>
<tr><td class="col-c">${q1}</td><td class="col-d">1. Visually inspected the interiors of the aircraft for any alterations out of the ordinary.</td><td class="col-r">${q1r}</td></tr>
<tr><td class="col-c">${q2}</td><td class="col-d">2. Check for the presence of hazardous/dangerous and prohibited items. (firearms, chemicals, illegal drugs)</td><td class="col-r">${q2r}</td></tr>
<tr><td class="col-c">${q3}</td><td class="col-d">3. Check the cargo bay and make sure that the baggage's are not yet loaded to the aircraft before inspection.<br>(Note: Coordinate with concerned agencies for international flights)</td><td class="col-r">${q3r}</td></tr>
</table>

<!-- BAGGAGE/LUGGAGE/CARGO SECTION -->
<table>
<tr><th class="col-c">COMPLIED</th><th class="col-d">BAGGAGE/LUGGAGE/CARGO</th><th class="col-r">REMARKS</th></tr>
<tr><td class="col-c">${q4}</td><td class="col-d">4. Monitor the conduct of disembarkation of luggage, baggage and cargo from the aircraft.</td><td class="col-r">${q4r}</td></tr>
<tr><td class="col-c">${q5}</td><td class="col-d">5. Immediately isolate suspected baggage/cargo for manual inspection by GA/AW operator in the presence of the owner.<br>(Note: Refers to the OTS Updated list of SRIs)</td><td class="col-r">${q5r}</td></tr>
<tr><td class="col-c">${q6}</td><td class="col-d">6. Take appropriate action on the discrepancies on the documents and intercepted SRI/s.<br>(Note: Coordinate with concerned agencies for international flights)</td><td class="col-r">${q6r}</td></tr>
</table>

<!-- PILOT'S, CREW & PASSENGERS SECTION -->
<table>
<tr><th class="col-c">COMPLIED</th><th class="col-d">PILOT'S, CREW &amp;PASSENGERS</th><th class="col-r">REMARKS</th></tr>
<tr><td class="col-c">${q7}</td><td class="col-d">${isArrival ? "1" : "7"}. Positive identification shall be conducted on pilot/s, crew/s and passengers during boarding with the flight manifest as basis.</td><td class="col-r">${q7r}</td></tr>
<tr><td class="col-c">${q8}</td><td class="col-d">${isArrival ? "2" : "8"}. Profiling of pilot/s, crew/s and passengers.</td><td class="col-r">${q8r}</td></tr>
<tr><td class="col-c">${q9}</td><td class="col-d">${isArrival ? "3" : "9"}. Take appropriate action on the discrepancies on the documents and intercepted SRI/s.<br>(Note: Coordinate with concerned agencies for international flights)</td><td class="col-r">${q9r}</td></tr>
</table>

<!-- FLIGHT DETAILS -->
<div class="fd">
<div class="fd-row"><span class="fd-label">Aircraft Identification:</span><span class="fd-val">${acId}</span></div>
<div class="fd-row"><span class="fd-label">Date/Time:</span><span class="fd-val">${dateTime}</span></div>
<div class="fd-row"><span class="fd-label">Type of aircraft:</span><span class="fd-val">${acType}</span></div>
<div class="fd-row"><span class="fd-label">Itinerary:</span><span class="fd-val">${itinerary}</span></div>
<div class="fd-row fd-row-tall"><span class="fd-label">Name of Passengers &amp; Nationality:</span><span class="fd-val">${pax}</span></div>
<div class="fd-row"><span class="fd-label">Name of Pilot &amp; Nationality:</span><span class="fd-val">${pilot}</span></div>
<div class="fd-row"><span class="fd-label">Duty Ramp/Gen Av:</span><span class="fd-val">${duty}</span></div>
</div>

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
