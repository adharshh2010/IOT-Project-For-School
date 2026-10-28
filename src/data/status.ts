import {
  DataSnapshot,
  DEFAULT_THRESHOLDS,
  Measurement,
  PARAMETER_UNITS,
  Parameter,
  ScreeningStatus,
  ScreeningThresholds,
  STATUS_LABELS,
  TelemetryRecord,
} from './types';

export const STALE_AFTER_MS = 15 * 60 * 1000;

export function formatStatus(status: ScreeningStatus): string {
  return STATUS_LABELS[status];
}

export interface ScreeningAssessment {
  title: string;
  detail: string;
  tone: 'neutral' | 'warning' | 'danger' | 'informative';
}

export function getScreeningAssessment(status: ScreeningStatus): ScreeningAssessment {
  switch (status) {
    case ScreeningStatus.INITIALIZING:
      return {
        title: 'Drinkability not confirmed',
        detail: 'Waiting for a complete set of current readings from the selected data source.',
        tone: 'neutral',
      };
    case ScreeningStatus.NOT_CONFIGURED:
      return {
        title: 'Screening is not configured',
        detail: 'Configure the device before using its readings for a screening result.',
        tone: 'neutral',
      };
    case ScreeningStatus.DATA_INVALID:
      return {
        title: 'Drinkability not confirmed',
        detail: 'One or more required readings are missing or invalid. Refresh or check the sensors.',
        tone: 'neutral',
      };
    case ScreeningStatus.DATA_STALE:
      return {
        title: 'Readings may be stale',
        detail: 'The available readings are too old for this screening. Refresh before interpreting them.',
        tone: 'neutral',
      };
    case ScreeningStatus.HIGH_PRIORITY:
      return {
        title: 'High-priority screening concern',
        detail: 'A high-priority event was reported. Do not rely on this sample for drinking; follow local health guidance.',
        tone: 'danger',
      };
    case ScreeningStatus.WARNING:
      return {
        title: 'Screening concern',
        detail: 'At least one reading is outside its configured range or has an active warning. This screening cannot determine whether the water is safe.',
        tone: 'warning',
      };
    case ScreeningStatus.WITHIN_CONFIGURED_RANGES:
      return {
        title: 'Indicators within configured ranges',
        detail: 'Current readings meet the ranges configured here. Drinkability is not confirmed: this app does not test for germs or many harmful chemicals.',
        tone: 'informative',
      };
  }
}

export function measurementStatus(
  measurement: Measurement | undefined,
  now = Date.now(),
): ScreeningStatus {
  if (!measurement || !measurement.valid || measurement.value === null) {
    return ScreeningStatus.DATA_INVALID;
  }
  const timestamp = Date.parse(measurement.timestamp);
  if (!Number.isFinite(timestamp) || now - timestamp > STALE_AFTER_MS) {
    return ScreeningStatus.DATA_STALE;
  }
  return ScreeningStatus.WITHIN_CONFIGURED_RANGES;
}

export function getScreeningStatus(
  snapshot: DataSnapshot | null,
  thresholds: ScreeningThresholds = DEFAULT_THRESHOLDS,
  now = Date.now(),
): ScreeningStatus {
  if (!snapshot) return ScreeningStatus.INITIALIZING;
  if (!snapshot.device.configured) return ScreeningStatus.NOT_CONFIGURED;
  const latest = snapshot.latest;
  if (!latest) return ScreeningStatus.DATA_INVALID;

  const parameters = snapshot.device.supportedParameters;
  if (parameters.length === 0) return ScreeningStatus.DATA_INVALID;
  const statuses = parameters.map((key) => measurementStatus(latest.measurements[key], now));
  if (statuses.every((status) => status === ScreeningStatus.DATA_INVALID)) {
    return ScreeningStatus.DATA_INVALID;
  }
  if (statuses.includes(ScreeningStatus.DATA_STALE)) return ScreeningStatus.DATA_STALE;
  if (statuses.includes(ScreeningStatus.DATA_INVALID)) return ScreeningStatus.DATA_INVALID;

  const highPriority = snapshot.events.some((event) => event.active && event.priority === 'high');
  if (highPriority) return ScreeningStatus.HIGH_PRIORITY;

  const outOfRange = parameters.some((key) => {
    const value = latest.measurements[key].value;
    if (value === null) return false;
    if (key === 'ph' || key === 'temperature') {
      return value < thresholds[key].minimum || value > thresholds[key].maximum;
    }
    return value > thresholds[key].maximum;
  });
  if (outOfRange || snapshot.events.some((event) => event.active)) {
    return ScreeningStatus.WARNING;
  }
  return ScreeningStatus.WITHIN_CONFIGURED_RANGES;
}

export function missingMeasurement(parameter: Parameter, timestamp: string, error: string): Measurement {
  return {
    value: null,
    unit: PARAMETER_UNITS[parameter],
    valid: false,
    calibrated: false,
    timestamp,
    error,
  };
}

export function emptyRecord(timestamp: string, id = 'unavailable'): TelemetryRecord {
  return {
    id,
    timestamp,
    measurements: {
      ph: missingMeasurement('ph', timestamp, 'No reading received'),
      turbidity: missingMeasurement('turbidity', timestamp, 'No reading received'),
      tds: missingMeasurement('tds', timestamp, 'No reading received'),
      temperature: missingMeasurement('temperature', timestamp, 'No reading received'),
    },
  };
}
