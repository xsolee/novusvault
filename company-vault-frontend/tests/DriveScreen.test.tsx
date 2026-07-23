import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from './test-utils';
import { DriveScreen } from '@/features/drive/DriveScreen';

describe('DriveScreen (starts connected)', () => {
  it('shows the connected account, folder, and sync stats', async () => {
    await renderWithProviders(<DriveScreen />);

    await waitFor(() => expect(screen.getByText(/Connected as/)).toBeTruthy(), { timeout: 5000 });
    expect(screen.getByText('Company Documents')).toBeTruthy();
    expect(screen.getByText('Sync now')).toBeTruthy();
    expect(screen.getByText('Disconnect Drive')).toBeTruthy();
  });

  it('disconnects Google Drive after confirming the dialog', async () => {
    await renderWithProviders(<DriveScreen />);

    await waitFor(() => expect(screen.getByText('Disconnect Drive')).toBeTruthy(), { timeout: 5000 });
    await fireEvent.press(screen.getByText('Disconnect Drive'));

    await waitFor(() => expect(screen.getByText('Disconnect Google Drive?')).toBeTruthy(), { timeout: 5000 });
    await fireEvent.press(screen.getByText('Disconnect'));

    await waitFor(() => expect(screen.getByText('Connect Google Drive')).toBeTruthy(), { timeout: 5000 });
  });
});
