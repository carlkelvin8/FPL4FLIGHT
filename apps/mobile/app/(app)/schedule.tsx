import { useState, useCallback, useRef, useEffect } from "react";
import {
  View, Text, TextInput, FlatList, StyleSheet, RefreshControl, Alert,
  TouchableOpacity, Modal, ScrollView, Animated, ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { colors, spacing, borderRadius, fontSize, shadows } from "@shared/theme";

import { flightRepository, type FlightData, type CreateFlightDto } from "@features/flights/repositories/FlightRepository";
import { formatDateStr, getTodayStr, getTomorrowStr, getCalendarDays, MONTH_NAMES, getFlag } from "@shared/utils";
import { FlightCard as FlightCardComponent } from "@features/flights/components/FlightCard";
const FlightCard = FlightCardComponent as any;
import { type FlightSchedule, type FlightStatus, STATUS_CONFIG } from "@features/flights/types";

interface FlightFormData {
  flightNumber: string;
  depCode: string;
  depCity: string;
  depCountry: string;
  depTime: string;
  arrCode: string;
  arrCity: string;
  arrCountry: string;
  arrTime: string;
  date: string;
  aircraft: string;
  gate: string;
  pilotInCommand: string;
  remarks: string;
}

const EMPTY_FORM: FlightFormData = {
  flightNumber: "",
  depCode: "",
  depCity: "",
  depCountry: "",
  depTime: "",
  arrCode: "",
  arrCity: "",
  arrCountry: "",
  arrTime: "",
  date: "",
  aircraft: "",
  gate: "",
  pilotInCommand: "",
  remarks: "",
};

const COUNTRIES = [
  { code: "PH", name: "Philippines" },
  { code: "JP", name: "Japan" },
  { code: "KR", name: "South Korea" },
  { code: "SG", name: "Singapore" },
  { code: "HK", name: "Hong Kong" },
  { code: "CN", name: "China" },
  { code: "TW", name: "Taiwan" },
  { code: "TH", name: "Thailand" },
  { code: "VN", name: "Vietnam" },
  { code: "MY", name: "Malaysia" },
  { code: "ID", name: "Indonesia" },
  { code: "AU", name: "Australia" },
  { code: "NZ", name: "New Zealand" },
  { code: "IN", name: "India" },
  { code: "AE", name: "UAE" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "QA", name: "Qatar" },
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "GB", name: "United Kingdom" },
  { code: "FR", name: "France" },
  { code: "DE", name: "Germany" },
  { code: "IT", name: "Italy" },
  { code: "ES", name: "Spain" },
  { code: "NL", name: "Netherlands" },
  { code: "TR", name: "Turkey" },
  { code: "RU", name: "Russia" },
  { code: "BR", name: "Brazil" },
  { code: "MX", name: "Mexico" },
  { code: "KW", name: "Kuwait" },
  { code: "BH", name: "Bahrain" },
  { code: "OM", name: "Oman" },
];

export default function ScheduleScreen() {
  const insets = useSafeAreaInsets();
  const [flights, setFlights] = useState<FlightSchedule[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const successScale = useRef(new Animated.Value(0)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const loadFlights = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const result = await flightRepository.findAll();
      if (!mountedRef.current) return;
      if (result.success) {
        setFlights(result.data.map((f) => ({
          id: f.id,
          flightNumber: f.flightNumber,
          departure: f.departure,
          arrival: f.arrival,
          date: f.date,
          aircraft: f.aircraft,
          status: (f.status || "scheduled") as FlightStatus,
          gate: f.gate,
          pilotInCommand: f.pilotInCommand,
          remarks: f.remarks,
        })));
      } else {
        if (mountedRef.current) setLoadError(result.error.message);
      }
    } catch {
      if (mountedRef.current) setLoadError("Failed to load flights.");
    }
    if (mountedRef.current) setIsLoading(false);
  }, []);

  useEffect(() => { loadFlights(); }, [loadFlights]);

  function playSuccessAnimation() {
    setShowSuccess(true);
    successScale.setValue(0);
    successOpacity.setValue(1);
    Animated.sequence([
      Animated.spring(successScale, { toValue: 1, friction: 4, tension: 80, useNativeDriver: true }),
      Animated.delay(800),
      Animated.timing(successOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setShowSuccess(false));
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await loadFlights();
    if (mountedRef.current) setRefreshing(false);
  }, [loadFlights]);

  async function handleAddFlight(data: FlightFormData) {
    try {
      const result = await flightRepository.create(data);
      if (!result.success) {
        Alert.alert("Error", result.error.message);
        return;
      }
      await loadFlights();
      setShowForm(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      playSuccessAnimation();
    } catch {
      Alert.alert("Error", "Failed to add flight.");
    }
  }

  function handleFlightPress(flight: FlightSchedule) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const status = STATUS_CONFIG[flight.status];
    Alert.alert(
      flight.flightNumber,
      `${getFlag(flight.departure.country)} ${flight.departure.code} → ${getFlag(flight.arrival.country)} ${flight.arrival.code}\n\nAircraft: ${flight.aircraft}\nDate: ${flight.date}\nDeparture: ${flight.departure.time}\nArrival: ${flight.arrival.time}\nStatus: ${status.label}${flight.gate ? `\nGate: ${flight.gate}` : ""}${flight.pilotInCommand ? `\nPIC: ${flight.pilotInCommand}` : ""}${flight.remarks ? `\nRemarks: ${flight.remarks}` : ""}`,
    );
  }

  function handleDeleteFlight(id: string) {
    Alert.alert("Delete Flight", "Remove this flight from the schedule?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        try {
          const result = await flightRepository.delete(id);
          if (!result.success) {
            Alert.alert("Error", result.error.message);
          } else {
            setFlights((prev) => prev.filter((f) => f.id !== id));
          }
        } catch {
          Alert.alert("Error", "Failed to delete flight.");
        }
      }},
    ]);
  }

  const todayStr = getTodayStr();
  const tomorrowStr = getTomorrowStr();
  const todayFlights = flights.filter((f) => f.date === todayStr);
  const tomorrowFlights = flights.filter((f) => f.date === tomorrowStr);
  const otherFlights = flights.filter((f) => f.date !== todayStr && f.date !== tomorrowStr);

  const sections = [
    { title: "TODAY", data: todayFlights },
    { title: "TOMORROW", data: tomorrowFlights },
    { title: "UPCOMING", data: otherFlights },
  ].filter((s) => s.data.length > 0);

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Flights</Text>
        </View>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.brand[600]} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Flights</Text>
          <Text style={styles.count}>{flights.length} scheduled</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowForm(true); }} accessibilityLabel="Add flight">
          <Ionicons name="add" size={22} color={colors.white} />
        </TouchableOpacity>
      </View>

      {loadError && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={16} color={colors.red[600]} />
          <Text style={styles.errorText}>{loadError}</Text>
        </View>
      )}

      {sections.length === 0 && !isLoading ? (
        <View style={styles.centerContent}>
          <Text style={styles.emptyText}>No flights scheduled</Text>
          <Text style={styles.emptySubText}>Tap + to add a flight</Text>
        </View>
      ) : (
        <FlatList
          data={sections.flatMap((s) => s.data)}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <FlightCard flight={item} onPress={handleFlightPress} onDelete={handleDeleteFlight} />}
          contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand[500]} colors={[colors.brand[500]]} />}
          ListHeaderComponent={
            <>
              {sections.map((sec) => (
                <Text key={sec.title} style={styles.sectionLabel}>{sec.title}</Text>
              ))}
            </>
          }
        />
      )}

      {/* New Flight Form Modal */}
      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet">
        <FlightForm onSave={handleAddFlight} onCancel={() => setShowForm(false)} />
      </Modal>

      {/* Success overlay */}
      {showSuccess && (
        <Animated.View style={[styles.successOverlay, { opacity: successOpacity }]}>
          <Animated.View style={[styles.successCircle, { transform: [{ scale: successScale }] }]}>
            <Ionicons name="checkmark" size={44} color={colors.white} />
          </Animated.View>
          <Animated.Text style={[styles.successText, { opacity: successOpacity, transform: [{ scale: successScale }] }]}>
            Flight Scheduled!
          </Animated.Text>
        </Animated.View>
      )}
    </View>
  );
}


function FlightForm({ onSave, onCancel }: { onSave: (data: FlightFormData) => void; onCancel: () => void }) {
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState<FlightFormData>(EMPTY_FORM);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [timePickerField, setTimePickerField] = useState<"depTime" | "arrTime">("depTime");
  const [pickerHour, setPickerHour] = useState(6);
  const [pickerMinute, setPickerMinute] = useState(0);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countryPickerField, setCountryPickerField] = useState<"depCountry" | "arrCountry">("depCountry");
  const [countrySearch, setCountrySearch] = useState("");

  function update(key: keyof FlightFormData, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function selectDate(d: Date) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    update("date", formatDateStr(d));
    setShowCalendar(false);
  }

  function openTimePicker(field: "depTime" | "arrTime") {
    setTimePickerField(field);
    const current = form[field];
    if (current) {
      const [h, m] = current.split(":").map(Number);
      setPickerHour(h || 0);
      setPickerMinute(m || 0);
    } else {
      setPickerHour(6);
      setPickerMinute(0);
    }
    setShowTimePicker(true);
  }

  function confirmTime() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const timeStr = `${String(pickerHour).padStart(2, "0")}:${String(pickerMinute).padStart(2, "0")}`;
    update(timePickerField, timeStr);
    setShowTimePicker(false);
  }

  const monthNames = MONTH_NAMES;

  function handleSave() {
    if (!form.flightNumber.trim()) { Alert.alert("Required", "Flight number is required."); return; }
    if (!form.depCode.trim()) { Alert.alert("Required", "Departure airport code is required."); return; }
    if (!form.arrCode.trim()) { Alert.alert("Required", "Arrival airport code is required."); return; }
    if (!form.depTime.trim()) { Alert.alert("Required", "Departure time is required."); return; }
    if (!form.arrTime.trim()) { Alert.alert("Required", "Arrival time is required."); return; }
    onSave(form);
  }

  return (
    <View style={[formStyles.container, { paddingTop: insets.top }]}>
      <View style={formStyles.header}>
        <TouchableOpacity onPress={onCancel}>
          <Text style={formStyles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={formStyles.headerTitle}>New Flight</Text>
        <TouchableOpacity onPress={handleSave} style={formStyles.saveBtn}>
          <Text style={formStyles.saveBtnText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Flight Info */}
        <View style={formStyles.card}>
          <Text style={formStyles.cardLabel}>FLIGHT INFO</Text>
          <FormInput label="Flight Number" value={form.flightNumber} onChangeText={(v) => update("flightNumber", v)} placeholder="e.g. PF-101" autoCapitalize="characters" icon="airplane-outline" />

          <View style={formStyles.inputGroup}>
            <Text style={formStyles.inputLabel}>Date</Text>
            <TouchableOpacity style={formStyles.pickerBtn} onPress={() => setShowCalendar(true)}>
              <Ionicons name="calendar-outline" size={18} color={colors.brand[600]} />
              <Text style={form.date ? formStyles.pickerValue : formStyles.pickerPlaceholder}>
                {form.date || "Select date"}
              </Text>
              <Ionicons name="chevron-down" size={16} color={colors.runway[400]} />
            </TouchableOpacity>
          </View>

          <View style={formStyles.row}>
            <View style={{ flex: 1 }}>
              <FormInput label="Aircraft" value={form.aircraft} onChangeText={(v) => update("aircraft", v)} placeholder="e.g. A320neo" autoCapitalize="characters" icon="hardware-chip-outline" />
            </View>
            <View style={{ flex: 0.6 }}>
              <FormInput label="Gate" value={form.gate} onChangeText={(v) => update("gate", v)} placeholder="e.g. A12" autoCapitalize="characters" icon="navigate-outline" />
            </View>
          </View>
        </View>

        {/* Departure */}
        <View style={formStyles.card}>
          <Text style={formStyles.cardLabel}>DEPARTURE</Text>
          <View style={formStyles.row}>
            <View style={{ flex: 1 }}>
              <FormInput label="Airport Code" value={form.depCode} onChangeText={(v) => update("depCode", v)} placeholder="MNL" autoCapitalize="characters" icon="location-outline" />
            </View>
            <View style={{ flex: 0.5 }}>
              <View style={formStyles.inputGroup}>
                <Text style={formStyles.inputLabel}>Country</Text>
                <TouchableOpacity style={formStyles.pickerBtn} onPress={() => { setCountryPickerField("depCountry"); setCountrySearch(""); setShowCountryPicker(true); }}>
                  <Text style={{ fontSize: 18 }}>{form.depCountry ? getFlag(form.depCountry) : "🏳️"}</Text>
                  <Text style={form.depCountry ? formStyles.pickerValue : formStyles.pickerPlaceholder}>{form.depCountry || "Select"}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          <FormInput label="City" value={form.depCity} onChangeText={(v) => update("depCity", v)} placeholder="e.g. Manila" icon="business-outline" />

          <View style={formStyles.inputGroup}>
            <Text style={formStyles.inputLabel}>Departure Time</Text>
            <TouchableOpacity style={formStyles.pickerBtn} onPress={() => openTimePicker("depTime")}>
              <Ionicons name="time-outline" size={18} color={colors.brand[600]} />
              <Text style={form.depTime ? formStyles.pickerValue : formStyles.pickerPlaceholder}>
                {form.depTime || "Select time"}
              </Text>
              <Ionicons name="chevron-down" size={16} color={colors.runway[400]} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Arrival */}
        <View style={formStyles.card}>
          <Text style={formStyles.cardLabel}>ARRIVAL</Text>
          <View style={formStyles.row}>
            <View style={{ flex: 1 }}>
              <FormInput label="Airport Code" value={form.arrCode} onChangeText={(v) => update("arrCode", v)} placeholder="NRT" autoCapitalize="characters" icon="location-outline" />
            </View>
            <View style={{ flex: 0.5 }}>
              <View style={formStyles.inputGroup}>
                <Text style={formStyles.inputLabel}>Country</Text>
                <TouchableOpacity style={formStyles.pickerBtn} onPress={() => { setCountryPickerField("arrCountry"); setCountrySearch(""); setShowCountryPicker(true); }}>
                  <Text style={{ fontSize: 18 }}>{form.arrCountry ? getFlag(form.arrCountry) : "🏳️"}</Text>
                  <Text style={form.arrCountry ? formStyles.pickerValue : formStyles.pickerPlaceholder}>{form.arrCountry || "Select"}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          <FormInput label="City" value={form.arrCity} onChangeText={(v) => update("arrCity", v)} placeholder="e.g. Tokyo Narita" icon="business-outline" />

          <View style={formStyles.inputGroup}>
            <Text style={formStyles.inputLabel}>Arrival Time</Text>
            <TouchableOpacity style={formStyles.pickerBtn} onPress={() => openTimePicker("arrTime")}>
              <Ionicons name="time-outline" size={18} color={colors.brand[600]} />
              <Text style={form.arrTime ? formStyles.pickerValue : formStyles.pickerPlaceholder}>
                {form.arrTime || "Select time"}
              </Text>
              <Ionicons name="chevron-down" size={16} color={colors.runway[400]} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Crew & Remarks */}
        <View style={formStyles.card}>
          <Text style={formStyles.cardLabel}>CREW & REMARKS</Text>
          <FormInput label="Pilot in Command" value={form.pilotInCommand} onChangeText={(v) => update("pilotInCommand", v)} placeholder="e.g. Capt. Santos" icon="person-outline" />
          <FormInput label="Remarks" value={form.remarks} onChangeText={(v) => update("remarks", v)} placeholder="Optional notes" multiline icon="chatbubble-outline" />
        </View>
      </ScrollView>

      {/* Calendar Modal */}
      <Modal visible={showCalendar} transparent animationType="fade">
        <TouchableOpacity style={formStyles.calendarOverlay} activeOpacity={1} onPress={() => setShowCalendar(false)}>
          <TouchableOpacity activeOpacity={1} style={formStyles.calendarModal}>
            {/* Month Navigation */}
            <View style={formStyles.calendarHeader}>
              <TouchableOpacity onPress={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}>
                <Ionicons name="chevron-back" size={22} color={colors.runway[700]} />
              </TouchableOpacity>
              <Text style={formStyles.calendarMonthText}>
                {monthNames[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}
              </Text>
              <TouchableOpacity onPress={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}>
                <Ionicons name="chevron-forward" size={22} color={colors.runway[700]} />
              </TouchableOpacity>
            </View>

            {/* Day headers */}
            <View style={formStyles.calendarWeekRow}>
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                <Text key={d} style={formStyles.calendarWeekDay}>{d}</Text>
              ))}
            </View>

            {/* Days grid */}
            <View style={formStyles.calendarGrid}>
              {getCalendarDays(calendarMonth).map((day, i) => {
                if (!day) return <View key={`empty-${i}`} style={formStyles.calendarDayEmpty} />;
                const dateStr = formatDateStr(day);
                const isSelected = form.date === dateStr;
                const isToday = formatDateStr(new Date()) === dateStr;
                return (
                  <TouchableOpacity
                    key={dateStr}
                    style={[formStyles.calendarDay, isSelected && formStyles.calendarDaySelected, isToday && !isSelected && formStyles.calendarDayToday]}
                    onPress={() => selectDate(day)}
                  >
                    <Text style={[formStyles.calendarDayText, isSelected && formStyles.calendarDayTextSelected, isToday && !isSelected && formStyles.calendarDayTextToday]}>
                      {day.getDate()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Time Picker Modal */}
      <Modal visible={showTimePicker} transparent animationType="fade">
        <TouchableOpacity style={formStyles.calendarOverlay} activeOpacity={1} onPress={() => setShowTimePicker(false)}>
          <TouchableOpacity activeOpacity={1} style={formStyles.timePickerModal}>
            <Text style={formStyles.timePickerTitle}>
              {timePickerField === "depTime" ? "Departure Time" : "Arrival Time"}
            </Text>

            <View style={formStyles.timePickerRow}>
              {/* Hours */}
              <View style={formStyles.timePickerColumn}>
                <TouchableOpacity onPress={() => setPickerHour((pickerHour + 1) % 24)} style={formStyles.timeArrow}>
                  <Ionicons name="chevron-up" size={24} color={colors.runway[600]} />
                </TouchableOpacity>
                <View style={formStyles.timeValueBox}>
                  <Text style={formStyles.timeValueText}>{String(pickerHour).padStart(2, "0")}</Text>
                </View>
                <TouchableOpacity onPress={() => setPickerHour((pickerHour - 1 + 24) % 24)} style={formStyles.timeArrow}>
                  <Ionicons name="chevron-down" size={24} color={colors.runway[600]} />
                </TouchableOpacity>
                <Text style={formStyles.timeUnitLabel}>Hour</Text>
              </View>

              <Text style={formStyles.timeColon}>:</Text>

              {/* Minutes */}
              <View style={formStyles.timePickerColumn}>
                <TouchableOpacity onPress={() => setPickerMinute((pickerMinute + 5) % 60)} style={formStyles.timeArrow}>
                  <Ionicons name="chevron-up" size={24} color={colors.runway[600]} />
                </TouchableOpacity>
                <View style={formStyles.timeValueBox}>
                  <Text style={formStyles.timeValueText}>{String(pickerMinute).padStart(2, "0")}</Text>
                </View>
                <TouchableOpacity onPress={() => setPickerMinute((pickerMinute - 5 + 60) % 60)} style={formStyles.timeArrow}>
                  <Ionicons name="chevron-down" size={24} color={colors.runway[600]} />
                </TouchableOpacity>
                <Text style={formStyles.timeUnitLabel}>Min</Text>
              </View>
            </View>

            <TouchableOpacity style={formStyles.timeConfirmBtn} onPress={confirmTime}>
              <Text style={formStyles.timeConfirmText}>Confirm</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Country Picker Modal */}
      <Modal visible={showCountryPicker} transparent animationType="slide">
        <TouchableOpacity style={formStyles.calendarOverlay} activeOpacity={1} onPress={() => setShowCountryPicker(false)}>
          <TouchableOpacity activeOpacity={1} style={formStyles.countryModal}>
            <View style={formStyles.countryModalHandle} />
            <Text style={formStyles.countryModalTitle}>Select Country</Text>
            <View style={formStyles.countrySearchBar}>
              <Ionicons name="search" size={16} color={colors.runway[400]} />
              <TextInput
                style={formStyles.countrySearchInput}
                placeholder="Search..."
                placeholderTextColor={colors.runway[300]}
                value={countrySearch}
                onChangeText={setCountrySearch}
                autoFocus
              />
            </View>
            <ScrollView style={formStyles.countryList} showsVerticalScrollIndicator={false}>
              {COUNTRIES.filter((c) => countrySearch ? c.name.toLowerCase().includes(countrySearch.toLowerCase()) || c.code.toLowerCase().includes(countrySearch.toLowerCase()) : true).map((c) => (
                <TouchableOpacity key={c.code} style={formStyles.countryRow} onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  update(countryPickerField, c.code);
                  setShowCountryPicker(false);
                }}>
                  <Text style={formStyles.countryFlag}>{getFlag(c.code)}</Text>
                  <Text style={formStyles.countryName}>{c.name}</Text>
                  <Text style={formStyles.countryCode}>{c.code}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

function FormInput({ label, value, onChangeText, placeholder, autoCapitalize, multiline, icon }: {
  label: string; value: string; onChangeText: (v: string) => void; placeholder: string;
  autoCapitalize?: "characters" | "none" | "sentences" | "words"; multiline?: boolean; icon?: IoniconsName;
}) {
  return (
    <View style={formStyles.inputGroup}>
      <Text style={formStyles.inputLabel}>{label}</Text>
      <View style={[formStyles.inputWrapper, multiline && { alignItems: "flex-start" }]}>
        {icon && <Ionicons name={icon} size={16} color={colors.runway[400]} style={{ marginTop: multiline ? 14 : 0 }} />}
        <TextInput
          style={[formStyles.textInput, multiline && { height: 80, textAlignVertical: "top" }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.runway[300]}
          autoCapitalize={autoCapitalize}
          multiline={multiline}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.runway[50] },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: colors.white, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.runway[200] },
  title: { fontSize: 26, fontWeight: "700", color: colors.runway[900], letterSpacing: -0.5 },
  count: { fontSize: fontSize.sm, color: colors.runway[400], marginTop: 2 },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.brand[600], alignItems: "center", justifyContent: "center", shadowColor: colors.brand[600], shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 4 },
  sectionLabel: { fontSize: fontSize.xs, fontWeight: "700", color: colors.runway[500], textTransform: "uppercase", letterSpacing: 0.6, paddingHorizontal: spacing.lg, marginBottom: spacing.sm, marginTop: spacing.md },
  flightCard: { marginHorizontal: spacing.lg, marginBottom: spacing.sm },
  flightHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md },
  flightNumber: { fontSize: fontSize.base, fontWeight: "700", color: colors.runway[900], letterSpacing: 0.5 },
  statusBadge: { paddingHorizontal: spacing.sm + 2, paddingVertical: 3, borderRadius: borderRadius.sm },
  statusText: { fontSize: fontSize.xs, fontWeight: "700" },
  routeRow: { flexDirection: "row", alignItems: "center", marginBottom: spacing.md },
  airport: { flex: 1, alignItems: "flex-start" },
  airportRight: { alignItems: "flex-end" },
  flag: { fontSize: 22, marginBottom: 4 },
  airportCode: { fontSize: fontSize.lg, fontWeight: "800", color: colors.runway[900], letterSpacing: 1 },
  airportCity: { fontSize: fontSize.xs, color: colors.runway[500], marginTop: 1 },
  time: { fontSize: fontSize.sm, fontWeight: "600", color: colors.brand[600], marginTop: 4 },
  flightLine: { flexDirection: "row", alignItems: "center", flex: 1.2, paddingHorizontal: spacing.xs },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.runway[300] },
  dashLine: { flex: 1, height: 1.5, backgroundColor: colors.runway[200], marginHorizontal: 2 },
  flightFooter: { flexDirection: "row", gap: spacing.md, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.runway[100] },
  footerChip: { flexDirection: "row", alignItems: "center", gap: 4 },
  footerText: { fontSize: fontSize.xs, color: colors.runway[500] },
  errorBanner: { flexDirection: "row", alignItems: "center", gap: spacing.sm, backgroundColor: colors.red[50], marginHorizontal: spacing.lg, marginBottom: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.red[100] },
  errorText: { fontSize: fontSize.sm, color: colors.red[700], flex: 1 },
  centerContent: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.xl },
  emptyText: { fontSize: fontSize.lg, fontWeight: "600", color: colors.runway[700], marginBottom: spacing.xs },
  emptySubText: { fontSize: fontSize.sm, color: colors.runway[400], textAlign: "center" },
  // Success
  successOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center", zIndex: 999 },
  successCircle: { width: 88, height: 88, borderRadius: 44, backgroundColor: colors.green[500], alignItems: "center", justifyContent: "center", shadowColor: colors.green[500], shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  successText: { fontSize: fontSize.lg, fontWeight: "700", color: colors.white, marginTop: spacing.md },
});

const formStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.runway[50] },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: colors.white, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.runway[200] },
  cancelText: { fontSize: fontSize.base, color: colors.runway[500], fontWeight: "500" },
  headerTitle: { fontSize: fontSize.lg, fontWeight: "700", color: colors.runway[900], letterSpacing: -0.3 },
  saveBtn: { backgroundColor: colors.brand[600], paddingHorizontal: 20, paddingVertical: 9, borderRadius: 20, shadowColor: colors.brand[600], shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 3 },
  saveBtnText: { fontSize: fontSize.sm, fontWeight: "700", color: colors.white },
  card: { backgroundColor: colors.white, marginHorizontal: spacing.md, marginTop: spacing.md, borderRadius: 16, padding: spacing.lg, shadowColor: colors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardLabel: { fontSize: 11, fontWeight: "800", color: colors.brand[600], letterSpacing: 1.2, marginBottom: spacing.lg },
  inputGroup: { marginBottom: spacing.md },
  inputLabel: { fontSize: fontSize.xs, fontWeight: "600", color: colors.runway[600], marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.3 },
  inputWrapper: { flexDirection: "row", alignItems: "center", backgroundColor: colors.runway[50], borderWidth: 1.5, borderColor: colors.runway[200], borderRadius: 12, paddingHorizontal: spacing.md, gap: spacing.sm },
  textInput: { flex: 1, fontSize: fontSize.base, color: colors.runway[900], paddingVertical: 14 },
  row: { flexDirection: "row", gap: spacing.sm },
  pickerBtn: { flexDirection: "row", alignItems: "center", backgroundColor: colors.runway[50], borderWidth: 1.5, borderColor: colors.runway[200], borderRadius: 12, paddingHorizontal: spacing.md, paddingVertical: 14, gap: spacing.sm },
  pickerValue: { flex: 1, fontSize: fontSize.base, fontWeight: "600", color: colors.runway[900] },
  pickerPlaceholder: { flex: 1, fontSize: fontSize.base, color: colors.runway[300] },
  // Country picker
  countryModal: { backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg, maxHeight: "70%", paddingBottom: spacing.xl },
  countryModalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.runway[300], alignSelf: "center", marginBottom: spacing.md },
  countryModalTitle: { fontSize: fontSize.lg, fontWeight: "700", color: colors.runway[900], textAlign: "center", marginBottom: spacing.md },
  countrySearchBar: { flexDirection: "row", alignItems: "center", backgroundColor: colors.runway[50], borderRadius: 10, paddingHorizontal: spacing.md, paddingVertical: 10, gap: spacing.sm, marginBottom: spacing.md },
  countrySearchInput: { flex: 1, fontSize: fontSize.base, color: colors.runway[900], padding: 0 },
  countryList: { maxHeight: 350 },
  countryRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.runway[100], gap: spacing.md },
  countryFlag: { fontSize: 24 },
  countryName: { flex: 1, fontSize: fontSize.base, color: colors.runway[900] },
  countryCode: { fontSize: fontSize.sm, fontWeight: "600", color: colors.runway[400] },
  // Calendar
  calendarOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: spacing.lg },
  calendarModal: { backgroundColor: colors.white, borderRadius: 20, padding: spacing.lg, width: "100%", maxWidth: 340 },
  calendarHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.md },
  calendarMonthText: { fontSize: fontSize.base, fontWeight: "700", color: colors.runway[900] },
  calendarWeekRow: { flexDirection: "row", marginBottom: spacing.sm },
  calendarWeekDay: { flex: 1, textAlign: "center", fontSize: fontSize.xs, fontWeight: "600", color: colors.runway[400] },
  calendarGrid: { flexDirection: "row", flexWrap: "wrap" },
  calendarDayEmpty: { width: "14.28%", height: 40 },
  calendarDay: { width: "14.28%", height: 40, alignItems: "center", justifyContent: "center", borderRadius: 20 },
  calendarDaySelected: { backgroundColor: colors.brand[600] },
  calendarDayToday: { backgroundColor: colors.brand[50] },
  calendarDayText: { fontSize: fontSize.sm, fontWeight: "500", color: colors.runway[800] },
  calendarDayTextSelected: { color: colors.white, fontWeight: "700" },
  calendarDayTextToday: { color: colors.brand[600], fontWeight: "700" },
  // Time Picker
  timePickerModal: { backgroundColor: colors.white, borderRadius: 20, padding: spacing.lg, width: "100%", maxWidth: 280, alignItems: "center" },
  timePickerTitle: { fontSize: fontSize.base, fontWeight: "700", color: colors.runway[900], marginBottom: spacing.lg },
  timePickerRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.lg },
  timePickerColumn: { alignItems: "center" },
  timeArrow: { padding: 8 },
  timeValueBox: { width: 64, height: 64, borderRadius: 14, backgroundColor: colors.runway[50], borderWidth: 1.5, borderColor: colors.runway[200], alignItems: "center", justifyContent: "center" },
  timeValueText: { fontSize: 28, fontWeight: "800", color: colors.runway[900] },
  timeColon: { fontSize: 28, fontWeight: "800", color: colors.runway[400], marginBottom: 20 },
  timeUnitLabel: { fontSize: fontSize.xs, color: colors.runway[400], marginTop: 4 },
  timeConfirmBtn: { backgroundColor: colors.brand[600], paddingHorizontal: spacing.xl, paddingVertical: 12, borderRadius: 12, width: "100%" , alignItems: "center" },
  timeConfirmText: { fontSize: fontSize.base, fontWeight: "700", color: colors.white },
});
