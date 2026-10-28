import React, { useEffect, useState } from 'react';
import { Link } from 'expo-router';
import { ArrowLeft, Check, Info } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { AppScreen } from '@/src/components/AppScreen';
import { Panel } from '@/src/components/Panel';
import { StateNotice } from '@/src/components/StateNotice';
import { useData } from '@/src/data/context';
import { convertToCelsius } from '@/src/data/format';
import { ScreeningThresholds } from '@/src/data/types';
import { useAppTheme } from '@/src/theme';

const RETENTION_OPTIONS = [1, 7, 30, 90];
type Draft = Record<'phMin' | 'phMax' | 'turbidityMax' | 'tdsMax' | 'tempMin' | 'tempMax', string>;

export default function SettingsScreen() {
  const theme = useAppTheme();
  const {
    mode, apiBaseUrl, configureApi, setMode, thresholds, setThresholds,
    temperatureUnit, setTemperatureUnit, historyRetentionDays, setHistoryRetentionDays,
    error, loading,
  } = useData();
  const [endpoint, setEndpoint] = useState(apiBaseUrl);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(() => makeDraft(thresholds, temperatureUnit));

  useEffect(() => {
    setEndpoint(apiBaseUrl);
  }, [apiBaseUrl]);

  useEffect(() => {
    setDraft(makeDraft(thresholds, temperatureUnit));
  }, [thresholds, temperatureUnit]);

  const saveThresholds = () => {
    const values = Object.values(draft).map(Number);
    if (values.some((value) => !Number.isFinite(value))) {
      setValidationError('Enter a valid number for each screening range.');
      return;
    }
    const [phMin, phMax, turbidityMax, tdsMax, tempMinInput, tempMaxInput] = values;
    const tempMin = convertToCelsius(tempMinInput, temperatureUnit);
    const tempMax = convertToCelsius(tempMaxInput, temperatureUnit);
    if (phMin >= phMax || tempMin >= tempMax || turbidityMax < 0 || tdsMax < 0) {
      setValidationError('Minimum values must be lower than maximums; turbidity and TDS limits cannot be negative.');
      return;
    }
    const next: ScreeningThresholds = {
      ph: { minimum: phMin, maximum: phMax },
      turbidity: { maximum: turbidityMax },
      tds: { maximum: tdsMax },
      temperature: { minimum: tempMin, maximum: tempMax },
    };
    setThresholds(next);
    setValidationError(null);
    setSavedMessage('Screening ranges saved on this device.');
  };

  const enableApi = () => {
    const url = endpoint.trim();
    if (!/^https?:\/\/\S+$/i.test(url)) {
      setValidationError('Enter a complete HTTP or HTTPS API base URL first.');
      return;
    }
    configureApi(url, 'api');
    setValidationError(null);
    setSavedMessage('API selected. Connecting to the configured endpoint…');
  };

  const useDemo = () => {
    setMode('demo');
    setValidationError(null);
    setSavedMessage('Demo mode selected. Sample values are illustrative, not sensor readings.');
  };

  return (
    <AppScreen title="Settings & about" subtitle="Configure the data source and screening display.">
      {error && <StateNotice kind="error" title="Data source status" detail={error} />}
      {loading && mode === 'api' && <StateNotice kind="loading" title="Checking API" detail="Contacting the configured endpoints." />}

      <Panel title="Data source" detail="The app never substitutes demo values when a live API request fails.">
        <View style={[styles.modeSwitch, { backgroundColor: theme.surfaceMuted }]}>
          <ModeButton selected={mode === 'demo'} label="Demo mode" onPress={useDemo} />
          <ModeButton selected={mode === 'api'} label="Live API" onPress={enableApi} />
        </View>
        <Field
          label="API base URL"
          value={endpoint}
          onChangeText={(text) => { setEndpoint(text); setValidationError(null); }}
          placeholder="http://10.0.2.2:3000"
          accessibilityLabel="API base URL"
          autoCapitalize="none"
          keyboardType="url"
        />
        <Text style={[styles.caption, { color: theme.mutedText }]}>
          Expo public defaults: EXPO_PUBLIC_DATA_MODE and EXPO_PUBLIC_API_BASE_URL. Saved app settings override these defaults.
        </Text>
      </Panel>

      <Panel title="Screening ranges" detail="Editable example references only—not regulatory or drinking-water safety limits.">
        <View style={[styles.caution, { backgroundColor: theme.warningSoft }]}>
          <Info size={15} color={theme.warning} />
          <Text style={[styles.cautionText, { color: theme.secondaryText }]}>
            Set ranges using validated sensors, local guidance, and your intended use. The status describes these configured ranges only.
          </Text>
        </View>
        <View style={styles.fieldRow}>
          <Field label="pH minimum" value={draft.phMin} onChangeText={(value) => setDraft({ ...draft, phMin: value })} accessibilityLabel="pH minimum" keyboardType="decimal-pad" />
          <Field label="pH maximum" value={draft.phMax} onChangeText={(value) => setDraft({ ...draft, phMax: value })} accessibilityLabel="pH maximum" keyboardType="decimal-pad" />
        </View>
        <View style={styles.fieldRow}>
          <Field label="Turbidity maximum · NTU" value={draft.turbidityMax} onChangeText={(value) => setDraft({ ...draft, turbidityMax: value })} accessibilityLabel="Turbidity maximum in NTU" keyboardType="decimal-pad" />
          <Field label="TDS maximum · ppm" value={draft.tdsMax} onChangeText={(value) => setDraft({ ...draft, tdsMax: value })} accessibilityLabel="TDS maximum in parts per million" keyboardType="decimal-pad" />
        </View>
        <View style={styles.fieldRow}>
          <Field label={`Temperature minimum · ${temperatureUnit}`} value={draft.tempMin} onChangeText={(value) => setDraft({ ...draft, tempMin: value })} accessibilityLabel={`Temperature minimum in ${temperatureUnit}`} keyboardType="decimal-pad" />
          <Field label={`Temperature maximum · ${temperatureUnit}`} value={draft.tempMax} onChangeText={(value) => setDraft({ ...draft, tempMax: value })} accessibilityLabel={`Temperature maximum in ${temperatureUnit}`} keyboardType="decimal-pad" />
        </View>
        <ActionButton label="Save screening ranges" onPress={saveThresholds} />
        {savedMessage && <Text style={[styles.success, { color: theme.success }]}>{savedMessage}</Text>}
        {validationError && <Text accessibilityRole="alert" style={[styles.error, { color: theme.danger }]}>{validationError}</Text>}
      </Panel>

      <Panel title="Display units" detail="Temperature thresholds are converted and stored internally in °C.">
        <View style={styles.modeSwitch}>
          <ModeButton selected={temperatureUnit === '°C'} label="Celsius · °C" onPress={() => setTemperatureUnit('°C')} />
          <ModeButton selected={temperatureUnit === '°F'} label="Fahrenheit · °F" onPress={() => setTemperatureUnit('°F')} />
        </View>
        <Text style={[styles.caption, { color: theme.mutedText }]}>
          pH, turbidity (NTU), and dissolved solids (ppm) use the units supplied by the device API.
        </Text>
      </Panel>

      <Panel title="History retention" detail="Controls how much returned history is shown in this app; it does not delete server records.">
        <View style={styles.retentionRow}>
          {RETENTION_OPTIONS.map((days) => (
            <ModeButton
              key={days}
              selected={historyRetentionDays === days}
              label={`${days}d`}
              onPress={() => setHistoryRetentionDays(days)}
            />
          ))}
        </View>
      </Panel>

      <Panel title="About NEERGUARD">
        <InfoRow label="Project" value="IoT water-quality screening prototype" />
        <InfoRow label="Indicators" value="pH, turbidity, dissolved solids (TDS), temperature" />
        <InfoRow label="Privacy" value="No account or analytics service is configured. API traffic goes only to the base URL you enter." />
        <InfoRow label="Limitations" value="Selected indicators only. This device cannot determine drinking-water safety or detect every pathogen or chemical contaminant." />
        <InfoRow label="Calibration" value="No calibration action or history is currently provided by the API." />
      </Panel>

      <Link href="/calibration" asChild>
        <Pressable
          accessibilityRole="link"
          style={StyleSheet.flatten([styles.link, { backgroundColor: theme.surfaceMuted }])}
        >
          <Text style={[styles.linkText, { color: theme.text }]}>Calibration guidance and records</Text>
          <ArrowLeft size={16} color={theme.secondaryText} style={{ transform: [{ rotate: '180deg' }] }} />
        </Pressable>
      </Link>
      <Link href="/" asChild>
        <Pressable accessibilityRole="link" style={styles.back}>
          <ArrowLeft size={16} color={theme.primary} />
          <Text style={[styles.backText, { color: theme.primary }]}>Back to overview</Text>
        </Pressable>
      </Link>
    </AppScreen>
  );
}

function makeDraft(thresholds: ScreeningThresholds, unit: '°C' | '°F'): Draft {
  const fromCelsius = (value: number) => unit === '°F' ? (value * 9) / 5 + 32 : value;
  return {
    phMin: String(thresholds.ph.minimum),
    phMax: String(thresholds.ph.maximum),
    turbidityMax: String(thresholds.turbidity.maximum),
    tdsMax: String(thresholds.tds.maximum),
    tempMin: fromCelsius(thresholds.temperature.minimum).toFixed(1),
    tempMax: fromCelsius(thresholds.temperature.maximum).toFixed(1),
  };
}

function ModeButton({ selected, label, onPress }: { selected: boolean; label: string; onPress: () => void }) {
  const theme = useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.modeButton, selected && { backgroundColor: theme.surface }]}
    >
      <Text style={[styles.modeText, { color: selected ? theme.primary : theme.secondaryText }]}>{label}</Text>
    </Pressable>
  );
}

function Field({
  label, value, onChangeText, placeholder, accessibilityLabel, autoCapitalize, keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  accessibilityLabel: string;
  autoCapitalize?: 'none' | 'sentences';
  keyboardType?: 'url' | 'decimal-pad';
}) {
  const theme = useAppTheme();
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: theme.secondaryText }]}>{label}</Text>
      <TextInput
        accessibilityLabel={accessibilityLabel}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.mutedText}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        style={[styles.input, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border }]}
      />
    </View>
  );
}

function ActionButton({ label, onPress }: { label: string; onPress: () => void }) {
  const theme = useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.actionButton, { backgroundColor: theme.primary, opacity: pressed ? 0.8 : 1 }]}
    >
      <Check size={16} color="#FFFFFF" />
      <Text style={styles.actionText}>{label}</Text>
    </Pressable>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  const theme = useAppTheme();
  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoLabel, { color: theme.secondaryText }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: theme.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  modeSwitch: { flexDirection: 'row', gap: 5, padding: 4, borderRadius: 13, backgroundColor: 'transparent' },
  modeButton: { flex: 1, minHeight: 36, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 7, paddingVertical: 8, borderRadius: 10 },
  modeText: { fontSize: 11, fontWeight: '700', textAlign: 'center' },
  field: { flex: 1, minWidth: 120, gap: 5 },
  fieldLabel: { fontSize: 10, fontWeight: '600' },
  input: { height: 42, borderRadius: 11, borderWidth: 1, paddingHorizontal: 10, fontSize: 13 },
  caption: { fontSize: 10, lineHeight: 15 },
  caution: { flexDirection: 'row', alignItems: 'flex-start', gap: 7, borderRadius: 12, padding: 10 },
  cautionText: { flex: 1, fontSize: 11, lineHeight: 16 },
  fieldRow: { flexDirection: 'row', gap: 10 },
  actionButton: { minHeight: 43, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, padding: 10, borderRadius: 12 },
  actionText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  success: { fontSize: 11 },
  error: { fontSize: 11, lineHeight: 16 },
  retentionRow: { flexDirection: 'row', gap: 5 },
  infoRow: { gap: 3 },
  infoLabel: { fontSize: 10, fontWeight: '700' },
  infoValue: { fontSize: 12, lineHeight: 18 },
  link: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 14 },
  linkText: { fontSize: 12, fontWeight: '700' },
  back: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
  backText: { fontSize: 12, fontWeight: '700' },
});
