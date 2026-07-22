import React from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { LoginScreen } from '@/features/auth/LoginScreen';
import { LoadingIndicator } from '@/components/feedback/LoadingIndicator';

export default function Login() {
  const { status } = useAuth();

  if (status === 'loading') return <LoadingIndicator />;
  if (status === 'signedIn') return <Redirect href="/dashboard" />;

  return <LoginScreen />;
}
