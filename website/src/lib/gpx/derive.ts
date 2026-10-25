// Values derived from GPX points. Author: A097MPRUS.
// The rules follow the GPX Viewer desktop core (Sources/GpxCore/Analysis.swift and
// GraphMetrics.swift) with one deliberate difference: smoothing and gradient are computed within
// each segment, so a recording gap never produces a slope.
import { geodesic } from './geo';
import type { Derived, GpxData } from './types';

/** Moving time rule shared with the statistics: same segment, 0 < dt <= 300 s, >= 0.5 m/s. */
export const MOVING = { maxGap: 300, minSpeed: 0.5 };

function segmentIndex(data: GpxData): Int32Array {
  const seg = new Int32Array(data.count);
  data.segments.forEach((s, k) => seg.fill(k, s.start, s.end));
  return seg;
}

/** Sliding mean of `v` over +-`half` metres of `d`, within [a, b). */
function smoothRange(
  d: Float64Array,
  v: Float64Array,
  half: number,
  a: number,
  b: number,
  out: Float64Array,
) {
  let lo = a;
  let hi = a;
  let sum = 0;
  let count = 0;
  for (let i = a; i < b; i++) {
    const di = d[i]!;
    while (hi < b && d[hi]! <= di + half) {
      const x = v[hi]!;
      if (!Number.isNaN(x)) {
        sum += x;
        count++;
      }
      hi++;
    }
    while (lo < hi && d[lo]! < di - half) {
      const x = v[lo]!;
      if (!Number.isNaN(x)) {
        sum -= x;
        count--;
      }
      lo++;
    }
    out[i] = count > 0 ? sum / count : NaN;
  }
}

/** Linear interpolation of v at distance target within [a, b), moving the cursor idx. */
function valueAt(
  d: Float64Array,
  v: Float64Array,
  a: number,
  b: number,
  target: number,
  idx: { i: number },
): number {
  while (idx.i < b - 1 && d[idx.i + 1]! < target) idx.i++;
  while (idx.i > a && d[idx.i]! > target) idx.i--;
  const i = idx.i;
  const j = Math.min(i + 1, b - 1);
  const x = v[i]!;
  const y = v[j]!;
  if (Number.isNaN(x) || Number.isNaN(y)) return Number.isNaN(x) ? y : x;
  const t = d[j]! > d[i]! ? Math.min(1, Math.max(0, (target - d[i]!) / (d[j]! - d[i]!))) : 0;
  return x + (y - x) * t;
}

function gradeRange(
  d: Float64Array,
  v: Float64Array,
  span: number,
  a: number,
  b: number,
  out: Float64Array,
) {
  const lowIdx = { i: a };
  const highIdx = { i: a };
  const first = d[a]!;
  const last = d[b - 1]!;
  for (let i = a; i < b; i++) {
    const lo = Math.max(first, d[i]! - span / 2);
    const hi = Math.min(last, d[i]! + span / 2);
    out[i] = NaN;
    if (hi - lo >= span * 0.4) {
      const x = valueAt(d, v, a, b, lo, lowIdx);
      const y = valueAt(d, v, a, b, hi, highIdx);
      if (!Number.isNaN(x) && !Number.isNaN(y)) out[i] = ((y - x) / (hi - lo)) * 100;
    }
  }
}

export function derive(data: GpxData): Derived {
  const n = data.count;
  const { lat, lon, time, ele } = data;
  const segment = segmentIndex(data);
  const dist = new Float64Array(n);
  const lonUnwrapped = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    if (i === 0) {
      lonUnwrapped[0] = lon[0]!;
      continue;
    }
    let l = lon[i]!;
    const prev = lonUnwrapped[i - 1]!;
    while (l - prev > 180) l -= 360;
    while (l - prev < -180) l += 360;
    lonUnwrapped[i] = l;
    dist[i] =
      dist[i - 1]! +
      (segment[i] === segment[i - 1] ? geodesic(lat[i - 1]!, lon[i - 1]!, lat[i]!, lon[i]!) : 0);
  }

  // Elapsed seconds since the first timestamp; points without one keep the previous value.
  const elapsed = new Float64Array(n).fill(NaN);
  let t0 = NaN;
  for (let i = 0; i < n; i++) {
    if (!Number.isNaN(time[i]!)) {
      t0 = time[i]!;
      break;
    }
  }
  if (!Number.isNaN(t0)) {
    let last = 0;
    for (let i = 0; i < n; i++) {
      const t = time[i]!;
      if (!Number.isNaN(t)) last = (t - t0) / 1000;
      elapsed[i] = last;
    }
  }

  // Cumulative moving time.
  const moving = new Float64Array(n).fill(NaN);
  if (!Number.isNaN(t0)) {
    let total = 0;
    for (let i = 0; i < n; i++) {
      if (i > 0 && segment[i] === segment[i - 1]) {
        const dt = (time[i]! - time[i - 1]!) / 1000;
        const dd = dist[i]! - dist[i - 1]!;
        if (dt > 0 && dt <= MOVING.maxGap && dd / dt >= MOVING.minSpeed) total += dt;
      }
      moving[i] = total;
    }
  }

  // Calculated speed: distance over a window of +-5 s, never across a gap, a segment break or a
  // timestamp that goes backwards; windows of 120 s or more give no speed.
  const speed = new Float64Array(n).fill(NaN);
  let start = 0;
  while (start < n) {
    if (Number.isNaN(time[start]!)) {
      start++;
      continue;
    }
    let end = start;
    while (
      end + 1 < n &&
      segment[end + 1] === segment[start] &&
      !Number.isNaN(time[end + 1]!) &&
      time[end + 1]! >= time[end]!
    )
      end++;
    let a = start;
    let b = start;
    for (let i = start; i <= end; i++) {
      const t = time[i]!;
      while (a < i && t - time[a + 1]! >= 5000) a++;
      b = Math.max(b, i);
      while (b < end && time[b]! - t < 5000) b++;
      const dt = (time[b]! - time[a]!) / 1000;
      if (dt > 0 && dt < 120) speed[i] = (dist[b]! - dist[a]!) / dt;
    }
    start = end + 1;
  }

  // Smoothed elevation, gradient and vertical speed per segment.
  const smooth = new Float64Array(n).fill(NaN);
  const grade = new Float64Array(n).fill(NaN);
  const vspeed = new Float64Array(n).fill(NaN);
  for (const s of data.segments) {
    smoothRange(dist, ele, 25, s.start, s.end, smooth);
    gradeRange(dist, smooth, 50, s.start, s.end, grade);
    let a = s.start;
    let b = s.start;
    for (let i = s.start; i < s.end; i++) {
      const t = time[i]!;
      if (Number.isNaN(t) || Number.isNaN(smooth[i]!)) continue;
      while (a < i && (Number.isNaN(time[a]!) || t - time[a]! > 15000)) a++;
      b = Math.max(b, i);
      while (b + 1 < s.end && !Number.isNaN(time[b + 1]!) && time[b + 1]! - t <= 15000) b++;
      const dt = (time[b]! - time[a]!) / 1000;
      const e0 = smooth[a]!;
      const e1 = smooth[b]!;
      if (dt >= 10 && !Number.isNaN(e0) && !Number.isNaN(e1)) vspeed[i] = ((e1 - e0) / dt) * 60;
    }
  }
  return { dist, elapsed, moving, speed, smooth, grade, vspeed, segment, lonUnwrapped };
}
