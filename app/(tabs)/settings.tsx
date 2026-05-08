import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import { Alert, Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { useColors } from "@/hooks/useColors";
import { RootState } from "@/src/store";
import { setProfile } from "@/src/store/slices/profileSlice";

const TAB_BAR_HEIGHT = 100;

function SettingRow({ icon, iconColor, label, value, toggle, onToggle, onPress, destructive, showChevron = true }: {
  icon: string; iconColor: string; label: string; value?: string;
  toggle?: boolean; onToggle?: (val: boolean) => void; onPress?: () => void;
  destructive?: boolean; showChevron?: boolean;
}) {
  const colors = useColors();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}>
      <View style={[styles.rowIcon, { backgroundColor: iconColor + "18" }]}>
        <Ionicons name={icon as any} size={18} color={iconColor} />
      </View>
      <Text style={[styles.rowLabel, { color: destructive ? colors.destructive : colors.foreground }]}>{label}</Text>
      {value !== undefined && <Text style={[styles.rowValue, { color: colors.mutedForeground }]}>{value}</Text>}
      {toggle !== undefined && onToggle && (
        <Switch value={toggle} onValueChange={(v) => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onToggle(v); }} trackColor={{ true: "#00C9A7", false: undefined }} thumbColor="#fff" />
      )}
      {toggle === undefined && showChevron && <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />}
    </Pressable>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const colors = useColors();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>{title.toUpperCase()}</Text>
      <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>{children}</View>
    </View>
  );
}

function Separator() {
  const colors = useColors();
  return <View style={[styles.separator, { backgroundColor: colors.border }]} />;
}

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const profile = useSelector((s: RootState) => s.profile);
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const [saveTransactions, setSaveTransactions] = useState(true);
  const [autoVerify, setAutoVerify] = useState(true);
  const [useWebDialer, setUseWebDialer] = useState(false);
  const [contactsToggle, setContactsToggle] = useState(true);
  const [nearbyMerchants, setNearbyMerchants] = useState(false);
  const [recentRecipients, setRecentRecipients] = useState(true);
  const [faceId, setFaceId] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [editVisible, setEditVisible] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");

  const openEdit = () => {
    setEditName(profile.name);
    setEditPhone(profile.phone);
    setEditVisible(true);
  };

  const saveEdit = () => {
    if (!editPhone.trim()) { Alert.alert("Required", "Please enter your phone number."); return; }
    dispatch(setProfile({ name: editName.trim(), phone: editPhone.trim() }));
    setEditVisible(false);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scroll, { paddingBottom: TAB_BAR_HEIGHT + (Platform.OS === "web" ? 34 : insets.bottom), paddingTop: topPad + 16 }]}>
        <Text style={[styles.pageTitle, { color: colors.foreground }]}>Settings</Text>
        <View style={[styles.profileCard, { backgroundColor: colors.card }]}>
          <View style={[styles.profileAvatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.profileAvatarText}>{profile.name ? profile.name.slice(0,1).toUpperCase() : "?"}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.foreground }]}>{profile.name || "Tap edit to set your name"}</Text>
            <Text style={[styles.profilePhone, { color: colors.mutedForeground }]}>{profile.phone || "No phone number set"}</Text>
          </View>
          <Pressable onPress={openEdit} style={[styles.editBtn, { backgroundColor: colors.muted }]}>
            <Ionicons name="pencil" size={16} color={colors.primary} />
          </Pressable>
        </View>
        <Section title="Activity Stats">
          <View style={styles.statsRow}>
            <View style={styles.statItem}><Text style={[styles.statValue, { color: colors.foreground }]}>RWF 1.2M</Text><Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Total Sent</Text></View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}><Text style={[styles.statValue, { color: colors.foreground }]}>248</Text><Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Transactions</Text></View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}><Text style={[styles.statValue, { color: colors.accent }]}>RWF 980K</Text><Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Received</Text></View>
          </View>
        </Section>
        <LinearGradient colors={["#6C63FF", "#1A237E"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.premiumCard}>
          <View style={styles.premiumLeft}>
            <Text style={styles.premiumTitle}>KandaPay Premium</Text>
            <Text style={styles.premiumDesc}>Unlimited transfers · Priority support · Analytics</Text>
          </View>
          <Pressable style={styles.premiumBtn}><Text style={styles.premiumBtnText}>Upgrade</Text></Pressable>
        </LinearGradient>
        <Section title="Transactions">
          <SettingRow icon="save-outline" iconColor="#6C63FF" label="Save Transactions" toggle={saveTransactions} onToggle={setSaveTransactions} showChevron={false} />
          <Separator />
          <SettingRow icon="checkmark-circle-outline" iconColor="#00C9A7" label="Auto-verify (SMS)" toggle={autoVerify} onToggle={setAutoVerify} showChevron={false} />
          <Separator />
          <SettingRow icon="globe-outline" iconColor="#1A237E" label="Use Web Dialer" toggle={useWebDialer} onToggle={setUseWebDialer} showChevron={false} />
        </Section>
        <Section title="Recipients">
          <SettingRow icon="people-outline" iconColor="#6C63FF" label="Contacts" toggle={contactsToggle} onToggle={setContactsToggle} showChevron={false} />
          <Separator />
          <SettingRow icon="location-outline" iconColor="#00C9A7" label="Nearby Merchants" toggle={nearbyMerchants} onToggle={setNearbyMerchants} showChevron={false} />
          <Separator />
          <SettingRow icon="time-outline" iconColor="#1A237E" label="Recent Recipients" toggle={recentRecipients} onToggle={setRecentRecipients} showChevron={false} />
        </Section>
        <Section title="Security">
          <SettingRow icon="finger-print" iconColor="#1A237E" label="Face ID / Biometrics" toggle={faceId} onToggle={setFaceId} showChevron={false} />
          <Separator />
          <SettingRow icon="lock-closed-outline" iconColor="#6C63FF" label="Change PIN" onPress={() => {}} />
        </Section>
        <Section title="Notifications">
          <SettingRow icon="notifications-outline" iconColor="#00C9A7" label="Enable Notifications" toggle={notifications} onToggle={setNotifications} showChevron={false} />
        </Section>
        <Section title="Support">
          <SettingRow icon="chatbubbles-outline" iconColor="#00C9A7" label="WhatsApp Support" onPress={() => {}} />
          <Separator />
          <SettingRow icon="mail-outline" iconColor="#6C63FF" label="Email Support" onPress={() => {}} />
        </Section>
        <Section title="Account">
          <SettingRow icon="log-out-outline" iconColor="#EF4444" label="Logout" onPress={() => Alert.alert("Logout", "Are you sure you want to logout?", [{ text: "Cancel", style: "cancel" }, { text: "Logout", style: "destructive" }])} destructive />
          <Separator />
          <SettingRow icon="trash-outline" iconColor="#EF4444" label="Delete Account" onPress={() => Alert.alert("Delete Account", "This action is irreversible. All your data will be deleted.", [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive" }])} destructive />
        </Section>
        <Text style={[styles.version, { color: colors.mutedForeground }]}>KandaPay v1.0.0</Text>
      </ScrollView>
      <Modal visible={editVisible} transparent animationType="fade" onRequestClose={() => setEditVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setEditVisible(false)}>
          <Pressable style={[styles.editModal, { backgroundColor: colors.card }]} onPress={() => {}}>
            <Text style={[styles.editModalTitle, { color: colors.foreground }]}>Edit Profile</Text>
            <TextInput
              style={[styles.editInput, { color: colors.foreground, borderColor: colors.border }]}
              placeholder="Your name"
              placeholderTextColor={colors.mutedForeground}
              value={editName}
              onChangeText={setEditName}
            />
            <TextInput
              style={[styles.editInput, { color: colors.foreground, borderColor: colors.border }]}
              placeholder="Your phone number e.g. 0788123456"
              placeholderTextColor={colors.mutedForeground}
              value={editPhone}
              onChangeText={setEditPhone}
              keyboardType="phone-pad"
              autoFocus
            />
            <View style={styles.editModalActions}>
              <Pressable onPress={() => setEditVisible(false)} style={[styles.editModalBtn, { borderColor: colors.border }]}>
                <Text style={[styles.editModalBtnText, { color: colors.mutedForeground }]}>Cancel</Text>
              </Pressable>
              <Pressable onPress={saveEdit} style={[styles.editModalBtn, { backgroundColor: "#1A237E", borderColor: "#1A237E" }]}>
                <Text style={[styles.editModalBtnText, { color: "#fff" }]}>Save</Text>
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
  scroll: { flexGrow: 1, padding: 16, gap: 12 },
  pageTitle: { fontSize: 26, fontWeight: "800", letterSpacing: -0.5, marginBottom: 4 },
  profileCard: { flexDirection: "row", alignItems: "center", padding: 16, borderRadius: 20, gap: 14, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  profileAvatar: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  profileAvatarText: { color: "#fff", fontSize: 22, fontWeight: "700" },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 16, fontWeight: "700" },
  profilePhone: { fontSize: 13, marginTop: 2 },
  editBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  statsRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 8 },
  statItem: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 16, fontWeight: "800" },
  statLabel: { fontSize: 11, marginTop: 2 },
  statDivider: { width: 1, height: 36 },
  premiumCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 18, borderRadius: 20 },
  premiumLeft: { flex: 1, gap: 4 },
  premiumTitle: { color: "#fff", fontSize: 15, fontWeight: "700" },
  premiumDesc: { color: "rgba(255,255,255,0.75)", fontSize: 11, lineHeight: 16 },
  premiumBtn: { backgroundColor: "rgba(255,255,255,0.22)", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.3)" },
  premiumBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  section: { gap: 6 },
  sectionTitle: { fontSize: 11, fontWeight: "600", letterSpacing: 0.6, paddingHorizontal: 4 },
  sectionCard: { borderRadius: 16, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  row: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 13, gap: 12 },
  rowIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  rowLabel: { flex: 1, fontSize: 14, fontWeight: "500" },
  rowValue: { fontSize: 13 },
  separator: { height: StyleSheet.hairlineWidth, marginLeft: 62 },
  version: { textAlign: "center", fontSize: 12, paddingVertical: 8 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  editModal: { width: 300, borderRadius: 20, padding: 20, gap: 12 },
  editModalTitle: { fontSize: 16, fontWeight: "700", textAlign: "center", marginBottom: 4 },
  editInput: { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15 },
  editModalActions: { flexDirection: "row", gap: 10, marginTop: 4 },
  editModalBtn: { flex: 1, paddingVertical: 11, borderRadius: 12, alignItems: "center", borderWidth: 1.5 },
  editModalBtnText: { fontSize: 14, fontWeight: "700" },
});
