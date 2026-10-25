// Unit conversion and formatting. Author: A097MPRUS.
export type Units = 'metric' | 'imperial';
export type Clock = '24' | '12';

export const FT = 0.3048;
export const MILE = 1609.344;

export function distance(m: number | null, units: Units): string {
  if (m === null || !Number.isFinite(m)) return '-';
  if (units === 'imperial') {
    const mi = m / MILE;
    return mi < 0.1 ? `${Math.round(m / FT)} ft` : `${mi.toFixed(mi < 10 ? 2 : 1)} mi`;
  }
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(m < 10000 ? 2 : 1)} km`;
}

export function elevation(m: number | null, units: Units, signed = false): string {
  if (m === null || !Number.isFinite(m)) return '-';
  const v = units === 'imperial' ? m / FT : m;
  const r = Math.round(v);
  return `${signed && r > 0 ? '+' : ''}${r} ${units === 'imperial' ? 'ft' : 'm'}`;
}

export function speed(ms: number | null, units: Units): string {
  if (ms === null || !Number.isFinite(ms)) return '-';
  return units === 'imperial'
    ? `${(ms * 2.2369363).toFixed(1)} mph`
    : `${(ms * 3.6).toFixed(1)} km/h`;
}

/** Hours, minutes and seconds: 1:05:09, or 5:09 under an hour. */
export function duration(seconds: number | null): string {
  if (seconds === null || !Number.isFinite(seconds)) return '-';
  const s = Math.round(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(h ? 2 : 1, '0');
  return `${h ? `${h}:` : ''}${mm}:${String(sec).padStart(2, '0')}`;
}

/** Date and time in UTC, ISO order, so the value does not depend on the visitor's locale. */
export function dateTime(ms: number | null, clock: Clock): string {
  if (ms === null || !Number.isFinite(ms)) return '-';
  const d = new Date(ms);
  const date = d.toISOString().slice(0, 10);
  let h = d.getUTCHours();
  const m = String(d.getUTCMinutes()).padStart(2, '0');
  const s = String(d.getUTCSeconds()).padStart(2, '0');
  if (clock === '12') {
    const suffix = h < 12 ? 'AM' : 'PM';
    h = h % 12 || 12;
    return `${date} ${h}:${m}:${s} ${suffix} UTC`;
  }
  return `${date} ${String(h).padStart(2, '0')}:${m}:${s} UTC`;
}

export function temperature(c: number | null, units: Units): string {
  if (c === null || !Number.isFinite(c)) return '-';
  return units === 'imperial' ? `${((c * 9) / 5 + 32).toFixed(1)} °F` : `${c.toFixed(1)} °C`;
}

export function integer(v: number | null, unit: string): string {
  if (v === null || !Number.isFinite(v)) return '-';
  return `${Math.round(v)} ${unit}`;
}

export function bytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}
