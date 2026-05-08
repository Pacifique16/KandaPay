import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import React from "react";
import { GlassTabBar } from "@/components/GlassTabBar";

function ClassicTabLayout() {
  return (
    <Tabs
      tabBar={(props) => <GlassTabBar state={props.state} navigation={props.navigation} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: "none" },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="reports" options={{ title: "Reports" }} />
      <Tabs.Screen name="transport" options={{ title: "Pay Bills" }} />
      <Tabs.Screen name="settings" options={{ title: "Settings" }} />
    </Tabs>
  );
}

export default function TabLayout() {
  // Use native liquid glass on iOS 26+ if available
  if (isLiquidGlassAvailable()) {
    try {
      const { NativeTabs } = require("expo-router/unstable-native-tabs");
      const { Icon, Label } = require("expo-router/unstable-native-tabs");
      return (
        <NativeTabs>
          <NativeTabs.Trigger name="index">
            <Icon sf={{ default: "house", selected: "house.fill" }} />
            <Label>Home</Label>
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="reports">
            <Icon sf={{ default: "chart.bar", selected: "chart.bar.fill" }} />
            <Label>Reports</Label>
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="transport">
            <Icon sf={{ default: "creditcard", selected: "creditcard.fill" }} />
            <Label>Pay Bills</Label>
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="settings">
            <Icon sf={{ default: "gearshape", selected: "gearshape.fill" }} />
            <Label>Settings</Label>
          </NativeTabs.Trigger>
        </NativeTabs>
      );
    } catch {
      return <ClassicTabLayout />;
    }
  }
  return <ClassicTabLayout />;
}
