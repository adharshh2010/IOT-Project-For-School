import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ScreeningStatus } from '@/src/data/types';
import { formatStatus } from '@/src/data/status';
import { useAppTheme } from '@/src/theme';

export function StatusPill({ status, label }: { status: ScreeningStatus; label?: string }) {
  const theme = useAppTheme();
  const colors = status === ScreeningStatus.HIGH_PRIORITY
    ? [theme.dangerSoft, theme.danger]
    : status === ScreeningStatus.WARNING
      ? [theme.warningSoft, theme.warning]
      : status === ScreeningStatus.WITHIN_CONFIGURED_RANGES
        ? [theme.successSoft, theme.success]
        : [theme.surfaceMuted, theme.secondaryText];
  return (
    <View style={[styles.pill, { backgroundColor: colors[0] }]}>
      <Text style={[styles.text, { color: colors[1] }]}>{label ?? formatStatus(status)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6 },
  text: { fontSize: 11, fontWeight: '700' },
});
