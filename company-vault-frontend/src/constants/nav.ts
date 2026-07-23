import type { Ionicons } from '@expo/vector-icons';

export interface NavItem {
  href: '/chat' | '/documents' | '/drive' | '/dashboard' | '/settings';
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
  group: 'knowledge' | 'insights';
}

/** Ask-first: the chat is the product, so it leads the navigation. */
export const NAV_ITEMS: NavItem[] = [
  { href: '/chat', label: 'Ask', icon: 'chatbubble-outline', activeIcon: 'chatbubble', group: 'knowledge' },
  { href: '/documents', label: 'Library', icon: 'library-outline', activeIcon: 'library', group: 'knowledge' },
  { href: '/drive', label: 'Sources', icon: 'cloud-outline', activeIcon: 'cloud', group: 'knowledge' },
  { href: '/dashboard', label: 'Overview', icon: 'stats-chart-outline', activeIcon: 'stats-chart', group: 'insights' },
  { href: '/settings', label: 'Settings', icon: 'settings-outline', activeIcon: 'settings', group: 'insights' },
];

export const NAV_GROUPS: Array<{ key: NavItem['group']; label: string }> = [
  { key: 'knowledge', label: 'Knowledge' },
  { key: 'insights', label: 'Insights' },
];

export function sectionTitleFor(pathname: string): string {
  const item = NAV_ITEMS.find((n) => pathname.startsWith(n.href));
  return item?.label ?? 'Company Vault';
}
