import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppScreen } from '@/src/components/AppScreen';
import { MeasurementGrid } from '@/src/components/MeasurementGrid';
import { Panel } from '@/src/components/Panel';
import { StateNotice } from '@/src/components/StateNotice';
import { useData } from '@/src/data/context';
import { formatTimestamp } from '@/src/data/format';
import { useAppTheme } from '@/src/theme';

export default function MeasurementsScreen() {
  const theme = useAppTheme();
  const { snapshot, error, loading, refresh } = useData();
  return (
    <AppScreen title="Live measurements" subtitle="Most recent reported values and measurement quality." onRefresh={() => void refresh()}>
      {error && <StateNotice kind="error" title="API unavailable" detail={error} />}
      {loading && !snapshot && <StateNotice kind="loading" title="Loading readings" detail="Waiting for the selected data source." />}
      {!snapshot && !loading && <StateNotice kind="info" title="No measurements yet" detail="Readings will appear here when the data source reports them." />}
      <MeasurementGrid snapshot={snapshot} />
      <Panel title="Reading quality" detail="Validity and calibration are reported per measurement, not inferred from the numeric value.">
        <View style={styles.qualityRow}>
          <Text style={[styles.key, { color: theme.secondaryText }]}>Sample timestamp</Text>
          <Text style={[styles.value, { color: theme.text }]}>{formatTimestamp(snapshot?.latest?.timestamp)}</Text>
        </View>
        <View style={styles.qualityRow}>
          <Text style={[styles.key, { color: theme.secondaryText }]}>Calibration status</Text>
          <Text style={[styles.value, { color: theme.text }]}>
            {snapshot?.latest
              ? Object.values(snapshot.latest.measurements).some((measurement) => measurement.calibrated)
                ? 'Confirmed for selected sensors'
                : 'Not confirmed'
              : 'No calibration data'}
          </Text>
        </View>
      </Panel>
      <Text style={[styles.note, { color: theme.mutedText }]}>
        A missing, invalid, or stale value stays visibly unavailable; it is never substituted with zero.
      </Text>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  qualityRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  key: { fontSize: 12 },
  value: { fontSize: 12, fontWeight: '600', textAlign: 'right', flexShrink: 1 },
  note: { fontSize: 11, lineHeight: 16 },
});
