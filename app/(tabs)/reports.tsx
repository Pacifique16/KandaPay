import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import { Platform, Pressable, SectionList, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ReportSection, ReportTransaction, REPORT_SECTIONS } from "@/constants/mockData";
import { useColors } from "@/hooks/useColors";

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const TAB_BAR_HEIGHT = 100;

function formatK(n: number): string {
  if (n === 0) return "0";
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${Math.round(n / 1000)}k`;
  return String(n);
}

function WeekSummaryCard({ section }: { section: ReportSection }) {
  const colors = useColors();
  const chartData = section.chartData ?? [];
  const maxVal = Math.max(...chartData.map((d) => d.amount), 1);
  const CHART_H = 80;
  return (
    <View style={[styles.weekCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.weekHeader}>
        <View style={[styles.weekBadge, { backgroundColor: colors.muted }]}>
          <Text style={[styles.weekBadgeText, { color: colors.mutedForeground }]}>{section.title}</Text>
        </View>
        <View style={styles.weekStats}>
          <View style={styles.weekStatRow}>
            <View style={[styles.statDot, { backgroundColor: colors.secondary }]} />
            <Text style={[styles.weekStatLabel, { color: colors.mutedForeground }]}>Total spent:</Text>
            <Text style={[styles.weekStatValue, { color: colors.foreground }]}>{(section.totalSpent ?? 0).toLocaleString()} RWF</Text>
          </View>
          <View style={styles.weekStatRow}>
            <View style={[styles.statDot, { backgroundColor: colors.accent }]} />
            <Text style={[styles.weekStatLabel, { color: colors.mutedForeground }]}>MTN fees:</Text>
            <Text style={[styles.weekStatValue, { color: colors.foreground }]}>{(section.fees ?? 0).toLocaleString()} RWF</Text>
          </View>
        </View>
      </View>
      <View style={[styles.chartArea, { height: CHART_H + 40 }]}>
        {chartData.map((item, i) => {
          const ratio = item.amount / maxVal;
          const barH = item.amount > 0 ? Math.max(ratio * CHART_H, 6) : 3;
          return (
            <View key={i} style={styles.chartBarCol}>
              <View style={styles.barTrack}>
                <Text style={[styles.barAmount, { color: colors.mutedForeground }]}>{formatK(item.amount)}</Text>
                <View style={[styles.bar, { height: barH, backgroundColor: item.amount > 0 ? colors.secondary : colors.muted }]} />
              </View>
              <Text style={[styles.barDay, { color: colors.mutedForeground }]}>{item.day}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function PersonRow({ item }: { item: ReportTransaction }) {
  const colors = useColors();
  const isCredit = item.type === "credit";
  return (
    <View style={[styles.personRow, { borderBottomColor: colors.border }]}>
      <View style={[styles.arrowWrap, { backgroundColor: isCredit ? colors.accent + "18" : "transparent" }]}>
        {isCredit && <Ionicons name="arrow-up" size={14} color={colors.accent} />}
      </View>
      <View style={styles.personInfo}>
        <Text style={[styles.personName, { color: colors.foreground }]}>{item.name}</Text>
        {item.phone && <Text style={[styles.personPhone, { color: colors.mutedForeground }]}>{item.phone}</Text>}
      </View>
      <Text style={[styles.personAmount, { color: isCredit ? colors.accent : colors.foreground }]}>
        {isCredit ? "+" : ""}{item.amount.toLocaleString()} RWF
      </Text>
    </View>
  );
}

function MerchantRow({ item }: { item: ReportTransaction }) {
  const colors = useColors();
  return (
    <View style={[styles.merchantRow, { borderBottomColor: colors.border }]}>
      <View style={[styles.merchantAccent, { backgroundColor: item.color ?? colors.secondary }]} />
      <View style={styles.merchantInfo}>
        <Text style={[styles.merchantName, { color: colors.foreground }]}>{item.name}</Text>
        {item.category && <Text style={[styles.merchantCategory, { color: colors.mutedForeground }]}>{item.category}</Text>}
      </View>
      <Text style={[styles.merchantAmount, { color: colors.foreground }]}>{item.amount.toLocaleString()} RWF</Text>
    </View>
  );
}

export default function ReportsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const now = new Date();
  const [search, setSearch] = useState("");

  const filteredSections: ReportSection[] = useMemo(() => {
    if (!search) return REPORT_SECTIONS;
    const q = search.toLowerCase();
    return REPORT_SECTIONS.map((section) => {
      if (section.sectionType === "week-summary") return null;
      const filtered = section.data.filter((tx) => tx.name.toLowerCase().includes(q) || (tx.phone ?? "").includes(q) || (tx.category ?? "").includes(q));
      return filtered.length > 0 ? { ...section, data: filtered } : null;
    }).filter(Boolean) as ReportSection[];
  }, [search]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.monthNav, { paddingTop: topPad + 8 }]}>
        <Text style={[styles.monthText, { color: colors.primary }]}>{MONTH_NAMES[now.getMonth()]}</Text>
        <Text style={[styles.yearText, { color: colors.mutedForeground }]}>{now.getFullYear()}</Text>
      </View>
      <View style={[styles.searchWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Ionicons name="search" size={16} color={colors.mutedForeground} />
        <TextInput style={[styles.searchInput, { color: colors.foreground }]} value={search} onChangeText={setSearch} placeholder="Type anything, we'll find it" placeholderTextColor={colors.mutedForeground} autoCapitalize="none" autoCorrect={false} />
        {search.length > 0 && <Pressable onPress={() => setSearch("")}><Ionicons name="close-circle" size={16} color={colors.mutedForeground} /></Pressable>}
      </View>
      <SectionList
        sections={filteredSections}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + bottomPad + 16 }}
        renderSectionHeader={({ section }) => {
          if (section.sectionType === "week-summary") return <WeekSummaryCard section={section} />;
          return (
            <View style={styles.dateHeader}>
              <Text style={[styles.dateDay, { color: colors.mutedForeground }]}>{section.dayName}</Text>
              <Text style={[styles.dateNum, { color: colors.primary }]}>{section.dayNum}</Text>
            </View>
          );
        }}
        renderItem={({ item, section }) => {
          if (section.sectionType === "week-summary") return null;
          if (!item.name) return null;
          if (item.isMerchant) return <MerchantRow item={item} />;
          return <PersonRow item={item} />;
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={40} color={colors.muted} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No transactions found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  monthNav: { flexDirection: "row", alignItems: "baseline", paddingHorizontal: 20, paddingBottom: 12, gap: 10 },
  monthText: { fontSize: 22, fontWeight: "800" },
  yearText: { fontSize: 16, fontWeight: "500" },
  searchWrap: { flexDirection: "row", alignItems: "center", marginHorizontal: 16, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, gap: 10, marginBottom: 8, borderWidth: 1, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  searchInput: { flex: 1, fontSize: 14, padding: 0 },
  dateHeader: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 6 },
  dateDay: { fontSize: 11, fontWeight: "600", letterSpacing: 0.5 },
  dateNum: { fontSize: 22, fontWeight: "800", marginTop: 1 },
  personRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 13, gap: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  arrowWrap: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  personInfo: { flex: 1 },
  personName: { fontSize: 14, fontWeight: "600" },
  personPhone: { fontSize: 12, marginTop: 2 },
  personAmount: { fontSize: 14, fontWeight: "700" },
  merchantRow: { flexDirection: "row", alignItems: "center", paddingLeft: 20, paddingRight: 20, paddingVertical: 13, gap: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  merchantAccent: { width: 3, height: 40, borderRadius: 2 },
  merchantInfo: { flex: 1 },
  merchantName: { fontSize: 14, fontWeight: "700" },
  merchantCategory: { fontSize: 12, marginTop: 2, textTransform: "capitalize" },
  merchantAmount: { fontSize: 14, fontWeight: "700" },
  weekCard: { marginHorizontal: 16, marginTop: 20, borderRadius: 16, padding: 16, borderWidth: 1, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  weekHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 16 },
  weekBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  weekBadgeText: { fontSize: 12, fontWeight: "700" },
  weekStats: { flex: 1, gap: 5 },
  weekStatRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  statDot: { width: 8, height: 8, borderRadius: 4 },
  weekStatLabel: { fontSize: 12 },
  weekStatValue: { fontSize: 12, fontWeight: "700", flex: 1, textAlign: "right" },
  chartArea: { flexDirection: "row", alignItems: "flex-end", gap: 4 },
  chartBarCol: { flex: 1, alignItems: "center", justifyContent: "flex-end" },
  barTrack: { flex: 1, alignItems: "center", justifyContent: "flex-end", gap: 3, width: "100%" },
  barAmount: { fontSize: 9, fontWeight: "600", textAlign: "center" },
  bar: { width: 14, borderRadius: 4 },
  barDay: { fontSize: 10, fontWeight: "600", marginTop: 4 },
  emptyState: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 14 },
});
