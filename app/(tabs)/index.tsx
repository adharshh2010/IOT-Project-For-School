import React from 'react';
import { Link } from 'expo-router';
import { ChevronRight, CircleCheck, CircleHelp, Wifi, WifiOff } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppScreen } from '@/src/components/AppScreen';
import { MeasurementGrid } from '@/src/components/MeasurementGrid';
import { Panel } from '@/src/components/Panel';
import { ScreeningAssessment } from '@/src/components/ScreeningAssessment';
import { StateNotice } from '@/src/components/StateNotice';
import { StatusPill } from '@/src/components/StatusPill';
import { formatTimestamp } from '@/src/data/format';
import { useData } from '@/src/data/context';
import { getScreeningStatus } from '@/src/data/status';
import { ScreeningStatus } from '@/src/data/types';
import { useAppTheme } from '@/src/theme';

export default function OverviewScreen() {
  const theme = useAppTheme();
  const { snapshot, loading, error, refresh, thresholds, mode } = useData();
  const status = getScreeningStatus(snapshot, thresholds);
  const connected = mode === 'api' && snapshot?.device.connected === true;

  return (
    <AppScreen title="Water overview" subtitle="A clear view of your latest screening indicators." onRefresh={() => void refresh()}>
      {error && <StateNotice kind="error" title="Could not refresh data" detail={`${error} Use refresh to try again.`} />}
      {loading && !snapshot && <StateNotice kind="loading" title="Connecting" detail="Loading monitoring data…" />}
      {!loading && !snapshot && !error && (
        <StateNotice kind="info" title="No readings available" detail="Connect a device or choose demo mode in Settings." />
      )}

      <Panel style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={[styles.connectionIcon, { backgroundColor: connected ? theme.successSoft : theme.surfaceMuted }]}>
            {connected
              ? <Wifi size={19} color={theme.success} />
              : mode === 'demo'
                ? <CircleHelp size={19} color={theme.secondaryText} />
                : <WifiOff size={19} color={theme.mutedText} />}
          </View>
          <View style={styles.connectionCopy}>
            <Text style={[styles.connectionTitle, { color: theme.text }]}>
              {mode === 'demo' ? 'Device not verified' : connected ? 'Device connected' : 'Device offline'}
            </Text>
            <Text style={[styles.connectionDetail, { color: theme.secondaryText }]}>
              {mode === 'demo' ? 'Demo data is not a live sensor connection' : `Last contact · ${formatTimestamp(snapshot?.device.lastContact)}`}
            </Text>
          </View>
          {connected && <CircleCheck size={19} color={theme.success} />}
        </View>
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <View style={styles.screeningRow}>
          <View style={styles.screeningCopy}>
            <Text style={[styles.screeningLabel, { color: theme.mutedText }]}>SCREENING STATUS</Text>
            <StatusPill
            status={status}
            label={status === ScreeningStatus.INITIALIZING ? 'Waiting for data' : undefined}
            />
          </View>
          <View style={styles.update}>
            <Text style={[styles.updateLabel, { color: theme.mutedText }]}>LAST SAMPLE</Text>
            <Text style={[styles.updateValue, { color: theme.secondaryText }]}>
              {formatTimestamp(snapshot?.latest?.timestamp)}
            </Text>
          </View>
        </View>
      </Panel>

      <ScreeningAssessment status={status} />

      <View style={styles.sectionHeading}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Latest measurements</Text>
        <Link href="/measurements" asChild>
          <Pressable accessibilityRole="link" style={styles.link}>
            <Text style={[styles.linkText, { color: theme.primary }]}>All readings</Text>
            <ChevronRight size={15} color={theme.primary} />
          </Pressable>
        </Link>
      </View>
      <MeasurementGrid snapshot={snapshot} />

      <Panel title="Active warnings" detail="Screening threshold events reported by the selected data source.">
        {snapshot?.events.filter((event) => event.active).length ? (
          snapshot.events.filter((event) => event.active).slice(0, 3).map((event) => (
            <View key={event.id} style={styles.warningRow}>
              <View style={[styles.warningDot, { backgroundColor: event.priority === 'high' ? theme.danger : theme.warning }]} />
              <Text style={[styles.warningText, { color: theme.text }]}>
                {event.parameter.toUpperCase()} · {event.measuredValue} {event.unit} · {event.reference}
              </Text>
            </View>
          ))
        ) : (
          <Text style={[styles.emptyCopy, { color: theme.secondaryText }]}>
            {mode === 'demo' ? 'The demo includes no alert events.' : 'No active events were reported.'}
          </Text>
        )}
      </Panel>

      <Link href="/settings" asChild>
        <Pressable
          accessibilityRole="link"
          style={StyleSheet.flatten([styles.settingsLink, { backgroundColor: theme.surfaceMuted }])}
        >
          <Text style={[styles.settingsText, { color: theme.secondaryText }]}>Configure screening ranges and API</Text>
          <ChevronRight size={17} color={theme.secondaryText} />
        </Pressable>
      </Link>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  hero: { padding: 17, gap: 15 },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  connectionIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  connectionCopy: { flex: 1, gap: 3 },
  connectionTitle: { fontSize: 14, fontWeight: '700' },
  connectionDetail: { fontSize: 11, lineHeight: 15 },
  divider: { height: 1 },
  screeningRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  screeningCopy: { gap: 7, alignItems: 'flex-start' },
  screeningLabel: { fontSize: 9, letterSpacing: 1, fontWeight: '700' },
  update: { alignItems: 'flex-end', gap: 6 },
  updateLabel: { fontSize: 9, letterSpacing: 1, fontWeight: '700' },
  updateValue: { fontSize: 11, fontWeight: '600' },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: -8 },
  sectionTitle: { fontSize: 17, fontWeight: '700' },
  link: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  linkText: { fontSize: 12, fontWeight: '700' },
  warningRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  warningDot: { width: 8, height: 8, borderRadius: 4 },
  warningText: { flex: 1, fontSize: 12, lineHeight: 18 },
  emptyCopy: { fontSize: 12, lineHeight: 18 },
  settingsLink: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderRadius: 15 },
  settingsText: { fontSize: 12, fontWeight: '600' },
});
