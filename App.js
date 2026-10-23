import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Constants from 'expo-constants';
import { DataProvider, useData, LockCtx } from './src/store';
import { ThemeCtx, dark, light } from './src/theme';
import { hasPassword, wipeAuth } from './src/security';
import { Icon } from './src/ui';
import { Setup, Lock } from './src/screens/Auth';
import Home from './src/screens/Home';
import TxForm from './src/screens/TxForm';
import { MySavings, GoalDetail, GoalForm, Archived } from './src/screens/Savings';
import Transactions, { TxDetail } from './src/screens/Transactions';
import Analytics from './src/screens/Analytics';
import Settings, { ChangePassword } from './src/screens/Settings';
import { Calendar, Challenges, Reminders } from './src/screens/Extras';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function Tabs() {
  return (
    <ThemeCtx.Consumer>
      {(t) => (
        <Tab.Navigator screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: { backgroundColor: t.card, borderTopColor: t.border, height: 64, paddingBottom: 8, paddingTop: 6 },
          tabBarActiveTintColor: t.text, tabBarInactiveTintColor: t.sub,
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
          tabBarIcon: ({ color }) => <Icon name={route.name} color={color} size={22} />,
        })}>
          <Tab.Screen name="Home" component={Home} />
          <Tab.Screen name="Savings" component={MySavings} options={{ tabBarLabel: 'My Savings' }} />
          <Tab.Screen name="Transactions" component={Transactions} />
          <Tab.Screen name="Analytics" component={Analytics} />
          <Tab.Screen name="Settings" component={Settings} />
        </Tab.Navigator>
      )}
    </ThemeCtx.Consumer>
  );
}

function Root() {
  const { state, wipeAll } = useData();
  const [auth, setAuth] = useState('loading');
  useEffect(() => {
    if (Constants.executionEnvironment === 'standalone' || Constants.executionEnvironment === 'bare') {
      import('expo-notifications').then((Notifications) => {
        Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: false, shouldSetBadge: false }) });
      }).catch((error) => console.error('Could not initialize notifications:', error));
    }
  }, []);
  useEffect(() => { hasPassword().then((h) => setAuth(h ? 'locked' : 'setup')); }, []);
  const t = state && state.settings.dark === false ? light : dark;
  if (!state || auth === 'loading') return <View style={{ flex: 1, backgroundColor: dark.bg, justifyContent: 'center' }}><ActivityIndicator /></View>;
  const base = t.mode === 'dark' ? DarkTheme : DefaultTheme;
  const nav = { ...base, colors: { ...base.colors, primary: t.text, background: t.bg, card: t.card, text: t.text, border: t.border, notification: t.red } };
  const hdr = { headerStyle: { backgroundColor: t.bg }, headerTintColor: t.text, headerShadowVisible: false, headerBackTitle: 'Back', contentStyle: { backgroundColor: t.bg } };
  return (
    <ThemeCtx.Provider value={t}>
      <StatusBar style={t.mode === 'dark' ? 'light' : 'dark'} />
      {auth === 'setup' && <Setup onDone={() => setAuth('unlocked')} />}
      {auth === 'locked' && <Lock onUnlock={() => setAuth('unlocked')} onErase={async () => { await wipeAuth(); await wipeAll(); setAuth('setup'); }} />}
      {auth === 'unlocked' && (
        <LockCtx.Provider value={() => setAuth('locked')}>
          <NavigationContainer theme={nav}>
            <Stack.Navigator screenOptions={hdr}>
              <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
              <Stack.Screen name="TxForm" component={TxForm} options={({ route }) => ({ title: route.params?.editId ? 'Edit transaction' : route.params?.type === 'withdraw' ? 'Withdraw' : 'Save money', presentation: 'modal' })} />
              <Stack.Screen name="GoalForm" component={GoalForm} />
              <Stack.Screen name="GoalDetail" component={GoalDetail} options={{ title: 'Account' }} />
              <Stack.Screen name="TxDetail" component={TxDetail} options={{ title: 'Transaction' }} />
              <Stack.Screen name="Archived" component={Archived} options={{ title: 'Archived goals' }} />
              <Stack.Screen name="Calendar" component={Calendar} options={{ title: 'Savings Calendar' }} />
              <Stack.Screen name="Challenges" component={Challenges} options={{ title: 'Streaks & challenges' }} />
              <Stack.Screen name="Reminders" component={Reminders} options={{ title: 'Saving reminders' }} />
              <Stack.Screen name="ChangePassword" component={ChangePassword} options={{ title: 'Change password' }} />
            </Stack.Navigator>
          </NavigationContainer>
        </LockCtx.Provider>
      )}
    </ThemeCtx.Provider>
  );
}

export default function App() {
  return <SafeAreaProvider><DataProvider><Root /></DataProvider></SafeAreaProvider>;
}
