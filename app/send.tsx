import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NumericKeypad } from "@/components/NumericKeypad";
import { CATEGORIES, CategoryType } from "@/constants/mockData";
import { useColors } from "@/hooks/useColors";

const ACTION_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  send: { label: "Send Money", icon: "paper-plane", color: "#6C63FF" },
  airtime: { label: "Buy Airtime", icon: "phone-portrait", color: "#F59E0B" },
  bills: { label: "Pay Bills", icon: "receipt", color: "#EC4899" },
};

export default function SendScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ action?: string; prefill?: string }>();
  const action = ACTION_CONFIG[params.action ?? "send"] ?? ACTION_CONFIG.send;
  const [amount, setAmount] = useState(params.prefill ?? "");
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | null>(null);

  const handleDigit = (digit: string) => {
    if (amount.replace(".", "").length >= 9) return;
    setAmount((prev) => prev + digit);
  };

  const handleBackspace = () => setAmount((prev) => prev.slice(0, -1));

  const formattedAmount = () => {
    if (!amount) return "0";
    return parseInt(amount).toLocaleString() + (amount.includes(".") ? "." + (amount.split(".")[1] ?? "") : "");
  };

  const handleConfirm = () => {
    if (!amount || parseFloat(amount) <= 0) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  const hasAmount = !!amount && parseFloat(amount) > 0;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: (Platform.OS === "web" ? 67 : insets.top) + 8, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-down" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>{action.label}</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.amountSection}>
          <Text style={[styles.amountLabel, { color: colors.mutedForeground }]}>Enter Amount</Text>
          <View style={styles.amountRow}>
            <Text style={[styles.currency, { color: colors.mutedForeground }]}>RWF</Text>
            <Text style={[styles.amount, { color: hasAmount ? colors.foreground : colors.border }]} numberOfLines={1} adjustsFontSizeToFit>
              {formattedAmount()}
            </Text>
          </View>
          <View style={[styles.amountUnderline, { backgroundColor: hasAmount ? action.color : colors.border }]} />
        </View>
        <NumericKeypad onPress={handleDigit} onBackspace={handleBackspace} />
        <View style={styles.categorySection}>
          <Text style={[styles.categoryTitle, { color: colors.mutedForeground }]}>Category (optional)</Text>
          <View style={styles.categoryRow}>
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <Pressable key={cat} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelectedCategory(isSelected ? null : cat); }}>
                  <View style={[styles.categoryPill, { backgroundColor: isSelected ? action.color : colors.muted, borderColor: isSelected ? action.color : "transparent" }]}>
                    <Text style={[styles.categoryPillText, { color: isSelected ? "#fff" : colors.mutedForeground }]}>{cat}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
        <View style={styles.btnSection}>
          <Pressable onPress={handleConfirm} style={({ pressed }) => [styles.actionBtn, { backgroundColor: hasAmount ? action.color : colors.muted, opacity: pressed ? 0.85 : 1 }]}>
            <Ionicons name={action.icon as any} size={20} color={hasAmount ? "#fff" : colors.mutedForeground} />
            <Text style={[styles.actionBtnText, { color: hasAmount ? "#fff" : colors.mutedForeground }]}>{action.label}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  scroll: { paddingBottom: 40, gap: 24 },
  amountSection: { alignItems: "center", paddingHorizontal: 24, paddingTop: 32, gap: 8 },
  amountLabel: { fontSize: 13, fontWeight: "500" },
  amountRow: { flexDirection: "row", alignItems: "baseline", gap: 8 },
  currency: { fontSize: 24, fontWeight: "600" },
  amount: { fontSize: 52, fontWeight: "800", letterSpacing: -2 },
  amountUnderline: { width: "60%", height: 2, borderRadius: 2, marginTop: 4 },
  categorySection: { paddingHorizontal: 16, gap: 10 },
  categoryTitle: { fontSize: 12, fontWeight: "600", paddingHorizontal: 4 },
  categoryRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  categoryPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5 },
  categoryPillText: { fontSize: 13, fontWeight: "600" },
  btnSection: { paddingHorizontal: 16 },
  actionBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 17, borderRadius: 20, gap: 8 },
  actionBtnText: { fontSize: 16, fontWeight: "700" },
});
