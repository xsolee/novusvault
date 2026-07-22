import React from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { LoadingIndicator } from '@/components/feedback/LoadingIndicator';

export default function Index() {
  const { status } = useAuth();

  if (status === 'loading') return <LoadingIndicator />;
  return <Redirect href={status === 'signedIn' ? '/dashboard' : '/login'} />;
}
