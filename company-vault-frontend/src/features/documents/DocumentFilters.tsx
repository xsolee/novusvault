import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '@/constants/theme';
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
  return (
    <View>
      <View style={styles.searchBox}>
        <Ionicons name="search" size={16} color={colors.textFaint} />
        <TextInput
          value={search}
          onChangeText={onSearchChange}
          placeholder="Search by filename…"
          placeholderTextColor={colors.textFaint}
          style={styles.searchInput}
        />
      </View>

      <FilterRow label="Department" options={DEPARTMENTS} value={department} onChange={onDepartmentChange} />
      <FilterRow label="Category" options={CATEGORIES} value={category} onChange={onCategoryChange} />
      <FilterRow label="Status" options={STATUSES} value={status} onChange={onStatusChange} />
    </View>
  );
}

function FilterRow<T extends string>({
  label, options, value, onChange,
}: {
  label: string;
  options: T[];
  value?: T;
  onChange: (value?: T) => void;
}) {
  return (
    <View style={styles.filterGroup}>
      <Text style={styles.filterLabel}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Chip label="All" active={!value} onPress={() => onChange(undefined)} />
        {options.map((option) => (
          <Chip key={option} label={formatEnumLabel(option)} active={value === option} onPress={() => onChange(option)} />
        ))}
      </ScrollView>
    </View>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[typography.caption, active ? styles.chipTextActive : styles.chipText]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
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
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surfaceMuted,
    marginRight: 6,
  },
  chipActive: {
    backgroundColor: colors.primary,
  },
  chipText: {
    color: colors.textMuted,
  },
  chipTextActive: {
    color: colors.textInverse,
  },
});
