import React from 'react';
import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { LoadingIndicator } from '@/components/feedback/LoadingIndicator';
import { AppShell } from '@/components/layout/AppShell';

export default function AppLayout() {
  const { status } = useAuth();

  if (status === 'loading') return <LoadingIndicator />;
  if (status === 'signedOut') return <Redirect href="/login" />;

  return (
    <AppShell>
      <Stack screenOptions={{ headerShown: false }} />
    </AppShell>
  );
}
