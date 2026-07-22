import React from 'react';
import { screen, waitFor } from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import { renderWithProviders } from './test-utils';
import { useAuth } from '@/hooks/useAuth';
import { AppShell } from '@/components/layout/AppShell';
import { Text } from 'react-native';

function ProtectedArea() {
  const { status } = useAuth();
  if (status === 'loading') return null;
  if (status === 'signedOut') return <Text>redirect-to-login</Text>;
  return (
    <AppShell>
      <Text>protected-content</Text>
    </AppShell>
  );
}

describe('protected app routes', () => {
  it('redirects to login when there is no stored session', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(null);
    await renderWithProviders(<ProtectedArea />);

    await waitFor(() => expect(screen.getByText('redirect-to-login')).toBeTruthy());
    expect(screen.queryByText('protected-content')).toBeNull();
  });

  it('renders the protected shell when a session token exists', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce('mock-session-token');
    await renderWithProviders(<ProtectedArea />);

    await waitFor(() => expect(screen.getByText('protected-content')).toBeTruthy());
  });
});
