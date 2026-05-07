import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import * as Contacts from "expo-contacts";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { check, request, PERMISSIONS, RESULTS } from "react-native-permissions";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { NearbyMerchant, NEARBY_MERCHANTS } from "@/constants/mockData";
import { useColors } from "@/hooks/useColors";
import { buyAirtime, sendMoney } from "@/src/services/ussdService";
import { RootState } from "@/src/store";
import { addRecent } from "@/src/store/slices/recentsSlice";

type PhoneContact = {
  id: string;
  name: string;
  phone: string;
  initials: string;
  color: string;
};

const COLORS = ["#6C63FF", "#1A237E", "#00C9A7", "#4A47A3", "#F59E0B", "#EC4899"];

const CONTACTS_CACHE_KEY = "@kandapay_contacts_cache";

// Module-level cache so contacts don't reload within the same JS session
let cachedContacts: PhoneContact[] = [];
let contactsLoaded = false;

function extractCode(fullCode: string): string {
  return fullCode.split("*").pop()?.replace("#", "") ?? fullCode;
}

function Avatar({ name, color, size = 48 }: { name: string; color?: string; size?: number }) {
  const initials = name.trim().slice(0, 1).toUpperCase() || "?";
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 4, backgroundColor: color ?? "#1A237E" }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.38 }]}>{initials}</Text>
    </View>
  );
}

function MerchantCard({ merchant, onPress }: { merchant: NearbyMerchant; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.merchantCard, pressed && { opacity: 0.75 }]}>
      <LinearGradient colors={["#1A237E", "#6C63FF"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.merchantCardGradient}>
        <Text style={styles.merchantCardName} numberOfLines={1}>{merchant.name}</Text>
        <View style={styles.merchantCodeBadge}>
          <Text style={styles.merchantCodeText}>{extractCode(merchant.code)}</Text>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

export default function RecipientPickerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ amount: string; action: string; actionColor: string; actionLabel: string }>();
  const dispatch = useDispatch();
  const { selectedSlot, detectedOperator } = useSelector((s: RootState) => s.sim);
  const recents = useSelector((s: RootState) => s.recents.list);

  const [search, setSearch] = useState("");
  const [contacts, setContacts] = useState<PhoneContact[]>(cachedContacts);
  const [loading, setLoading] = useState(!contactsLoaded);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  useEffect(() => {
    if (contactsLoaded) return;
    (async () => {
      try {
        // Try loading from AsyncStorage first
        const cached = await AsyncStorage.getItem(CONTACTS_CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached) as PhoneContact[];
          cachedContacts = parsed;
          contactsLoaded = true;
          setContacts(parsed);
          setLoading(false);
          return;
        }
        // No cache — check/request permission then fetch
        const permission = PERMISSIONS.ANDROID.READ_CONTACTS;
        let status = await check(permission);
        if (status === RESULTS.DENIED) status = await request(permission);
        if (status !== RESULTS.GRANTED) {
          setLoading(false);
          Alert.alert(
            "Contacts Permission Required",
            "KandaPay needs access to your contacts to send money. Please enable it in Settings.",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Open Settings", onPress: () => Linking.openSettings() },
            ]
          );
          return;
        }
        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
          sort: Contacts.SortTypes.FirstName,
        });
        const mapped: PhoneContact[] = [];
        data.forEach((c, i) => {
          const name = c.name ?? "";
          const phones = c.phoneNumbers ?? [];
          phones.forEach((p) => {
            if (p.number) {
              mapped.push({
                id: `${c.id}-${p.id ?? i}`,
                name,
                phone: p.number,
                initials: name.slice(0, 1).toUpperCase() || "?",
                color: COLORS[mapped.length % COLORS.length],
              });
            }
          });
        });
        cachedContacts = mapped;
        contactsLoaded = true;
        setContacts(mapped);
        await AsyncStorage.setItem(CONTACTS_CACHE_KEY, JSON.stringify(mapped));
      } catch (e: any) {
        Alert.alert("Error", e.message ?? "Failed to load contacts");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const displayAmount = useMemo(() => {
    const n = parseInt(params.amount ?? "0", 10);
    return isNaN(n) ? "0" : n.toLocaleString();
  }, [params.amount]);

  const filteredContacts = useMemo(() => {
    if (!search) return contacts;
    const q = search.toLowerCase();
    return contacts.filter((c) => c.name.toLowerCase().includes(q) || c.phone.includes(q));
  }, [search, contacts]);

  const filteredMerchants = useMemo(() => {
    if (!search) return NEARBY_MERCHANTS;
    const q = search.toLowerCase();
    return NEARBY_MERCHANTS.filter((m) => m.name.toLowerCase().includes(q) || m.code.includes(q));
  }, [search]);

  const sections = useMemo(() => {
    const result: { title: string; data: PhoneContact[] }[] = [];
    const isPhoneNumber = /^[0-9+\s\-]{6,}$/.test(search);
    if (isPhoneNumber) {
      result.push({
        title: "SEND TO THIS NUMBER",
        data: [{ id: "manual", name: search, phone: search, initials: "#", color: "#6C63FF" }],
      });
    }
    if (!search && recents.length > 0) {
      result.push({ title: "MOST RECENT", data: recents });
    }
    if (filteredContacts.length > 0) {
      result.push({ title: "CONTACTS", data: filteredContacts });
    }
    return result;
  }, [filteredContacts, search, recents]);

  const handleSelect = async (name: string, phone: string, color = "#6C63FF") => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const amtFormatted = parseInt(params.amount ?? "0", 10).toLocaleString();
    Alert.alert(
      "Confirm Payment",
      `${params.actionLabel ?? "Send"} RWF ${amtFormatted} to ${name === phone ? phone : `${name}\n${phone}`}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: params.actionLabel ?? "Send",
          onPress: async () => {
            dispatch(addRecent({
              id: phone,
              name: name === phone ? phone : name,
              phone,
              initials: name.slice(0, 1).toUpperCase() || "#",
              color,
            }));
            let result;
            if (params.action === "airtime") {
              result = await buyAirtime(params.amount, detectedOperator, selectedSlot);
            } else {
              result = await sendMoney(phone, params.amount, selectedSlot);
            }
            if (!result.success) {
              Alert.alert("Failed", result.error ?? "Unknown error");
            }
            router.replace("/(tabs)");
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8, borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        <Pressable onPress={() => router.back()} style={[styles.closeBtn, { backgroundColor: colors.muted }]}>
          <Ionicons name="close" size={18} color={colors.foreground} />
        </Pressable>
        <View style={[styles.searchWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            value={search}
            onChangeText={setSearch}
            placeholder="Search contacts or type a number..."
            placeholderTextColor={colors.mutedForeground}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={16} color={colors.mutedForeground} />
            </Pressable>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Loading contacts...</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.listContent, { paddingBottom: bottomPad + 90 }]}
          ListHeaderComponent={
            filteredMerchants.length > 0 ? (
              <View>
                <Text style={[styles.sectionHeader, { color: colors.mutedForeground }]}>NEARBY MERCHANT CODES</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.merchantsScroll}>
                  {filteredMerchants.map((m) => (
                    <MerchantCard key={m.id} merchant={m} onPress={() => handleSelect(m.name, extractCode(m.code), "#1A237E")} />
                  ))}
                </ScrollView>
              </View>
            ) : null
          }
          renderSectionHeader={({ section }) => (
            <Text style={[styles.sectionHeader, { color: colors.mutedForeground }]}>{section.title}</Text>
          )}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => handleSelect(item.name, item.phone, item.color)}
              style={({ pressed }) => [styles.row, { backgroundColor: pressed ? colors.muted : "transparent" }]}
            >
              <Avatar name={item.initials} color={item.color} size={48} />
              <View style={styles.rowInfo}>
                <Text style={[styles.rowName, { color: colors.foreground }]}>{item.name}</Text>
                <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>{item.phone}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.border} />
            </Pressable>
          )}
          ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: colors.border }]} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={40} color={colors.border} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                {search ? "No contacts found" : "No contacts available"}
              </Text>
            </View>
          }
        />
      )}

      {/* Total Bar */}
      <View style={[styles.totalBar, { paddingBottom: bottomPad + 8, borderTopColor: colors.border, backgroundColor: colors.card }]}>
        <Text style={[styles.totalLabel, { color: colors.mutedForeground }]}>Total:</Text>
        <View style={styles.totalAmountRow}>
          <Text style={[styles.totalAmount, { color: colors.primary }]}>{displayAmount}</Text>
          <Text style={[styles.totalCurrency, { color: colors.mutedForeground }]}>RWF</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12, gap: 10, borderBottomWidth: 1 },
  closeBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  searchWrap: { flex: 1, flexDirection: "row", alignItems: "center", borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, gap: 8, borderWidth: 1, elevation: 1 },
  searchInput: { flex: 1, fontSize: 14, padding: 0 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontSize: 14 },
  listContent: { paddingHorizontal: 16 },
  sectionHeader: { fontSize: 11, fontWeight: "700", letterSpacing: 1.2, paddingTop: 20, paddingBottom: 10 },
  merchantsScroll: { gap: 10, paddingBottom: 4 },
  merchantCard: { width: 130, borderRadius: 16, overflow: "hidden", elevation: 6 },
  merchantCardGradient: { padding: 14, paddingTop: 16, minHeight: 90, justifyContent: "space-between" },
  merchantCardName: { color: "#FFFFFF", fontSize: 13, fontWeight: "700", lineHeight: 17 },
  merchantCodeBadge: { alignSelf: "flex-start", backgroundColor: "rgba(255,255,255,0.18)", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, marginTop: 10 },
  merchantCodeText: { color: "rgba(255,255,255,0.95)", fontSize: 12, fontWeight: "700", letterSpacing: 0.5 },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 12, gap: 14, borderRadius: 12, paddingHorizontal: 6 },
  rowInfo: { flex: 1, gap: 3 },
  rowName: { fontSize: 15, fontWeight: "600" },
  rowSub: { fontSize: 13 },
  avatar: { alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#FFFFFF", fontWeight: "700" },
  separator: { height: StyleSheet.hairlineWidth, marginLeft: 68 },
  emptyState: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 14 },
  totalBar: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 24, paddingTop: 16, borderTopWidth: 1, elevation: 8 },
  totalLabel: { fontSize: 16, fontWeight: "600" },
  totalAmountRow: { flexDirection: "row", alignItems: "baseline", gap: 5 },
  totalAmount: { fontSize: 28, fontWeight: "800", letterSpacing: -1 },
  totalCurrency: { fontSize: 14, fontWeight: "600" },
});
