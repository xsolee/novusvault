export const env = {
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8000/api/v1',
  appName: process.env.EXPO_PUBLIC_APP_NAME ?? 'Company Vault',
} as const;
