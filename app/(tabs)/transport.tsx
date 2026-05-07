import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import { FlatList, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

const TAB_BAR_HEIGHT = 100;

type Biller = { id: string; label: string; icon: string; color: string; route: "tap-and-go" | "bill-payment"; type?: string };

const BILLERS: Biller[] = [
  { id: "electricity", label: "Electricity", icon: "flash", color: "#1A237E", route: "bill-payment", type: "electricity" },
  { id: "startimes", label: "Startimes", icon: "tv", color: "#1A237E", route: "bill-payment", type: "startimes" },
  { id: "dstv", label: "DSTV", icon: "wifi", color: "#1A237E", route: "bill-payment", type: "dstv" },
  { id: "water", label: "Water", icon: "water", color: "#1A237E", route: "bill-payment", type: "water" },
  { id: "tapgo", label: "Tap & Go", icon: "bus", color: "#1A237E", route: "tap-and-go" },
  { id: "irembo", label: "IREMBO", icon: "globe-outline", color: "#1A237E", route: "bill-payment", type: "irembo" },
  { id: "canalplus", label: "Canal Plus", icon: "play-circle", color: "#1A237E", route: "bill-payment", type: "canal-plus" },
  { id: "school", label: "School Fees", icon: "school", color: "#1A237E", route: "bill-payment", type: "school-fees" },
];

function BillerCard({ biller }: { biller: Biller }) {
  const colors = useColors();
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (biller.route === "tap-and-go") router.push("/tap-and-go");
    else router.push({ pathname: "/bill-payment", params: { type: biller.type } });
  };
  return (
    <Pressable onPress={handlePress} style={({ pressed }) => [styles.card, { backgroundColor: colors.card, opacity: pressed ? 0.75 : 1 }]}>
      <View style={[styles.iconWrap, { backgroundColor: biller.color + "18" }]}>
        <Ionicons name={biller.icon as any} size={28} color={biller.color} />
      </View>
      <Text style={[styles.cardLabel, { color: colors.foreground }]} numberOfLines={2}>{biller.label}</Text>
    </Pressable>
  );
}

export default function PayBillsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const [search, setSearch] = useState("");
  const filtered = search ? BILLERS.filter((b) => b.label.toLowerCase().includes(search.toLowerCase())) : BILLERS;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + bottomPad + 16 }}>
        <View style={[styles.header, { paddingTop: topPad + 12 }]}>
          <Text style={[styles.title, { color: colors.primary }]}>Pay Bills</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Select a service to pay</Text>
        </View>
        <View style={[styles.searchWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="search" size={16} color={colors.mutedForeground} />
          <TextInput style={[styles.searchInput, { color: colors.foreground }]} value={search} onChangeText={setSearch} placeholder="Search billers" placeholderTextColor={colors.mutedForeground} autoCapitalize="none" autoCorrect={false} />
          {search.length > 0 && <Pressable onPress={() => setSearch("")}><Ionicons name="close-circle" size={16} color={colors.mutedForeground} /></Pressable>}
        </View>
        <FlatList
          data={filtered}
          numColumns={3}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.gridRow}
          renderItem={({ item }) => <BillerCard biller={item} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={38} color={colors.border} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No billers found</Text>
            </View>
          }
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: "800", letterSpacing: -0.5 },
  subtitle: { fontSize: 14, marginTop: 3 },
  searchWrap: { flexDirection: "row", alignItems: "center", marginHorizontal: 16, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11, gap: 10, marginBottom: 16, borderWidth: 1, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  searchInput: { flex: 1, fontSize: 14, padding: 0 },
  grid: { paddingHorizontal: 12, gap: 10 },
  gridRow: { gap: 10 },
  card: { flex: 1, aspectRatio: 0.9, borderRadius: 18, alignItems: "center", justifyContent: "center", gap: 10, padding: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  iconWrap: { width: 54, height: 54, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  cardLabel: { fontSize: 12, fontWeight: "700", textAlign: "center", lineHeight: 16 },
  emptyState: { alignItems: "center", paddingVertical: 40, gap: 12 },
  emptyText: { fontSize: 14 },
});
