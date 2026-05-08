import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { useColors } from "@/hooks/useColors";
import { buyAirtime, buyAirtimeOther } from "@/src/services/ussdService";
import { RootState } from "@/src/store";
import { getContactsSync, isContactsLoaded, CachedContact } from "@/src/lib/contactsCache";

type PhoneContact = CachedContact;
const CONTACT_COLOR = "#1A237E";

function Avatar({ name, color, size = 48, imageUri }: { name: string; color?: string; size?: number; imageUri?: string }) {
  const initials = name.trim().slice(0, 1).toUpperCase() || "?";
  if (imageUri) {
    return (
      <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 4, overflow: "hidden" }]}>
        <Image source={{ uri: imageUri }} style={{ width: size, height: size }} resizeMode="cover" />
      </View>
    );
  }
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 4, backgroundColor: color ?? CONTACT_COLOR, borderWidth: 1, borderColor: "rgba(255,255,255,0.15)" }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.38 }]}>{initials}</Text>
    </View>
  );
}

function HighlightText({ text, query, style }: { text: string; query: string; style: any }) {
  if (!query) return <Text style={style}>{text}</Text>;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  return (
    <Text style={style}>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase()
          ? <Text key={i} style={[style, { color: '#00C9A7', fontWeight: '700' }]}>{part}</Text>
          : <Text key={i}>{part}</Text>
      )}
    </Text>
  );
}

const ContactRow = React.memo(function ContactRow({ item, onPress, colors, query, isMe }: {
  item: PhoneContact; onPress: () => void; colors: any; query: string; isMe?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, { backgroundColor: pressed ? colors.muted : isMe ? colors.primary + "12" : "transparent" }]}
    >
      <View style={{ position: "relative" }}>
        <Avatar name={item.initials} color={isMe ? "#6C63FF" : item.color} size={48} imageUri={item.imageUri} />
        {isMe && (
          <View style={styles.meBadge}>
            <Text style={styles.meBadgeText}>Me</Text>
          </View>
        )}
      </View>
      <View style={styles.rowInfo}>
        <HighlightText text={item.name} query={query} style={[styles.rowName, { color: colors.foreground }]} />
        <Text style={[styles.rowSub, { color: isMe ? colors.primary : colors.mutedForeground }]}>
          {item.phones && item.phones.length > 1 ? `${item.phones.length} phone numbers` : item.phone}
        </Text>
      </View>
      {isMe && <View style={[styles.selectedDot, { backgroundColor: "#6C63FF" }]} />}
      {!isMe && <Ionicons name="chevron-forward" size={16} color={colors.border} />}
    </Pressable>
  );
});

const AnimatedContactRow = React.memo(function AnimatedContactRow({ item, onPress, colors, query, index, isMe }: {
  item: PhoneContact; onPress: () => void; colors: any; query: string; index: number; isMe?: boolean;
}) {
  const translateY = React.useRef(new Animated.Value(40)).current;
  const opacity = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    translateY.setValue(40);
    opacity.setValue(0);
    Animated.parallel([
      Animated.timing(translateY, { toValue: 0, duration: 250, delay: index * 40, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 250, delay: index * 40, useNativeDriver: true }),
    ]).start();
  }, [query]);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <ContactRow item={item} onPress={onPress} colors={colors} query={query} isMe={isMe} />
    </Animated.View>
  );
});

export default function AirtimePickerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ amount: string }>();
  const dispatch = useDispatch();
  const { selectedSlot, detectedOperator, cards } = useSelector((s: RootState) => s.sim);
  const profile = useSelector((s: RootState) => s.profile);

  const [search, setSearch] = useState("");
  const [contacts, setContacts] = useState<PhoneContact[]>(() => getContactsSync());
  const [loading, setLoading] = useState(() => !isContactsLoaded());

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  // Sync contacts from cache
  useEffect(() => {
    const synced = getContactsSync();
    if (synced.length > 0) { setContacts(synced); setLoading(false); }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const fresh = getContactsSync();
      if (fresh.length > 0 && fresh.length !== contacts.length) setContacts(fresh);
    }, 2000);
    return () => clearInterval(interval);
  }, [contacts.length]);

  // Build "Me" entry from profile phone number
  const meContact = useMemo<PhoneContact | null>(() => {
    const phone = profile.phone?.trim();
    if (!phone) return null;
    return {
      id: "me",
      name: profile.name?.trim() || "Me",
      phone,
      phones: [phone],
      initials: (profile.name?.trim() || "M").slice(0, 1).toUpperCase(),
      color: "#6C63FF",
      imageUri: undefined,
    };
  }, [profile]);

  const displayAmount = useMemo(() => {
    const n = parseInt(params.amount ?? "0", 10);
    return isNaN(n) ? "0" : n.toLocaleString();
  }, [params.amount]);

  const filteredContacts = useMemo(() => {
    const allContacts = getContactsSync().length > contacts.length ? getContactsSync() : contacts;
    if (!search) return allContacts;
    const q = search.toLowerCase();
    const qDigits = q.replace(/\D/g, '');
    return allContacts.filter((c) => {
      if (c.name.toLowerCase().includes(q)) return true;
      if (qDigits.length === 0) return false;
      const phoneDigits = c.phone.replace(/\D/g, '');
      const phoneLocal = phoneDigits.startsWith('250') ? '0' + phoneDigits.slice(3) : phoneDigits;
      return phoneDigits.includes(qDigits) || phoneLocal.includes(qDigits);
    });
  }, [search, contacts]);

  const isPhoneNumber = (s: string) => /^0[0-9]{6,9}$/.test(s.replace(/\s/g, ''));

  const exactMatch = useMemo(() => {
    if (!search) return undefined;
    const cleaned = search.replace(/[\s-]/g, '');
    const searchNorm = cleaned.startsWith('250') ? '0' + cleaned.slice(3) : cleaned;
    return filteredContacts.find((c) => {
      const phoneDigits = c.phone.replace(/\D/g, '');
      const phoneLocal = phoneDigits.startsWith('250') ? '0' + phoneDigits.slice(3) : phoneDigits;
      return phoneDigits === searchNorm || phoneLocal === searchNorm;
    });
  }, [search, filteredContacts]);

  const typedEntry = useMemo<PhoneContact | null>(() => {
    if (!search || exactMatch) return null;
    const cleaned = search.replace(/[\s-]/g, '');
    if (!isPhoneNumber(cleaned)) return null;
    return { id: '__typed__', name: cleaned, phone: cleaned, phones: [cleaned], initials: '#', color: '#555', imageUri: undefined };
  }, [search, exactMatch]);

  const sections = useMemo(() => {
    const result: { title: string; data: PhoneContact[]; isMe?: boolean; isTyped?: boolean }[] = [];

    if (typedEntry) {
      result.push({ title: "BUY FOR", data: [typedEntry], isTyped: true });
    }

    // Always show "Me" at top when not searching
    if (!search && meContact) {
      result.push({ title: "MY NUMBER", data: [meContact], isMe: true });
    }

    const deduped = exactMatch
      ? filteredContacts.filter((c) => c.id !== exactMatch.id)
      : filteredContacts;

    if (exactMatch) {
      result.push({ title: "BEST MATCH", data: [exactMatch] });
    }

    if (deduped.length > 0) {
      result.push({ title: "CONTACTS", data: deduped });
    }

    return result;
  }, [filteredContacts, search, meContact, typedEntry, exactMatch]);

  const handleSelect = async (name: string, phone: string, isMe = false) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const amtFormatted = parseInt(params.amount ?? "0", 10).toLocaleString();
    const displayName = isMe ? "your number" : name;

    Alert.alert(
      "Buy Airtime",
      `Buy RWF ${amtFormatted} airtime for ${displayName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Buy Airtime",
          onPress: async () => {
            const result = isMe
              ? await buyAirtime(params.amount, detectedOperator, selectedSlot)
              : await buyAirtimeOther(phone, params.amount, detectedOperator, selectedSlot);
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
            placeholder="Search contacts..."
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
          renderSectionHeader={({ section }) => (
            <Text style={[styles.sectionHeader, { color: colors.mutedForeground }]}>{section.title}</Text>
          )}
          renderItem={({ item, index, section }) => (
            <AnimatedContactRow
              item={item}
              onPress={() => handleSelect(item.name, item.phone, (section as any).isMe)}
              colors={colors}
              query={(section as any).isTyped ? '' : search}
              index={index}
              isMe={(section as any).isMe}
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
        <Text style={[styles.totalLabel, { color: colors.mutedForeground }]}>Airtime:</Text>
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
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 12, gap: 14, borderRadius: 12, paddingHorizontal: 6 },
  rowInfo: { flex: 1, gap: 3 },
  rowName: { fontSize: 15, fontWeight: "600" },
  rowSub: { fontSize: 13 },
  avatar: { alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#FFFFFF", fontWeight: "700" },
  meBadge: { position: "absolute", bottom: -4, right: -4, backgroundColor: "#6C63FF", borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1, borderWidth: 1.5, borderColor: "#fff" },
  meBadgeText: { color: "#fff", fontSize: 9, fontWeight: "800" },
  selectedDot: { width: 10, height: 10, borderRadius: 5 },
  separator: { height: StyleSheet.hairlineWidth, marginLeft: 68 },
  emptyState: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 14 },
  totalBar: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 24, paddingTop: 16, borderTopWidth: 1, elevation: 8 },
  totalLabel: { fontSize: 16, fontWeight: "600" },
  totalAmountRow: { flexDirection: "row", alignItems: "baseline", gap: 5 },
  totalAmount: { fontSize: 28, fontWeight: "800", letterSpacing: -1 },
  totalCurrency: { fontSize: 14, fontWeight: "600" },
});
