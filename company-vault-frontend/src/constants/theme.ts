export interface ThemeColors {
  bg: string;
  surface: string;
  surfaceMuted: string;
  surfaceSunken: string;
  sidebarBg: string;
  border: string;
  borderStrong: string;

  text: string;
  textMuted: string;
  textFaint: string;
  textInverse: string;

  primary: string;
  primaryHover: string;
  primarySoft: string;
  primaryText: string;

  accent: string;
  accentSoft: string;

  warning: string;
  warningSoft: string;

  danger: string;
  dangerSoft: string;

  info: string;
  infoSoft: string;

  overlay: string;
}

export const lightColors: ThemeColors = {
  bg: '#F7F7FB',
  surface: '#FFFFFF',
  surfaceMuted: '#F1F1F8',
  surfaceSunken: '#ECEBF7',
  sidebarBg: '#F3F1FA',
  border: '#E7E6F2',
  borderStrong: '#D8D6EC',

  text: '#1B1730',
  textMuted: '#635F7A',
  textFaint: '#9490AC',
  textInverse: '#FFFFFF',

  primary: '#6D5AE6',
  primaryHover: '#5B49D6',
  primarySoft: '#EFECFD',
  primaryText: '#5138C9',

  accent: '#2FBFA0',
  accentSoft: '#E3F8F2',

  warning: '#E8A23D',
  warningSoft: '#FDF1E0',

  danger: '#E15B5B',
  dangerSoft: '#FCEAEA',

  info: '#3D8FE8',
  infoSoft: '#E7F1FD',

  overlay: 'rgba(27, 23, 48, 0.45)',
};

/**
 * Neutral dark-grey dark theme: layered greys (#101012 → #212124) so elevation
 * still reads, with the purple reserved for accents only — never backgrounds.
 */
export const darkColors: ThemeColors = {
  bg: '#101012',
  surface: '#18181B',
  surfaceMuted: '#212124',
  surfaceSunken: '#26262A',
  sidebarBg: '#131316',
  border: '#29292E',
  borderStrong: '#38383F',

  text: '#EDEDF0',
  textMuted: '#A3A3AC',
  textFaint: '#6F6F78',
  textInverse: '#121214',

  primary: '#8C7BF0',
  primaryHover: '#A99DF6',
  primarySoft: '#272337',
  primaryText: '#A99DF6',

  accent: '#38C9A8',
  accentSoft: '#17302B',

  warning: '#E3A94F',
  warningSoft: '#332A18',

  danger: '#E87474',
  dangerSoft: '#351D1D',

  info: '#6FB1E8',
  infoSoft: '#1C2833',

  overlay: 'rgba(0, 0, 0, 0.6)',
};

export interface DepartmentColor {
  fg: string;
  bg: string;
}

export const lightDepartmentColors: Record<string, DepartmentColor> = {
  HUMAN_RESOURCES: { fg: '#B4508B', bg: '#FBEAF3' },
  ACCOUNTING: { fg: '#3D8FE8', bg: '#E7F1FD' },
  TREASURY: { fg: '#2FA0A0', bg: '#E3F7F5' },
  FINANCE: { fg: '#5138C9', bg: '#EFECFD' },
  SALES: { fg: '#D97B3E', bg: '#FDF0E4' },
  OPERATIONS: { fg: '#4E8C4A', bg: '#EAF6E8' },
  PROCUREMENT: { fg: '#8A6D3B', bg: '#F6EFE0' },
  LEGAL: { fg: '#6D5AE6', bg: '#EFECFD' },
  INFORMATION_TECHNOLOGY: { fg: '#2F7DBF', bg: '#E6F1FA' },
  ADMINISTRATION: { fg: '#7A7A7A', bg: '#F0F0F0' },
  GENERAL: { fg: '#635F7A', bg: '#F1F1F8' },
  UNKNOWN: { fg: '#9490AC', bg: '#F1F1F8' },
};

export const darkDepartmentColors: Record<string, DepartmentColor> = {
  HUMAN_RESOURCES: { fg: '#E183BC', bg: '#33222C' },
  ACCOUNTING: { fg: '#7FAEEA', bg: '#1E2733' },
  TREASURY: { fg: '#5CC9C8', bg: '#182E2B' },
  FINANCE: { fg: '#A99DF6', bg: '#272337' },
  SALES: { fg: '#E89A5E', bg: '#322619' },
  OPERATIONS: { fg: '#8CC888', bg: '#202B1E' },
  PROCUREMENT: { fg: '#CBA96A', bg: '#2F2919' },
  LEGAL: { fg: '#B49AF0', bg: '#282233' },
  INFORMATION_TECHNOLOGY: { fg: '#6FB1E8', bg: '#1C2833' },
  ADMINISTRATION: { fg: '#A9A9B2', bg: '#232326' },
  GENERAL: { fg: '#A3A3AC', bg: '#212124' },
  UNKNOWN: { fg: '#6F6F78', bg: '#212124' },
};

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

export const typography = {
  display: { fontSize: 30, fontWeight: '700' as const, lineHeight: 38 },
  h1: { fontSize: 24, fontWeight: '700' as const, lineHeight: 32 },
  h2: { fontSize: 19, fontWeight: '600' as const, lineHeight: 26 },
  h3: { fontSize: 16, fontWeight: '600' as const, lineHeight: 22 },
  body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
  bodyMedium: { fontSize: 15, fontWeight: '600' as const, lineHeight: 22 },
  caption: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18 },
  captionMedium: { fontSize: 13, fontWeight: '600' as const, lineHeight: 18 },
  tiny: { fontSize: 11, fontWeight: '600' as const, lineHeight: 14 },
} as const;

export const shadow = {
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },
  popover: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.14,
    shadowRadius: 32,
    elevation: 8,
  },
} as const;

export const breakpoints = {
  tablet: 768,
  desktop: 1080,
} as const;
