import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow, spacing, typography } from '@/constants/theme';
import { Button } from '@/components/common/Button';
import { LoadingIndicator } from '@/components/feedback/LoadingIndicator';
import { ErrorState } from '@/components/feedback/ErrorState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { useDriveFolders } from './useDrive';
import type { DriveFolder } from '@/types/domain';

interface Crumb {
  id: string | null;
  name: string;
}

export function FolderSelector({
  visible,
  onCancel,
  onConfirm,
  confirming,
}: {
  visible: boolean;
  onCancel: () => void;
  onConfirm: (folder: DriveFolder) => void;
  confirming: boolean;
}) {
  const [trail, setTrail] = useState<Crumb[]>([{ id: null, name: 'My Drive' }]);
  const [selected, setSelected] = useState<DriveFolder | null>(null);

  const currentParentId = trail[trail.length - 1].id;
  const { data: folders, isLoading, isError, refetch } = useDriveFolders(currentParentId, visible);

  const openFolder = (folder: DriveFolder) => {
    setTrail((prev) => [...prev, { id: folder.id, name: folder.name }]);
    setSelected(null);
  };

  const jumpTo = (index: number) => {
    setTrail((prev) => prev.slice(0, index + 1));
    setSelected(null);
  };

  const reset = () => {
    setTrail([{ id: null, name: 'My Drive' }]);
    setSelected(null);
  };

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={[styles.dialog, shadow.popover]}>
          <View style={styles.header}>
            <Text style={typography.h3}>Select a Google Drive folder</Text>
            <Pressable onPress={onCancel} hitSlop={8}>
              <Ionicons name="close" size={20} color={colors.textFaint} />
            </Pressable>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.breadcrumbs}>
            {trail.map((crumb, index) => (
              <View key={`${crumb.id}-${index}`} style={styles.crumbGroup}>
                <Pressable onPress={() => jumpTo(index)}>
                  <Text style={[typography.captionMedium, index === trail.length - 1 ? styles.crumbActive : styles.crumb]}>
                    {crumb.name}
                  </Text>
                </Pressable>
                {index < trail.length - 1 ? (
                  <Ionicons name="chevron-forward" size={12} color={colors.textFaint} style={{ marginHorizontal: 4 }} />
                ) : null}
              </View>
            ))}
          </ScrollView>

          <View style={styles.listWrap}>
            {isLoading ? (
              <LoadingIndicator inline />
            ) : isError ? (
              <ErrorState message="Could not load folders." onRetry={refetch} />
            ) : !folders || folders.length === 0 ? (
              <EmptyState icon="folder-open-outline" title="No subfolders here" />
            ) : (
              <ScrollView style={{ maxHeight: 260 }}>
                {folders.map((folder) => (
                  <Pressable
                    key={folder.id}
                    onPress={() => setSelected(folder)}
                    style={({ hovered }: any) => [
                      styles.row,
                      selected?.id === folder.id && styles.rowSelected,
                      hovered && selected?.id !== folder.id && { backgroundColor: colors.surfaceMuted },
                    ]}
                  >
                    <Ionicons name="folder" size={18} color={colors.primary} />
                    <Text style={styles.rowLabel} numberOfLines={1}>
                      {folder.name}
                    </Text>
                    <Pressable onPress={() => openFolder(folder)} hitSlop={8}>
                      <Ionicons name="chevron-forward" size={16} color={colors.textFaint} />
                    </Pressable>
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </View>

          {selected ? (
            <Text style={styles.selectedPath} numberOfLines={1}>
              Selected: {trail.map((c) => c.name).join(' / ')} / {selected.name}
            </Text>
          ) : null}

          <View style={styles.actions}>
            <Button label="Cancel" variant="secondary" onPress={() => { reset(); onCancel(); }} />
            <Button
              label="Confirm folder"
              disabled={!selected}
              loading={confirming}
              onPress={() => selected && onConfirm(selected)}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  dialog: {
    width: '100%',
    maxWidth: 460,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  breadcrumbs: {
    flexDirection: 'row',
    marginTop: spacing.sm,
  },
  crumbGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  crumb: {
    color: colors.textFaint,
  },
  crumbActive: {
    color: colors.primaryText,
  },
  listWrap: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    minHeight: 120,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowSelected: {
    backgroundColor: colors.primarySoft,
  },
  rowLabel: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  selectedPath: {
    ...typography.caption,
    color: colors.primaryText,
    marginTop: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.xs,
    marginTop: spacing.lg,
  },
});
