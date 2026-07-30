import { useState, useEffect, useMemo } from "react";
import { View, Text, StyleSheet, SectionList, TouchableOpacity, Modal, ActivityIndicator, TextInput, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { WebView } from "react-native-webview";
import { supabase } from "@core/network";
import { colors, spacing, borderRadius, fontSize } from "@shared/theme";

interface AIPDoc {
  id: string;
  title: string;
  url: string;
}

interface AIPSection {
  title: string;
  icon: string;
  data: AIPDoc[];
}

const STORAGE_BASE = "https://tajflaaiezwlbkgyfnkh.supabase.co/storage/v1/object/public/aip-docs";

export default function AIPScreen() {
  const insets = useSafeAreaInsets();
  const [sections, setSections] = useState<AIPSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingDoc, setViewingDoc] = useState<AIPDoc | null>(null);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");

  useEffect(() => {
    loadPDFs();
  }, []);

  async function loadPDFs() {
    setLoading(true);
    try {
      const folders = [
        { path: "Part_1_-_GEN", title: "GEN - General", icon: "book-outline" },
        { path: "Part_2_-_ENR", title: "ENR - En Route", icon: "navigate-outline" },
        { path: "Part_3_-_AD", title: "AD - Aerodromes", icon: "airplane-outline" },
      ];

      const loadedSections: AIPSection[] = [];

      for (const folder of folders) {
        const { data, error } = await supabase.storage.from("aip-docs").list(folder.path, { limit: 100, sortBy: { column: "name", order: "asc" } });
        if (!error && data) {
          const docs: AIPDoc[] = data
            .filter((f) => f.name.endsWith(".pdf"))
            .map((f) => ({
              id: f.id ?? f.name,
              title: f.name.replace(/_/g, " ").replace(".pdf", "").replace(/\s+-\s+/g, " – "),
              url: `${STORAGE_BASE}/${folder.path}/${f.name}`,
            }));
          if (docs.length > 0) {
            loadedSections.push({ title: folder.title, icon: folder.icon, data: docs });
          }
        }
      }

      setSections(loadedSections);
    } catch { /* silently fail */ }
    setLoading(false);
  }

  // Filtered data
  const filteredSections = useMemo(() => {
    let result = sections;
    // Filter by section
    if (activeFilter !== "all") {
      result = result.filter((s) => s.title.toLowerCase().startsWith(activeFilter));
    }
    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.map((s) => ({
        ...s,
        data: s.data.filter((d) => d.title.toLowerCase().includes(q)),
      })).filter((s) => s.data.length > 0);
    }
    return result;
  }, [sections, search, activeFilter]);

  const totalDocs = sections.reduce((s, sec) => s + sec.data.length, 0);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>AIP Reference</Text>
            <Text style={styles.subtitle}>Philippine Aeronautical Information Publication</Text>
          </View>
          <View style={styles.countBadge}>
            <Text style={styles.countNum}>{totalDocs}</Text>
            <Text style={styles.countLabel}>PDFs</Text>
          </View>
        </View>
        {/* Search */}
        <View style={styles.searchRow}>
          <Ionicons name="search" size={16} color={colors.runway[400]} />
          <TextInput style={styles.searchInput} placeholder="Search documents..." placeholderTextColor={colors.runway[400]} value={search} onChangeText={setSearch} autoCapitalize="none" autoCorrect={false} />
          {search.length > 0 && <TouchableOpacity onPress={() => setSearch("")}><Ionicons name="close-circle" size={18} color={colors.runway[300]} /></TouchableOpacity>}
        </View>
        {/* Filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {[{ key: "all", label: "All" }, { key: "gen", label: "GEN" }, { key: "enr", label: "ENR" }, { key: "ad", label: "AD" }].map((f) => (
            <TouchableOpacity key={f.key} style={[styles.filterChip, activeFilter === f.key && styles.filterChipActive]} onPress={() => setActiveFilter(f.key)}>
              <Text style={[styles.filterChipText, activeFilter === f.key && styles.filterChipTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}><ActivityIndicator size="large" color={colors.brand[600]} /><Text style={styles.loadingText}>Loading documents...</Text></View>
      ) : (
        <SectionList
          sections={filteredSections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Ionicons name={section.icon as any} size={16} color={colors.brand[600]} />
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionCount}>{section.data.length}</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setViewingDoc(item); }} activeOpacity={0.7}>
              <Ionicons name="document-text" size={18} color={colors.red[500]} />
              <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.runway[400]} />
            </TouchableOpacity>
          )}
        />
      )}

      {/* PDF Viewer */}
      <Modal visible={!!viewingDoc} animationType="slide" presentationStyle="fullScreen">
        <View style={[styles.viewerContainer, { paddingTop: insets.top }]}>
          <View style={styles.viewerHeader}>
            <TouchableOpacity onPress={() => setViewingDoc(null)} style={styles.viewerBack}>
              <Ionicons name="chevron-back" size={22} color={colors.brand[600]} />
              <Text style={styles.viewerBackText}>Back</Text>
            </TouchableOpacity>
            <Text style={styles.viewerTitle} numberOfLines={1}>{viewingDoc?.title}</Text>
            <View style={{ width: 60 }} />
          </View>
          {viewingDoc && (
            <WebView
              source={{ uri: `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(viewingDoc.url)}` }}
              style={styles.webview}
              startInLoadingState
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.runway[50] },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.runway[200] },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm },
  title: { fontSize: 24, fontWeight: "700", color: colors.runway[900] },
  subtitle: { fontSize: fontSize.sm, color: colors.runway[400], marginTop: 2 },
  countBadge: { alignItems: "center", backgroundColor: colors.brand[50], paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.md },
  countNum: { fontSize: fontSize.lg, fontWeight: "700", color: colors.brand[600] },
  countLabel: { fontSize: 8, fontWeight: "600", color: colors.brand[500] },
  searchRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, backgroundColor: colors.runway[50], borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.runway[200], paddingHorizontal: spacing.md, height: 40, marginBottom: spacing.sm },
  searchInput: { flex: 1, fontSize: fontSize.sm, color: colors.runway[900] },
  filterRow: { gap: spacing.xs, paddingBottom: spacing.xs },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: borderRadius.full, backgroundColor: colors.runway[100] },
  filterChipActive: { backgroundColor: colors.brand[600] },
  filterChipText: { fontSize: 11, fontWeight: "600", color: colors.runway[600] },
  filterChipTextActive: { color: colors.white },
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { fontSize: fontSize.sm, color: colors.runway[400], marginTop: spacing.md },
  // Sections
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.sm },
  sectionTitle: { fontSize: fontSize.sm, fontWeight: "700", color: colors.brand[600], flex: 1 },
  sectionCount: { fontSize: fontSize.xs, fontWeight: "600", color: colors.runway[400], backgroundColor: colors.runway[100], paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  // Cards
  card: { flexDirection: "row", alignItems: "center", gap: spacing.sm, backgroundColor: colors.white, marginHorizontal: spacing.md, paddingHorizontal: spacing.md, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.runway[100] },
  cardTitle: { flex: 1, fontSize: fontSize.sm, fontWeight: "500", color: colors.runway[800] },
  // Viewer
  viewerContainer: { flex: 1, backgroundColor: colors.white },
  viewerHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.md, paddingVertical: 12, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.runway[200] },
  viewerBack: { flexDirection: "row", alignItems: "center", gap: 2, width: 60 },
  viewerBackText: { fontSize: fontSize.sm, color: colors.brand[600], fontWeight: "500" },
  viewerTitle: { fontSize: fontSize.sm, fontWeight: "700", color: colors.runway[900], flex: 1, textAlign: "center" },
  webview: { flex: 1 },
});
