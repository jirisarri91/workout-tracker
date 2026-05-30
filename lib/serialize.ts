import { Decimal } from '@prisma/client/runtime/client';

const DATE_FIELDS = new Set(['date']);
const TIME_FIELDS = new Set(['start_time', 'end_time']);

function serializeValue(key: string, value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (value instanceof Decimal) return value.toNumber();
  if (value instanceof Date) {
    if (DATE_FIELDS.has(key)) return value.toISOString().split('T')[0];
    if (TIME_FIELDS.has(key)) {
      const h = String(value.getUTCHours()).padStart(2, '0');
      const m = String(value.getUTCMinutes()).padStart(2, '0');
      const s = String(value.getUTCSeconds()).padStart(2, '0');
      return `${h}:${m}:${s}`;
    }
    return value.toISOString();
  }
  return value;
}

export function serialize(data: unknown): unknown {
  if (data === null || data === undefined) return data;
  if (Array.isArray(data)) return data.map(serialize);
  if (typeof data === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      if (value instanceof Decimal) {
        result[key] = value.toNumber();
      } else if (value instanceof Date) {
        result[key] = serializeValue(key, value);
      } else if (Array.isArray(value)) {
        result[key] = value.map(serialize);
      } else if (value !== null && typeof value === 'object') {
        result[key] = serialize(value);
      } else {
        result[key] = value;
      }
    }
    return result;
  }
  return data;
}
