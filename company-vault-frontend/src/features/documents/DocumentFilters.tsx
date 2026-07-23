import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radius, spacing, typography, type ThemeColors } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { formatEnumLabel } from '@/components/common/Badge';
import type { DocumentCategory, DocumentDepartment, DocumentProcessingStatus } from '@/types/domain';

const DEPARTMENTS: DocumentDepartment[] = [
  'HUMAN_RESOURCES', 'ACCOUNTING', 'TREASURY', 'FINANCE', 'SALES', 'OPERATIONS',
  'PROCUREMENT', 'LEGAL', 'INFORMATION_TECHNOLOGY', 'ADMINISTRATION', 'GENERAL', 'UNKNOWN',
];
const CATEGORIES: DocumentCategory[] = [
  'POLICY', 'PROCEDURE', 'CONTRACT', 'REPORT', 'INVOICE', 'RECEIPT', 'SPREADSHEET',
  'PRESENTATION', 'MEMO', 'FORM', 'MANUAL', 'LETTER', 'MEETING_NOTES', 'OTHER',
];
const STATUSES: DocumentProcessingStatus[] = ['PENDING', 'PROCESSING', 'INDEXED', 'FAILED'];

interface Props {
  search: string;
  onSearchChange: (value: string) => void;
  department?: DocumentDepartment;
  onDepartmentChange: (value?: DocumentDepartment) => void;
  category?: DocumentCategory;
  onCategoryChange: (value?: DocumentCategory) => void;
  status?: DocumentProcessingStatus;
  onStatusChange: (value?: DocumentProcessingStatus) => void;
}

export function DocumentFilters({
  search, onSearchChange,
  department, onDepartmentChange,
  category, onCategoryChange,
  status, onStatusChange,
}: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View>
      <View style={styles.searchBox}>
        <Ionicons name="search" size={16} color={colors.textFaint} />
        <TextInput
          value={search}
          onChangeText={onSearchChange}
          placeholder="Search by name, topic, or content…"
          placeholderTextColor={colors.textFaint}
          style={styles.searchInput}
        />
      </View>

      <FilterRow label="Department" options={DEPARTMENTS} value={department} onChange={onDepartmentChange} styles={styles} colors={colors} />
      <FilterRow label="Category" options={CATEGORIES} value={category} onChange={onCategoryChange} styles={styles} colors={colors} />
      <FilterRow label="Status" options={STATUSES} value={status} onChange={onStatusChange} styles={styles} colors={colors} />
    </View>
  );
}

function FilterRow<T extends string>({
  label, options, value, onChange, styles, colors,
}: {
  label: string;
  options: T[];
  value?: T;
  onChange: (value?: T) => void;
  styles: ReturnType<typeof createStyles>;
  colors: ThemeColors;
}) {
  return (
    <View style={styles.filterGroup}>
      <Text style={styles.filterLabel}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Chip label="All" active={!value} onPress={() => onChange(undefined)} styles={styles} colors={colors} />
        {options.map((option) => (
          <Chip
            key={option}
            label={formatEnumLabel(option)}
            active={value === option}
            onPress={() => onChange(option)}
            styles={styles}
            colors={colors}
          />
        ))}
      </ScrollView>
    </View>
  );
}

function Chip({
  label, active, onPress, styles, colors,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
  colors: ThemeColors;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[typography.caption, { color: active ? colors.primaryText : colors.textMuted }, active && { fontWeight: '600' }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    searchBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.borderStrong,
      borderRadius: radius.md,
      paddingHorizontal: spacing.sm,
      paddingVertical: 10,
    },
    searchInput: {
      flex: 1,
      ...typography.body,
      color: colors.text,
      outlineStyle: 'none' as any,
    },
    filterGroup: {
      marginTop: spacing.sm,
    },
    filterLabel: {
      ...typography.tiny,
      color: colors.textFaint,
      marginBottom: 6,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    chip: {
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 6,
      paddingHorizontal: spacing.sm,
      backgroundColor: colors.surface,
      marginRight: 6,
    },
    chipActive: {
      backgroundColor: colors.primarySoft,
      borderColor: colors.primary,
    },
  });
