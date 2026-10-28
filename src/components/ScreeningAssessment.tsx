import React from 'react';
import { CircleAlert, CircleCheck, CircleHelp } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { getScreeningAssessment } from '@/src/data/status';
import { ScreeningStatus } from '@/src/data/types';
import { useAppTheme } from '@/src/theme';
import { Panel } from './Panel';

export function ScreeningAssessment({ status }: { status: ScreeningStatus }) {
  const theme = useAppTheme();
  const assessment = getScreeningAssessment(status);
  const color = assessment.tone === 'danger'
    ? theme.danger
    : assessment.tone === 'warning'
      ? theme.warning
      : assessment.tone === 'informative'
        ? theme.primary
        : theme.secondaryText;
  const Icon = assessment.tone === 'danger' || assessment.tone === 'warning'
    ? CircleAlert
    : assessment.tone === 'informative'
      ? CircleCheck
      : CircleHelp;

  return (
    <Panel title="Drinkability screening" detail="A screening result—not a drinking-water safety test.">
      <View style={styles.result}>
        <View style={[styles.icon, { backgroundColor: assessment.tone === 'danger'
          ? theme.dangerSoft
          : assessment.tone === 'warning'
            ? theme.warningSoft
            : theme.primarySoft }]}
        >
          <Icon size={20} color={color} />
        </View>
        <Text accessibilityRole="header" style={[styles.title, { color: theme.text }]}>
          {assessment.title}
        </Text>
      </View>
      <Text style={[styles.detail, { color: theme.secondaryText }]}>{assessment.detail}</Text>
    </Panel>
  );
}

const styles = StyleSheet.create({
  result: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  icon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, fontSize: 15, fontWeight: '700' },
  detail: { fontSize: 12, lineHeight: 18 },
});
