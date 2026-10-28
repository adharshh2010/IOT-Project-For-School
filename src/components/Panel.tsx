import React, { PropsWithChildren } from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useAppTheme } from '@/src/theme';

interface Props extends PropsWithChildren {
  title?: string;
  detail?: string;
  style?: ViewStyle;
}

export function Panel({ title, detail, children, style }: Props) {
  const theme = useAppTheme();
  return (
    <View style={[styles.panel, { backgroundColor: theme.surface, borderColor: theme.border }, style]}>
      {(title || detail) && (
        <View style={styles.heading}>
          {title && <Text style={[styles.title, { color: theme.text }]}>{title}</Text>}
          {detail && <Text style={[styles.detail, { color: theme.secondaryText }]}>{detail}</Text>}
        </View>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { padding: 16, borderRadius: 20, borderWidth: 1, gap: 14 },
  heading: { gap: 3 },
  title: { fontSize: 16, fontWeight: '700' },
  detail: { fontSize: 12, lineHeight: 18 },
});
