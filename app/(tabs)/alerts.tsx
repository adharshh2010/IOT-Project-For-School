import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AlertTriangle, Check } from 'lucide-react-native';
import { AppScreen } from '@/src/components/AppScreen';
import { Panel } from '@/src/components/Panel';
import { StateNotice } from '@/src/components/StateNotice';
import { useData } from '@/src/data/context';
import { formatTimestamp, formatValue } from '@/src/data/format';
import { convertTemperature } from '@/src/data/format';
import { PARAMETER_LABELS } from '@/src/data/types';
import { useAppTheme } from '@/src/theme';

type EventFilter = 'active' | 'resolved';

export default function AlertsScreen() {
  const theme = useAppTheme();
  const { snapshot, error, loading, refresh, mode, temperatureUnit } = useData();
  const [filter, setFilter] = useState<EventFilter>('active');
  const events = useMemo(
    () => (snapshot?.events ?? []).filter((event) => event.active === (filter === 'active')),
    [snapshot, filter],
  );

  return (
    <AppScreen title="Alerts" subtitle="Reported threshold events and suggested checks." onRefresh={() => void refresh()}>
      {error && <StateNotice kind="error" title="Events unavailable" detail={error} />}
      {loading && !snapshot && <StateNotice kind="loading" title="Loading events" detail="Waiting for events from the selected source." />}
      <View style={[styles.filters, { backgroundColor: theme.surfaceMuted }]}>
        {(['active', 'resolved'] as EventFilter[]).map((item) => (
          <Pressable
            key={item}
            accessibilityRole="button"
            accessibilityState={{ selected: filter === item }}
            onPress={() => setFilter(item)}
            style={[styles.filterButton, filter === item && { backgroundColor: theme.surface }]}
          >
            <Text style={[styles.filterText, { color: filter === item ? theme.text : theme.secondaryText }]}>
              {item === 'active' ? 'Active' : 'Resolved'}
            </Text>
          </Pressable>
        ))}
      </View>
      {events.length === 0 ? (
        <Panel>
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: theme.surfaceMuted }]}>
              {filter === 'active'
                ? <Check size={19} color={theme.success} />
                : <AlertTriangle size={18} color={theme.mutedText} />}
            </View>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              {filter === 'active' ? 'No active events reported' : 'No resolved events reported'}
            </Text>
            <Text style={[styles.emptyText, { color: theme.secondaryText }]}>
              {mode === 'demo'
                ? 'The demo dataset contains no alert events. This does not indicate that a real water sample is safe.'
                : 'No events were returned by the API for this filter.'}
            </Text>
          </View>
        </Panel>
      ) : events.map((event) => (
        <Panel key={event.id}>
          <View style={styles.eventHeader}>
            <View style={[styles.eventIcon, { backgroundColor: event.priority === 'high' ? theme.dangerSoft : theme.warningSoft }]}>
              <AlertTriangle size={17} color={event.priority === 'high' ? theme.danger : theme.warning} />
            </View>
            <View style={styles.eventTitle}>
              <Text style={[styles.parameter, { color: theme.text }]}>{PARAMETER_LABELS[event.parameter]}</Text>
              <Text style={[styles.date, { color: theme.mutedText }]}>{formatTimestamp(event.timestamp)}</Text>
            </View>
            <Text style={[styles.priority, { color: event.priority === 'high' ? theme.danger : theme.warning }]}>
              {event.priority === 'high' ? 'Priority' : 'Review'}
            </Text>
          </View>
          <View style={[styles.valueBlock, { backgroundColor: theme.surfaceMuted }]}>
            <Text style={[styles.valueLabel, { color: theme.secondaryText }]}>MEASURED</Text>
            <Text style={[styles.value, { color: theme.text }]}>
              {formatValue(event.parameter === 'temperature' ? convertTemperature(event.measuredValue, temperatureUnit) : event.measuredValue, 2)}
              {' '}{event.parameter === 'temperature' ? temperatureUnit : event.unit}
            </Text>
            <Text style={[styles.reference, { color: theme.secondaryText }]}>Configured reference · {event.reference}</Text>
          </View>
          <View style={styles.suggestion}>
            <Text style={[styles.suggestionLabel, { color: theme.secondaryText }]}>Suggested investigation</Text>
            <Text style={[styles.suggestionText, { color: theme.text }]}>{event.suggestedInvestigation}</Text>
          </View>
        </Panel>
      ))}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  filters: { flexDirection: 'row', borderRadius: 13, padding: 4, gap: 4 },
  filterButton: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 10 },
  filterText: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
  empty: { alignItems: 'center', gap: 9, paddingVertical: 6 },
  emptyIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 14, fontWeight: '700', textAlign: 'center' },
  emptyText: { fontSize: 12, lineHeight: 18, textAlign: 'center' },
  eventHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  eventIcon: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  eventTitle: { flex: 1, gap: 3 },
  parameter: { fontSize: 14, fontWeight: '700' },
  date: { fontSize: 10 },
  priority: { fontSize: 11, fontWeight: '700' },
  valueBlock: { padding: 12, borderRadius: 13, gap: 4 },
  valueLabel: { fontSize: 9, letterSpacing: 0.8, fontWeight: '700' },
  value: { fontSize: 18, fontWeight: '700' },
  reference: { fontSize: 11 },
  suggestion: { gap: 4 },
  suggestionLabel: { fontSize: 11, fontWeight: '700' },
  suggestionText: { fontSize: 12, lineHeight: 18 },
});
