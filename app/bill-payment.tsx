import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { useColors } from "@/hooks/useColors";
import { getCurrentLocation, submitMerchantSignal } from "@/src/lib/merchantIntelligence";
import { payBill } from "@/src/services/ussdService";
import { RootState } from "@/src/store";

type FieldConfig = { key: string; label: string; placeholder: string; keyboardType?: "default" | "numeric" | "phone-pad" };
type BillConfig = { title: string; icon: string; color: string; fields: FieldConfig[]; hasBouquet?: boolean; buttonLabel: string };

const BILL_CONFIGS: Record<string, BillConfig> = {
  electricity: { title: "Electricity", icon: "flash", color: "#6C63FF", fields: [{ key: "meter", label: "Meter Number", placeholder: "Enter meter number" }, { key: "amount", label: "Amount (RWF)", placeholder: "e.g. 500", keyboardType: "numeric" }], buttonLabel: "Pay Bill" },
  startimes: { title: "Startimes", icon: "tv", color: "#00C9A7", fields: [{ key: "smartcard", label: "Smartcard Number", placeholder: "Enter smartcard number" }, { key: "amount", label: "Amount (RWF)", placeholder: "e.g. 500", keyboardType: "numeric" }], buttonLabel: "Pay Bill" },
  dstv: { title: "DSTV", icon: "tv", color: "#1A237E", fields: [{ key: "smartcard", label: "Smartcard Number", placeholder: "Enter smartcard number" }], hasBouquet: true, buttonLabel: "Pay Bill" },
  water: { title: "Water", icon: "water", color: "#4A47A3", fields: [{ key: "account", label: "Account Number", placeholder: "Enter account number" }], buttonLabel: "Proceed" },
  irembo: { title: "IREMBO", icon: "globe-outline", color: "#00C9A7", fields: [{ key: "account", label: "Account Number", placeholder: "Enter account number" }], buttonLabel: "Proceed" },
  "canal-plus": { title: "Canal Plus", icon: "play-circle", color: "#1A237E", fields: [{ key: "smartcard", label: "Smartcard Number", placeholder: "Enter smartcard number" }, { key: "amount", label: "Amount (RWF)", placeholder: "e.g. 5000", keyboardType: "numeric" }], buttonLabel: "Pay Bill" },
  "school-fees": { title: "School Fees", icon: "school", color: "#4A47A3", fields: [{ key: "student_id", label: "Student ID", placeholder: "Enter student ID" }, { key: "school_id", label: "School ID", placeholder: "Enter school ID" }], buttonLabel: "Proceed" },
};

const DSTV_BOUQUETS = [
  { label: "Isange (Access)", price: 5000 },
  { label: "Compact", price: 10500 },
  { label: "Compact Plus", price: 18000 },
  { label: "Premium", price: 29500 },
];

export default function BillPaymentScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const params = useLocalSearchParams<{ type: string; merchantCode?: string; merchantName?: string }>();
  const { selectedSlot, detectedOperator } = useSelector((s: RootState) => s.sim);

  // Handle direct merchant code from nearby suggestions
  const isMerchantDirect = params.type === "merchant" && !!params.merchantCode;
  const config = isMerchantDirect
    ? {
        title: params.merchantName ?? params.merchantCode ?? "Merchant",
        icon: "storefront-outline" as const,
        color: "#6C63FF",
        fields: [{ key: "amount", label: "Amount (RWF)", placeholder: "Enter amount", keyboardType: "numeric" as const }],
        buttonLabel: "Pay Merchant",
      }
    : BILL_CONFIGS[params.type ?? ""] ?? BILL_CONFIGS["electricity"];
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [selectedBouquet, setSelectedBouquet] = useState(0);
  const [bouquetOpen, setBouquetOpen] = useState(false);

  const updateField = (key: string, value: string) => setFieldValues((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    const allFilled = config.fields.every((f) => (fieldValues[f.key] ?? "").trim().length > 0);
    if (!allFilled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert("Incomplete", "Please fill in all required fields.");
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const amount = fieldValues["amount"] ?? DSTV_BOUQUETS[selectedBouquet].price.toString();
    const code = isMerchantDirect
      ? params.merchantCode!
      : fieldValues["meter"] ?? fieldValues["smartcard"] ?? fieldValues["account"] ?? fieldValues["student_id"] ?? "";
    Alert.alert(
      "Confirm Payment",
      `${config.title} payment\nAmount: RWF ${parseInt(amount).toLocaleString()}\n\nProceed?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: config.buttonLabel,
          onPress: async () => {
            const result = await payBill(code, amount, detectedOperator === 'UNKNOWN' ? 'MTN' : detectedOperator, selectedSlot);
            if (result.success) {
              getCurrentLocation().then((loc) => {
                if (loc) submitMerchantSignal(code, loc.latitude, loc.longitude);
              });
            } else {
              Alert.alert("Failed", result.error ?? "Unknown error");
            }
            router.replace("/(tabs)");
          },
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPad + 8, borderBottomColor: colors.border, backgroundColor: colors.background }]}>
          <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.muted }]}>
            <Ionicons name="chevron-back" size={20} color={colors.foreground} />
          </Pressable>
          <View style={styles.headerCenter}>
            <View style={[styles.headerIcon, { backgroundColor: config.color + "18" }]}>
              <Ionicons name={config.icon as any} size={18} color={config.color} />
            </View>
            <Text style={[styles.headerTitle, { color: colors.primary }]}>{config.title}</Text>
          </View>
          <View style={{ width: 38 }} />
        </View>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 24 }]}>
          <View style={styles.form}>
            {config.fields.map((field) => (
              <View key={field.key} style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.foreground }]}>{field.label}</Text>
                <TextInput style={[styles.fieldInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]} placeholder={field.placeholder} placeholderTextColor={colors.mutedForeground} value={fieldValues[field.key] ?? ""} onChangeText={(v) => updateField(field.key, v)} keyboardType={field.keyboardType ?? "default"} autoCapitalize="none" autoCorrect={false} />
              </View>
            ))}
            {config.hasBouquet && (
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Bouquet</Text>
                <Pressable onPress={() => setBouquetOpen((o) => !o)} style={[styles.bouquetTrigger, { backgroundColor: colors.card, borderColor: bouquetOpen ? colors.primary : colors.border }]}>
                  <Text style={[styles.bouquetSelected, { color: colors.foreground }]}>{DSTV_BOUQUETS[selectedBouquet].label} — RWF {DSTV_BOUQUETS[selectedBouquet].price.toLocaleString()}</Text>
                  <Ionicons name={bouquetOpen ? "chevron-up" : "chevron-down"} size={18} color={colors.mutedForeground} />
                </Pressable>
                {bouquetOpen && (
                  <View style={[styles.bouquetDropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    {DSTV_BOUQUETS.map((b, i) => (
                      <Pressable key={i} onPress={() => { setSelectedBouquet(i); setBouquetOpen(false); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }} style={[styles.bouquetOption, i < DSTV_BOUQUETS.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
                        <Text style={[styles.bouquetOptionText, { color: colors.foreground }]}>{b.label}</Text>
                        <View style={styles.bouquetOptionRight}>
                          <Text style={[styles.bouquetPrice, { color: colors.mutedForeground }]}>RWF {b.price.toLocaleString()}</Text>
                          {i === selectedBouquet && <Ionicons name="checkmark-circle" size={18} color={colors.primary} />}
                        </View>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>
        </ScrollView>
        <View style={[styles.footer, { paddingBottom: bottomPad + 16, borderTopColor: colors.border, backgroundColor: colors.background }]}>
          <Pressable onPress={handleSubmit} style={({ pressed }) => [styles.submitBtn, { backgroundColor: config.color, opacity: pressed ? 0.82 : 1 }]}>
            <Text style={styles.submitBtnText}>{config.buttonLabel}</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
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
  headerCenter: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  scroll: { flexGrow: 1 },
  form: { padding: 20, gap: 20 },
  fieldGroup: { gap: 8 },
  fieldLabel: { fontSize: 14, fontWeight: "600" },
  fieldInput: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15 },
  bouquetTrigger: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14 },
  bouquetSelected: { fontSize: 15, flex: 1 },
  bouquetDropdown: { borderWidth: 1, borderRadius: 14, overflow: "hidden", marginTop: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  bouquetOption: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14 },
  bouquetOptionText: { fontSize: 14, fontWeight: "500" },
  bouquetOptionRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  bouquetPrice: { fontSize: 13 },
  footer: { paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1 },
  submitBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 16, borderRadius: 16 },
  submitBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
