import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { AuthProvider } from '@/hooks/useAuth';
import { ThemeProvider, useTheme } from '@/hooks/useTheme';
import { ToastProvider } from '@/components/feedback/ToastProvider';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ThemedApp() {
  const { scheme, colors } = useTheme();

  return (
    <ToastProvider>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      {/* React Navigation's native-stack defaults each screen's content
          container to a white background regardless of theme, so it must be
          set explicitly here per scheme. */}
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="(app)" />
      </Stack>
    </ToastProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <ThemedApp />
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
