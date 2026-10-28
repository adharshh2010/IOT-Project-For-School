export function formatTimestamp(value: string | null | undefined): string {
  if (!value) return 'Not reported';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return 'Invalid timestamp';
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export function formatValue(value: number | null, digits = 1): string {
  if (value === null || !Number.isFinite(value)) return '—';
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: digits }).format(value);
}

export function convertTemperature(value: number, unit: '°C' | '°F'): number {
  return unit === '°F' ? (value * 9) / 5 + 32 : value;
}

export function convertToCelsius(value: number, unit: '°C' | '°F'): number {
  return unit === '°F' ? ((value - 32) * 5) / 9 : value;
}
