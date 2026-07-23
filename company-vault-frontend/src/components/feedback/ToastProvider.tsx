import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radius, shadow, spacing, typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

type ToastVariant = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  show: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const VARIANT_ICON: Record<ToastVariant, keyof typeof Ionicons.glyphMap> = {
  success: 'checkmark-circle',
  error: 'alert-circle',
  info: 'information-circle',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const show = useCallback((message: string, variant: ToastVariant = 'info') => {
    const id = idRef.current++;
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  const value = useMemo(() => ({ show }), [show]);

  const variantColor: Record<ToastVariant, string> = {
    success: colors.accent,
    error: colors.danger,
    info: colors.info,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <View pointerEvents="box-none" style={styles.container}>
        {toasts.map((toast) => (
          <View
            key={toast.id}
            style={[
              styles.toast,
              shadow.popover,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Ionicons name={VARIANT_ICON[toast.variant]} size={18} color={variantColor[toast.variant]} />
            <Text style={[typography.body, styles.text, { color: colors.text }]}>{toast.message}</Text>
            <Pressable
              onPress={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              hitSlop={8}
            >
              <Ionicons name="close" size={16} color={colors.textFaint} />
            </Pressable>
          </View>
        ))}
      </View>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: spacing.lg,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: spacing.xs,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    maxWidth: 420,
  },
  text: {
    flexShrink: 1,
  },
});
