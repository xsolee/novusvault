import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from './test-utils';
import { DocumentsListScreen } from '@/features/documents/DocumentsListScreen';

describe('DocumentsListScreen', () => {
  it('lists documents and filters them by search text', async () => {
    await renderWithProviders(<DocumentsListScreen />);

    await waitFor(() => expect(screen.getByText('Employee Handbook.pdf')).toBeTruthy(), { timeout: 5000 });
    expect(screen.getByText('Q2 Financial Report.pdf')).toBeTruthy();

    await fireEvent.changeText(screen.getByPlaceholderText('Search by filename…'), 'handbook');

    await waitFor(
      () => {
        expect(screen.getByText('Employee Handbook.pdf')).toBeTruthy();
        expect(screen.queryByText('Q2 Financial Report.pdf')).toBeNull();
      },
      { timeout: 5000 },
    );
  });

  it('filters documents by department', async () => {
    await renderWithProviders(<DocumentsListScreen />);

    await waitFor(() => expect(screen.getByText('Employee Handbook.pdf')).toBeTruthy(), { timeout: 5000 });

    await fireEvent.press(screen.getAllByText('Treasury')[0]);

    await waitFor(
      () => {
        expect(screen.getByText('Treasury Payment Procedure.pdf')).toBeTruthy();
        expect(screen.queryByText('Employee Handbook.pdf')).toBeNull();
      },
      { timeout: 5000 },
    );
  });
});
