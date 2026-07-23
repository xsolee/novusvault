import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  darkColors,
  darkDepartmentColors,
  lightColors,
  lightDepartmentColors,
  type DepartmentColor,
  type ThemeColors,
} from '@/constants/theme';

type Scheme = 'light' | 'dark';

const THEME_KEY = 'company-vault.theme';

interface ThemeContextValue {
  scheme: Scheme;
  colors: ThemeColors;
  departmentColors: Record<string, DepartmentColor>;
  toggleScheme: () => void;
  setScheme: (scheme: Scheme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreference] = useState<Scheme | null>(null);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(THEME_KEY)
      .then((stored) => {
        if (!cancelled && (stored === 'light' || stored === 'dark')) setPreference(stored);
      })
      .catch(() => {
        // Fall back to the system scheme if storage is unavailable.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const scheme: Scheme = preference ?? (systemScheme === 'dark' ? 'dark' : 'light');

  const setScheme = useCallback((next: Scheme) => {
    setPreference(next);
    AsyncStorage.setItem(THEME_KEY, next).catch(() => {
      // Preference persists for this session only if storage is unavailable.
    });
  }, []);

  const toggleScheme = useCallback(() => {
    setScheme(scheme === 'dark' ? 'light' : 'dark');
  }, [scheme, setScheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      scheme,
      colors: scheme === 'dark' ? darkColors : lightColors,
      departmentColors: scheme === 'dark' ? darkDepartmentColors : lightDepartmentColors,
      toggleScheme,
      setScheme,
    }),
    [scheme, toggleScheme, setScheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
