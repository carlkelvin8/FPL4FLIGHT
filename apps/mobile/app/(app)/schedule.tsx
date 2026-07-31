import { useState, useCallback, useRef, useEffect } from "react";
import {
  View, Text, TextInput, FlatList, StyleSheet, RefreshControl, Alert,
  TouchableOpacity, Modal, ScrollView, Animated, ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { colors, spacing, borderRadius, fontSize, shadows, type ThemeColors } from "@shared/theme";

import { flightRepository, type FlightData, type CreateFlightDto } from "@features/flights/repositories/FlightRepository";
import { formatDateStr, getTodayStr, getTomorrowStr, getCalendarDays, MONTH_NAMES, getFlag } from "@shared/utils";
import { FlightCard as FlightCardComponent } from "@features/flights/components/FlightCard";
const FlightCard = FlightCardComponent as React.ComponentType<any>;
import { type FlightSchedule, type FlightStatus, STATUS_CONFIG } from "@features/flights/types";
import { useAppTheme } from "@shared/hooks/useAppTheme";

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
  const { colors: theme } = useAppTheme();
  const [flights, setFlights] = useState<FlightSchedule[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const successScale = useRef(new Animated.Value(0)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;
  const mountedRef = useRef(true);
  const styles = createStyles(theme);
  const formStyles = createFormStyles(theme);

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
      // Check if saved offline
      const { getIsOnline } = require("@core/sync-manager");
      if (!getIsOnline()) {
        Alert.alert("Saved as Draft", "Flight saved locally. It will sync automatically when you're back online.", [{ text: "OK" }]);
      }
      playSuccessAnimation();
    } catch {
      Alert.alert("Error", "Failed to add flight.");
    }
  }

  const [selectedFlight, setSelectedFlight] = useState<FlightSchedule | null>(null);

  function handleFlightPress(flight: FlightSchedule) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedFlight(flight);
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
        <FlightForm onSave={handleAddFlight} onCancel={() => setShowForm(false)} styles={formStyles} />
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

      {/* Flight Detail Modal */}
      <Modal visible={!!selectedFlight} transparent animationType="fade">
        <TouchableOpacity style={styles.detailOverlay} activeOpacity={1} onPress={() => setSelectedFlight(null)}>
          <TouchableOpacity activeOpacity={1} style={styles.detailModal}>
            {selectedFlight && (() => {
              const s = STATUS_CONFIG[selectedFlight.status];
              return (<>
                <View style={styles.detailHandle} />
                {/* Route Header */}
                <View style={styles.detailRouteRow}>
                  <View style={styles.detailAirport}>
                    <Text style={styles.detailFlag}>{getFlag(selectedFlight.departure.country)}</Text>
                    <Text style={styles.detailCode}>{selectedFlight.departure.code}</Text>
                    <Text style={styles.detailCity}>{selectedFlight.departure.city || "Departure"}</Text>
                    <Text style={styles.detailTime}>{selectedFlight.departure.time}</Text>
                  </View>
                  <View style={styles.detailLine}>
                    <View style={styles.detailDot} />
                    <View style={styles.detailDash} />
                    <Ionicons name="airplane" size={18} color={colors.brand[600]} />
                    <View style={styles.detailDash} />
                    <View style={styles.detailDot} />
                  </View>
                  <View style={[styles.detailAirport, { alignItems: "flex-end" }]}>
                    <Text style={styles.detailFlag}>{getFlag(selectedFlight.arrival.country)}</Text>
                    <Text style={styles.detailCode}>{selectedFlight.arrival.code}</Text>
                    <Text style={styles.detailCity}>{selectedFlight.arrival.city || "Arrival"}</Text>
                    <Text style={styles.detailTime}>{selectedFlight.arrival.time}</Text>
                  </View>
                </View>
                {/* Flight Number & Status */}
                <View style={styles.detailInfoRow}>
                  <Text style={styles.detailFlightNum}>{selectedFlight.flightNumber}</Text>
                  <View style={[styles.detailStatusBadge, { backgroundColor: s.bg }]}>
                    <View style={[styles.detailStatusDot, { backgroundColor: s.color }]} />
                    <Text style={[styles.detailStatusText, { color: s.color }]}>{s.label}</Text>
                  </View>
                </View>
                {/* Details Grid */}
                <View style={styles.detailGrid}>
                  <View style={styles.detailGridItem}><Ionicons name="calendar-outline" size={16} color={theme.textMuted} /><Text style={styles.detailGridLabel}>Date</Text><Text style={styles.detailGridValue}>{selectedFlight.date}</Text></View>
                  <View style={styles.detailGridItem}><Ionicons name="airplane-outline" size={16} color={theme.textMuted} /><Text style={styles.detailGridLabel}>Aircraft</Text><Text style={styles.detailGridValue}>{selectedFlight.aircraft || "—"}</Text></View>
                  {selectedFlight.gate && <View style={styles.detailGridItem}><Ionicons name="navigate-outline" size={16} color={theme.textMuted} /><Text style={styles.detailGridLabel}>Gate</Text><Text style={styles.detailGridValue}>{selectedFlight.gate}</Text></View>}
                  {selectedFlight.pilotInCommand && <View style={styles.detailGridItem}><Ionicons name="person-outline" size={16} color={theme.textMuted} /><Text style={styles.detailGridLabel}>PIC</Text><Text style={styles.detailGridValue}>{selectedFlight.pilotInCommand}</Text></View>}
                </View>
                {selectedFlight.remarks && <View style={styles.detailRemarks}><Text style={styles.detailRemarksLabel}>Remarks</Text><Text style={styles.detailRemarksText}>{selectedFlight.remarks}</Text></View>}
                {/* Actions */}
                <View style={styles.detailActions}>
                  <TouchableOpacity style={styles.detailDeleteBtn} onPress={() => { setSelectedFlight(null); handleDeleteFlight(selectedFlight.id); }}>
                    <Ionicons name="trash-outline" size={18} color={colors.red[500]} />
                    <Text style={styles.detailDeleteText}>Delete</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.detailCloseBtn} onPress={() => setSelectedFlight(null)}>
                    <Text style={styles.detailCloseText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </>);
            })()}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}


function FlightForm({ onSave, onCancel, styles }: { onSave: (data: FlightFormData) => void; onCancel: () => void; styles: ReturnType<typeof createFormStyles> }) {
  const insets = useSafeAreaInsets();
  const { colors: theme } = useAppTheme();
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
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Flight</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
          <Text style={styles.saveBtnText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Flight Info */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>FLIGHT INFO</Text>
          <FormInput label="Flight Number" value={form.flightNumber} onChangeText={(v) => update("flightNumber", v)} placeholder="e.g. PF-101" autoCapitalize="characters" icon="airplane-outline" styles={styles} />

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Date</Text>
            <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowCalendar(true)}>
              <Ionicons name="calendar-outline" size={18} color={colors.brand[600]} />
              <Text style={form.date ? styles.pickerValue : styles.pickerPlaceholder}>
                {form.date || "Select date"}
              </Text>
              <Ionicons name="chevron-down" size={16} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <FormInput label="Aircraft" value={form.aircraft} onChangeText={(v) => update("aircraft", v)} placeholder="e.g. A320neo" autoCapitalize="characters" icon="hardware-chip-outline" styles={styles} />
            </View>
            <View style={{ flex: 0.6 }}>
              <FormInput label="Gate" value={form.gate} onChangeText={(v) => update("gate", v)} placeholder="e.g. A12" autoCapitalize="characters" icon="navigate-outline" styles={styles} />
            </View>
          </View>
        </View>

        {/* Departure */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>DEPARTURE</Text>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <FormInput label="Airport Code" value={form.depCode} onChangeText={(v) => update("depCode", v)} placeholder="MNL" autoCapitalize="characters" icon="location-outline" styles={styles} />
            </View>
            <View style={{ flex: 0.7 }}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Country</Text>
                <TouchableOpacity style={styles.pickerBtn} onPress={() => { setCountryPickerField("depCountry"); setCountrySearch(""); setShowCountryPicker(true); }}>
                  <Text style={{ fontSize: 18 }}>{form.depCountry ? getFlag(form.depCountry) : "🏳️"}</Text>
                  <Text style={form.depCountry ? styles.pickerValue : styles.pickerPlaceholder}>{form.depCountry || "Select"}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          <FormInput label="City" value={form.depCity} onChangeText={(v) => update("depCity", v)} placeholder="e.g. Manila" icon="business-outline" styles={styles} />

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Departure Time</Text>
            <TouchableOpacity style={styles.pickerBtn} onPress={() => openTimePicker("depTime")}>
              <Ionicons name="time-outline" size={18} color={colors.brand[600]} />
              <Text style={form.depTime ? styles.pickerValue : styles.pickerPlaceholder}>
                {form.depTime || "Select time"}
              </Text>
              <Ionicons name="chevron-down" size={16} color={theme.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Arrival */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>ARRIVAL</Text>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <FormInput label="Airport Code" value={form.arrCode} onChangeText={(v) => update("arrCode", v)} placeholder="NRT" autoCapitalize="characters" icon="location-outline" styles={styles} />
            </View>
            <View style={{ flex: 0.7 }}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Country</Text>
                <TouchableOpacity style={styles.pickerBtn} onPress={() => { setCountryPickerField("arrCountry"); setCountrySearch(""); setShowCountryPicker(true); }}>
                  <Text style={{ fontSize: 18 }}>{form.arrCountry ? getFlag(form.arrCountry) : "🏳️"}</Text>
                  <Text style={form.arrCountry ? styles.pickerValue : styles.pickerPlaceholder}>{form.arrCountry || "Select"}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          <FormInput label="City" value={form.arrCity} onChangeText={(v) => update("arrCity", v)} placeholder="e.g. Tokyo Narita" icon="business-outline" styles={styles} />

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Arrival Time</Text>
            <TouchableOpacity style={styles.pickerBtn} onPress={() => openTimePicker("arrTime")}>
              <Ionicons name="time-outline" size={18} color={colors.brand[600]} />
              <Text style={form.arrTime ? styles.pickerValue : styles.pickerPlaceholder}>
                {form.arrTime || "Select time"}
              </Text>
              <Ionicons name="chevron-down" size={16} color={theme.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Crew & Remarks */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>CREW & REMARKS</Text>
          <FormInput label="Pilot in Command" value={form.pilotInCommand} onChangeText={(v) => update("pilotInCommand", v)} placeholder="e.g. Capt. Santos" icon="person-outline" styles={styles} />
          <FormInput label="Remarks" value={form.remarks} onChangeText={(v) => update("remarks", v)} placeholder="Optional notes" multiline icon="chatbubble-outline" styles={styles} />
        </View>
      </ScrollView>

      {/* Calendar Modal */}
      <Modal visible={showCalendar} transparent animationType="fade">
        <TouchableOpacity style={styles.calendarOverlay} activeOpacity={1} onPress={() => setShowCalendar(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.calendarModal}>
            {/* Month Navigation */}
            <View style={styles.calendarHeader}>
              <TouchableOpacity onPress={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}>
                <Ionicons name="chevron-back" size={22} color={theme.textSecondary} />
              </TouchableOpacity>
              <Text style={styles.calendarMonthText}>
                {monthNames[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}
              </Text>
              <TouchableOpacity onPress={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}>
                <Ionicons name="chevron-forward" size={22} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Day headers */}
            <View style={styles.calendarWeekRow}>
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                <Text key={d} style={styles.calendarWeekDay}>{d}</Text>
              ))}
            </View>

            {/* Days grid */}
            <View style={styles.calendarGrid}>
              {getCalendarDays(calendarMonth).map((day, i) => {
                if (!day) return <View key={`empty-${i}`} style={styles.calendarDayEmpty} />;
                const dateStr = formatDateStr(day);
                const isSelected = form.date === dateStr;
                const isToday = formatDateStr(new Date()) === dateStr;
                return (
                  <TouchableOpacity
                    key={dateStr}
                    style={[styles.calendarDay, isSelected && styles.calendarDaySelected, isToday && !isSelected && styles.calendarDayToday]}
                    onPress={() => selectDate(day)}
                  >
                    <Text style={[styles.calendarDayText, isSelected && styles.calendarDayTextSelected, isToday && !isSelected && styles.calendarDayTextToday]}>
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
        <TouchableOpacity style={styles.calendarOverlay} activeOpacity={1} onPress={() => setShowTimePicker(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.timePickerModal}>
            <Text style={styles.timePickerTitle}>
              {timePickerField === "depTime" ? "Departure Time" : "Arrival Time"}
            </Text>

            <View style={styles.timePickerRow}>
              {/* Hours */}
              <View style={styles.timePickerColumn}>
                <TouchableOpacity onPress={() => setPickerHour((pickerHour + 1) % 24)} style={styles.timeArrow}>
                  <Ionicons name="chevron-up" size={24} color={theme.textSecondary} />
                </TouchableOpacity>
                <View style={styles.timeValueBox}>
                  <Text style={styles.timeValueText}>{String(pickerHour).padStart(2, "0")}</Text>
                </View>
                <TouchableOpacity onPress={() => setPickerHour((pickerHour - 1 + 24) % 24)} style={styles.timeArrow}>
                  <Ionicons name="chevron-down" size={24} color={theme.textSecondary} />
                </TouchableOpacity>
                <Text style={styles.timeUnitLabel}>Hour</Text>
              </View>

              <Text style={styles.timeColon}>:</Text>

              {/* Minutes */}
              <View style={styles.timePickerColumn}>
                <TouchableOpacity onPress={() => setPickerMinute((pickerMinute + 5) % 60)} style={styles.timeArrow}>
                  <Ionicons name="chevron-up" size={24} color={theme.textSecondary} />
                </TouchableOpacity>
                <View style={styles.timeValueBox}>
                  <Text style={styles.timeValueText}>{String(pickerMinute).padStart(2, "0")}</Text>
                </View>
                <TouchableOpacity onPress={() => setPickerMinute((pickerMinute - 5 + 60) % 60)} style={styles.timeArrow}>
                  <Ionicons name="chevron-down" size={24} color={theme.textSecondary} />
                </TouchableOpacity>
                <Text style={styles.timeUnitLabel}>Min</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.timeConfirmBtn} onPress={confirmTime}>
              <Text style={styles.timeConfirmText}>Confirm</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Country Picker Modal */}
      <Modal visible={showCountryPicker} transparent animationType="slide">
        <TouchableOpacity style={styles.calendarOverlay} activeOpacity={1} onPress={() => setShowCountryPicker(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.countryModal}>
            <View style={styles.countryModalHandle} />
            <Text style={styles.countryModalTitle}>Select Country</Text>
            <View style={styles.countrySearchBar}>
              <Ionicons name="search" size={16} color={theme.textMuted} />
              <TextInput
                style={styles.countrySearchInput}
                placeholder="Search..."
                placeholderTextColor={colors.runway[300]}
                value={countrySearch}
                onChangeText={setCountrySearch}
                autoFocus
              />
            </View>
            <ScrollView style={styles.countryList} showsVerticalScrollIndicator={false}>
              {COUNTRIES.filter((c) => countrySearch ? c.name.toLowerCase().includes(countrySearch.toLowerCase()) || c.code.toLowerCase().includes(countrySearch.toLowerCase()) : true).map((c) => (
                <TouchableOpacity key={c.code} style={styles.countryRow} onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  update(countryPickerField, c.code);
                  setShowCountryPicker(false);
                }}>
                  <Text style={styles.countryFlag}>{getFlag(c.code)}</Text>
                  <Text style={styles.countryName}>{c.name}</Text>
                  <Text style={styles.countryCode}>{c.code}</Text>
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

function FormInput({ label, value, onChangeText, placeholder, autoCapitalize, multiline, icon, styles }: {
  label: string; value: string; onChangeText: (v: string) => void; placeholder: string;
  autoCapitalize?: "characters" | "none" | "sentences" | "words"; multiline?: boolean; icon?: IoniconsName;
  styles: ReturnType<typeof createFormStyles>;
}) {
  const { colors: theme } = useAppTheme();
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={[styles.inputWrapper, multiline && { alignItems: "flex-start" }]}>
        {icon && <Ionicons name={icon} size={16} color={theme.textMuted} style={{ marginTop: multiline ? 14 : 0 }} />}
        <TextInput
          style={[styles.textInput, multiline && { height: 80, textAlignVertical: "top" }]}
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

const createStyles = (theme: ThemeColors) =>
  StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: theme.surface, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border },
  title: { fontSize: 26, fontWeight: "700", color: theme.textPrimary, letterSpacing: -0.5 },
  count: { fontSize: fontSize.sm, color: theme.textMuted, marginTop: 2 },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.brand[600], alignItems: "center", justifyContent: "center", shadowColor: colors.brand[600], shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 4 },
  sectionLabel: { fontSize: fontSize.xs, fontWeight: "700", color: theme.textMuted, textTransform: "uppercase", letterSpacing: 0.6, paddingHorizontal: spacing.lg, marginBottom: spacing.sm, marginTop: spacing.md },
  flightCard: { marginHorizontal: spacing.lg, marginBottom: spacing.sm },
  flightHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md },
  flightNumber: { fontSize: fontSize.base, fontWeight: "700", color: theme.textPrimary, letterSpacing: 0.5 },
  statusBadge: { paddingHorizontal: spacing.sm + 2, paddingVertical: 3, borderRadius: borderRadius.sm },
  statusText: { fontSize: fontSize.xs, fontWeight: "700" },
  routeRow: { flexDirection: "row", alignItems: "center", marginBottom: spacing.md },
  airport: { flex: 1, alignItems: "flex-start" },
  airportRight: { alignItems: "flex-end" },
  flag: { fontSize: 22, marginBottom: 4 },
  airportCode: { fontSize: fontSize.lg, fontWeight: "800", color: theme.textPrimary, letterSpacing: 1 },
  airportCity: { fontSize: fontSize.xs, color: theme.textMuted, marginTop: 1 },
  time: { fontSize: fontSize.sm, fontWeight: "600", color: colors.brand[600], marginTop: 4 },
  flightLine: { flexDirection: "row", alignItems: "center", flex: 1.2, paddingHorizontal: spacing.xs },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.runway[300] },
  dashLine: { flex: 1, height: 1.5, backgroundColor: theme.border, marginHorizontal: 2 },
  flightFooter: { flexDirection: "row", gap: spacing.md, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: theme.borderLight },
  footerChip: { flexDirection: "row", alignItems: "center", gap: 4 },
  footerText: { fontSize: fontSize.xs, color: theme.textMuted },
  errorBanner: { flexDirection: "row", alignItems: "center", gap: spacing.sm, backgroundColor: colors.red[50], marginHorizontal: spacing.lg, marginBottom: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.red[100] },
  errorText: { fontSize: fontSize.sm, color: colors.red[700], flex: 1 },
  centerContent: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.xl },
  emptyText: { fontSize: fontSize.lg, fontWeight: "600", color: theme.textSecondary, marginBottom: spacing.xs },
  emptySubText: { fontSize: fontSize.sm, color: theme.textMuted, textAlign: "center" },
  // Success
  successOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center", zIndex: 999 },
  successCircle: { width: 88, height: 88, borderRadius: 44, backgroundColor: colors.green[500], alignItems: "center", justifyContent: "center", shadowColor: colors.green[500], shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  successText: { fontSize: fontSize.lg, fontWeight: "700", color: colors.white, marginTop: spacing.md },
  // Flight Detail Modal
  detailOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  detailModal: { backgroundColor: theme.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: spacing.lg, paddingBottom: 40 },
  detailHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.runway[300], alignSelf: "center", marginBottom: spacing.lg },
  detailRouteRow: { flexDirection: "row", alignItems: "center", marginBottom: spacing.lg },
  detailAirport: { flex: 1 },
  detailFlag: { fontSize: 28, marginBottom: 4 },
  detailCode: { fontSize: 22, fontWeight: "800", color: theme.textPrimary, letterSpacing: 1 },
  detailCity: { fontSize: fontSize.xs, color: theme.textMuted, marginTop: 2 },
  detailTime: { fontSize: fontSize.base, fontWeight: "700", color: colors.brand[600], marginTop: 4 },
  detailLine: { flexDirection: "row", alignItems: "center", flex: 1.5, paddingHorizontal: spacing.xs },
  detailDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.runway[300] },
  detailDash: { flex: 1, height: 2, backgroundColor: theme.border, marginHorizontal: 2 },
  detailInfoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: theme.borderLight },
  detailFlightNum: { fontSize: fontSize.lg, fontWeight: "700", color: theme.textPrimary, letterSpacing: 0.5 },
  detailStatusBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  detailStatusDot: { width: 8, height: 8, borderRadius: 4 },
  detailStatusText: { fontSize: fontSize.xs, fontWeight: "700" },
  detailGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.md },
  detailGridItem: { backgroundColor: theme.background, borderRadius: borderRadius.md, padding: spacing.md, width: "47%", gap: 4 },
  detailGridLabel: { fontSize: 10, fontWeight: "600", color: theme.textMuted },
  detailGridValue: { fontSize: fontSize.base, fontWeight: "700", color: theme.textPrimary },
  detailRemarks: { backgroundColor: theme.background, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.md },
  detailRemarksLabel: { fontSize: 10, fontWeight: "600", color: theme.textMuted, marginBottom: 4 },
  detailRemarksText: { fontSize: fontSize.sm, color: theme.textSecondary },
  detailActions: { flexDirection: "row", gap: spacing.sm },
  detailDeleteBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, paddingVertical: 14, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.red[100], backgroundColor: colors.red[50] },
  detailDeleteText: { fontSize: fontSize.sm, fontWeight: "600", color: colors.red[500] },
  detailCloseBtn: { flex: 2, alignItems: "center", justifyContent: "center", paddingVertical: 14, borderRadius: borderRadius.md, backgroundColor: colors.brand[600] },
  detailCloseText: { fontSize: fontSize.sm, fontWeight: "700", color: colors.white },
});

const createFormStyles = (theme: ThemeColors) =>
  StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: theme.surface, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border },
  cancelText: { fontSize: fontSize.base, color: theme.textMuted, fontWeight: "500" },
  headerTitle: { fontSize: fontSize.lg, fontWeight: "700", color: theme.textPrimary, letterSpacing: -0.3 },
  saveBtn: { backgroundColor: colors.brand[600], paddingHorizontal: 20, paddingVertical: 9, borderRadius: 20, shadowColor: colors.brand[600], shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 3 },
  saveBtnText: { fontSize: fontSize.sm, fontWeight: "700", color: colors.white },
  card: { backgroundColor: theme.surface, marginHorizontal: spacing.md, marginTop: spacing.md, borderRadius: 16, padding: spacing.md, shadowColor: colors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardLabel: { fontSize: 11, fontWeight: "800", color: colors.brand[600], letterSpacing: 1.2, marginBottom: spacing.md },
  inputGroup: { marginBottom: spacing.sm },
  inputLabel: { fontSize: fontSize.xs, fontWeight: "600", color: theme.textSecondary, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.3 },
  inputWrapper: { flexDirection: "row", alignItems: "center", backgroundColor: theme.background, borderWidth: 1.5, borderColor: theme.border, borderRadius: 12, paddingHorizontal: spacing.sm, gap: spacing.xs },
  textInput: { flex: 1, fontSize: fontSize.sm, color: theme.textPrimary, paddingVertical: 12 },
  row: { flexDirection: "row", gap: spacing.sm },
  pickerBtn: { flexDirection: "row", alignItems: "center", backgroundColor: theme.background, borderWidth: 1.5, borderColor: theme.border, borderRadius: 12, paddingHorizontal: spacing.sm, paddingVertical: 14, gap: spacing.xs, minHeight: 50 },
  pickerValue: { flex: 1, fontSize: fontSize.sm, fontWeight: "600", color: theme.textPrimary },
  pickerPlaceholder: { flex: 1, fontSize: fontSize.sm, color: colors.runway[300] },
  // Country picker
  countryModal: { backgroundColor: theme.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg, maxHeight: "70%", paddingBottom: spacing.xl },
  countryModalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.runway[300], alignSelf: "center", marginBottom: spacing.md },
  countryModalTitle: { fontSize: fontSize.lg, fontWeight: "700", color: theme.textPrimary, textAlign: "center", marginBottom: spacing.md },
  countrySearchBar: { flexDirection: "row", alignItems: "center", backgroundColor: theme.background, borderRadius: 10, paddingHorizontal: spacing.md, paddingVertical: 10, gap: spacing.sm, marginBottom: spacing.md },
  countrySearchInput: { flex: 1, fontSize: fontSize.base, color: theme.textPrimary, padding: 0 },
  countryList: { maxHeight: 350 },
  countryRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.borderLight, gap: spacing.md },
  countryFlag: { fontSize: 24 },
  countryName: { flex: 1, fontSize: fontSize.base, color: theme.textPrimary },
  countryCode: { fontSize: fontSize.sm, fontWeight: "600", color: theme.textMuted },
  // Calendar
  calendarOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: spacing.lg },
  calendarModal: { backgroundColor: theme.surface, borderRadius: 20, padding: spacing.lg, width: "100%", maxWidth: 340 },
  calendarHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.md },
  calendarMonthText: { fontSize: fontSize.base, fontWeight: "700", color: theme.textPrimary },
  calendarWeekRow: { flexDirection: "row", marginBottom: spacing.sm },
  calendarWeekDay: { flex: 1, textAlign: "center", fontSize: fontSize.xs, fontWeight: "600", color: theme.textMuted },
  calendarGrid: { flexDirection: "row", flexWrap: "wrap" },
  calendarDayEmpty: { width: "14.28%", height: 40 },
  calendarDay: { width: "14.28%", height: 40, alignItems: "center", justifyContent: "center", borderRadius: 20 },
  calendarDaySelected: { backgroundColor: colors.brand[600] },
  calendarDayToday: { backgroundColor: colors.brand[50] },
  calendarDayText: { fontSize: fontSize.sm, fontWeight: "500", color: theme.textPrimary },
  calendarDayTextSelected: { color: colors.white, fontWeight: "700" },
  calendarDayTextToday: { color: colors.brand[600], fontWeight: "700" },
  // Time Picker
  timePickerModal: { backgroundColor: theme.surface, borderRadius: 20, padding: spacing.lg, width: "100%", maxWidth: 280, alignItems: "center" },
  timePickerTitle: { fontSize: fontSize.base, fontWeight: "700", color: theme.textPrimary, marginBottom: spacing.lg },
  timePickerRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.lg },
  timePickerColumn: { alignItems: "center" },
  timeArrow: { padding: 8 },
  timeValueBox: { width: 64, height: 64, borderRadius: 14, backgroundColor: theme.background, borderWidth: 1.5, borderColor: theme.border, alignItems: "center", justifyContent: "center" },
  timeValueText: { fontSize: 28, fontWeight: "800", color: theme.textPrimary },
  timeColon: { fontSize: 28, fontWeight: "800", color: theme.textMuted, marginBottom: 20 },
  timeUnitLabel: { fontSize: fontSize.xs, color: theme.textMuted, marginTop: 4 },
  timeConfirmBtn: { backgroundColor: colors.brand[600], paddingHorizontal: spacing.xl, paddingVertical: 12, borderRadius: 12, width: "100%" , alignItems: "center" },
  timeConfirmText: { fontSize: fontSize.base, fontWeight: "700", color: colors.white },
});
