import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Activity, Beaker, Droplets, Thermometer } from 'lucide-react-native';
import { formatTimestamp } from '@/src/data/format';
import { convertTemperature, formatValue } from '@/src/data/format';
import { measurementStatus } from '@/src/data/status';
import { Measurement, PARAMETER_LABELS, Parameter, ScreeningStatus } from '@/src/data/types';
import { useAppTheme } from '@/src/theme';
import { useData } from '@/src/data/context';
import { StatusPill } from './StatusPill';

const iconFor: Record<Parameter, typeof Droplets> = {
  ph: Beaker,
  turbidity: Droplets,
  tds: Activity,
  temperature: Thermometer,
};

export function MeasurementTile({ parameter, measurement }: { parameter: Parameter; measurement?: Measurement }) {
  const theme = useAppTheme();
  const { temperatureUnit } = useData();
  const Icon = iconFor[parameter];
  const status = measurementStatus(measurement);
  return (
    <View style={[styles.tile, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.heading}>
        <View style={[styles.icon, { backgroundColor: theme.primarySoft }]}>
          <Icon size={17} color={theme.primary} />
        </View>
        <Text style={[styles.name, { color: theme.secondaryText }]}>{PARAMETER_LABELS[parameter]}</Text>
      </View>
      <View style={styles.valueRow}>
        <Text style={[styles.value, { color: theme.text }]}>
          {!measurement?.valid || measurement.value === null
            ? '—'
            : formatValue(parameter === 'temperature' ? convertTemperature(measurement.value, temperatureUnit) : measurement.value, 1)}
        </Text>
        <Text style={[styles.unit, { color: theme.secondaryText }]}>
          {measurement?.valid ? parameter === 'temperature' ? temperatureUnit : measurement.unit : '—'}
        </Text>
      </View>
      <StatusPill status={status} />
      <View style={styles.meta}>
        <Text style={[styles.metaText, { color: theme.mutedText }]}>
          {measurement?.calibrated ? 'Calibration confirmed' : 'Calibration unconfirmed'}
        </Text>
        <Text style={[styles.metaText, { color: theme.mutedText }]} numberOfLines={1}>
          {measurement ? formatTimestamp(measurement.timestamp) : 'No sample timestamp'}
        </Text>
      </View>
      {!measurement?.valid && measurement?.error ? (
        <Text style={[styles.error, { color: theme.warning }]}>{measurement.error}</Text>
      ) : null}
      {status === ScreeningStatus.DATA_INVALID && !measurement && (
        <Text style={[styles.error, { color: theme.warning }]}>No reading received</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { borderWidth: 1, borderRadius: 19, padding: 14, gap: 9, minHeight: 176 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  icon: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 12, fontWeight: '600' },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 5, marginTop: 1 },
  value: { fontSize: 26, fontWeight: '700', letterSpacing: -0.7 },
  unit: { fontSize: 12, fontWeight: '600' },
  meta: { gap: 3, marginTop: 1 },
  metaText: { fontSize: 10 },
  error: { fontSize: 10, lineHeight: 14 },
});
