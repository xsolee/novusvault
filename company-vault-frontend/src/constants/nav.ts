import type { Ionicons } from '@expo/vector-icons';

export interface NavItem {
  href: '/dashboard' | '/documents' | '/drive' | '/chat' | '/settings';
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
}

export const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: 'grid-outline', activeIcon: 'grid' },
  { href: '/documents', label: 'Documents', icon: 'document-text-outline', activeIcon: 'document-text' },
  { href: '/drive', label: 'Google Drive', icon: 'cloud-outline', activeIcon: 'cloud' },
  { href: '/chat', label: 'Ask Company Vault', icon: 'sparkles-outline', activeIcon: 'sparkles' },
  { href: '/settings', label: 'Settings', icon: 'settings-outline', activeIcon: 'settings' },
];
