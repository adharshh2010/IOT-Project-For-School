import React, { PropsWithChildren } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Droplet, RefreshCw } from 'lucide-react-native';
import { useData } from '@/src/data/context';
import { useAppTheme } from '@/src/theme';

interface Props extends PropsWithChildren {
  title: string;
  subtitle: string;
  onRefresh?: () => void;
}

export function AppScreen({ title, subtitle, children, onRefresh }: Props) {
  const theme = useAppTheme();
  const { mode, loading } = useData();
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topline}>
          <View style={styles.brand}>
            <View style={[styles.mark, { backgroundColor: theme.primarySoft }]}>
              <Droplet size={17} color={theme.primary} fill={theme.primary} />
            </View>
            <Text style={[styles.brandText, { color: theme.text }]}>NEERGUARD</Text>
          </View>
          {onRefresh && (
            <Pressable
              onPress={onRefresh}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Refresh monitoring data"
              style={({ pressed }) => [styles.refresh, { backgroundColor: theme.surface, opacity: pressed || loading ? 0.6 : 1 }]}
            >
              <RefreshCw size={17} color={theme.secondaryText} />
            </Pressable>
          )}
        </View>

        <View style={styles.heading}>
          <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
          <Text style={[styles.subtitle, { color: theme.secondaryText }]}>{subtitle}</Text>
        </View>

        {mode === 'demo' && (
          <View style={[styles.demoBanner, { backgroundColor: theme.warningSoft, borderColor: theme.warning + '35' }]}>
            <View style={[styles.demoDot, { backgroundColor: theme.warning }]} />
            <View style={styles.demoCopy}>
              <Text style={[styles.demoTitle, { color: theme.warning }]}>DEMO MODE</Text>
              <Text style={[styles.demoText, { color: theme.secondaryText }]}>
                Illustrative sample data — not readings from a connected sensor.
              </Text>
            </View>
          </View>
        )}

        {children}
        <Text style={[styles.footer, { color: theme.mutedText }]}>
          Screening indicators only · Not a drinking-water safety test
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 28, gap: 18 },
  topline: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  mark: { width: 32, height: 32, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  brandText: { fontSize: 13, fontWeight: '800', letterSpacing: 1.6 },
  refresh: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  heading: { gap: 4, marginTop: 1 },
  title: { fontSize: 28, fontWeight: '700', letterSpacing: -0.8 },
  subtitle: { fontSize: 14, lineHeight: 20 },
  demoBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 12, borderWidth: 1, borderRadius: 15 },
  demoDot: { width: 8, height: 8, borderRadius: 4, marginTop: 4 },
  demoCopy: { flex: 1, gap: 3 },
  demoTitle: { fontSize: 11, letterSpacing: 1, fontWeight: '800' },
  demoText: { fontSize: 12, lineHeight: 17 },
  footer: { fontSize: 11, textAlign: 'center', marginTop: 2 },
});
