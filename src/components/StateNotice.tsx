import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { AlertCircle, Info } from 'lucide-react-native';
import { useAppTheme } from '@/src/theme';

export function StateNotice({ kind, title, detail }: {
  kind: 'loading' | 'error' | 'info';
  title: string;
  detail: string;
}) {
  const theme = useAppTheme();
  const color = kind === 'error' ? theme.danger : kind === 'loading' ? theme.primary : theme.secondaryText;
  const background = kind === 'error' ? theme.dangerSoft : theme.surfaceMuted;
  return (
    <View accessibilityRole="alert" style={[styles.box, { backgroundColor: background }]}>
      {kind === 'loading'
        ? <ActivityIndicator color={color} />
        : kind === 'error'
          ? <AlertCircle size={19} color={color} />
          : <Info size={19} color={color} />}
      <View style={styles.copy}>
        <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.detail, { color: theme.secondaryText }]}>{detail}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flexDirection: 'row', alignItems: 'flex-start', gap: 11, padding: 14, borderRadius: 15 },
  copy: { flex: 1, gap: 3 },
  title: { fontSize: 13, fontWeight: '700' },
  detail: { fontSize: 12, lineHeight: 18 },
});
