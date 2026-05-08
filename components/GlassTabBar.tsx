import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

const TABS = [
  { name: "index", label: "Home", icon: "home", iconOutline: "home-outline" },
  { name: "reports", label: "Reports", icon: "bar-chart", iconOutline: "bar-chart-outline" },
  { name: "bills", label: "Pay Bills", icon: "card", iconOutline: "card-outline" },
  { name: "settings", label: "Settings", icon: "settings", iconOutline: "settings-outline" },
] as const;

type TabBarProps = {
  state: { index: number; routes: Array<{ key: string; name: string }> };
  navigation: any;
};

export const GlassTabBar = React.memo(function GlassTabBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const scales = React.useRef(TABS.map(() => new Animated.Value(1))).current;

  const handlePress = (routeName: string, routeKey: string, index: number, isFocused: boolean) => {
    if (!isFocused) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.timing(scales[index], { toValue: 0.88, duration: 80, useNativeDriver: true }),
      Animated.timing(scales[index], { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
    const event = navigation.emit({ type: "tabPress", target: routeKey, canPreventDefault: true });
    if (!isFocused && !event.defaultPrevented) navigation.navigate(routeName, undefined);
  };

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.outerWrapper, { paddingBottom: bottomPad + 8 }]}>
      <View style={styles.pillShadow}>
        <BlurView
          intensity={Platform.OS === "ios" ? 60 : 85}
          tint={Platform.OS === "ios" ? "systemUltraThinMaterial" : "light"}
          style={styles.blurContainer}
        >
          <View style={[styles.glassOverlay, { borderColor: colors.border }]}>
            {state.routes.map((route, index) => {
              const tab = TABS.find((t) => t.name === route.name) ?? TABS[0];
              const isFocused = state.index === index;
              return (
                <Pressable
                  key={route.key}
                  onPress={() => handlePress(route.name, route.key, index, isFocused)}
                  style={styles.tabItem}
                  hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                >
                  <Animated.View
                    style={[
                      styles.tabInner,
                      isFocused && { backgroundColor: colors.accent + "22" },
                      { transform: [{ scale: scales[index] }] },
                    ]}
                  >
                    <Ionicons
                      name={(isFocused ? tab.icon : tab.iconOutline) as any}
                      size={22}
                      color={isFocused ? colors.accent : colors.mutedForeground}
                    />
                    <Text
                      style={[
                        styles.label,
                        {
                          color: isFocused ? colors.accent : colors.mutedForeground,
                          fontWeight: isFocused ? "600" : "400",
                        },
                      ]}
                    >
                      {tab.label}
                    </Text>
                  </Animated.View>
                </Pressable>
              );
            })}
          </View>
        </BlurView>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  outerWrapper: {
    position: "absolute",
    bottom: 0,
    left: 16,
    right: 16,
    alignItems: "center",
  },
  pillShadow: {
    width: "100%",
    borderRadius: 40,
    shadowColor: "#1A237E",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 16,
  },
  blurContainer: {
    borderRadius: 40,
    overflow: "hidden",
  },
  glassOverlay: {
    flexDirection: "row",
    borderRadius: 40,
    borderWidth: 1.5,
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: Platform.OS === "ios" ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.72)",
  },
  tabItem: { flex: 1, alignItems: "center" },
  tabInner: {
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 28,
    gap: 2,
  },
  label: { fontSize: 10, letterSpacing: 0.1 },
});
