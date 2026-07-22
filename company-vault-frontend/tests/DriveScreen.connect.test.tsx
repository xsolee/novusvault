import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from './test-utils';
import { DriveScreen } from '@/features/drive/DriveScreen';
import { driveService } from '@/services/driveService';

describe('DriveScreen (starts disconnected)', () => {
  beforeAll(async () => {
    await driveService.disconnect();
  });

  it('shows the not-connected explainer and connects on demand', async () => {
    await renderWithProviders(<DriveScreen />);

    await waitFor(() => expect(screen.getByText('Connect Google Drive')).toBeTruthy(), { timeout: 5000 });
    expect(screen.getByText(/never receives your Google credentials/i)).toBeTruthy();

    await fireEvent.press(screen.getByText('Connect Google Drive'));

    await waitFor(() => expect(screen.getByText('Connected')).toBeTruthy(), { timeout: 5000 });
  });
});
