import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from './test-utils';
import { ChatScreen } from '@/features/chat/ChatScreen';

describe('ChatScreen', () => {
  it('renders the welcome state with suggested questions', async () => {
    await renderWithProviders(<ChatScreen />);

    expect(screen.getByText('Welcome to Company Vault')).toBeTruthy();
    expect(screen.getByText('What is our maternity leave policy?')).toBeTruthy();
  });

  it('answers a clear question with a detected department and a citation', async () => {
    await renderWithProviders(<ChatScreen />);

    await fireEvent.press(screen.getByText('What is our maternity leave policy?'));

    await waitFor(() => expect(screen.getByText('Employee Handbook.pdf')).toBeTruthy(), { timeout: 5000 });
    expect(screen.getAllByText('Human Resources').length).toBeGreaterThan(0);
    expect(screen.getByText('Open document')).toBeTruthy();
  });

  it('asks for clarification on a broad question and follows a suggestion', async () => {
    await renderWithProviders(<ChatScreen />);

    await fireEvent.changeText(
      screen.getByPlaceholderText('Ask about any company document…'),
      'What is the approval process?',
    );
    await fireEvent.press(screen.getByLabelText('Send message'));

    await waitFor(() => expect(screen.getByText('Which approval process are you asking about?')).toBeTruthy(), {
      timeout: 5000,
    });
    const option = screen.getByText('Human Resources leave approval');
    expect(option).toBeTruthy();

    await fireEvent.press(option);

    await waitFor(() => expect(screen.getByText('Employee Handbook.pdf')).toBeTruthy(), { timeout: 5000 });
  });
});
