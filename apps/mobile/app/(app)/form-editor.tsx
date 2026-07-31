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
            originWhitelist={["*"]}
            source={{ html: generatePDFHtml(templateName, sections, formData) }}
            style={{ flex: 1 }}
            scalesPageToFit={false}
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

/** Generate PDF HTML — pixel-perfect replica of PNP Plaridel Airport checklist.
 * Uses the exact original document layout with data overlaid at precise positions.
 * The background is the blank form; we just fill in the values.
 */
function generatePDFHtml(title: string, sections: FormSection[], data: Record<string, unknown>): string {
  // Detect CAAP Flight Plan template
  if (title.toLowerCase().includes("caap") || title.toLowerCase().includes("flight plan")) {
    return generateCaapFlightPlanHtml(data);
  }
  // Default: PNP Checklist
  return generatePnpChecklistHtml(title, data);
}

/** CAAP Flight Plan ATS 2019-1 — 1:1 using real blank form as background */
function generateCaapFlightPlanHtml(data: Record<string, unknown>): string {
  const d = (key: string) => String(data[key] || "");
  const chk = (key: string) => data[key] === "Yes" ? "✗" : "";
  // Import embedded base64 image
  const { CAAP_BG } = require("@features/forms/caap-bg");
  const BG = CAAP_BG;

  // Field positions as % of page (top, left) — calibrated to the blank form
  const f = [
    { t: 10.2, l: 17, v: d("addressees"), s: 9 },
    { t: 13.5, l: 9, v: d("date_of_filing"), s: 10 },
    { t: 13.5, l: 27, v: d("originator"), s: 9 },
    { t: 18.5, l: 6, v: d("message_type") || "FPL", s: 9 },
    { t: 18.5, l: 30, v: d("aircraft_id"), s: 11 },
    { t: 18.5, l: 64, v: d("flight_rules"), s: 12 },
    { t: 18.5, l: 79, v: d("type_of_flight"), s: 12 },
    { t: 22.5, l: 9, v: d("number_aircraft"), s: 10 },
    { t: 22.5, l: 18, v: d("type_of_aircraft"), s: 11 },
    { t: 22.5, l: 37, v: d("wake_turbulence"), s: 12 },
    { t: 22.5, l: 63, v: `${d("equipment")} / ${d("surveillance")}`, s: 9 },
    { t: 26.5, l: 8, v: d("departure_aerodrome"), s: 11 },
    { t: 26.5, l: 38, v: d("departure_time"), s: 11 },
    { t: 30, l: 6, v: d("cruising_speed"), s: 10 },
    { t: 30, l: 22, v: d("level"), s: 10 },
    { t: 30, l: 38, v: d("route"), s: 8, w: 55 },
    { t: 37, l: 9, v: d("destination_aerodrome"), s: 11 },
    { t: 37, l: 30, v: d("total_eet"), s: 11 },
    { t: 37, l: 49, v: d("altn_aerodrome"), s: 11 },
    { t: 37, l: 72, v: d("altn_aerodrome_2"), s: 11 },
    { t: 41, l: 5, v: d("other_info"), s: 8, w: 90 },
    { t: 51.5, l: 8, v: `${d("endurance_hr")}${d("endurance_min")}`, s: 11 },
    { t: 51.5, l: 29, v: d("persons_on_board"), s: 11 },
    { t: 51.5, l: 62, v: chk("emergency_radio_uhf"), s: 12 },
    { t: 51.5, l: 72, v: chk("emergency_radio_vhf"), s: 12 },
    { t: 51.5, l: 82, v: chk("emergency_radio_elt"), s: 12 },
    { t: 55.5, l: 12, v: chk("survival_polar"), s: 12 },
    { t: 55.5, l: 23, v: chk("survival_desert"), s: 12 },
    { t: 55.5, l: 36, v: chk("survival_maritime"), s: 12 },
    { t: 55.5, l: 48, v: chk("survival_jungle"), s: 12 },
    { t: 55.5, l: 62, v: chk("jackets_light"), s: 12 },
    { t: 55.5, l: 72, v: chk("jackets_fluores"), s: 12 },
    { t: 55.5, l: 82, v: chk("jackets_uhf"), s: 12 },
    { t: 55.5, l: 90, v: chk("jackets_vhf"), s: 12 },
    { t: 60, l: 12, v: d("dinghies_number"), s: 10 },
    { t: 60, l: 24, v: d("dinghies_capacity"), s: 10 },
    { t: 60, l: 38, v: chk("dinghies_cover"), s: 12 },
    { t: 60, l: 52, v: d("dinghies_colour"), s: 9 },
    { t: 64, l: 7, v: d("aircraft_colour"), s: 10, w: 80 },
    { t: 68, l: 7, v: d("remarks"), s: 9, w: 80 },
    { t: 72, l: 7, v: d("pilot_in_command"), s: 10, w: 65 },
    { t: 76, l: 12, v: d("filed_by"), s: 9 },
    { t: 86, l: 5, v: d("pilot_name_signature"), s: 9 },
    { t: 86, l: 35, v: d("license_no"), s: 9 },
  ];

  const overlays = f.filter(x => x.v).map(x =>
    `<div style="position:absolute;top:${x.t}%;left:${x.l}%;font-size:${x.s}px;font-family:'Courier New',monospace;font-weight:bold;color:#000;${x.w ? `max-width:${x.w}%` : ""}">${x.v}</div>`
  ).join("\n");

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>*{margin:0;padding:0;box-sizing:border-box;}body{margin:0;padding:0;}.page{position:relative;width:100%;}.bg{width:100%;display:block;}.overlay{position:absolute;top:0;left:0;width:100%;height:100%;}</style>
</head><body><div class="page"><img class="bg" src="${BG}"/><div class="overlay">${overlays}</div></div></body></html>`;
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
  const q1r = data["q1r"] || "";
  const q2r = data["q2r"] || "";
  const q3r = data["q3r"] || "";
  const q4r = data["q4r"] || "";
  const q5r = data["q5r"] || "";
  const q6r = data["q6r"] || "";
  const q7r = data["q7r"] || "";
  const q8r = data["q8r"] || "";
  const q9r = data["q9r"] || "";
  const acId = data["ac_id"] || "";
  const dateTime = data["date_time"] || "";
  const acType = data["ac_type"] || "";
  const itinerary = data["itinerary"] || "";
  const pax = data["pax"] || "";
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
