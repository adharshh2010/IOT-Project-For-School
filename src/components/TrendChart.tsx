import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';
import { formatTimestamp, formatValue } from '@/src/data/format';
import { convertTemperature } from '@/src/data/format';
import { TelemetryRecord } from '@/src/data/types';
import { useData } from '@/src/data/context';
import { useAppTheme } from '@/src/theme';

export type TimeRange = '1H' | '6H' | '24H' | '7D';

const RANGE_MS: Record<TimeRange, number> = {
  '1H': 60 * 60_000,
  '6H': 6 * 60 * 60_000,
  '24H': 24 * 60 * 60_000,
  '7D': 7 * 24 * 60 * 60_000,
};

interface Props {
  records: TelemetryRecord[];
  parameter: keyof TelemetryRecord['measurements'];
  range: TimeRange;
}

export function TrendChart({ records, parameter, range }: Props) {
  const theme = useAppTheme();
  const { temperatureUnit } = useData();
  const now = Date.now();
  const filtered = records
    .filter((record) => {
      const time = Date.parse(record.timestamp);
      return Number.isFinite(time) && time >= now - RANGE_MS[range] && time <= now + 60_000;
    })
    .sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
  const validValues = filtered.flatMap((record) => {
    const measurement = record.measurements[parameter];
    return measurement?.valid && measurement.value !== null
      ? [parameter === 'temperature' ? convertTemperature(measurement.value, temperatureUnit) : measurement.value]
      : [];
  });

  if (filtered.length === 0 || validValues.length === 0) {
    return (
      <View style={[styles.empty, { backgroundColor: theme.surfaceMuted }]}>
        <Text style={[styles.emptyTitle, { color: theme.text }]}>Not enough data for this range</Text>
        <Text style={[styles.emptyDetail, { color: theme.secondaryText }]}>
          Charts use timestamped, valid readings. Missing samples remain gaps.
        </Text>
      </View>
    );
  }

  const width = 320;
  const height = 190;
  const left = 43;
  const right = 10;
  const top = 14;
  const bottom = 32;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const minimum = Math.min(...validValues);
  const maximum = Math.max(...validValues);
  const padding = maximum === minimum ? Math.max(Math.abs(minimum) * 0.1, 1) : (maximum - minimum) * 0.15;
  const low = minimum - padding;
  const high = maximum + padding;
  const firstTime = Date.parse(filtered[0].timestamp);
  const lastTime = Date.parse(filtered[filtered.length - 1].timestamp);
  const x = (record: TelemetryRecord) => firstTime === lastTime
    ? left + plotWidth / 2
    : left + ((Date.parse(record.timestamp) - firstTime) / (lastTime - firstTime)) * plotWidth;
  const y = (value: number) => top + ((high - value) / (high - low)) * plotHeight;

  const paths: string[] = [];
  let segment = '';
  filtered.forEach((record) => {
    const measurement = record.measurements[parameter];
    if (!measurement?.valid || measurement.value === null) {
      if (segment) paths.push(segment);
      segment = '';
      return;
    }
    const value = parameter === 'temperature' ? convertTemperature(measurement.value, temperatureUnit) : measurement.value;
    const nextPoint = `${x(record).toFixed(1)} ${y(value).toFixed(1)}`;
    segment = segment ? `${segment} L ${nextPoint}` : `M ${nextPoint}`;
  });
  if (segment) paths.push(segment);
  const labels = [filtered[0], filtered[Math.floor((filtered.length - 1) / 2)], filtered[filtered.length - 1]];
  const uniqueLabels = labels.filter((record, index) => labels.findIndex((entry) => entry.id === record.id) === index);

  return (
    <View accessibilityLabel={`${parameter} trend chart, ${validValues.length} valid readings`}>
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        {[0, 0.5, 1].map((fraction) => {
          const yPos = top + fraction * plotHeight;
          const tick = high - fraction * (high - low);
          return (
            <React.Fragment key={fraction}>
              <Line x1={left} y1={yPos} x2={width - right} y2={yPos} stroke={theme.chartGrid} strokeWidth={1} />
              <SvgText x={left - 7} y={yPos + 4} textAnchor="end" fill={theme.mutedText} fontSize={10}>
                {formatValue(tick, 1)}
              </SvgText>
            </React.Fragment>
          );
        })}
        {paths.map((path, index) => (
          <Path key={index} d={path} fill="none" stroke={theme.chart} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        ))}
        {filtered.map((record) => {
          const measurement = record.measurements[parameter];
          return measurement?.valid && measurement.value !== null ? (
            <Circle
              key={record.id}
              cx={x(record)}
              cy={y(parameter === 'temperature' ? convertTemperature(measurement.value, temperatureUnit) : measurement.value)}
              r={3.5}
              fill={theme.chart}
            />
          ) : null;
        })}
        {uniqueLabels.map((record) => (
          <SvgText key={record.id} x={x(record)} y={height - 7} textAnchor="middle" fill={theme.mutedText} fontSize={9}>
            {new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(record.timestamp))}
          </SvgText>
        ))}
      </Svg>
      <Text style={[styles.caption, { color: theme.mutedText }]}>
        {validValues.length} valid sample{validValues.length === 1 ? '' : 's'} · {parameter === 'temperature' ? temperatureUnit : filtered[0].measurements[parameter].unit}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { minHeight: 145, alignItems: 'center', justifyContent: 'center', padding: 18, borderRadius: 14, gap: 5 },
  emptyTitle: { fontSize: 13, fontWeight: '700', textAlign: 'center' },
  emptyDetail: { fontSize: 11, lineHeight: 16, textAlign: 'center' },
  caption: { fontSize: 10, textAlign: 'center', marginTop: 1 },
});
