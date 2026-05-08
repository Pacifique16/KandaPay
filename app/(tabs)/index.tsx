import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { NumericKeypad } from "@/components/NumericKeypad";
import { EXPENSE_TAGS, ExpenseTag } from "@/constants/mockData";
import { useColors } from "@/hooks/useColors";
import { getCurrentLocation, getNearbyMerchants } from "@/src/lib/merchantIntelligence";
import { getSimCards, requestUssdPermissions } from "@/src/modules/ussd/UssdBridge";
import { checkBalance } from "@/src/services/ussdService";
import { RootState } from "@/src/store";
import { setDetectedOperator, setSimCards } from "@/src/store/slices/simSlice";

const QUICK_ACTIONS = [
  { id: "send", label: "Send Money", icon: "paper-plane-outline", color: "#6C63FF" },
  { id: "airtime", label: "Buy Airtime", icon: "phone-portrait-outline", color: "#F59E0B" },
  { id: "bills", label: "Pay Bills", icon: "receipt-outline", color: "#EC4899" },
] as const;

const VISIBLE_TAGS: ExpenseTag[] = ["house", "school_fees", "transport"];

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const { detectedOperator, selectedSlot } = useSelector((s: RootState) => s.sim);
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [amount, setAmount] = useState("");
  const [selectedAction, setSelectedAction] = useState<typeof QUICK_ACTIONS[number]["id"]>("send");
  const [activeTags, setActiveTags] = useState<ExpenseTag[]>([]);

  useEffect(() => {
    const init = async () => {
      await requestUssdPermissions();
      const sims = await getSimCards();
      dispatch(setSimCards(sims));
      if (sims.length > 0) {
        const name = sims[0].operatorName.toUpperCase();
        let operator: "MTN" | "AIRTEL" | "UNKNOWN" = "UNKNOWN";
        if (name.includes("MTN")) operator = "MTN";
        else if (name.includes("AIRTEL")) operator = "AIRTEL";
        else operator = "MTN";
        dispatch(setDetectedOperator(operator));
      }
      // Pre-warm nearby merchants cache in background silently
      const loc = await getCurrentLocation();
      if (loc) getNearbyMerchants(loc.latitude, loc.longitude, 40);
    };
    init();
  }, []);

  const handleDigit = useCallback((digit: string) => {
    if (amount.replace(".", "").length >= 9) return;
    setAmount((prev) => prev + digit);
  }, [amount]);

  const handleBackspace = useCallback(() => setAmount((prev) => prev.slice(0, -1)), []);

  const handleClear = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setAmount("");
    setActiveTags([]);
  }, []);

  const toggleTag = useCallback((tag: ExpenseTag) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  }, []);

  const displayAmount = useMemo(() => (!amount ? "0" : parseInt(amount, 10).toLocaleString()), [amount]);
  const hasAmount = !!amount && parseFloat(amount) > 0;
  const selectedActionData = QUICK_ACTIONS.find((a) => a.id === selectedAction)!;

  const handlePay = useCallback(() => {
    if (!hasAmount) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: "/recipient-picker",
      params: { amount, action: selectedAction, actionColor: selectedActionData.color, actionLabel: selectedActionData.label },
    });
  }, [hasAmount, amount, selectedAction, selectedActionData]);

  const handleBalance = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const operator = detectedOperator === "UNKNOWN" ? "MTN" : detectedOperator;
    const result = await checkBalance(operator, selectedSlot);
    Alert.alert("Balance", result.response ?? result.error ?? "No response");
  }, [detectedOperator, selectedSlot]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={["#0D1035", "#1A237E"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.amountCard, { marginTop: topPad + 12 }]}
      >
        <View style={styles.operatorRow}>
          <View style={styles.operatorBadge}>
            <Text style={styles.operatorFlag}>🇷🇼</Text>
            <Text style={styles.operatorName}>{detectedOperator !== "UNKNOWN" ? detectedOperator : "MTN"}</Text>
          </View>
        </View>
        <View style={styles.amountRow}>
          <Text style={styles.amountDisplay} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.4}>
            {displayAmount}
          </Text>
          <Text style={styles.currencyLabel}>RWF</Text>
        </View>
        <View style={styles.tagsRow}>
          {VISIBLE_TAGS.map((tag) => {
            const isActive = activeTags.includes(tag);
            return (
              <Pressable key={tag} onPress={() => toggleTag(tag)} style={[styles.tag, isActive && styles.tagActive]}>
                {isActive && <Ionicons name="checkmark" size={11} color="rgba(255,255,255,0.9)" />}
                <Text style={[styles.tagText, isActive && styles.tagTextActive]}>{tag}</Text>
              </Pressable>
            );
          })}
          <Pressable style={styles.addTagBtn}>
            <Text style={styles.addTagText}>+ finance</Text>
          </Pressable>
        </View>
      </LinearGradient>

      <View style={styles.quickActionsRow}>
        {QUICK_ACTIONS.map((action) => {
          const isSelected = selectedAction === action.id;
          return (
            <Pressable
              key={action.id}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelectedAction(action.id); }}
              style={[styles.quickActionBtn, {
                backgroundColor: isSelected ? action.color : colors.card,
                borderColor: isSelected ? action.color : colors.border,
                shadowColor: isSelected ? action.color : "transparent",
              }]}
            >
              <Ionicons name={action.icon} size={15} color={isSelected ? "#fff" : colors.mutedForeground} />
              <Text style={[styles.quickActionLabel, { color: isSelected ? "#fff" : colors.mutedForeground }]} numberOfLines={1}>
                {action.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.keypadWrapper}>
        <NumericKeypad onPress={handleDigit} onBackspace={handleBackspace} onClear={handleClear} />
      </View>

      <View style={[styles.bottomActions, { paddingBottom: bottomPad + 96 }]}>
        <Pressable onPress={handleBalance} style={[styles.bottomBtn, styles.balanceBtn, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <Ionicons name="wallet-outline" size={18} color={colors.foreground} />
          <Text style={[styles.bottomBtnText, { color: colors.foreground }]}>Balance</Text>
        </Pressable>
        <Pressable onPress={handlePay} style={[styles.bottomBtn, { backgroundColor: hasAmount ? selectedActionData.color : colors.muted }]}>
          <Ionicons name="arrow-up-circle-outline" size={18} color={hasAmount ? "#fff" : colors.mutedForeground} />
          <Text style={[styles.bottomBtnText, { color: hasAmount ? "#fff" : colors.mutedForeground }]}>
            {selectedActionData.label}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  amountCard: { marginHorizontal: 16, borderRadius: 24, padding: 20, paddingBottom: 16, shadowColor: "#1A237E", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 12 },
  operatorRow: { alignItems: "flex-end", marginBottom: 4 },
  operatorBadge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(255,255,255,0.12)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  operatorFlag: { fontSize: 14 },
  operatorName: { color: "rgba(255,255,255,0.9)", fontSize: 13, fontWeight: "700", letterSpacing: 0.5 },
  amountRow: { flexDirection: "row", alignItems: "baseline", justifyContent: "center", gap: 6, paddingVertical: 8 },
  amountDisplay: { fontSize: 52, fontWeight: "800", color: "#FFFFFF", letterSpacing: -2 },
  currencyLabel: { fontSize: 22, fontWeight: "600", color: "rgba(255,255,255,0.7)", letterSpacing: 1 },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 6 },
  tag: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)" },
  tagActive: { backgroundColor: "rgba(255,255,255,0.18)", borderColor: "rgba(255,255,255,0.3)" },
  tagText: { color: "rgba(255,255,255,0.55)", fontSize: 11, fontWeight: "500" },
  tagTextActive: { color: "rgba(255,255,255,0.95)" },
  addTagBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.15)", borderStyle: "dashed" },
  addTagText: { color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: "500" },
  quickActionsRow: { flexDirection: "row", paddingHorizontal: 16, paddingTop: 14, gap: 8 },
  quickActionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 10, paddingHorizontal: 6, borderRadius: 14, borderWidth: 1.5, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 },
  quickActionLabel: { fontSize: 11, fontWeight: "600" },
  keypadWrapper: { flex: 1, justifyContent: "center", paddingTop: 4 },
  bottomActions: { flexDirection: "row", paddingHorizontal: 16, gap: 10 },
  bottomBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 15, borderRadius: 18 },
  balanceBtn: { borderWidth: 1.5, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  bottomBtnText: { fontSize: 15, fontWeight: "700" },
});
