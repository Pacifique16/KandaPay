import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import { Dimensions, FlatList, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TRANSPORT_CARDS, TransportCard } from "@/constants/mockData";
import { useColors } from "@/hooks/useColors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH - 64;
const CARD_GRADIENTS = [["#1A237E", "#6C63FF"] as const, ["#004D40", "#00C9A7"] as const];
const ACTIONS = [
  { id: "topup", label: "Top Up", icon: "add-circle", color: "#6C63FF", desc: "Add balance to your card" },
  { id: "register", label: "Register Card", icon: "card", color: "#00C9A7", desc: "Link a new Tap & Go card" },
  { id: "balance", label: "Check Balance", icon: "wallet", color: "#1A237E", desc: "View your card balance" },
] as const;

function TapCard({ card, index }: { card: TransportCard; index: number }) {
  const gradient = CARD_GRADIENTS[index % CARD_GRADIENTS.length];
  return (
    <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.tapCard, { width: CARD_WIDTH }]}>
      <View style={styles.cardTop}>
        <View>
          <Text style={styles.tapLabel}>Tap & Go</Text>
          <Text style={styles.cardName}>{card.name}</Text>
        </View>
        <View style={styles.tapIconWrap}>
          <Ionicons name="wifi" size={28} color="rgba(255,255,255,0.8)" style={{ transform: [{ rotate: "90deg" }] }} />
        </View>
      </View>
      <Text style={styles.cardNumber}>{card.cardNumber}</Text>
      <View style={styles.cardBottom}>
        <Text style={styles.cardBalanceLabel}>Balance</Text>
        <Text style={styles.cardBalance}>RWF {card.balance.toLocaleString()}</Text>
      </View>
      <View style={styles.cardDecor1} />
      <View style={styles.cardDecor2} />
    </LinearGradient>
  );
}

export default function TapAndGoScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.navHeader, { paddingTop: topPad + 8, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.muted }]}>
          <Ionicons name="chevron-back" size={20} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.navTitle, { color: colors.primary }]}>Tap & Go</Text>
        <View style={{ width: 38 }} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 24 }]}>
        <View style={styles.container}>
          <FlatList
            data={TRANSPORT_CARDS}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            snapToInterval={CARD_WIDTH + 16}
            decelerationRate="fast"
            contentContainerStyle={{ paddingHorizontal: 16, gap: 16 }}
            onScroll={(e) => setActiveIndex(Math.round(e.nativeEvent.contentOffset.x / (CARD_WIDTH + 16)))}
            scrollEventThrottle={16}
            renderItem={({ item, index }) => <TapCard card={item} index={index} />}
          />
          <View style={styles.dots}>
            {TRANSPORT_CARDS.map((_, i) => (
              <View key={i} style={[styles.dot, { backgroundColor: i === activeIndex ? colors.accent : colors.border, width: i === activeIndex ? 20 : 8 }]} />
            ))}
          </View>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Card Actions</Text>
          <View style={styles.actionsGrid}>
            {ACTIONS.map((action) => (
              <Pressable key={action.id} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)} style={styles.actionCardWrapper}>
                <View style={[styles.actionCard, { backgroundColor: colors.card }]}>
                  <View style={[styles.actionIconWrap, { backgroundColor: action.color + "18" }]}>
                    <Ionicons name={action.icon as any} size={26} color={action.color} />
                  </View>
                  <Text style={[styles.actionLabel, { color: colors.foreground }]}>{action.label}</Text>
                  <Text style={[styles.actionDesc, { color: colors.mutedForeground }]}>{action.desc}</Text>
                </View>
              </Pressable>
            ))}
          </View>
          <View style={[styles.statsCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.statsTitle, { color: colors.foreground }]}>This Month</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}><Text style={[styles.statValue, { color: colors.foreground }]}>47</Text><Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Trips</Text></View>
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <View style={styles.statItem}><Text style={[styles.statValue, { color: colors.foreground }]}>RWF 21K</Text><Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Spent</Text></View>
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <View style={styles.statItem}><Text style={[styles.statValue, { color: colors.accent }]}>5%</Text><Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Saved</Text></View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  navHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  backBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  navTitle: { fontSize: 17, fontWeight: "700" },
  scroll: { flexGrow: 1 },
  container: { gap: 16, paddingTop: 20, paddingBottom: 8 },
  tapCard: { borderRadius: 24, padding: 22, height: 190, overflow: "hidden", position: "relative" },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  tapLabel: { color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: "500" },
  cardName: { color: "#fff", fontSize: 18, fontWeight: "700", marginTop: 4 },
  tapIconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  cardNumber: { color: "rgba(255,255,255,0.85)", fontSize: 20, fontWeight: "700", letterSpacing: 3, marginTop: 24 },
  cardBottom: { position: "absolute", bottom: 22, left: 22 },
  cardBalanceLabel: { color: "rgba(255,255,255,0.6)", fontSize: 11, fontWeight: "500" },
  cardBalance: { color: "#fff", fontSize: 20, fontWeight: "800" },
  cardDecor1: { position: "absolute", width: 120, height: 120, borderRadius: 60, backgroundColor: "rgba(255,255,255,0.07)", top: -30, right: -20 },
  cardDecor2: { position: "absolute", width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(255,255,255,0.05)", bottom: 20, right: 60 },
  dots: { flexDirection: "row", justifyContent: "center", gap: 6 },
  dot: { height: 8, borderRadius: 4 },
  sectionTitle: { fontSize: 16, fontWeight: "700", paddingHorizontal: 20 },
  actionsGrid: { flexDirection: "row", paddingHorizontal: 16, gap: 10 },
  actionCardWrapper: { flex: 1 },
  actionCard: { borderRadius: 18, padding: 14, alignItems: "center", gap: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  actionIconWrap: { width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  actionLabel: { fontSize: 13, fontWeight: "700", textAlign: "center" },
  actionDesc: { fontSize: 10, textAlign: "center", lineHeight: 14 },
  statsCard: { marginHorizontal: 16, borderRadius: 20, padding: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  statsTitle: { fontSize: 14, fontWeight: "700", marginBottom: 12 },
  statsRow: { flexDirection: "row", alignItems: "center" },
  statItem: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 20, fontWeight: "800" },
  statLabel: { fontSize: 11, marginTop: 2 },
  statDivider: { width: 1, height: 40 },
});
