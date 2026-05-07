import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

type Props = {
  onPress: (digit: string) => void;
  onBackspace: () => void;
  onClear?: () => void;
};

const KEYS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["clear", "0", "⌫"],
];

export const NumericKeypad = React.memo(function NumericKeypad({ onPress, onBackspace, onClear }: Props) {
  const colors = useColors();
  const scales = React.useRef(KEYS.flat().map(() => new Animated.Value(1))).current;

  const handleKey = (key: string, flatIndex: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.timing(scales[flatIndex], { toValue: 0.84, duration: 60, useNativeDriver: true }),
      Animated.timing(scales[flatIndex], { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
    if (key === "⌫") onBackspace();
    else if (key === "clear") onClear?.();
    else onPress(key);
  };

  let flatIndex = 0;
  return (
    <View style={styles.container}>
      {KEYS.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((key) => {
            const currentIndex = flatIndex++;
            const isBackspace = key === "⌫";
            const isClear = key === "clear";
            return (
              <Animated.View key={key} style={[styles.keyWrapper, { transform: [{ scale: scales[currentIndex] }] }]}>
                <Pressable
                  onPress={() => handleKey(key, currentIndex)}
                  style={({ pressed }) => [
                    styles.key,
                    { backgroundColor: isBackspace ? colors.muted : "transparent" },
                    pressed && styles.keyPressed,
                  ]}
                >
                  {isBackspace ? (
                    <Ionicons name="backspace-outline" size={22} color={colors.foreground} />
                  ) : isClear ? (
                    <Text style={[styles.clearText, { color: colors.accent }]}>clear</Text>
                  ) : (
                    <Text style={[styles.keyText, { color: colors.foreground }]}>{key}</Text>
                  )}
                </Pressable>
              </Animated.View>
            );
          })}
        </View>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  container: { gap: 4, paddingHorizontal: 12 },
  row: { flexDirection: "row", justifyContent: "center" },
  keyWrapper: { flex: 1 },
  key: { height: 64, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  keyPressed: { opacity: 0.5 },
  keyText: { fontSize: 26, fontWeight: "500" },
  clearText: { fontSize: 14, fontWeight: "600", letterSpacing: 0.2 },
});
