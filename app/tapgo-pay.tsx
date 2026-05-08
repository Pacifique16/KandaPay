import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { useColors } from "@/hooks/useColors";
import { payBill } from "@/src/services/ussdService";
import { RootState } from "@/src/store";
import { updateBalance } from "@/src/store/slices/tapGoSlice";

const QUICK_AMOUNTS = [500, 1000, 1500];
const OTHER_MOBILE_ID = "other_mobile";

export default function TapGoPayScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const params = useLocalSearchParams<{ cardId: string; cardName: string }>();
  const dispatch = useDispatch();
  const { detectedOperator, selectedSlot, cards } = useSelector((s: RootState) => s.sim);
  const profile = useSelector((s: RootState) => s.profile);

  const [amount, setAmount] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<"MTN" | "AIRTEL" | "other_mobile">(
    detectedOperator === "AIRTEL" ? "AIRTEL" : "MTN"
  );
  const [otherPhone, setOtherPhone] = useState("");
  const [selectedNumberBox, setSelectedNumberBox] = useState<"registered" | "other">("registered");

  const mtnPhone = profile.phone?.startsWith("078") || profile.phone?.startsWith("079") ? profile.phone : "";
  const airtelPhone = profile.phone?.startsWith("072") || profile.phone?.startsWith("073") ? profile.phone : "";

  const billedNumber =
    selectedMethod === "MTN" ? mtnPhone || "078XXXXXXX" :
    selectedMethod === "AIRTEL" ? airtelPhone || "073XXXXXXX" :
    otherPhone;

  const handleSelectMethod = (method: "MTN" | "AIRTEL" | "other_mobile") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedMethod(method);
    if (method !== OTHER_MOBILE_ID) setSelectedNumberBox("registered");
  };

  const handlePay = async () => {
    if (!amount || parseInt(amount) <= 0) {
      Alert.alert("Required", "Please enter an amount.");
      return;
    }
    const phone = selectedNumberBox === "other" ? otherPhone.trim() : billedNumber;
    if (!phone || phone.includes("X")) {
      Alert.alert("Required", "Please enter a valid phone number.");
      return;
    }
    Alert.alert(
      "Confirm Top Up",
      `Top up ${params.cardId} with RWF ${parseInt(amount).toLocaleString()}\nBilled to: ${phone}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Pay",
          onPress: async () => {
            const operator = selectedMethod === OTHER_MOBILE_ID ? detectedOperator : selectedMethod;
            const cardNumber = (params.cardId ?? "").trim().toUpperCase();
            dispatch(updateBalance({ cardNumber, amount: parseInt(amount) }));
            await payBill(cardNumber, amount, operator === "UNKNOWN" ? "MTN" : operator, selectedSlot);
            router.replace("/(tabs)");
          },
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: topPad + 8, borderBottomColor: colors.border, backgroundColor: colors.background }]}>
          <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.muted }]}>
            <Ionicons name="chevron-back" size={20} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.primary }]}>Top Up</Text>
          <View style={{ width: 38 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 100 }]}>

          {/* Set Amount */}
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>SET AMOUNT</Text>
          <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>How much would you like to top up?</Text>

          <View style={styles.amountDisplay}>
            <TextInput
              style={[styles.amountValue, { color: colors.foreground, minWidth: 60 }]}
              value={amount}
              onChangeText={(t) => setAmount(t.replace(/[^0-9]/g, ""))}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={colors.mutedForeground}
              textAlign="center"
            />
            <Text style={[styles.amountCurrency, { color: colors.mutedForeground }]}> RWF</Text>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.quickAmounts}>
            {QUICK_AMOUNTS.map((q) => (
              <Pressable
                key={q}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setAmount(q.toString()); }}
                style={styles.quickChip}
              >
                <Text style={[styles.quickChipText, { color: amount === q.toString() ? colors.primary : colors.foreground }]}>
                  {q.toLocaleString()} RWF
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Pay With */}
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 28 }]}>PAY WITH</Text>
          <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>Select method you want to use for payment</Text>

          <View style={styles.methodRow}>
            {/* MTN Card */}
            <Pressable onPress={() => handleSelectMethod("MTN")} style={[styles.methodCard, { borderColor: selectedMethod === "MTN" ? colors.primary : colors.border, borderWidth: selectedMethod === "MTN" ? 2 : 1 }]}>
              <LinearGradient colors={["#FFCC00", "#FF8C00"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.methodCardGradient}>
                <View style={styles.methodCardTop}>
                  <Text style={styles.mtnLogoText}>MTN</Text>
                  <View style={[styles.radio, { borderColor: selectedMethod === "MTN" ? "#fff" : "rgba(255,255,255,0.5)" }]}>
                    {selectedMethod === "MTN" && <Ionicons name="checkmark" size={12} color="#fff" />}
                  </View>
                </View>
                <Text style={styles.methodCardLabel}>MTN MoMo</Text>
              </LinearGradient>
            </Pressable>

            {/* Airtel Card */}
            <Pressable onPress={() => handleSelectMethod("AIRTEL")} style={[styles.methodCard, { borderColor: selectedMethod === "AIRTEL" ? colors.primary : colors.border, borderWidth: selectedMethod === "AIRTEL" ? 2 : 1 }]}>
              <LinearGradient colors={["#E53935", "#B71C1C"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.methodCardGradient}>
                <View style={styles.methodCardTop}>
                  <Text style={styles.airtelLogoText}>airtel</Text>
                  <View style={[styles.radio, { borderColor: selectedMethod === "AIRTEL" ? "#fff" : "rgba(255,255,255,0.5)" }]}>
                    {selectedMethod === "AIRTEL" && <Ionicons name="checkmark" size={12} color="#fff" />}
                  </View>
                </View>
                <Text style={styles.methodCardLabel}>Airtel Money</Text>
              </LinearGradient>
            </Pressable>
          </View>

          {/* Billed number box */}
          {selectedMethod !== OTHER_MOBILE_ID && (
            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelectedNumberBox("registered"); }}
              style={[styles.billedBox, { backgroundColor: colors.card, borderColor: selectedNumberBox === "registered" ? colors.primary : colors.border, borderWidth: selectedNumberBox === "registered" ? 2 : 1 }]}
            >
              <View style={styles.billedBoxInner}>
                <Text style={[styles.billedNumber, { color: colors.foreground }]}>{billedNumber}</Text>
                <View style={[styles.radio, { borderColor: selectedNumberBox === "registered" ? colors.primary : colors.border }]}>
                  {selectedNumberBox === "registered" && <Ionicons name="checkmark" size={12} color={colors.primary} />}
                </View>
              </View>
            </Pressable>
          )}

          {/* Other Mobile Number */}
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelectedNumberBox("other"); }}
            style={[styles.otherOption, { backgroundColor: colors.card, borderColor: selectedNumberBox === "other" ? colors.primary : colors.border, borderWidth: selectedNumberBox === "other" ? 2 : 1 }]}
          >
            <Text style={[styles.otherOptionText, { color: colors.foreground }]}>Other Mobile Number</Text>
            <View style={[styles.radio, { borderColor: selectedMethod === OTHER_MOBILE_ID ? colors.primary : colors.border }]}>
              {selectedMethod === OTHER_MOBILE_ID && <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />}
            </View>
          </Pressable>

          {selectedNumberBox === "other" && (
            <View style={styles.otherInputWrap}>
              <Text style={[styles.inputLabel, { color: colors.foreground }]}>Phone Number</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                placeholder="e.g. 0789534491"
                placeholderTextColor={colors.mutedForeground}
                value={otherPhone}
                onChangeText={setOtherPhone}
                keyboardType="phone-pad"
                autoFocus
              />
            </View>
          )}
        </ScrollView>

        {/* Pay button */}
        <View style={[styles.footer, { paddingBottom: bottomPad + 16, borderTopColor: colors.border, backgroundColor: colors.background }]}>
          <Pressable onPress={handlePay} style={({ pressed }) => [styles.payBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.82 : 1 }]}>
            <Text style={styles.payBtnText}>Pay</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  backBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  scroll: { paddingHorizontal: 16, paddingTop: 24, gap: 0 },
  sectionLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 1.2, marginBottom: 4 },
  sectionSub: { fontSize: 13, marginBottom: 16 },
  amountDisplay: { flexDirection: "row", alignItems: "baseline", justifyContent: "center", marginBottom: 20 },
  amountValue: { fontSize: 32, fontWeight: "800", padding: 0, minWidth: 60, textAlign: "center" },
  amountCurrency: { fontSize: 16, fontWeight: "600" },
  amountInput: { fontSize: 15, textAlign: "center", borderBottomWidth: 1, paddingVertical: 8, marginBottom: 20 },
  divider: { height: 1, marginBottom: 16 },
  quickAmounts: { flexDirection: "row", justifyContent: "center", gap: 6, marginBottom: 8 },
  quickChip: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 10, backgroundColor: "#E8F5E9", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  quickChipText: { fontSize: 11, fontWeight: "600" },
  methodRow: { flexDirection: "row", gap: 12, marginBottom: 12 },
  methodCard: { flex: 1, borderRadius: 16, overflow: "hidden" },
  methodCardGradient: { padding: 16, height: 100, justifyContent: "space-between" },
  methodCardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  mtnLogoText: { color: "#fff", fontSize: 13, fontWeight: "900", letterSpacing: 1 },
  airtelLogoText: { color: "#fff", fontSize: 13, fontWeight: "700", letterSpacing: 0.5 },
  methodCardLabel: { color: "#fff", fontSize: 13, fontWeight: "700" },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  billedBox: { borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 12 },
  billedBoxInner: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  billedNumber: { fontSize: 15, fontWeight: "600" },
  otherOption: { flexDirection: "row", alignItems: "center", borderRadius: 16, padding: 16, gap: 14, marginBottom: 12 },
  cardIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  otherOptionText: { flex: 1, fontSize: 15, fontWeight: "600" },
  otherInputWrap: { gap: 8, marginBottom: 12 },
  inputLabel: { fontSize: 14, fontWeight: "600" },
  input: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15 },
  footer: { paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1 },
  payBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 16, borderRadius: 16 },
  payBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
