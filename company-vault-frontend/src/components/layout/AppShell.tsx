import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/constants/theme';
import { useResponsive } from '@/hooks/useResponsive';
import { Sidebar } from './Sidebar';
import { BottomTabBar } from './BottomTabBar';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { useSidebarNav } = useResponsive();

  if (useSidebarNav) {
    return (
      <View style={styles.desktopRoot}>
        <Sidebar />
        <View style={styles.desktopContent}>{children}</View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.mobileRoot} edges={['top']}>
      <View style={styles.mobileContent}>{children}</View>
      <BottomTabBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  desktopRoot: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.bg,
  },
  desktopContent: {
    flex: 1,
  },
  mobileRoot: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  mobileContent: {
    flex: 1,
  },
});
