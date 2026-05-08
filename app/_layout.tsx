import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from "@expo-google-fonts/inter";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Provider } from "react-redux";
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from "@/src/store";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { initMerchantIntelligence } from "@/src/lib/merchantIntelligence";
import { preloadContactsCache, invalidateContactsCache } from "@/src/lib/contactsCache";

SplashScreen.preventAutoHideAsync();

function RootLayoutNav({ onboardingDone }: { onboardingDone: boolean }) {
  const router = useRouter();

  useEffect(() => {
    if (!onboardingDone) router.replace("/onboarding");
  }, [onboardingDone]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="onboarding" options={{ animation: "fade" }} />
      <Stack.Screen name="send" options={{ presentation: "modal", animation: "slide_from_bottom" }} />
      <Stack.Screen name="recipient-picker" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="airtime-picker" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="tap-and-go" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="bill-payment" options={{ animation: "slide_from_right" }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);

  useEffect(() => {
    const init = async () => {
      // Run all preloading in parallel before showing app
      await Promise.all([
        AsyncStorage.getItem("onboardingDone").then((v) => setOnboardingDone(!!v)),
        preloadContactsCache(),
        initMerchantIntelligence(),
      ]);
    };
    init();
  }, []);

  useEffect(() => {
    if ((fontsLoaded || fontError) && onboardingDone !== null) SplashScreen.hideAsync();
  }, [fontsLoaded, fontError, onboardingDone]);

  if ((!fontsLoaded && !fontError) || onboardingDone === null) return null;

  return (
    <Provider store={store}>
      <PersistGate persistor={persistor}>
        <SafeAreaProvider>
          <ErrorBoundary>
            <RootLayoutNav onboardingDone={onboardingDone} />
          </ErrorBoundary>
        </SafeAreaProvider>
      </PersistGate>
    </Provider>
  );
}
