import { DataSnapshot } from './types';

export const exampleApiSnapshot: DataSnapshot = {
  health: {
    status: 'ok',
    checkedAt: '2026-03-01T10:00:00.000Z',
    deviceConnected: true,
  },
  device: {
    deviceId: 'NG-001',
    firmwareVersion: '0.1.0',
    connected: true,
    apiConnected: true,
    lastContact: '2026-03-01T09:59:00.000Z',
    configured: true,
    supportedParameters: ['ph', 'turbidity', 'tds', 'temperature'],
  },
  latest: {
    id: 'reading-001',
    timestamp: '2026-03-01T09:59:00.000Z',
    measurements: {
      ph: { value: 7.1, unit: 'pH', valid: true, calibrated: false, timestamp: '2026-03-01T09:59:00.000Z' },
      turbidity: { value: 2.4, unit: 'NTU', valid: true, calibrated: false, timestamp: '2026-03-01T09:59:00.000Z' },
      tds: { value: 286, unit: 'ppm', valid: true, calibrated: false, timestamp: '2026-03-01T09:59:00.000Z' },
      temperature: { value: null, unit: '°C', valid: false, calibrated: false, timestamp: '2026-03-01T09:59:00.000Z', error: 'Sensor not installed' },
    },
  },
  readings: [],
  events: [],
  fetchedAt: '2026-03-01T10:00:00.000Z',
};
