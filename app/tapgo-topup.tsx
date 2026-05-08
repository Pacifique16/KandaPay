import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { useColors } from "@/hooks/useColors";
import { RootState } from "@/src/store";

const OTHER_ID = "other";

export default function TapGoTopUpScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const cards = useSelector((s: RootState) => s.tapGo);
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [selectedCard, setSelectedCard] = useState(cards[0]?.cardNumber ?? OTHER_ID);
  const [otherCardNumber, setOtherCardNumber] = useState("");

  const handleSelect = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCard(id);
  };

  const handleContinue = () => {
    const cardId = selectedCard === OTHER_ID ? otherCardNumber.trim() : selectedCard;
    if (selectedCard === OTHER_ID && !cardId) {
      Alert.alert("Required", "Please enter the card number.");
      return;
    }
    const cardName = cards.find((c) => c.cardNumber === selectedCard)?.name ?? cardId;
    router.push({ pathname: "/tapgo-pay", params: { cardId, cardName } });
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
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>SELECT CARD</Text>
          <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>Select card you want to top up</Text>

          <View style={styles.cardList}>
            {cards.map((card) => {
              const isSelected = selectedCard === card.cardNumber;
              return (
                <Pressable
                  key={card.id}
                  onPress={() => handleSelect(card.cardNumber)}
                  style={[styles.cardOption, { backgroundColor: colors.card, borderColor: isSelected ? colors.primary : colors.border, borderWidth: isSelected ? 2 : 1 }]}
                >
                  <View style={styles.cardInfo}>
                    <Text style={[styles.cardId, { color: colors.foreground }]}>{card.cardNumber}</Text>
                    <Text style={[styles.cardName, { color: colors.mutedForeground }]}>{card.name}</Text>
                  </View>
                  <View style={[styles.radio, { borderColor: isSelected ? colors.primary : colors.border }]}>
                    {isSelected && <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />}
                  </View>
                </Pressable>
              );
            })}

            {/* Other card option */}
            <Pressable
              onPress={() => handleSelect(OTHER_ID)}
              style={[styles.cardOption, { backgroundColor: colors.card, borderColor: selectedCard === OTHER_ID ? colors.primary : colors.border, borderWidth: selectedCard === OTHER_ID ? 2 : 1 }]}
            >
              <View style={styles.cardInfo}>
                <Text style={[styles.cardId, { color: colors.foreground }]}>Other Tap & Go card</Text>
              </View>
              <View style={[styles.radio, { borderColor: selectedCard === OTHER_ID ? colors.primary : colors.border }]}>
                {selectedCard === OTHER_ID && <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />}
              </View>
            </Pressable>

            {/* Card number input for Other */}
            {selectedCard === OTHER_ID && (
              <View style={styles.otherInputWrap}>
                <Text style={[styles.inputLabel, { color: colors.foreground }]}>Card Number</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                  placeholder="Enter card number"
                  placeholderTextColor={colors.mutedForeground}
                  value={otherCardNumber}
                  onChangeText={setOtherCardNumber}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  autoFocus
                />
              </View>
            )}
          </View>
        </ScrollView>

        {/* Continue button */}
        <View style={[styles.footer, { paddingBottom: bottomPad + 16, borderTopColor: colors.border, backgroundColor: colors.background }]}>
          <Pressable onPress={handleContinue} style={({ pressed }) => [styles.continueBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.82 : 1 }]}>
            <Text style={styles.continueBtnText}>Continue</Text>
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
  scroll: { paddingHorizontal: 16, paddingTop: 24 },
  sectionLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 1.2, marginBottom: 4 },
  sectionSub: { fontSize: 13, marginBottom: 20 },
  cardList: { gap: 12 },
  cardOption: { flexDirection: "row", alignItems: "center", borderRadius: 16, padding: 16, gap: 14 },
  cardIconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  cardInfo: { flex: 1, gap: 2 },
  cardId: { fontSize: 15, fontWeight: "700" },
  cardName: { fontSize: 13 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  radioDot: { width: 11, height: 11, borderRadius: 6 },
  otherInputWrap: { gap: 8, marginTop: 4 },
  inputLabel: { fontSize: 14, fontWeight: "600" },
  input: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15 },
  footer: { paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1 },
  continueBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 16, borderRadius: 16 },
  continueBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
