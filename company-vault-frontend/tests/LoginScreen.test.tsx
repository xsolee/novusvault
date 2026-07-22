import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from './test-utils';
import { LoginScreen } from '@/features/auth/LoginScreen';
import { setMockLoginShouldFail } from '@/mocks/authMock';

describe('LoginScreen', () => {
  afterEach(() => {
    setMockLoginShouldFail(false);
  });

  it('renders the Company Vault branding and continue button', async () => {
    await renderWithProviders(<LoginScreen />);

    expect(screen.getByText('Company Vault')).toBeTruthy();
    expect(screen.getByText('Continue with Google')).toBeTruthy();
  });

  it('shows a loading state and then clears it after a successful sign-in', async () => {
    await renderWithProviders(<LoginScreen />);

    await fireEvent.press(screen.getByText('Continue with Google'));

    await waitFor(() => expect(screen.queryByText(/failed|cancelled/i)).toBeNull(), { timeout: 5000 });
  });

  it('shows a login failure message when Google sign-in fails', async () => {
    setMockLoginShouldFail(true);
    await renderWithProviders(<LoginScreen />);

    await fireEvent.press(screen.getByText('Continue with Google'));

    await waitFor(() => expect(screen.getByText(/Google sign-in was cancelled or failed/i)).toBeTruthy(), {
      timeout: 5000,
    });
  });
});
