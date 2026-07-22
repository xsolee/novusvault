import React from 'react';
import { EmptyState } from './EmptyState';

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <EmptyState
      icon="warning-outline"
      title="Something went wrong"
      description={message ?? 'Please try again in a moment.'}
      actionLabel={onRetry ? 'Retry' : undefined}
      onAction={onRetry}
    />
  );
}
