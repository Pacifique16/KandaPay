import { Tabs } from "expo-router";
import React from "react";
import { GlassTabBar } from "@/components/GlassTabBar";

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <GlassTabBar state={props.state} navigation={props.navigation} />}
      screenOptions={{ headerShown: false, tabBarStyle: { display: "none" } }}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="reports" options={{ title: "Reports" }} />
      <Tabs.Screen name="transport" options={{ title: "Pay Bills" }} />
      <Tabs.Screen name="settings" options={{ title: "Settings" }} />
    </Tabs>
  );
}
