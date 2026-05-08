import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Animated, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { NumericKeypad } from "@/components/NumericKeypad";
import { EXPENSE_TAGS, ExpenseTag } from "@/constants/mockData";
import { useColors } from "@/hooks/useColors";
import { getCurrentLocation, getNearbyMerchants } from "@/src/lib/merchantIntelligence";
import { getSimCards, requestUssdPermissions } from "@/src/modules/ussd/UssdBridge";
import { checkBalance } from "@/src/services/ussdService";
import { RootState } from "@/src/store";
import { setDetectedOperator, setSelectedSlot, setSimCards } from "@/src/store/slices/simSlice";

const VISIBLE_TAGS: ExpenseTag[] = ["house", "school_fees", "transport"];

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const { detectedOperator, selectedSlot, cards } = useSelector((s: RootState) => s.sim);

  const IOS_OPERATORS = ["MTN", "AIRTEL"] as const;

  const SimSelector = useCallback(() => {
    // iOS — manual operator segmented toggle
    if (Platform.OS === "ios") {
      return (
        <View style={styles.operatorRow}>
          <View style={styles.segmentedToggle}>
            {IOS_OPERATORS.map((op, i) => {
              const isSelected = detectedOperator === op;
              return (
                <Pressable
                  key={op}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    dispatch(setDetectedOperator(op));
                  }}
                  style={[
                    styles.segmentBtn,
                    i === 0 && styles.segmentBtnLeft,
                    i === IOS_OPERATORS.length - 1 && styles.segmentBtnRight,
                    isSelected && styles.segmentBtnActive,
                  ]}
                >
                  <Text style={[styles.segmentText, isSelected && styles.segmentTextActive]}>
                    {op}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      );
    }
    // Android — auto-detected SIMs
    if (cards.length === 0) return null;
    if (cards.length === 1) {
      if (detectedOperator === "UNKNOWN") return null;
      return (
        <View style={styles.operatorRow}>
          <View style={styles.operatorBadge}>
            <Text style={styles.operatorFlag}>🇷🇼</Text>
            <Text style={styles.operatorName}>{detectedOperator}</Text>
          </View>
        </View>
      );
    }
    // Dual SIM Android
    return (
      <View style={styles.operatorRow}>
        {cards.map((sim) => {
          const name = sim.operatorName.toUpperCase();
          const op = name.includes("MTN") ? "MTN" : name.includes("AIRTEL") ? "AIRTEL" : sim.operatorName || `SIM ${sim.slotIndex + 1}`;
          const isSelected = sim.slotIndex === selectedSlot;
          return (
            <Pressable
              key={sim.slotIndex}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                dispatch(setSelectedSlot(sim.slotIndex));
                const opName = name.includes("MTN") ? "MTN" : name.includes("AIRTEL") ? "AIRTEL" : "MTN";
                dispatch(setDetectedOperator(opName as "MTN" | "AIRTEL"));
              }}
              style={[styles.simPill, isSelected && styles.simPillActive]}
            >
              <Text style={styles.operatorFlag}>🇷🇼</Text>
              <Text style={[styles.operatorName, !isSelected && { color: "rgba(255,255,255,0.5)" }]}>
                SIM{sim.slotIndex + 1} · {op}
              </Text>
              {isSelected && <View style={styles.simDot} />}
            </Pressable>
          );
        })}
      </View>
    );
  }, [cards, selectedSlot, detectedOperator]);
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [amount, setAmount] = useState("");
  const [activeTags, setActiveTags] = useState<ExpenseTag[]>([]);

  useEffect(() => {
    if (Platform.OS === 'ios') {
      // Set MTN as default on iOS if no operator selected yet
      if (detectedOperator === 'UNKNOWN') dispatch(setDetectedOperator('MTN'));
      return;
    }
    const init = async () => {
      await requestUssdPermissions();
      const sims = await getSimCards();
      dispatch(setSimCards(sims));
      if (sims.length > 0) {
        // Use the currently selected slot's operator
        const activeSim = sims.find(s => s.slotIndex === selectedSlot) ?? sims[0];
        const name = activeSim.operatorName.toUpperCase();
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
  }, [selectedSlot]);

  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shake = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  }, [shakeAnim]);

  const handleDigit = useCallback((digit: string) => {
    if (amount.replace(".", "").length >= 9) return;
    const next = amount + digit;
    if (parseInt(next, 10) > 1000000) return;
    setAmount(next);
  }, [amount]);

  const handleBackspace = useCallback(() => setAmount((prev) => prev.slice(0, -1)), []);

  const handleClear = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setAmount("");
    setActiveTags([]);
  }, []);

  const [customTags, setCustomTags] = useState<ExpenseTag[]>([]);
  const [tagInputVisible, setTagInputVisible] = useState(false);
  const [tagInputText, setTagInputText] = useState("");

  // Load persisted custom tags on mount
  useEffect(() => {
    AsyncStorage.getItem("customTags").then((val) => {
      if (val) setCustomTags(JSON.parse(val));
    });
  }, []);

  const handleAddTag = useCallback(() => {
    setTagInputText("");
    setTagInputVisible(true);
  }, []);

  const confirmAddTag = useCallback(() => {
    const tag = tagInputText.trim().toLowerCase().replace(/\s+/g, "_") as ExpenseTag;
    if (tag && !customTags.includes(tag)) {
      const updated = [...customTags, tag];
      setCustomTags(updated);
      AsyncStorage.setItem("customTags", JSON.stringify(updated));
    }
    setTagInputVisible(false);
  }, [tagInputText, customTags]);


  const toggleTag = useCallback((tag: ExpenseTag) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  }, []);

  const displayAmount = useMemo(() => (!amount ? "0" : parseInt(amount, 10).toLocaleString()), [amount]);
  const hasAmount = !!amount && parseFloat(amount) > 0;
  const handlePay = useCallback(() => {
    if (!hasAmount) { shake(); return; }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: "/recipient-picker",
      params: { amount, action: "send", actionColor: "#6C63FF", actionLabel: "Send Money" },
    });
  }, [hasAmount, amount, shake]);

  const handleAirtime = useCallback(() => {
    if (!hasAmount) { shake(); return; }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({ pathname: "/airtime-picker", params: { amount } });
  }, [hasAmount, amount, shake]);

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
        <SimSelector />
        <Animated.View style={[styles.amountRow, { transform: [{ translateX: shakeAnim }] }]}>
          <Text style={styles.amountDisplay} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.3}>
            {displayAmount}
          </Text>
          <Text style={styles.currencyLabel}>RWF</Text>
        </Animated.View>
        <View style={styles.tagsRow}>
          {[...VISIBLE_TAGS, ...customTags].map((tag) => {
            const isActive = activeTags.includes(tag);
            return (
              <Pressable key={tag} onPress={() => toggleTag(tag)} style={[styles.tag, isActive && styles.tagActive]}>
                {isActive && <Ionicons name="checkmark" size={11} color="rgba(255,255,255,0.9)" />}
                <Text style={[styles.tagText, isActive && styles.tagTextActive]}>{tag.replace(/_/g, " ")}</Text>
              </Pressable>
            );
          })}
          <Pressable onPress={handleAddTag} style={styles.addTagBtn}>
            <Text style={styles.addTagText}>+ add tag</Text>
          </Pressable>
        </View>
      </LinearGradient>


      <View style={styles.keypadWrapper}>
        <NumericKeypad onPress={handleDigit} onBackspace={handleBackspace} onClear={handleClear} />
      </View>

      <View style={[styles.bottomActions, { paddingBottom: bottomPad + 96 }]}>
        <Pressable onPress={handleBalance} style={[styles.bottomBtn, styles.balanceBtn, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <Ionicons name="wallet-outline" size={16} color={colors.foreground} />
          <Text style={[styles.bottomBtnText, { color: colors.foreground }]} numberOfLines={1} adjustsFontSizeToFit>Balance</Text>
        </Pressable>
        <Pressable onPress={handleAirtime} style={[styles.bottomBtn, !hasAmount && styles.inactiveBtn, { backgroundColor: hasAmount ? "#F59E0B" : "rgba(0,0,0,0.03)" }]}>
          <Ionicons name="phone-portrait-outline" size={16} color={hasAmount ? "#fff" : colors.mutedForeground} />
          <Text style={[styles.bottomBtnText, { color: hasAmount ? "#fff" : colors.mutedForeground }]} numberOfLines={1} adjustsFontSizeToFit>Airtime</Text>
        </Pressable>
        <Pressable onPress={handlePay} style={[styles.bottomBtn, !hasAmount && styles.inactiveBtn, { backgroundColor: hasAmount ? "#6C63FF" : "rgba(0,0,0,0.03)" }]}>
          <Ionicons name="arrow-up-circle-outline" size={16} color={hasAmount ? "#fff" : colors.mutedForeground} />
          <Text style={[styles.bottomBtnText, { color: hasAmount ? "#fff" : colors.mutedForeground }]} numberOfLines={1} adjustsFontSizeToFit>Send</Text>
        </Pressable>
      </View>
      <Modal visible={tagInputVisible} transparent animationType="fade" onRequestClose={() => setTagInputVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setTagInputVisible(false)}>
          <Pressable style={[styles.tagModal, { backgroundColor: colors.card }]} onPress={() => {}}>
            <Text style={[styles.tagModalTitle, { color: colors.foreground }]}>Add Tag</Text>
            <TextInput
              style={[styles.tagModalInput, { color: colors.foreground, borderColor: colors.border }]}
              placeholder="e.g. rent, sport, food"
              placeholderTextColor={colors.mutedForeground}
              value={tagInputText}
              onChangeText={(t) => setTagInputText(t.toLowerCase())}
              autoFocus
              onSubmitEditing={confirmAddTag}
              returnKeyType="done"
            />
            <View style={styles.tagModalActions}>
              <Pressable onPress={() => setTagInputVisible(false)} style={[styles.tagModalBtn, { borderColor: colors.border }]}>
                <Text style={[styles.tagModalBtnText, { color: colors.mutedForeground }]}>Cancel</Text>
              </Pressable>
              <Pressable onPress={confirmAddTag} style={[styles.tagModalBtn, styles.tagModalBtnPrimary]}>
                <Text style={[styles.tagModalBtnText, { color: "#fff" }]}>Add</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  amountCard: { marginHorizontal: 16, borderRadius: 24, padding: 28, paddingBottom: 28, shadowColor: "#1A237E", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 12 },
  operatorRow: { flexDirection: "row", justifyContent: "flex-end", gap: 6, marginBottom: 4 },
  operatorBadge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(255,255,255,0.12)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  operatorFlag: { fontSize: 14 },
  operatorName: { color: "rgba(255,255,255,0.9)", fontSize: 13, fontWeight: "700", letterSpacing: 0.5 },
  simPill: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(255,255,255,0.08)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  simPillActive: { backgroundColor: "rgba(255,255,255,0.18)", borderColor: "rgba(255,255,255,0.35)" },
  simDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#4ADE80" },
  segmentedToggle: { flexDirection: "row", backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", overflow: "hidden", alignSelf: "flex-end" },
  segmentBtn: { paddingHorizontal: 10, paddingVertical: 4 },
  segmentBtnLeft: { borderRightWidth: 1, borderRightColor: "rgba(255,255,255,0.12)" },
  segmentBtnRight: {},
  segmentBtnActive: { backgroundColor: "rgba(255,255,255,0.22)" },
  segmentText: { color: "rgba(255,255,255,0.4)", fontSize: 12, fontWeight: "600", letterSpacing: 0.5 },
  segmentTextActive: { color: "#fff" },
  amountRow: { flexDirection: "row", alignItems: "baseline", justifyContent: "center", gap: 6, paddingVertical: 22, overflow: "hidden" },
  amountDisplay: { flexShrink: 1, fontSize: 48, fontWeight: "800", color: "#FFFFFF", letterSpacing: -2, textAlign: "center" },
  currencyLabel: { fontSize: 28, fontWeight: "600", color: "rgba(255,255,255,0.7)", letterSpacing: 1 },
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
  bottomBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 13, borderRadius: 12 },
  balanceBtn: { borderWidth: 1.5, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  inactiveBtn: { borderWidth: 1, borderColor: "rgba(0,0,0,0.08)", backgroundColor: "rgba(0,0,0,0.04)" },
  bottomBtnText: { fontSize: 13, fontWeight: "700" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  tagModal: { width: 280, borderRadius: 20, padding: 20, gap: 14 },
  tagModalTitle: { fontSize: 16, fontWeight: "700", textAlign: "center" },
  tagModalInput: { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15 },
  tagModalActions: { flexDirection: "row", gap: 10 },
  tagModalBtn: { flex: 1, paddingVertical: 11, borderRadius: 12, alignItems: "center", borderWidth: 1.5 },
  tagModalBtnPrimary: { backgroundColor: "#1A237E", borderColor: "#1A237E" },
  tagModalBtnText: { fontSize: 14, fontWeight: "700" },
});
