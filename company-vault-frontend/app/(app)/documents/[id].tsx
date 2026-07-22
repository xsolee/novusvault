import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { DocumentDetailsScreen } from '@/features/documents/DocumentDetailsScreen';

export default function DocumentDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <DocumentDetailsScreen id={id} />;
}
