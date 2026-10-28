import React from 'react';
import { Tabs } from 'expo-router';
import { Activity, Bell, ChartNoAxesCombined, Cpu, House } from 'lucide-react-native';
import { useAppTheme } from '@/src/theme';

const icons = {
  index: House,
  measurements: Activity,
  trends: ChartNoAxesCombined,
  alerts: Bell,
  device: Cpu,
};

export default function TabLayout() {
  const theme = useAppTheme();
  return (
    <Tabs
      screenOptions={({ route }) => {
        const Icon = icons[route.name as keyof typeof icons] ?? House;
        return {
          headerShown: false,
          tabBarActiveTintColor: theme.primary,
          tabBarInactiveTintColor: theme.mutedText,
          tabBarStyle: {
            backgroundColor: theme.surface,
            borderTopColor: theme.border,
            height: 64,
            paddingTop: 7,
            paddingBottom: 8,
          },
          tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
          tabBarIcon: ({ color, size }) => <Icon color={color} size={size} strokeWidth={2} />,
          sceneStyle: { backgroundColor: theme.background },
        };
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Overview' }} />
      <Tabs.Screen name="measurements" options={{ title: 'Readings' }} />
      <Tabs.Screen name="trends" options={{ title: 'Trends' }} />
      <Tabs.Screen name="alerts" options={{ title: 'Alerts' }} />
      <Tabs.Screen name="device" options={{ title: 'Device' }} />
    </Tabs>
  );
}
