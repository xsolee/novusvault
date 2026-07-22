import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from './test-utils';
import { DriveScreen } from '@/features/drive/DriveScreen';

describe('DriveScreen manual synchronization', () => {
  it('starts a sync run and shows live progress', async () => {
    await renderWithProviders(<DriveScreen />);

    await waitFor(() => expect(screen.getByText('Sync Documents')).toBeTruthy(), { timeout: 5000 });
    await fireEvent.press(screen.getByText('Sync Documents'));

    await waitFor(() => expect(screen.getByText('Synchronizing…')).toBeTruthy(), { timeout: 5000 });
    expect(screen.getByText(/%$/)).toBeTruthy();
  });
});
