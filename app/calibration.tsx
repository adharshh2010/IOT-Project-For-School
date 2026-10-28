import React from 'react';
import { Link } from 'expo-router';
import { ArrowLeft, Beaker, CircleHelp, Info } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppScreen } from '@/src/components/AppScreen';
import { Panel } from '@/src/components/Panel';
import { useData } from '@/src/data/context';
import { useAppTheme } from '@/src/theme';

export default function CalibrationScreen() {
  const theme = useAppTheme();
  const { snapshot, mode } = useData();
  const calibrationReported = snapshot?.latest
    ? Object.values(snapshot.latest.measurements).some((measurement) => measurement.calibrated)
    : false;

  return (
    <AppScreen title="Calibration" subtitle="Understand and record sensor calibration status.">
      <Panel style={styles.statePanel}>
        <View style={[styles.icon, { backgroundColor: calibrationReported ? theme.successSoft : theme.warningSoft }]}>
          {calibrationReported
            ? <Beaker size={19} color={theme.success} />
            : <CircleHelp size={19} color={theme.warning} />}
        </View>
        <Text style={[styles.stateTitle, { color: theme.text }]}>
          {calibrationReported ? 'Calibration reported by data source' : 'Calibration not confirmed'}
        </Text>
        <Text style={[styles.stateDetail, { color: theme.secondaryText }]}>
          {mode === 'demo'
            ? 'The demo does not perform calibration. All sample measurements are explicitly marked unconfirmed.'
            : 'No calibration workflow or calibration-history endpoint is currently connected to this app.'}
        </Text>
      </Panel>

      <Panel title="Before calibrating" detail="Follow the probe manufacturer's instructions for your exact sensor hardware.">
        <Instruction number="1" text="Check that the probe is clean, undamaged, and suitable for the liquid being measured." />
        <Instruction number="2" text="Use fresh, labelled reference solutions and avoid returning used solution to its bottle." />
        <Instruction number="3" text="Rinse the probe between solutions and allow its reading to stabilize as directed by its manufacturer." />
        <Instruction number="4" text="Record the solution, date, sensor identity, and result in your validated calibration workflow." />
      </Panel>

      <Panel title="Reference solution records" detail="Examples for pH calibration—not completed calibration records.">
        {['pH 4.00 · acidic reference', 'pH 7.00 · neutral reference', 'pH 10.00 · alkaline reference'].map((entry) => (
          <View key={entry} style={styles.recordRow}>
            <Beaker size={15} color={theme.primary} />
            <Text style={[styles.recordText, { color: theme.text }]}>{entry}</Text>
            <Text style={[styles.notRecorded, { color: theme.mutedText }]}>Not recorded</Text>
          </View>
        ))}
        <View style={[styles.notice, { backgroundColor: theme.surfaceMuted }]}>
          <Info size={16} color={theme.secondaryText} />
          <Text style={[styles.noticeText, { color: theme.secondaryText }]}>
            This app cannot perform or save calibration yet. Sensor readings stay labelled unconfirmed until a real workflow reports otherwise.
          </Text>
        </View>
      </Panel>

      <Link href="/" asChild>
        <Pressable accessibilityRole="link" style={styles.back}>
          <ArrowLeft size={16} color={theme.primary} />
          <Text style={[styles.backText, { color: theme.primary }]}>Back to overview</Text>
        </Pressable>
      </Link>
    </AppScreen>
  );
}

function Instruction({ number, text }: { number: string; text: string }) {
  const theme = useAppTheme();
  return (
    <View style={styles.instruction}>
      <View style={[styles.number, { backgroundColor: theme.primarySoft }]}>
        <Text style={[styles.numberText, { color: theme.primary }]}>{number}</Text>
      </View>
      <Text style={[styles.instructionText, { color: theme.secondaryText }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  statePanel: { alignItems: 'flex-start' },
  icon: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 14 },
  stateTitle: { fontSize: 15, fontWeight: '700' },
  stateDetail: { fontSize: 12, lineHeight: 18 },
  instruction: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  number: { width: 24, height: 24, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  numberText: { fontSize: 11, fontWeight: '800' },
  instructionText: { flex: 1, fontSize: 12, lineHeight: 18 },
  recordRow: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 29 },
  recordText: { flex: 1, fontSize: 12, fontWeight: '600' },
  notRecorded: { fontSize: 10 },
  notice: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 11, borderRadius: 12 },
  noticeText: { flex: 1, fontSize: 11, lineHeight: 16 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingVertical: 5 },
  backText: { fontSize: 12, fontWeight: '700' },
});
