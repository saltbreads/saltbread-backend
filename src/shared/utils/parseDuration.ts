import ms from 'ms';
import type { StringValue } from 'ms';

/**
 * 문자열 duration(예: 7d, 15m, 1h)을 밀리초로 변환
 * fallback을 지정할 수 있음
 */
export function parseDurationMs(
  raw: StringValue,
  fallbackMs = 7 * 24 * 60 * 60 * 1000,
): number {
  const duration = ms(raw);

  if (typeof duration !== 'number') {
    return fallbackMs;
  }

  return duration;
}

export function parseDurationToDate(
  raw: StringValue,
  fallbackMs = 7 * 24 * 60 * 60 * 1000,
): Date {
  const duration = parseDurationMs(raw, fallbackMs);
  return new Date(Date.now() + duration);
}
