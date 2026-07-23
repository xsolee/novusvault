import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useResponsive } from '@/hooks/useResponsive';
import { useTheme } from '@/hooks/useTheme';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { BottomTabBar } from './BottomTabBar';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { useSidebarNav } = useResponsive();
  const { colors } = useTheme();

  if (useSidebarNav) {
    return (
      <View style={{ flex: 1, flexDirection: 'row', backgroundColor: colors.bg }}>
        <Sidebar />
        <View style={{ flex: 1 }}>
          <TopBar />
          <View style={{ flex: 1 }}>{children}</View>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <View style={{ flex: 1 }}>{children}</View>
      <BottomTabBar />
    </SafeAreaView>
  );
}
