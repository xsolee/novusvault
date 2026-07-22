import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from './test-utils';
import { FolderSelector } from '@/features/drive/FolderSelector';

describe('FolderSelector', () => {
  it('does nothing on confirm until a folder is selected, then confirms the selection', async () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();

    await renderWithProviders(
      <FolderSelector visible onCancel={onCancel} onConfirm={onConfirm} confirming={false} />,
    );

    await waitFor(() => expect(screen.getByText('Company Documents')).toBeTruthy(), { timeout: 5000 });

    await fireEvent.press(screen.getByText('Confirm folder'));
    expect(onConfirm).not.toHaveBeenCalled();

    await fireEvent.press(screen.getByText('Company Documents'));
    await fireEvent.press(screen.getByText('Confirm folder'));

    expect(onConfirm).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'root-1', name: 'Company Documents' }),
    );
  });

  it('calls onCancel when Cancel is pressed', async () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();

    await renderWithProviders(
      <FolderSelector visible onCancel={onCancel} onConfirm={onConfirm} confirming={false} />,
    );

    await fireEvent.press(await screen.findByText('Cancel', {}, { timeout: 5000 }));
    expect(onCancel).toHaveBeenCalled();
  });
});
