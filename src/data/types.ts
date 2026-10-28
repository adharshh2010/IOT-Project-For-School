export enum ScreeningStatus {
  INITIALIZING = 'INITIALIZING',
  NOT_CONFIGURED = 'NOT_CONFIGURED',
  DATA_INVALID = 'DATA_INVALID',
  DATA_STALE = 'DATA_STALE',
  WARNING = 'WARNING',
  HIGH_PRIORITY = 'HIGH_PRIORITY',
  WITHIN_CONFIGURED_RANGES = 'WITHIN_CONFIGURED_RANGES',
}

export type Parameter = 'ph' | 'turbidity' | 'tds' | 'temperature';

export interface Measurement {
  value: number | null;
  unit: string;
  valid: boolean;
  calibrated: boolean;
  timestamp: string;
  rawValue?: number;
  error?: string;
}

export interface DeviceState {
  deviceId: string;
  firmwareVersion: string;
  connected: boolean;
  apiConnected: boolean;
  lastContact: string | null;
  configured: boolean;
  supportedParameters: Parameter[];
}

export interface AlertEvent {
  id: string;
  parameter: Parameter;
  measuredValue: number;
  unit: string;
  reference: string;
  timestamp: string;
  active: boolean;
  priority: 'warning' | 'high';
  suggestedInvestigation: string;
}

export interface TelemetryRecord {
  id: string;
  timestamp: string;
  measurements: Record<Parameter, Measurement>;
}

export interface HealthState {
  status: string;
  checkedAt: string;
  deviceConnected: boolean;
}

export interface DataSnapshot {
  health: HealthState;
  device: DeviceState;
  latest: TelemetryRecord | null;
  readings: TelemetryRecord[];
  events: AlertEvent[];
  fetchedAt: string;
}

export interface ScreeningThresholds {
  ph: { minimum: number; maximum: number };
  turbidity: { maximum: number };
  tds: { maximum: number };
  temperature: { minimum: number; maximum: number };
}

export interface TelemetryDataProvider {
  readonly mode: 'demo' | 'api';
  getSnapshot(): Promise<DataSnapshot>;
}

export const PARAMETER_LABELS: Record<Parameter, string> = {
  ph: 'pH',
  turbidity: 'Turbidity',
  tds: 'Dissolved solids',
  temperature: 'Temperature',
};

export const PARAMETER_UNITS: Record<Parameter, string> = {
  ph: 'pH',
  turbidity: 'NTU',
  tds: 'ppm',
  temperature: '°C',
};

export const DEFAULT_THRESHOLDS: ScreeningThresholds = {
  ph: { minimum: 6.5, maximum: 8.5 },
  turbidity: { maximum: 5 },
  tds: { maximum: 500 },
  temperature: { minimum: 5, maximum: 35 },
};

export const STATUS_LABELS: Record<ScreeningStatus, string> = {
  [ScreeningStatus.INITIALIZING]: 'Connecting',
  [ScreeningStatus.NOT_CONFIGURED]: 'Not configured',
  [ScreeningStatus.DATA_INVALID]: 'Data unavailable',
  [ScreeningStatus.DATA_STALE]: 'Data may be stale',
  [ScreeningStatus.WARNING]: 'Review recommended',
  [ScreeningStatus.HIGH_PRIORITY]: 'Priority review',
  [ScreeningStatus.WITHIN_CONFIGURED_RANGES]: 'Within configured ranges',
};
