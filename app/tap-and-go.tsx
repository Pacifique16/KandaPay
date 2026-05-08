import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert, Dimensions, FlatList, KeyboardAvoidingView,
  Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { useColors } from "@/hooks/useColors";
import { addCard, editCard, deleteCard, TapGoCard } from "@/src/store/slices/tapGoSlice";
import { RootState } from "@/src/store";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH - 64;
const CARD_GRADIENTS = [
  ["#1A237E", "#6C63FF"] as const,
  ["#004D40", "#00C9A7"] as const,
  ["#4A148C", "#9C27B0"] as const,
  ["#BF360C", "#FF7043"] as const,
];

const ACTIONS = [
  { id: "topup", label: "Top Up", icon: "add-circle", color: "#6C63FF", desc: "Add balance to your card" },
  { id: "register", label: "Register Card", icon: "card", color: "#00C9A7", desc: "Link a new Tap & Go card" },
  { id: "balance", label: "Check Balance", icon: "wallet", color: "#1A237E", desc: "View your card balance" },
] as const;

// Mock ID verification — in production this would call a real API
function verifyId(idNumber: string): { phone: string; name: string } | null {
  if (idNumber.length < 6) return null;
  return { phone: "0789534491", name: "Pacifique Harerimana" };
}

function TapCard({ card, index, onEdit, onDelete }: { card: TapGoCard; index: number; onEdit: () => void; onDelete: () => void }) {
  const gradient = CARD_GRADIENTS[index % CARD_GRADIENTS.length];
  return (
    <Pressable
      onLongPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        Alert.alert(card.cardNumber, card.name, [
          { text: "Edit", onPress: onEdit },
          { text: "Delete", style: "destructive", onPress: onDelete },
          { text: "Cancel", style: "cancel" },
        ]);
      }}
      delayLongPress={400}
    >
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
    </Pressable>
  );
}

export default function TapAndGoScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const cards = useSelector((s: RootState) => s.tapGo);
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [activeIndex, setActiveIndex] = useState(0);
  const [showRegister, setShowRegister] = useState(false);
  const [showBalance, setShowBalance] = useState(false);
  const [balanceCard, setBalanceCard] = useState("");
  const [otherBalanceCard, setOtherBalanceCard] = useState("");

  // Edit card state
  const [showEdit, setShowEdit] = useState(false);
  const [editingCard, setEditingCard] = useState<TapGoCard | null>(null);
  const [editName, setEditName] = useState("");

  // Register card state
  const [step, setStep] = useState<"id" | "details">("id");
  const [idNumber, setIdNumber] = useState("");
  const [verifiedPhone, setVerifiedPhone] = useState("");
  const [verifiedName, setVerifiedName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");

  const openRegister = () => {
    setStep("id");
    setIdNumber(""); setVerifiedPhone(""); setVerifiedName("");
    setCardNumber(""); setCardName("");
    setShowRegister(true);
  };

  const openBalance = () => {
    setBalanceCard(cards[0]?.cardNumber ?? "other");
    setOtherBalanceCard("");
    setShowBalance(true);
  };

  const handleCheckBalance = () => {
    const card = balanceCard === "other" ? otherBalanceCard.trim() : balanceCard;
    if (!card) { Alert.alert("Required", "Please enter a card number."); return; }
    Alert.alert("Check Balance", `Checking balance for card ${card}...`);
    setShowBalance(false);
  };

  const openEdit = (card: TapGoCard) => {
    setEditingCard(card);
    setEditName(card.name);
    setShowEdit(true);
  };

  const handleSaveEdit = () => {
    if (!editName.trim()) {
      Alert.alert("Required", "Please enter a card name.");
      return;
    }
    dispatch(editCard({ id: editingCard!.id, name: editName.trim() }));
    setShowEdit(false);
  };

  const handleDelete = (card: TapGoCard) => {
    Alert.alert("Delete Card", `Remove card ${card.cardNumber} (${card.name})?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => dispatch(deleteCard(card.id)) },
    ]);
  };

  const closeRegister = () => setShowRegister(false);

  const handleVerifyId = () => {
    const result = verifyId(idNumber.trim());
    if (!result) {
      Alert.alert("Not Found", "No account found for this ID number.");
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setVerifiedPhone(result.phone);
    setVerifiedName(result.name);
    setStep("details");
  };

  const handleRegisterCard = () => {
    if (cards.length >= 5) {
      Alert.alert("Limit Reached", "You can only register up to 5 cards.");
      return;
    }
    if (!cardNumber.trim() || !cardName.trim()) {
      Alert.alert("Required", "Please fill in all fields.");
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    dispatch(addCard({
      id: Date.now().toString(),
      name: cardName.trim(),
      cardNumber: cardNumber.trim().toUpperCase(),
      balance: 0,
    }));
    closeRegister();
    Alert.alert("Success", `Card ${cardNumber.toUpperCase()} registered successfully!`);
  };

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
            data={cards}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            snapToInterval={CARD_WIDTH + 16}
            decelerationRate="fast"
            contentContainerStyle={{ paddingHorizontal: 16, gap: 16 }}
            onScroll={(e) => setActiveIndex(Math.round(e.nativeEvent.contentOffset.x / (CARD_WIDTH + 16)))}
            scrollEventThrottle={16}
            renderItem={({ item, index }) => <TapCard card={item} index={index} onEdit={() => openEdit(item)} onDelete={() => handleDelete(item)} />}
          />
          <View style={styles.dots}>
            {cards.map((_, i) => (
              <View key={i} style={[styles.dot, { backgroundColor: i === activeIndex ? colors.accent : colors.border, width: i === activeIndex ? 20 : 8 }]} />
            ))}
          </View>

          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Card Actions</Text>
          <View style={styles.actionsGrid}>
            {ACTIONS.map((action) => (
              <Pressable key={action.id} onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                if (action.id === "topup") router.push("/tapgo-topup");
                else if (action.id === "register") openRegister();
                else if (action.id === "balance") openBalance();
              }} style={styles.actionCardWrapper}>
                <View style={[styles.actionCard, { backgroundColor: colors.card }]}>
                  <View style={[styles.actionIconWrap, { backgroundColor: "transparent" }]}>
                    <Ionicons name={action.icon as any} size={26} color={action.color} />
                  </View>
                  <Text style={[styles.actionLabel, { color: colors.foreground }]}>{action.label}</Text>
                  <Text style={[styles.actionDesc, { color: colors.mutedForeground }]}>{action.desc}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Register Card Bottom Sheet */}
      <Modal visible={showRegister} transparent animationType="slide" onRequestClose={closeRegister}>
        <KeyboardAvoidingView style={{ flex: 1, justifyContent: "flex-end" }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={closeRegister} />
          <View style={[styles.sheet, { backgroundColor: colors.background }]}>
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: colors.primary }]}>Register Card</Text>
              <Pressable onPress={closeRegister} style={[styles.closeBtn, { backgroundColor: colors.muted }]}>
                <Ionicons name="close" size={18} color={colors.foreground} />
              </Pressable>
            </View>

            {step === "id" ? (
              <View style={styles.sheetBody}>
                <Text style={[styles.fieldLabel, { color: colors.foreground }]}>ID Number</Text>
                <TextInput
                  style={[styles.fieldInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                  placeholder="Enter your ID number"
                  placeholderTextColor={colors.mutedForeground}
                  value={idNumber}
                  onChangeText={setIdNumber}
                  keyboardType="default"
                  autoCapitalize="none"
                />
                <Pressable onPress={handleVerifyId} style={[styles.btn, { backgroundColor: colors.primary }]}>
                  <Text style={styles.btnText}>Continue</Text>
                </Pressable>
              </View>
            ) : (
              <ScrollView keyboardShouldPersistTaps="handled" style={styles.sheetBody}>
                <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Phone Number</Text>
                <View style={[styles.readonlyBox, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                  <Text style={[styles.readonlyText, { color: colors.foreground }]}>{verifiedPhone}</Text>
                  <Ionicons name="lock-closed" size={14} color={colors.mutedForeground} />
                </View>

                <Text style={[styles.fieldLabel, { color: colors.foreground, marginTop: 14 }]}>Owner Name</Text>
                <View style={[styles.readonlyBox, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                  <Text style={[styles.readonlyText, { color: colors.foreground }]}>{verifiedName}</Text>
                  <Ionicons name="lock-closed" size={14} color={colors.mutedForeground} />
                </View>

                <Text style={[styles.fieldLabel, { color: colors.foreground, marginTop: 14 }]}>Card Number</Text>
                <TextInput
                  style={[styles.fieldInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                  placeholder="e.g. C24D77B1"
                  placeholderTextColor={colors.mutedForeground}
                  value={cardNumber}
                  onChangeText={setCardNumber}
                  autoCapitalize="characters"
                  autoCorrect={false}
                />

                <Text style={[styles.fieldLabel, { color: colors.foreground, marginTop: 14 }]}>Card Name</Text>
                <TextInput
                  style={[styles.fieldInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                  placeholder="e.g. My Daily Card"
                  placeholderTextColor={colors.mutedForeground}
                  value={cardName}
                  onChangeText={setCardName}
                />

                <Pressable onPress={handleRegisterCard} style={[styles.btn, { backgroundColor: colors.primary, marginTop: 8 }]}>
                  <Text style={styles.btnText}>Register Card</Text>
                </Pressable>
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
      {/* Check Balance Bottom Sheet */}
      <Modal visible={showBalance} transparent animationType="slide" onRequestClose={() => setShowBalance(false)}>
        <KeyboardAvoidingView style={{ flex: 1, justifyContent: "flex-end" }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setShowBalance(false)} />
          <View style={[styles.sheet, { backgroundColor: colors.background }]}>
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: colors.primary }]}>Check Balance</Text>
              <Pressable onPress={() => setShowBalance(false)} style={[styles.closeBtn, { backgroundColor: colors.muted }]}>
                <Ionicons name="close" size={18} color={colors.foreground} />
              </Pressable>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" style={styles.sheetBody}>
              {cards.map((card) => {
                const isSelected = balanceCard === card.cardNumber;
                return (
                  <Pressable
                    key={card.id}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setBalanceCard(card.cardNumber); }}
                    style={[styles.cardOption, { backgroundColor: colors.card, borderColor: isSelected ? colors.primary : colors.border, borderWidth: isSelected ? 2 : 1, marginBottom: 10 }]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.cardOptionNumber, { color: colors.foreground }]}>{card.cardNumber}</Text>
                      <Text style={[styles.cardOptionName, { color: colors.mutedForeground }]}>{card.name}</Text>
                    </View>
                    <View style={[styles.radio, { borderColor: isSelected ? colors.primary : colors.border }]}>
                      {isSelected && <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />}
                    </View>
                  </Pressable>
                );
              })}

              {/* Other card */}
              <Pressable
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setBalanceCard("other"); }}
                style={[styles.cardOption, { backgroundColor: colors.card, borderColor: balanceCard === "other" ? colors.primary : colors.border, borderWidth: balanceCard === "other" ? 2 : 1, marginBottom: 10 }]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardOptionNumber, { color: colors.foreground }]}>Other Tap & Go card</Text>
                </View>
                <View style={[styles.radio, { borderColor: balanceCard === "other" ? colors.primary : colors.border }]}>
                  {balanceCard === "other" && <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />}
                </View>
              </Pressable>

              {balanceCard === "other" && (
                <View style={{ marginBottom: 8 }}>
                  <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Card Number</Text>
                  <TextInput
                    style={[styles.fieldInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                    placeholder="Enter card number"
                    placeholderTextColor={colors.mutedForeground}
                    value={otherBalanceCard}
                    onChangeText={setOtherBalanceCard}
                    autoCapitalize="characters"
                    autoCorrect={false}
                  />
                </View>
              )}

              <Pressable onPress={handleCheckBalance} style={[styles.btn, { backgroundColor: colors.primary }]}>
                <Text style={styles.btnText}>Check Balance</Text>
              </Pressable>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      {/* Edit Card Bottom Sheet */}
      <Modal visible={showEdit} transparent animationType="slide" onRequestClose={() => setShowEdit(false)}>
        <KeyboardAvoidingView style={{ flex: 1, justifyContent: "flex-end" }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setShowEdit(false)} />
          <View style={[styles.sheet, { backgroundColor: colors.background }]}>
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: colors.primary }]}>Edit Card</Text>
              <Pressable onPress={() => setShowEdit(false)} style={[styles.closeBtn, { backgroundColor: colors.muted }]}>
                <Ionicons name="close" size={18} color={colors.foreground} />
              </Pressable>
            </View>
            <View style={styles.sheetBody}>
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Card Name</Text>
              <TextInput
                style={[styles.fieldInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                placeholder="e.g. My Daily Card"
                placeholderTextColor={colors.mutedForeground}
                value={editName}
                onChangeText={setEditName}
              />
              <Pressable onPress={handleSaveEdit} style={[styles.btn, { backgroundColor: colors.primary }]}>
                <Text style={styles.btnText}>Save Changes</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  actionsGrid: { flexDirection: "row", paddingHorizontal: 16, gap: 10, alignItems: "stretch" },
  actionCardWrapper: { flex: 1, flexDirection: "column" },
  actionCard: { flex: 1, borderRadius: 18, padding: 14, alignItems: "center", justifyContent: "center", gap: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  actionIconWrap: { width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  actionLabel: { fontSize: 13, fontWeight: "700", textAlign: "center" },
  cardOption: { flexDirection: "row", alignItems: "center", borderRadius: 14, padding: 14, gap: 12 },
  cardIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  cardOptionNumber: { fontSize: 14, fontWeight: "700" },
  cardOptionName: { fontSize: 12 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingBottom: 32, shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.12, shadowRadius: 20, elevation: 20 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginTop: 12, marginBottom: 4 },
  sheetHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12 },
  sheetTitle: { fontSize: 18, fontWeight: "800" },
  closeBtn: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  sheetBody: { paddingHorizontal: 20, paddingBottom: 8 },
  fieldLabel: { fontSize: 14, fontWeight: "600", marginBottom: 8 },
  fieldInput: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, marginBottom: 4 },
  readonlyBox: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14 },
  readonlyText: { fontSize: 15, fontWeight: "600" },
  btn: { paddingVertical: 16, borderRadius: 16, alignItems: "center", marginTop: 20 },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
