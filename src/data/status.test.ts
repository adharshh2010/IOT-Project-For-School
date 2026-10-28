import { describe, expect, it, jest } from '@jest/globals';
import { exampleApiSnapshot } from './fixtures';
import { HttpApiProvider, parseDevice, parseMeasurement, parseRecord } from './api';
import { formatStatus, getScreeningAssessment, getScreeningStatus, measurementStatus } from './status';
import { DataSnapshot, PARAMETER_UNITS, ScreeningStatus } from './types';

describe('screening status', () => {
  it('uses the configured-range label rather than a safety claim', () => {
    expect(formatStatus(ScreeningStatus.WITHIN_CONFIGURED_RANGES)).toBe('Within configured ranges');
  });

  it('does not present in-range indicators as proof that water is drinkable', () => {
    const assessment = getScreeningAssessment(ScreeningStatus.WITHIN_CONFIGURED_RANGES);
    expect(assessment.title).toBe('Indicators within configured ranges');
    expect(assessment.detail).toContain('Drinkability is not confirmed');
    expect(assessment.tone).toBe('informative');
  });

  it('cautions when a configured-range warning is present', () => {
    const assessment = getScreeningAssessment(ScreeningStatus.WARNING);
    expect(assessment.title).toBe('Screening concern');
    expect(assessment.detail).toContain('outside its configured range');
    expect(assessment.tone).toBe('warning');
  });

  it.each([
    ScreeningStatus.INITIALIZING,
    ScreeningStatus.NOT_CONFIGURED,
    ScreeningStatus.DATA_INVALID,
    ScreeningStatus.DATA_STALE,
  ])('does not confirm drinkability when data is not ready (%s)', (status) => {
    expect(getScreeningAssessment(status).title).not.toContain('within configured ranges');
  });

  it('flags missing or malformed measurements instead of treating them as zero', () => {
    const missing = parseMeasurement(undefined, 'ph', '2026-03-01T10:00:00.000Z');
    const malformed = parseMeasurement({ value: '7.2', valid: true }, 'ph', '2026-03-01T10:00:00.000Z');

    expect(missing.value).toBeNull();
    expect(missing.valid).toBe(false);
    expect(missing.unit).toBe(PARAMETER_UNITS.ph);
    expect(malformed.value).toBeNull();
    expect(malformed.valid).toBe(false);
    expect(measurementStatus(missing)).toBe(ScreeningStatus.DATA_INVALID);
  });

  it('keeps omitted parameters explicitly unavailable in a partial record', () => {
    const record = parseRecord({
      id: 'partial',
      timestamp: '2026-03-01T10:00:00.000Z',
      measurements: { ph: { value: 7.1, unit: 'pH', valid: true, calibrated: false } },
    }, 'fallback');

    expect(record.measurements.ph.value).toBe(7.1);
    expect(record.measurements.turbidity.value).toBeNull();
    expect(record.measurements.turbidity.valid).toBe(false);
    expect(record.measurements.temperature.error).toBe('Reading missing or malformed');
  });

  it('uses the device sensor list and keeps legacy API responses compatible', () => {
    const baseDevice = {
      deviceId: 'NG-001',
      firmwareVersion: '0.1.0',
      connected: true,
      apiConnected: true,
      lastContact: null,
      configured: true,
    };
    expect(parseDevice({ ...baseDevice, supportedParameters: ['ph', 'tds'] }).supportedParameters)
      .toEqual(['ph', 'tds']);
    expect(parseDevice(baseDevice).supportedParameters)
      .toEqual(['ph', 'turbidity', 'tds', 'temperature']);
    expect(() => parseDevice({ ...baseDevice, supportedParameters: ['unknown'] }))
      .toThrow('supportedParameters');
  });

  it('reports stale timestamps explicitly', () => {
    const stale = { ...exampleApiSnapshot.latest!.measurements.ph, timestamp: '2026-01-01T00:00:00.000Z' };
    expect(measurementStatus(stale, Date.parse('2026-01-01T01:00:00.000Z'))).toBe(ScreeningStatus.DATA_STALE);
  });

  it('does not classify a partial dataset as within range', () => {
    expect(getScreeningStatus(exampleApiSnapshot, undefined, Date.parse('2026-03-01T10:00:00.000Z')))
      .toBe(ScreeningStatus.DATA_INVALID);
  });

  it('screens only the sensors reported as installed by the device', () => {
    const snapshot: DataSnapshot = {
      ...exampleApiSnapshot,
      device: { ...exampleApiSnapshot.device, supportedParameters: ['ph', 'turbidity', 'tds'] },
    };
    expect(getScreeningStatus(snapshot, undefined, Date.parse('2026-03-01T10:00:00.000Z')))
      .toBe(ScreeningStatus.WITHIN_CONFIGURED_RANGES);
  });

  it('surfaces an unavailable API instead of returning demo values', async () => {
    const fetchSpy = jest.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('network unavailable'));
    try {
      await expect(new HttpApiProvider('http://127.0.0.1:3000').getSnapshot())
        .rejects.toThrow('Could not reach the API');
    } finally {
      fetchSpy.mockRestore();
    }
  });
});
