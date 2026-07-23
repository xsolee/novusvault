import React from 'react';
import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { LoadingIndicator } from '@/components/feedback/LoadingIndicator';
import { AppShell } from '@/components/layout/AppShell';

export default function AppLayout() {
  const { status } = useAuth();
  const { colors } = useTheme();

  if (status === 'loading') return <LoadingIndicator />;
  if (status === 'signedOut') return <Redirect href="/login" />;

  return (
    <AppShell>
      {/* React Navigation's native-stack defaults each screen's content
          container to a white background regardless of AppShell's themed
          background, so it must be set explicitly here per scheme. */}
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />
    </AppShell>
  );
}
