import {
  AlertEvent,
  DataSnapshot,
  DeviceState,
  HealthState,
  Measurement,
  PARAMETER_UNITS,
  Parameter,
  TelemetryDataProvider,
  TelemetryRecord,
} from './types';
import { emptyRecord, missingMeasurement } from './status';

type JsonObject = Record<string, unknown>;

function isObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isParameter(value: unknown): value is Parameter {
  return value === 'ph' || value === 'turbidity' || value === 'tds' || value === 'temperature';
}

function requiredString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Invalid API response: "${field}" must be a non-empty string.`);
  }
  return value;
}

function requiredBoolean(value: unknown, field: string): boolean {
  if (typeof value !== 'boolean') {
    throw new Error(`Invalid API response: "${field}" must be a boolean.`);
  }
  return value;
}

function parseMeasurement(
  input: unknown,
  parameter: Parameter,
  timestamp: string,
): Measurement {
  if (!isObject(input)) {
    return missingMeasurement(parameter, timestamp, 'Reading missing or malformed');
  }
  const value = typeof input.value === 'number' && Number.isFinite(input.value)
    ? input.value
    : null;
  const unit = typeof input.unit === 'string' ? input.unit : PARAMETER_UNITS[parameter];
  const valid = input.valid === true && value !== null;
  const calibrated = input.calibrated === true;
  const measuredAt = typeof input.timestamp === 'string' && Number.isFinite(Date.parse(input.timestamp))
    ? input.timestamp
    : timestamp;
  const result: Measurement = {
    value,
    unit,
    valid,
    calibrated,
    timestamp: measuredAt,
  };
  if (typeof input.rawValue === 'number' && Number.isFinite(input.rawValue)) {
    result.rawValue = input.rawValue;
  }
  if (typeof input.error === 'string') result.error = input.error;
  if (value === null && !result.error) result.error = 'No valid numeric reading received';
  return result;
}

function parseRecord(input: unknown, defaultId: string): TelemetryRecord {
  if (!isObject(input)) throw new Error('Invalid API response: expected a reading record.');
  const timestamp = typeof input.timestamp === 'string' && Number.isFinite(Date.parse(input.timestamp))
    ? input.timestamp
    : new Date(0).toISOString();
  const measurements = isObject(input.measurements) ? input.measurements : {};
  return {
    id: typeof input.id === 'string' ? input.id : defaultId,
    timestamp,
    measurements: {
      ph: parseMeasurement(measurements.ph, 'ph', timestamp),
      turbidity: parseMeasurement(measurements.turbidity, 'turbidity', timestamp),
      tds: parseMeasurement(measurements.tds, 'tds', timestamp),
      temperature: parseMeasurement(measurements.temperature, 'temperature', timestamp),
    },
  };
}

function parseHealth(input: unknown): HealthState {
  if (!isObject(input)) throw new Error('Invalid API response: expected a health object.');
  return {
    status: requiredString(input.status, 'status'),
    checkedAt: requiredString(input.checkedAt, 'checkedAt'),
    deviceConnected: requiredBoolean(input.deviceConnected, 'deviceConnected'),
  };
}

function parseDevice(input: unknown): DeviceState {
  if (!isObject(input)) throw new Error('Invalid API response: expected a device object.');
  const lastContact = input.lastContact === null
    ? null
    : requiredString(input.lastContact, 'lastContact');
  let supportedParameters: Parameter[] = ['ph', 'turbidity', 'tds', 'temperature'];
  if (input.supportedParameters !== undefined) {
    if (!Array.isArray(input.supportedParameters)) {
      throw new Error('Invalid API response: "supportedParameters" must be an array.');
    }
    const parameters: Parameter[] = [];
    for (const parameter of input.supportedParameters) {
      if (!isParameter(parameter)) {
        throw new Error('Invalid API response: "supportedParameters" contains an unknown sensor.');
      }
      parameters.push(parameter);
    }
    supportedParameters = [...new Set(parameters)];
  }
  return {
    deviceId: requiredString(input.deviceId, 'deviceId'),
    firmwareVersion: requiredString(input.firmwareVersion, 'firmwareVersion'),
    connected: requiredBoolean(input.connected, 'connected'),
    apiConnected: requiredBoolean(input.apiConnected, 'apiConnected'),
    lastContact,
    configured: requiredBoolean(input.configured, 'configured'),
    supportedParameters,
  };
}

function parseEvents(input: unknown): AlertEvent[] {
  const events = Array.isArray(input) ? input : isObject(input) ? input.events : null;
  if (!Array.isArray(events)) {
    throw new Error('Invalid API response: expected an events array.');
  }
  return events.map((item, index) => {
    if (!isObject(item)) throw new Error(`Invalid API response: event ${index + 1} is malformed.`);
    const parameter = item.parameter;
    if (parameter !== 'ph' && parameter !== 'turbidity' && parameter !== 'tds' && parameter !== 'temperature') {
      throw new Error(`Invalid API response: event ${index + 1} has an unknown parameter.`);
    }
    if (typeof item.measuredValue !== 'number' || !Number.isFinite(item.measuredValue)) {
      throw new Error(`Invalid API response: event ${index + 1} has an invalid value.`);
    }
    if (item.priority !== 'warning' && item.priority !== 'high') {
      throw new Error(`Invalid API response: event ${index + 1} has an invalid priority.`);
    }
    return {
      id: requiredString(item.id, `events[${index}].id`),
      parameter,
      measuredValue: item.measuredValue,
      unit: requiredString(item.unit, `events[${index}].unit`),
      reference: requiredString(item.reference, `events[${index}].reference`),
      timestamp: requiredString(item.timestamp, `events[${index}].timestamp`),
      active: requiredBoolean(item.active, `events[${index}].active`),
      priority: item.priority,
      suggestedInvestigation: requiredString(item.suggestedInvestigation, `events[${index}].suggestedInvestigation`),
    };
  });
}

export class HttpApiProvider implements TelemetryDataProvider {
  readonly mode = 'api' as const;
  private readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.trim().replace(/\/+$/, '');
    if (!/^https?:\/\//i.test(this.baseUrl)) {
      throw new Error('API base URL must start with http:// or https://.');
    }
  }

  private async get(path: string): Promise<unknown> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(`API request ${path} failed with HTTP ${response.status}.`);
      }
      return await response.json() as unknown;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`API request ${path} timed out after 10 seconds.`);
      }
      if (error instanceof TypeError) {
        throw new Error(`Could not reach the API at ${this.baseUrl}. Check the endpoint and network.`);
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  async getSnapshot(): Promise<DataSnapshot> {
    const [healthJson, deviceJson, latestJson, readingsJson, eventsJson] = await Promise.all([
      this.get('/api/health'),
      this.get('/api/device'),
      this.get('/api/readings/latest'),
      this.get('/api/readings'),
      this.get('/api/events'),
    ]);

    const readingsInput = Array.isArray(readingsJson)
      ? readingsJson
      : isObject(readingsJson)
        ? readingsJson.readings
        : null;
    if (!Array.isArray(readingsInput)) {
      throw new Error('Invalid API response: expected a readings array.');
    }
    const latest = latestJson === null ? null : parseRecord(latestJson, 'latest');
    const readings = readingsInput.map((record, index) => parseRecord(record, `reading-${index + 1}`));
    if (latest && !readings.some((record) => record.id === latest.id)) {
      readings.unshift(latest);
    }
    if (!latest && readings.length === 0) {
      return {
        health: parseHealth(healthJson),
        device: parseDevice(deviceJson),
        latest: null,
        readings: [],
        events: parseEvents(eventsJson),
        fetchedAt: new Date().toISOString(),
      };
    }
    return {
      health: parseHealth(healthJson),
      device: parseDevice(deviceJson),
      latest,
      readings,
      events: parseEvents(eventsJson),
      fetchedAt: new Date().toISOString(),
    };
  }
}

export { emptyRecord, parseDevice, parseMeasurement, parseRecord };
