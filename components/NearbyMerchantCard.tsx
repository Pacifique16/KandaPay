import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { NearbyMerchantResult } from "@/src/lib/supabaseTypes";

type Props = {
  merchant: NearbyMerchantResult;
  onPress: (merchant: NearbyMerchantResult) => void;
};

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m away`;
  return `${(meters / 1000).toFixed(1)}km away`;
}

export const NearbyMerchantCard = React.memo(function NearbyMerchantCard({ merchant, onPress }: Props) {
  const colors = useColors();

  const confidenceColor =
    merchant.confidence_score >= 80 ? "#00C9A7" :
    merchant.confidence_score >= 60 ? "#F59E0B" : "#6C63FF";

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress(merchant);
      }}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.card, opacity: pressed ? 0.8 : 1 },
      ]}
    >
      {/* Icon */}
      <View style={[styles.iconWrap, { backgroundColor: confidenceColor + "18" }]}>
        <Ionicons name="storefront-outline" size={22} color={confidenceColor} />
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
          {merchant.merchant_name}
        </Text>
        <View style={styles.row}>
          <View style={[styles.codeBadge, { backgroundColor: colors.muted }]}>
            <Text style={[styles.code, { color: colors.primary }]}>{merchant.merchant_code}</Text>
          </View>
          <View style={styles.distanceRow}>
            <Ionicons name="location-outline" size={11} color={colors.mutedForeground} />
            <Text style={[styles.distance, { color: colors.mutedForeground }]}>
              {formatDistance(merchant.distance_meters)}
            </Text>
          </View>
        </View>
      </View>

      {/* Confidence */}
      <View style={styles.scoreWrap}>
        <Text style={[styles.score, { color: confidenceColor }]}>{merchant.confidence_score}</Text>
        <Text style={[styles.scoreLabel, { color: colors.mutedForeground }]}>score</Text>
      </View>

      <Ionicons name="chevron-forward" size={14} color={colors.border} />
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    gap: 10,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  info: { flex: 1, gap: 5 },
  name: { fontSize: 14, fontWeight: "700" },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  codeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  code: { fontSize: 11, fontWeight: "700", letterSpacing: 0.3 },
  distanceRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  distance: { fontSize: 11 },
  scoreWrap: { alignItems: "center" },
  score: { fontSize: 16, fontWeight: "800" },
  scoreLabel: { fontSize: 9, fontWeight: "600" },
});
