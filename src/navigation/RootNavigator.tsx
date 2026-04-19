import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/Home/HomeScreen';
import SendMoneyScreen from '../screens/SendMoney/SendMoneyScreen';
import AirtimeScreen from '../screens/Airtime/AirtimeScreen';
import BalanceScreen from '../screens/Balance/BalanceScreen';
import BillPaymentScreen from '../screens/BillPayment/BillPaymentScreen';

const Tab = createBottomTabNavigator();

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator screenOptions={{ headerShown: false }}>
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Send" component={SendMoneyScreen} />
        <Tab.Screen name="Airtime" component={AirtimeScreen} />
        <Tab.Screen name="Balance" component={BalanceScreen} />
        <Tab.Screen name="BillPayment" component={BillPaymentScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
