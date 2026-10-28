import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DemoDataProvider } from './demo';
import { HttpApiProvider } from './api';
import { DataSnapshot, DEFAULT_THRESHOLDS, ScreeningThresholds, TelemetryDataProvider } from './types';

const STORAGE_KEY = 'neerguard.settings.v1';
const DEFAULT_API_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';
const DEFAULT_MODE = process.env.EXPO_PUBLIC_DATA_MODE === 'api' && DEFAULT_API_URL ? 'api' : 'demo';

interface StoredSettings {
  mode: 'demo' | 'api';
  apiBaseUrl: string;
  thresholds: ScreeningThresholds;
  temperatureUnit: '°C' | '°F';
  historyRetentionDays: number;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isScreeningThresholds(value: unknown): value is ScreeningThresholds {
  if (!isObject(value) || !isObject(value.ph) || !isObject(value.turbidity)
    || !isObject(value.tds) || !isObject(value.temperature)) return false;
  return isFiniteNumber(value.ph.minimum) && isFiniteNumber(value.ph.maximum)
    && value.ph.minimum < value.ph.maximum
    && isFiniteNumber(value.turbidity.maximum) && value.turbidity.maximum >= 0
    && isFiniteNumber(value.tds.maximum) && value.tds.maximum >= 0
    && isFiniteNumber(value.temperature.minimum) && isFiniteNumber(value.temperature.maximum)
    && value.temperature.minimum < value.temperature.maximum;
}

interface DataContextValue {
  mode: 'demo' | 'api';
  snapshot: DataSnapshot | null;
  loading: boolean;
  error: string | null;
  apiBaseUrl: string;
  thresholds: ScreeningThresholds;
  temperatureUnit: '°C' | '°F';
  historyRetentionDays: number;
  setMode: (mode: 'demo' | 'api') => void;
  setApiBaseUrl: (url: string) => void;
  configureApi: (url: string, mode: 'demo' | 'api') => void;
  setThresholds: (thresholds: ScreeningThresholds) => void;
  setTemperatureUnit: (unit: '°C' | '°F') => void;
  setHistoryRetentionDays: (days: number) => void;
  refresh: () => Promise<void>;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: PropsWithChildren) {
  const [mode, setMode] = useState<'demo' | 'api'>(DEFAULT_MODE);
  const [apiBaseUrl, setApiBaseUrl] = useState(DEFAULT_API_URL);
  const [thresholds, setThresholds] = useState(DEFAULT_THRESHOLDS);
  const [temperatureUnit, setTemperatureUnit] = useState<'°C' | '°F'>('°C');
  const [historyRetentionDays, setHistoryRetentionDays] = useState(30);
  const [snapshot, setSnapshot] = useState<DataSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (!active) return;
        if (stored) {
          const parsed = JSON.parse(stored) as Partial<StoredSettings>;
          if (parsed.mode === 'demo' || parsed.mode === 'api') setMode(parsed.mode);
          if (typeof parsed.apiBaseUrl === 'string') setApiBaseUrl(parsed.apiBaseUrl);
          if (parsed.thresholds && isScreeningThresholds(parsed.thresholds)) {
            setThresholds(parsed.thresholds);
          } else if (parsed.thresholds) {
            setSettingsError('Saved screening ranges are invalid. Default ranges are being used.');
          }
          if (parsed.temperatureUnit === '°C' || parsed.temperatureUnit === '°F') setTemperatureUnit(parsed.temperatureUnit);
          if (parsed.historyRetentionDays === 1 || parsed.historyRetentionDays === 7
            || parsed.historyRetentionDays === 30 || parsed.historyRetentionDays === 90) {
            setHistoryRetentionDays(parsed.historyRetentionDays);
          }
        }
        setReady(true);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setSettingsError(`Could not load saved settings: ${cause instanceof Error ? cause.message : 'unknown error'}`);
        setReady(true);
      });
    return () => { active = false; };
  }, []);

  const persistSettings = useCallback((next: StoredSettings) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      .then(() => setSettingsError(null))
      .catch((cause: unknown) => {
        setSettingsError(`Could not save settings: ${cause instanceof Error ? cause.message : 'unknown error'}`);
      });
  }, []);

  const changeMode = useCallback((nextMode: 'demo' | 'api') => {
    setMode(nextMode);
    setSnapshot(null);
    setDataError(null);
    persistSettings({ mode: nextMode, apiBaseUrl, thresholds, temperatureUnit, historyRetentionDays });
  }, [apiBaseUrl, historyRetentionDays, persistSettings, temperatureUnit, thresholds]);

  const changeApiBaseUrl = useCallback((url: string) => {
    setApiBaseUrl(url);
    setSnapshot(null);
    setDataError(null);
    persistSettings({ mode, apiBaseUrl: url, thresholds, temperatureUnit, historyRetentionDays });
  }, [historyRetentionDays, mode, persistSettings, temperatureUnit, thresholds]);

  const configureApi = useCallback((url: string, nextMode: 'demo' | 'api') => {
    setApiBaseUrl(url);
    setMode(nextMode);
    setSnapshot(null);
    setDataError(null);
    persistSettings({ mode: nextMode, apiBaseUrl: url, thresholds, temperatureUnit, historyRetentionDays });
  }, [historyRetentionDays, persistSettings, temperatureUnit, thresholds]);

  const changeThresholds = useCallback((next: ScreeningThresholds) => {
    setThresholds(next);
    persistSettings({ mode, apiBaseUrl, thresholds: next, temperatureUnit, historyRetentionDays });
  }, [apiBaseUrl, historyRetentionDays, mode, persistSettings, temperatureUnit]);

  const changeTemperatureUnit = useCallback((unit: '°C' | '°F') => {
    setTemperatureUnit(unit);
    persistSettings({ mode, apiBaseUrl, thresholds, temperatureUnit: unit, historyRetentionDays });
  }, [apiBaseUrl, historyRetentionDays, mode, persistSettings, thresholds]);

  const changeHistoryRetentionDays = useCallback((days: number) => {
    setHistoryRetentionDays(days);
    persistSettings({ mode, apiBaseUrl, thresholds, temperatureUnit, historyRetentionDays: days });
  }, [apiBaseUrl, mode, persistSettings, temperatureUnit, thresholds]);

  const refresh = useCallback(async () => {
    if (!ready) return;
    setLoading(true);
    setDataError(null);
    try {
      const provider: TelemetryDataProvider = mode === 'demo'
        ? new DemoDataProvider()
        : new HttpApiProvider(apiBaseUrl);
      const next = await provider.getSnapshot();
      setSnapshot(next);
    } catch (cause) {
      setDataError(cause instanceof Error ? cause.message : 'Unable to load monitoring data.');
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl, mode, ready]);

  useEffect(() => {
    if (ready) void refresh();
  }, [ready, refresh]);

  useEffect(() => {
    if (!ready || mode !== 'api') return;
    const interval = setInterval(() => { void refresh(); }, 30_000);
    return () => clearInterval(interval);
  }, [mode, ready, refresh]);

  const value = useMemo(() => ({
    mode, snapshot, loading, error: settingsError ?? dataError, apiBaseUrl, thresholds, temperatureUnit, historyRetentionDays,
    setMode: changeMode, setApiBaseUrl: changeApiBaseUrl,
    configureApi, setThresholds: changeThresholds, setTemperatureUnit: changeTemperatureUnit,
    setHistoryRetentionDays: changeHistoryRetentionDays, refresh,
  }), [mode, snapshot, loading, settingsError, dataError, apiBaseUrl, thresholds, temperatureUnit, historyRetentionDays, changeMode, changeApiBaseUrl, configureApi, changeThresholds, changeTemperatureUnit, changeHistoryRetentionDays, refresh]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within a DataProvider.');
  return context;
}
