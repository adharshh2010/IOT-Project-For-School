import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppScreen } from '@/src/components/AppScreen';
import { Panel } from '@/src/components/Panel';
import { StateNotice } from '@/src/components/StateNotice';
import { TimeRange, TrendChart } from '@/src/components/TrendChart';
import { useData } from '@/src/data/context';
import { convertTemperature, formatTimestamp, formatValue } from '@/src/data/format';
import { PARAMETER_LABELS, Parameter } from '@/src/data/types';
import { useAppTheme } from '@/src/theme';

const ranges: TimeRange[] = ['1H', '6H', '24H', '7D'];
const allParameters: Parameter[] = ['ph', 'turbidity', 'tds', 'temperature'];

export default function TrendsScreen() {
  const theme = useAppTheme();
  const { snapshot, error, loading, refresh, historyRetentionDays, temperatureUnit } = useData();
  const [range, setRange] = useState<TimeRange>('6H');
  const [parameter, setParameter] = useState<Parameter>('ph');
  const parameters = snapshot?.device.supportedParameters ?? allParameters;
  const activeParameter = parameters.includes(parameter) ? parameter : parameters[0] ?? 'ph';
  const retentionCutoff = Date.now() - 24 * 60 * 60_000 * historyRetentionDays;
  const records = (snapshot?.readings ?? []).filter((record) => Date.parse(record.timestamp) >= retentionCutoff);
  const history = [...records].sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));

  return (
    <AppScreen title="Trends" subtitle="Explore timestamped readings over time." onRefresh={() => void refresh()}>
      {error && <StateNotice kind="error" title="Could not load trends" detail={error} />}
      {loading && !snapshot && <StateNotice kind="loading" title="Loading history" detail="Waiting for readings from the selected source." />}
      <Panel
        title={`${PARAMETER_LABELS[activeParameter]} trend`}
        detail={`${activeParameter === 'temperature' ? temperatureUnit : records[0]?.measurements[activeParameter]?.unit ?? 'unit unavailable'} · unavailable values create gaps; they are not interpolated.`}
      >
        <View style={styles.selectorRow}>
          {parameters.map((key) => (
            <Pressable
              key={key}
              onPress={() => setParameter(key)}
              accessibilityRole="button"
              accessibilityState={{ selected: activeParameter === key }}
              style={[styles.parameterButton, { backgroundColor: activeParameter === key ? theme.primarySoft : theme.surfaceMuted }]}
            >
              <Text style={[styles.parameterText, { color: activeParameter === key ? theme.primary : theme.secondaryText }]}>
                {key === 'ph' ? 'pH' : key === 'tds' ? 'TDS' : key === 'temperature' ? 'Temp' : 'Turbidity'}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.rangeRow}>
          {ranges.map((item) => (
            <Pressable
              key={item}
              onPress={() => setRange(item)}
              accessibilityRole="button"
              accessibilityState={{ selected: range === item }}
              style={[styles.rangeButton, { backgroundColor: range === item ? theme.primary : theme.surfaceMuted }]}
            >
              <Text style={[styles.rangeText, { color: range === item ? '#FFFFFF' : theme.secondaryText }]}>{item}</Text>
            </Pressable>
          ))}
        </View>
        <TrendChart records={records} parameter={activeParameter} range={range} />
      </Panel>

      <Panel title="Readings history" detail={`${PARAMETER_LABELS[activeParameter]} · newest first`}>
        {history.length === 0 ? (
          <Text style={[styles.empty, { color: theme.secondaryText }]}>
            {loading ? 'Waiting for history…' : 'No reading history has been reported.'}
          </Text>
        ) : (
          <ScrollView nestedScrollEnabled style={styles.historyList}>
            {history.slice(0, 30).map((record, index) => {
              const measurement = record.measurements[activeParameter];
              return (
                <View key={record.id} style={[styles.historyRow, index > 0 && { borderTopColor: theme.border, borderTopWidth: 1 }]}>
                  <View style={styles.historyCopy}>
                    <Text style={[styles.historyValue, { color: theme.text }]}>
                        {measurement?.valid && measurement.value !== null
                        ? formatValue(
                            activeParameter === 'temperature' ? convertTemperature(measurement.value, temperatureUnit) : measurement.value,
                          2,
                        )
                        : 'Unavailable'}
                        {measurement?.valid && measurement.value !== null ? ` ${activeParameter === 'temperature' ? temperatureUnit : measurement.unit}` : ''}
                    </Text>
                    <Text style={[styles.historyTime, { color: theme.mutedText }]}>{formatTimestamp(record.timestamp)}</Text>
                  </View>
                  {!measurement?.valid && <Text style={[styles.missing, { color: theme.warning }]}>Invalid / missing</Text>}
                </View>
              );
            })}
          </ScrollView>
        )}
      </Panel>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  selectorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  parameterButton: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 11 },
  parameterText: { fontSize: 11, fontWeight: '700' },
  rangeRow: { flexDirection: 'row', gap: 7 },
  rangeButton: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 10 },
  rangeText: { fontSize: 11, fontWeight: '700' },
  empty: { fontSize: 12, lineHeight: 18 },
  historyList: { maxHeight: 290 },
  historyRow: { minHeight: 55, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 9, gap: 8 },
  historyCopy: { gap: 3 },
  historyValue: { fontSize: 13, fontWeight: '700' },
  historyTime: { fontSize: 10 },
  missing: { fontSize: 10, fontWeight: '600' },
});
