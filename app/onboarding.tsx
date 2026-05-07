import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import { Animated, Dimensions, FlatList, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const SLIDES = [
  { id: "1", title: "Mobile Money\nWithout USSD Stress", desc: "Send, receive, and manage your money effortlessly — no USSD codes to memorize.", accent: "#6C63FF" },
  { id: "2", title: "Nearby Merchants\nat Your Fingertips", desc: "Discover and pay local businesses instantly. Your neighborhood, connected.", accent: "#00C9A7" },
  { id: "3", title: "Smart Expense\nTracking", desc: "Understand your spending patterns with beautiful charts and instant insights.", accent: "#F59E0B" },
  { id: "4", title: "Setup Complete", desc: "You're all set! KandaPay is ready to simplify your financial life.", accent: "#00C9A7" },
];

const completeOnboarding = async () => {
  await AsyncStorage.setItem("onboardingDone", "true");
  router.replace("/(tabs)");
};

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    else completeOnboarding();
  };

  const onScroll = Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
    useNativeDriver: false,
    listener: (event: any) => setCurrentIndex(Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH)),
  });

  const isLast = currentIndex === SLIDES.length - 1;

  return (
    <View style={[styles.root, { backgroundColor: "#0D1035" }]}>
      {!isLast && (
        <Pressable onPress={completeOnboarding} style={[styles.skipBtn, { top: (Platform.OS === "web" ? 67 : insets.top) + 12 }]}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      )}
      <Animated.FlatList
        ref={flatListRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onScroll={onScroll}
        scrollEventThrottle={16}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
            <View style={[styles.iconWrap, { backgroundColor: item.accent + "22" }]}>
              <Ionicons name={isLast ? "checkmark-circle" : "phone-portrait-outline"} size={100} color={item.accent} />
            </View>
          </View>
        )}
      />
      <View style={[styles.panel, { paddingBottom: (Platform.OS === "web" ? 34 : insets.bottom) + 16 }]}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => {
            const width = scrollX.interpolate({ inputRange: [(i - 1) * SCREEN_WIDTH, i * SCREEN_WIDTH, (i + 1) * SCREEN_WIDTH], outputRange: [8, 24, 8], extrapolate: "clamp" });
            const opacity = scrollX.interpolate({ inputRange: [(i - 1) * SCREEN_WIDTH, i * SCREEN_WIDTH, (i + 1) * SCREEN_WIDTH], outputRange: [0.4, 1, 0.4], extrapolate: "clamp" });
            return <Animated.View key={i} style={[styles.dot, { width, opacity, backgroundColor: SLIDES[currentIndex].accent }]} />;
          })}
        </View>
        <Text style={styles.slideTitle}>{SLIDES[currentIndex].title}</Text>
        <Text style={styles.slideDesc}>{SLIDES[currentIndex].desc}</Text>
        <Pressable onPress={handleNext} style={[styles.ctaBtn, { backgroundColor: SLIDES[currentIndex].accent }]}>
          <Text style={styles.ctaBtnText}>{isLast ? "Get Started" : "Continue"}</Text>
          <Ionicons name={isLast ? "rocket" : "arrow-forward"} size={18} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  skipBtn: { position: "absolute", right: 20, zIndex: 10, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 20 },
  skipText: { color: "rgba(255,255,255,0.8)", fontSize: 14, fontWeight: "600" },
  slide: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 120, paddingBottom: 40 },
  iconWrap: { width: 180, height: 180, borderRadius: 90, alignItems: "center", justifyContent: "center" },
  panel: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "rgba(13,16,53,0.95)", paddingTop: 28, paddingHorizontal: 24, borderTopLeftRadius: 32, borderTopRightRadius: 32, gap: 12, borderTopWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  dots: { flexDirection: "row", gap: 6, justifyContent: "center" },
  dot: { height: 8, borderRadius: 4 },
  slideTitle: { color: "#FFFFFF", fontSize: 28, fontWeight: "800", lineHeight: 36, letterSpacing: -0.5, textAlign: "center" },
  slideDesc: { color: "rgba(255,255,255,0.65)", fontSize: 14, lineHeight: 22, textAlign: "center" },
  ctaBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 16, borderRadius: 20, gap: 8, marginTop: 4 },
  ctaBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
