import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, radius, shadow, spacing, typography } from '@/constants/theme';
import { Button } from '@/components/common/Button';
import { Logo } from '@/components/common/Logo';
import { useAuth } from '@/hooks/useAuth';

export function LoginScreen() {
  const { signInWithGoogle } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleContinue = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      router.replace('/dashboard');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <View style={[styles.card, shadow.popover]}>
        <Logo size={44} />
        <Text style={styles.appName}>Company Vault</Text>
        <Text style={styles.description}>
          Connect your company documents and ask questions across your organizational knowledge.
        </Text>

        <Button
          label="Continue with Google"
          icon="logo-google"
          onPress={handleContinue}
          loading={loading}
          fullWidth
          style={{ marginTop: spacing.lg }}
        />

        {error ? (
          <View style={styles.errorRow}>
            <Ionicons name="alert-circle" size={16} color={colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <Text style={styles.footnote}>
          Only company administrators can sign in. Your Google credentials are handled securely by our
          backend and never stored on this device.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
  },
  appName: {
    ...typography.h1,
    color: colors.text,
    marginTop: spacing.md,
  },
  description: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.md,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    marginTop: spacing.sm,
    width: '100%',
  },
  errorText: {
    ...typography.caption,
    color: colors.danger,
    flexShrink: 1,
  },
  footnote: {
    ...typography.caption,
    color: colors.textFaint,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
