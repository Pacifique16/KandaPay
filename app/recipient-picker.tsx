import { Ionicons } from "@expo/vector-icons";
import * as Contacts from "expo-contacts";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
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
import { useColors } from "@/hooks/useColors";
import { buyAirtime, sendMoney, payBill } from "@/src/services/ussdService";
import { RootState } from "@/src/store";
import { addRecent } from "@/src/store/slices/recentsSlice";
import { getNearbyMerchantsSync } from "@/src/lib/merchantIntelligence";
import { NearbyMerchantResult } from "@/src/lib/supabaseTypes";
import { getContactsSync, isContactsLoaded, setContactsCache, CONTACTS_CACHE_KEY, CachedContact } from "@/src/lib/contactsCache";

type PhoneContact = CachedContact;

const CONTACT_COLOR = "#1A237E";

function Avatar({ name, color, size = 48, imageUri, isUnknown }: { name: string; color?: string; size?: number; imageUri?: string; isUnknown?: boolean }) {
  const initials = name.trim().slice(0, 1).toUpperCase() || "?";
  const badgeSize = size * 0.38;

  if (imageUri) {
    return (
      <View style={{ width: size, height: size }}>
        <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 4, overflow: "hidden" }]}>
          <Image source={{ uri: imageUri }} style={{ width: size, height: size }} resizeMode="cover" />
        </View>
      </View>
    );
  }

  if (isUnknown) {
    return (
      <View style={{ width: size, height: size }}>
        <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 4, backgroundColor: "#F1F3F8", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#E8ECF4" }]}>
          <View style={{ position: "relative", width: size * 0.65, height: size * 0.65 }}>
            <View style={{ width: size * 0.65, height: size * 0.65, borderRadius: size * 0.325, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#E8ECF4" }}>
              <Ionicons name="person" size={size * 0.35} color="#6B7280" />
            </View>
            <View style={{ position: "absolute", bottom: -3, left: -3, width: size * 0.28, height: size * 0.28, borderRadius: size * 0.14, backgroundColor: "#00C9A7", alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: "#fff" }}>
              <Text style={{ color: "#fff", fontSize: size * 0.14, fontWeight: "800" }}>?</Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 4, backgroundColor: color ?? "#1A237E", borderWidth: 1, borderColor: "rgba(255,255,255,0.15)" }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.38 }]}>{initials}</Text>
    </View>
  );
}

const ContactRow = React.memo(function ContactRow({ item, onPress, colors }: { item: PhoneContact; onPress: () => void; colors: any }) {
  // A contact is unknown if its name looks like a phone number or matches the phone field
  const isUnknown = item.name === item.phone || /^[\d\s\+\-\(\)]+$/.test(item.name);
  const isMerchantCode = /^\d{4,8}$/.test(item.phone.replace(/[\s\-]/g, '')) && !/^(\+?250)?0(7[2389]\d{7})$/.test(item.phone.replace(/[\s\-]/g, ''));
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, { backgroundColor: pressed ? colors.muted : "transparent" }]}
    >
      <Avatar name={item.initials} color={item.color} size={48} imageUri={item.imageUri} isUnknown={isUnknown || isMerchantCode} />
      <View style={styles.rowInfo}>
        <Text style={[styles.rowName, { color: colors.foreground }]}>{isUnknown ? item.phone : item.name}</Text>
        {!isUnknown && !isMerchantCode && <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>{item.phone}</Text>}
        {isMerchantCode && <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>{item.phone}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.border} />
    </Pressable>
  );
});

function MerchantCard({ merchant, onPress }: { merchant: NearbyMerchantResult; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.merchantCard, pressed && { opacity: 0.75 }]}>
      <LinearGradient colors={["#1A237E", "#6C63FF"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.merchantCardGradient}>
        <Text style={styles.merchantCardName} numberOfLines={2}>{merchant.merchant_name}</Text>
        <Text style={styles.merchantCodeText}>{merchant.merchant_code}</Text>
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
  const [contacts, setContacts] = useState<PhoneContact[]>(() => getContactsSync());
  const [loading, setLoading] = useState(() => !isContactsLoaded());
  const [nearbyMerchants, setNearbyMerchants] = useState<NearbyMerchantResult[]>(() => getNearbyMerchantsSync());

  // Sync nearby merchants when cache loads
  useEffect(() => {
    const merchants = getNearbyMerchantsSync();
    console.log('[RecipientPicker] merchants on mount:', merchants.length);
    if (merchants.length > 0) setNearbyMerchants(merchants);
    const t = setTimeout(() => {
      const fresh = getNearbyMerchantsSync();
      console.log('[RecipientPicker] merchants after 1.5s:', fresh.length);
      if (fresh.length > 0) setNearbyMerchants(fresh);
    }, 1500);
    return () => clearTimeout(t);
  }, []);
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  useEffect(() => {
    // If preloader already loaded contacts, use them immediately
    const synced = getContactsSync();
    if (synced.length > 0) {
      setContacts(synced);
      setLoading(false);
      return;
    }
    // No cache at all — fetch from device
    (async () => {
      try {
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
        const seenNames = new Set<string>();
        data.forEach((c) => {
          const name = (c.name ?? "").trim();
          if (!name || name.length < 2) return;
          if (/^[\d\s\+\-\(\)]+$/.test(name)) return;
          const phones = c.phoneNumbers ?? [];
          if (phones.length === 0) return;
          const phone = phones[0].number;
          if (!phone) return;
          const key = `${name}-${phone.replace(/\D/g, "")}`;
          if (seenNames.has(key)) return;
          seenNames.add(key);
          mapped.push({
            id: c.id ?? key,
            name,
            phone,
            initials: name.slice(0, 1).toUpperCase() || "?",
            color: CONTACT_COLOR,
            imageUri: undefined,
          });
        });
        setContacts(mapped);
        setContactsCache(mapped);
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
    if (!search) return nearbyMerchants;
    const q = search.toLowerCase();
    return nearbyMerchants.filter((m) => m.merchant_name.toLowerCase().includes(q) || m.merchant_code.includes(q));
  }, [search, nearbyMerchants]);

  const sections = useMemo(() => {
    const result: { title: string; data: PhoneContact[] }[] = [];
    const cleaned = search.replace(/[\s\-]/g, '');
    const isPhoneNumber = /^(\+?250)?0(7[2389]\d{7})$/.test(cleaned);
    const normalized = cleaned.startsWith('+250') ? '0' + cleaned.slice(4)
      : cleaned.startsWith('250') ? '0' + cleaned.slice(3) : cleaned;

    // Check for exact match in recents or contacts by normalizing both sides
    const normalizeNum = (n: string) => n.replace(/[\s\-().+]/g, '').replace(/^250/, '0').replace(/^\+250/, '0');
    const searchNorm = normalizeNum(cleaned);
    const exactInRecents = recents.find((r) => normalizeNum(r.phone) === searchNorm);
    const exactInContacts = contacts.find((c) => normalizeNum(c.phone) === searchNorm);
    const exactMatch = exactInRecents ?? exactInContacts;

    if (search.length > 0) {
      if (exactMatch) {
        // Show matched contact/recent instead of raw typed input
        result.push({
          title: "",
          data: [exactMatch],
        });
      } else {
        // Show typed input as tappable row
        result.push({
          title: "",
          data: [{ id: "manual-input", name: isPhoneNumber ? normalized : search, phone: isPhoneNumber ? normalized : cleaned, initials: "#", color: "#1A237E", imageUri: undefined }],
        });
      }
    }

    if (!search && recents.length > 0) {
      result.push({ title: "MOST RECENT", data: recents });
    } else if (search && recents.length > 0) {
      const q = search.toLowerCase();
      const filteredRecents = recents.filter((r) =>
        (r.name.toLowerCase().includes(q) || r.phone.includes(q)) && r !== exactMatch
      );
      if (filteredRecents.length > 0) result.push({ title: "MOST RECENT", data: filteredRecents });
    }

    if (filteredContacts.length > 0) {
      const deduped = exactMatch ? filteredContacts.filter((c) => c !== exactMatch) : filteredContacts;
      if (deduped.length > 0) result.push({ title: "CONTACTS", data: deduped });
    }

    return result;
  }, [filteredContacts, search, recents, contacts]);

  const handleSelect = async (name: string, phone: string, color = "#1A237E", isMerchant = false) => {
    const cleaned = phone.replace(/[\s\-().]/g, '').replace(/[^0-9+]/g, '');
    const isPhone = /^(\+?250)?0(7[2389]\d{7})$/.test(cleaned);
    const isMerchantCode = /^\d{4,8}$/.test(cleaned) && !isPhone;
    const _isMerchant = isMerchant || isMerchantCode;
    const normalized = cleaned.startsWith('+250') ? '0' + cleaned.slice(4)
      : cleaned.startsWith('250') ? '0' + cleaned.slice(3) : cleaned;
    const finalPhone = _isMerchant ? cleaned : normalized;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const amtFormatted = parseInt(params.amount ?? "0", 10).toLocaleString();
    const displayName = _isMerchant
      ? finalPhone
      : (name === phone ? finalPhone : `${name}\n${finalPhone}`);
    Alert.alert(
      "Confirm Payment",
      `${params.actionLabel ?? "Send"} RWF ${amtFormatted} to ${displayName}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: params.actionLabel ?? "Send",
          onPress: async () => {
            dispatch(addRecent({ id: finalPhone, name: name === phone ? finalPhone : name, phone: finalPhone, initials: name.slice(0, 1).toUpperCase() || "#", color: "#1A237E" }));
            let result;
            if (_isMerchant) {
              result = await payBill(finalPhone, params.amount, detectedOperator, selectedSlot);
            } else if (params.action === "airtime") {
              result = await buyAirtime(params.amount, detectedOperator, selectedSlot);
            } else {
              result = await sendMoney(finalPhone, params.amount, selectedSlot);
            }
            if (!result.success) Alert.alert("Failed", result.error ?? "Unknown error");
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
                    <MerchantCard key={m.id} merchant={m} onPress={() => handleSelect(m.merchant_name, m.merchant_code, "#1A237E", true)} />
                  ))}
                </ScrollView>
              </View>
            ) : null
          }
          renderSectionHeader={({ section }) => (
            <Text style={[styles.sectionHeader, { color: colors.mutedForeground }]}>{section.title}</Text>
          )}
          renderItem={({ item }) => (
            <ContactRow
              item={item}
              onPress={() => handleSelect(item.name, item.phone, item.color, item.id === "manual-merchant")}
              colors={colors}
            />
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
  merchantCard: { width: 120, borderRadius: 14, overflow: "hidden", elevation: 6 },
  merchantCardGradient: { padding: 12, minHeight: 65, justifyContent: "space-between" },
  merchantCardName: { color: "#FFFFFF", fontSize: 12, fontWeight: "700", lineHeight: 16 },
  merchantCodeText: { color: "rgba(255,255,255,0.75)", fontSize: 11, fontWeight: "600", marginTop: 4 },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 12, gap: 14, borderRadius: 12, paddingHorizontal: 6 },
  rowInfo: { flex: 1, gap: 3 },
  rowName: { fontSize: 15, fontWeight: "600" },
  rowSub: { fontSize: 13 },
  avatar: { alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#FFFFFF", fontWeight: "700" },
  unknownBadge: { position: "absolute", backgroundColor: "#00C9A7", alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: "#fff" },
  unknownBadgeText: { color: "#fff", fontWeight: "800" },
  separator: { height: StyleSheet.hairlineWidth, marginLeft: 68 },
  emptyState: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 14 },
  totalBar: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 24, paddingTop: 16, borderTopWidth: 1, elevation: 8 },
  totalLabel: { fontSize: 16, fontWeight: "600" },
  totalAmountRow: { flexDirection: "row", alignItems: "baseline", gap: 5 },
  totalAmount: { fontSize: 28, fontWeight: "800", letterSpacing: -1 },
  totalCurrency: { fontSize: 14, fontWeight: "600" },
});
