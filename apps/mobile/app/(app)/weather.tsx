import { useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { colors, spacing, borderRadius, fontSize } from "@shared/theme";
import { PressableScale } from "@shared/components/PressableScale";
import { useWeather } from "@features/weather/hooks/useWeather";
import { MetarCard } from "@features/weather/components/MetarCard";

export default function WeatherScreen() {
  const insets = useSafeAreaInsets();
  const {
    station,
    setStation,
    activeStation,
    metar,
    taf,
    metarLoading,
    tafLoading,
    metarError,
    tafError,
    recentStations,
    showTaf,
    setShowTaf,
    searchStation,
    refresh,
  } = useWeather();

  const handleSearch = useCallback(() => {
    if (station.trim().length === 4) {
      searchStation(station);
    }
  }, [station, searchStation]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIconBg}>
            <Ionicons name="cloud" size={20} color={colors.brand[600]} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Weather & METAR</Text>
            <Text style={styles.headerSub}>Aviation weather briefing</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
        refreshControl={
          <RefreshControl
            refreshing={metarLoading && !!activeStation}
            onRefresh={refresh}
            tintColor={colors.brand[500]}
          />
        }
      >
        {/* Search input */}
        <View style={styles.searchRow}>
          <View style={styles.searchInputWrapper}>
            <Ionicons name="search" size={18} color={colors.runway[400]} />
            <TextInput
              style={styles.searchInput}
              placeholder="ICAO code (e.g. KJFK)"
              placeholderTextColor={colors.runway[400]}
              value={station}
              onChangeText={setStation}
              autoCapitalize="characters"
              maxLength={4}
              returnKeyType="search"
              onSubmitEditing={handleSearch}
            />
          </View>
          <PressableScale
            onPress={handleSearch}
            scaleIn={0.9}
            haptic
            style={[styles.searchBtn, station.trim().length !== 4 && styles.searchBtnDisabled]}
            disabled={station.trim().length !== 4}
          >
            <Ionicons name="arrow-forward" size={18} color={colors.white} />
          </PressableScale>
        </View>

        {/* Recent stations chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipsScroll}
          contentContainerStyle={styles.chipsContent}
        >
          {recentStations.map((icao) => (
            <TouchableOpacity
              key={icao}
              style={[
                styles.chip,
                activeStation === icao && styles.chipActive,
              ]}
              onPress={() => searchStation(icao)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, activeStation === icao && styles.chipTextActive]}>
                {icao}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Loading state */}
        {metarLoading && !metar && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.brand[500]} />
            <Text style={styles.loadingText}>Fetching METAR...</Text>
          </View>
        )}

        {/* Error state */}
        {metarError && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={24} color={colors.red[500]} />
            <Text style={styles.errorText}>{metarError}</Text>
          </View>
        )}

        {/* METAR result */}
        {metar && <MetarCard metar={metar} />}

        {/* TAF toggle */}
        {metar && (
          <View style={styles.tafSection}>
            <TouchableOpacity
              style={styles.tafToggle}
              onPress={() => setShowTaf(!showTaf)}
              activeOpacity={0.7}
            >
              <View style={styles.tafToggleLeft}>
                <Ionicons name="time-outline" size={16} color={colors.brand[600]} />
                <Text style={styles.tafToggleText}>Terminal Forecast (TAF)</Text>
              </View>
              <Ionicons
                name={showTaf ? "chevron-up" : "chevron-down"}
                size={16}
                color={colors.runway[400]}
              />
            </TouchableOpacity>

            {showTaf && tafLoading && (
              <View style={styles.tafLoading}>
                <ActivityIndicator size="small" color={colors.brand[500]} />
              </View>
            )}

            {showTaf && tafError && (
              <Text style={styles.tafError}>{tafError}</Text>
            )}

            {showTaf && taf && (
              <View style={styles.tafCard}>
                <Text style={styles.tafRaw} selectable>
                  {taf.raw}
                </Text>
                <Text style={styles.tafValid}>
                  Valid: {taf.validFrom.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}Z —{" "}
                  {taf.validTo.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}Z
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Empty state */}
        {!metar && !metarLoading && !metarError && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconBg}>
              <Ionicons name="airplane-outline" size={40} color={colors.runway[400]} />
            </View>
            <Text style={styles.emptyTitle}>Enter an ICAO code</Text>
            <Text style={styles.emptySub}>
              Get current METAR and TAF data for any airport worldwide.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.runway[50],
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.runway[200],
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  headerIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.brand[50],
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.runway[900],
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 12,
    color: colors.runway[400],
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: spacing.md,
    paddingBottom: spacing["2xl"],
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.runway[200],
    paddingHorizontal: spacing.md,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.base,
    color: colors.runway[800],
    fontWeight: "600",
    letterSpacing: 1,
  },
  searchBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.brand[600],
    alignItems: "center",
    justifyContent: "center",
  },
  searchBtnDisabled: {
    backgroundColor: colors.runway[200],
  },
  chipsScroll: {
    marginBottom: spacing.lg,
  },
  chipsContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.runway[200],
    marginRight: spacing.sm,
  },
  chipActive: {
    backgroundColor: colors.brand[600],
    borderColor: colors.brand[600],
  },
  chipText: {
    fontSize: fontSize.sm,
    fontWeight: "700",
    color: colors.runway[600],
    letterSpacing: 0.5,
  },
  chipTextActive: {
    color: colors.white,
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: spacing["2xl"],
    gap: spacing.md,
  },
  loadingText: {
    fontSize: fontSize.sm,
    color: colors.runway[400],
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    backgroundColor: colors.red[50],
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.red[100],
  },
  errorText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.red[700],
  },
  tafSection: {
    marginTop: spacing.lg,
    marginHorizontal: spacing.md,
  },
  tafToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.runway[200],
  },
  tafToggleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  tafToggleText: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.runway[700],
  },
  tafLoading: {
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  tafError: {
    fontSize: fontSize.sm,
    color: colors.red[600],
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  tafCard: {
    marginTop: spacing.sm,
    backgroundColor: colors.runway[900],
    borderRadius: borderRadius.sm,
    padding: spacing.md,
  },
  tafRaw: {
    fontFamily: "monospace",
    fontSize: fontSize.xs,
    color: colors.green[500],
    lineHeight: 18,
  },
  tafValid: {
    fontSize: 10,
    color: colors.runway[400],
    marginTop: spacing.sm,
  },
  emptyState: {
    alignItems: "center",
    paddingTop: spacing["3xl"],
  },
  emptyIconBg: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.runway[100],
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: "600",
    color: colors.runway[700],
  },
  emptySub: {
    fontSize: fontSize.sm,
    color: colors.runway[400],
    marginTop: spacing.xs,
    textAlign: "center",
    paddingHorizontal: spacing["2xl"],
  },
});
