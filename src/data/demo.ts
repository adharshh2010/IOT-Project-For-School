import { DataSnapshot, TelemetryDataProvider } from './types';

function record(id: string, minutesAgo: number, values: [number, number, number, number]) {
  const timestamp = new Date(Date.now() - minutesAgo * 60_000).toISOString();
  const [ph, turbidity, tds, temperature] = values;
  return {
    id,
    timestamp,
    measurements: {
      ph: { value: ph, unit: 'pH', valid: true, calibrated: false, timestamp },
      turbidity: { value: turbidity, unit: 'NTU', valid: true, calibrated: false, timestamp },
      tds: { value: tds, unit: 'ppm', valid: true, calibrated: false, timestamp },
      temperature: { value: temperature, unit: '°C', valid: true, calibrated: false, timestamp },
    },
  };
}

export class DemoDataProvider implements TelemetryDataProvider {
  readonly mode = 'demo' as const;

  async getSnapshot(): Promise<DataSnapshot> {
    await new Promise((resolve) => setTimeout(resolve, 450));
    const readings = [
      record('demo-1', 4, [7.1, 2.4, 286, 23.8]),
      record('demo-2', 18, [7.0, 2.1, 279, 23.7]),
      record('demo-3', 37, [7.2, 2.7, 291, 23.9]),
      record('demo-4', 58, [7.0, 2.2, 283, 23.6]),
      record('demo-5', 83, [7.1, 2.6, 288, 23.8]),
      record('demo-6', 116, [6.9, 3.1, 297, 24.0]),
      record('demo-7', 151, [7.2, 2.5, 281, 23.5]),
      record('demo-8', 205, [7.1, 2.3, 275, 23.4]),
    ];
    const fetchedAt = new Date().toISOString();
    return {
      health: { status: 'demo', checkedAt: fetchedAt, deviceConnected: false },
      device: {
        deviceId: 'DEMO-DEVICE',
        firmwareVersion: 'Not reported',
        connected: false,
        apiConnected: false,
        lastContact: null,
        configured: true,
        supportedParameters: ['ph', 'turbidity', 'tds', 'temperature'],
      },
      latest: readings[0],
      readings,
      events: [],
      fetchedAt,
    };
  }
}
