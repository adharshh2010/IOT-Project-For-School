import React from 'react';
import { Link } from 'expo-router';
import { ChevronRight, CircleCheck, CircleX, Cpu, Wifi, WifiOff } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppScreen } from '@/src/components/AppScreen';
import { Panel } from '@/src/components/Panel';
import { StateNotice } from '@/src/components/StateNotice';
import { useData } from '@/src/data/context';
import { formatTimestamp } from '@/src/data/format';
import { PARAMETER_LABELS } from '@/src/data/types';
import { useAppTheme } from '@/src/theme';

export default function DeviceScreen() {
  const theme = useAppTheme();
  const { snapshot, error, loading, refresh, mode, apiBaseUrl } = useData();
  const device = snapshot?.device;
  const liveConnected = mode === 'api' && device?.connected === true;

  return (
    <AppScreen title="Device" subtitle="Connection details and practical troubleshooting." onRefresh={() => void refresh()}>
      {error && <StateNotice kind="error" title="Connection check failed" detail={error} />}
      {loading && !snapshot && <StateNotice kind="loading" title="Checking connection" detail="Waiting for device and API status." />}
      <Panel>
        <View style={styles.deviceHero}>
          <View style={[styles.deviceIcon, { backgroundColor: theme.primarySoft }]}>
            <Cpu size={21} color={theme.primary} />
          </View>
          <View style={styles.deviceCopy}>
            <Text style={[styles.deviceId, { color: theme.text }]}>{device?.deviceId ?? 'No device reported'}</Text>
            <Text style={[styles.deviceMeta, { color: theme.secondaryText }]}>Firmware {device?.firmwareVersion ?? 'not reported'}</Text>
          </View>
        </View>
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <StatusRow
          label="Sensor connection"
          value={mode === 'demo' ? 'Not verified in demo mode' : liveConnected ? 'Connected' : 'Not connected'}
          icon={liveConnected ? <Wifi size={16} color={theme.success} /> : <WifiOff size={16} color={theme.mutedText} />}
          color={theme.text}
        />
        <StatusRow
          label="API connectivity"
          value={mode === 'demo' ? 'Not tested · demo mode' : error ? 'Request failed' : device?.apiConnected ? 'Connected' : 'Not connected'}
          icon={error ? <CircleX size={16} color={theme.danger} /> : <CircleCheck size={16} color={mode === 'api' && device?.apiConnected ? theme.success : theme.mutedText} />}
          color={theme.text}
        />
        <StatusRow label="Last contact" value={mode === 'demo' ? 'Not available for demo data' : formatTimestamp(device?.lastContact)} color={theme.text} />
        <StatusRow
          label="Available sensors"
          value={device?.supportedParameters.map((parameter) => PARAMETER_LABELS[parameter]).join(', ') ?? 'Not reported'}
          color={theme.text}
        />
        <StatusRow label="API endpoint" value={mode === 'demo' ? 'Not in use' : apiBaseUrl || 'Not configured'} color={theme.text} />
      </Panel>

      <Panel title="Connection troubleshooting">
        <TroubleStep number="01" text="Confirm the device has power and its status indicator is active." />
        <TroubleStep number="02" text="Check that the phone and backend can reach the same local network." />
        <TroubleStep number="03" text="For Android Emulator, use 10.0.2.2 to reach a service on your computer." />
        <TroubleStep number="04" text="Verify the configured base URL and that the backend implements the documented API routes." />
      </Panel>

      <Link href="/settings" asChild>
        <Pressable
          accessibilityRole="link"
          style={StyleSheet.flatten([styles.link, { backgroundColor: theme.surfaceMuted }])}
        >
          <Text style={[styles.linkText, { color: theme.text }]}>Open API and device settings</Text>
          <ChevronRight size={17} color={theme.secondaryText} />
        </Pressable>
      </Link>
    </AppScreen>
  );
}

function StatusRow({ label, value, icon, color }: { label: string; value: string; icon?: React.ReactNode; color: string }) {
  const theme = useAppTheme();
  return (
    <View style={styles.statusRow}>
      <Text style={[styles.statusLabel, { color: theme.secondaryText }]}>{label}</Text>
      <View style={styles.statusValueWrap}>
        {icon}
        <Text style={[styles.statusValue, { color }]}>{value}</Text>
      </View>
    </View>
  );
}

function TroubleStep({ number, text }: { number: string; text: string }) {
  const theme = useAppTheme();
  return (
    <View style={styles.step}>
      <Text style={[styles.stepNumber, { color: theme.primary }]}>{number}</Text>
      <Text style={[styles.stepText, { color: theme.secondaryText }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  deviceHero: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  deviceIcon: { width: 46, height: 46, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  deviceCopy: { gap: 4 },
  deviceId: { fontSize: 16, fontWeight: '700' },
  deviceMeta: { fontSize: 11 },
  divider: { height: 1 },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  statusLabel: { fontSize: 11 },
  statusValueWrap: { flexDirection: 'row', alignItems: 'center', gap: 5, maxWidth: '62%' },
  statusValue: { fontSize: 11, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
  step: { flexDirection: 'row', gap: 10 },
  stepNumber: { fontSize: 11, fontWeight: '800', paddingTop: 1 },
  stepText: { flex: 1, fontSize: 12, lineHeight: 17 },
  link: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderRadius: 14 },
  linkText: { fontSize: 12, fontWeight: '700' },
});
