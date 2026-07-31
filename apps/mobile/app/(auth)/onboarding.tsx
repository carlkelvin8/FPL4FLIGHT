import { useState, useRef } from "react";
import { View, Text, StyleSheet, Dimensions, FlatList, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as SecureStore from "expo-secure-store";
import Animated, { FadeInUp } from "react-native-reanimated";
import { colors, spacing, borderRadius, fontSize, type ThemeColors } from "@shared/theme";
import { PressableScale } from "@shared/components/PressableScale";
import { useAppTheme } from "@shared/hooks/useAppTheme";
import { ONBOARDING_KEY } from "@shared/constants";

const { width } = Dimensions.get("window");

interface Slide {
  id: string;
  icon: string;
  title: string;
  description: string;
  color: string;
}

const SLIDES: Slide[] = [
  {
    id: "1",
    icon: "airplane",
    title: "Flight Plan Management",
    description: "Create, manage, and submit ICAO-standard flight plans. Supports CAAP Form ATS 2019-1 and PNP Aviation Security checklists.",
    color: colors.brand[600],
  },
  {
    id: "2",
    icon: "document-text",
    title: "Digital Forms & PDF Export",
    description: "Fill out aviation forms digitally, preview them, export to PDF, or email directly to authorities. All forms match official templates.",
    color: colors.green[600],
  },
  {
    id: "3",
    icon: "chatbubbles",
    title: "Pilot Community Chat",
    description: "Connect with fellow pilots in real-time. Share locations, weather info, and coordinate flights across multiple channels.",
    color: colors.brand[500],
  },
  {
    id: "4",
    icon: "calculator",
    title: "Aviation Tools",
    description: "E6B calculator, weight & balance, NOTAM viewer, pilot logbook, duty tracker, and navigation planning — all in one app.",
    color: colors.amber[600],
  },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors: theme } = useAppTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const styles = createStyles(theme);

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
      setCurrentIndex(currentIndex + 1);
    } else {
      handleDone();
    }
  };

  const handleSkip = () => {
    handleDone();
  };

  const handleDone = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await SecureStore.setItemAsync(ONBOARDING_KEY, "true").catch(() => {});
    router.replace("/(auth)/login");
  };

  const renderSlide = ({ item }: { item: Slide }) => (
    <View style={[styles.slide, { width }]}>
      <Animated.View entering={FadeInUp.duration(400)} style={styles.slideContent}>
        <View style={[styles.iconBg, { backgroundColor: item.color + "15" }]}>
          <Ionicons name={item.icon as any} size={64} color={item.color} />
        </View>
        <Text style={styles.slideTitle}>{item.title}</Text>
        <Text style={styles.slideDesc}>{item.description}</Text>
      </Animated.View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Skip button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleSkip} activeOpacity={0.7}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
      />

      {/* Pagination dots + Next button */}
      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[styles.dot, currentIndex === i && styles.dotActive]} />
          ))}
        </View>

        <PressableScale style={styles.nextBtn} onPress={handleNext} haptic>
          <Text style={styles.nextBtnText}>
            {currentIndex === SLIDES.length - 1 ? "Get Started" : "Next"}
          </Text>
          <Ionicons name={currentIndex === SLIDES.length - 1 ? "checkmark" : "arrow-forward"} size={18} color={colors.white} />
        </PressableScale>
      </View>
    </View>
  );
}

/** Check if onboarding was completed */
export async function hasCompletedOnboarding(): Promise<boolean> {
  try {
    const val = await SecureStore.getItemAsync(ONBOARDING_KEY);
    return val === "true";
  } catch {
    return false;
  }
}

const createStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    header: { alignItems: "flex-end", paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
    skipText: { fontSize: fontSize.base, color: theme.textMuted, fontWeight: "500" },
    slide: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: spacing.xl },
    slideContent: { alignItems: "center" },
    iconBg: { width: 120, height: 120, borderRadius: 60, alignItems: "center", justifyContent: "center", marginBottom: spacing.xl },
    slideTitle: { fontSize: 26, fontWeight: "700", color: theme.textPrimary, textAlign: "center", marginBottom: spacing.md, letterSpacing: -0.5 },
    slideDesc: { fontSize: fontSize.base, color: theme.textMuted, textAlign: "center", lineHeight: 24, paddingHorizontal: spacing.md },
    footer: { paddingHorizontal: spacing.lg, paddingVertical: spacing.lg },
    dots: { flexDirection: "row", justifyContent: "center", gap: spacing.sm, marginBottom: spacing.lg },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.border },
    dotActive: { width: 24, backgroundColor: colors.brand[600] },
    nextBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, backgroundColor: colors.brand[600], paddingVertical: spacing.md, borderRadius: borderRadius.md },
    nextBtnText: { fontSize: fontSize.base, fontWeight: "700", color: colors.white },
  });
