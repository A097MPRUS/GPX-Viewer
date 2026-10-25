// Track statistics. Author: A097MPRUS.
// Same rules as the desktop core (Sources/GpxCore/Analysis.swift, Statistics):
// - distance never bridges a gap between segments;
// - gain and loss use a hysteresis threshold (5, 2 or 1 m) that restarts in every segment;
// - moving time counts steps in the same segment of 0 to 300 s at 0.5 m/s or more;
// - elapsed time runs from the earliest to the latest timestamp.
import { MOVING } from './derive';
import type { Derived, GpxData, Stats } from './types';

export const GAIN_THRESHOLDS = [5, 2, 1] as const;

function mean(values: Float64Array, a: number, b: number, skipZero = false): number | null {
  let sum = 0;
  let count = 0;
  for (let i = a; i <= b; i++) {
    const v = values[i]!;
    if (Number.isNaN(v) || (skipZero && v === 0)) continue;
    sum += v;
    count++;
  }
  return count ? sum / count : null;
}

function extreme(values: Float64Array, a: number, b: number, max: boolean): number | null {
  let out: number | null = null;
  for (let i = a; i <= b; i++) {
    const v = values[i]!;
    if (Number.isNaN(v)) continue;
    if (out === null || (max ? v > out : v < out)) out = v;
  }
  return out;
}

/** Statistics of points `from` to `to` (inclusive); the whole file by default. */
export function computeStats(
  data: GpxData,
  derived: Derived,
  threshold = 5,
  from = 0,
  to = data.count - 1,
): Stats {
  const { ele, time } = data;
  const { dist, segment } = derived;
  const empty = data.count === 0 || to < from;
  const segmentsInRange = new Set<number>();
  let gain = 0;
  let loss = 0;
  let ref = NaN;
  let currentSegment = -1;
  let minEle: number | null = null;
  let maxEle: number | null = null;
  let start: number | null = null;
  let end: number | null = null;
  let moving = 0;
  let movingDist = 0;
  if (!empty) {
    for (let i = from; i <= to; i++) {
      const seg = segment[i]!;
      segmentsInRange.add(seg);
      if (seg !== currentSegment) {
        ref = NaN;
        currentSegment = seg;
      }
      const e = ele[i]!;
      if (!Number.isNaN(e)) {
        minEle = minEle === null ? e : Math.min(minEle, e);
        maxEle = maxEle === null ? e : Math.max(maxEle, e);
        if (Number.isNaN(ref)) ref = e;
        else if (e - ref >= threshold) {
          gain += e - ref;
          ref = e;
        } else if (ref - e >= threshold) {
          loss += ref - e;
          ref = e;
        }
      }
      const t = time[i]!;
      if (!Number.isNaN(t)) {
        start = start === null ? t : Math.min(start, t);
        end = end === null ? t : Math.max(end, t);
      }
      if (i > from && segment[i] === segment[i - 1]) {
        const dt = (t - time[i - 1]!) / 1000;
        const dd = dist[i]! - dist[i - 1]!;
        if (dt > 0 && dt <= MOVING.maxGap && dd / dt >= MOVING.minSpeed) {
          moving += dt;
          movingDist += dd;
        }
      }
    }
  }
  const distance = empty ? 0 : dist[to]! - dist[from]!;
  const elapsed = start !== null && end !== null ? (end - start) / 1000 : null;
  const hasTime = elapsed !== null;
  return {
    distance,
    points: empty ? 0 : to - from + 1,
    segments: segmentsInRange.size,
    gain: minEle === null ? null : gain,
    loss: minEle === null ? null : loss,
    minEle,
    maxEle,
    start,
    end,
    elapsed,
    moving: hasTime ? moving : null,
    stopped: hasTime ? Math.max(0, elapsed - moving) : null,
    avgSpeed: hasTime && elapsed > 0 ? distance / elapsed : null,
    movingSpeed: moving > 0 ? movingDist / moving : null,
    maxSpeed: empty ? null : extreme(derived.speed, from, to, true),
    avgHr: empty ? null : mean(data.hr, from, to),
    maxHr: empty ? null : extreme(data.hr, from, to, true),
    avgCad: empty ? null : mean(data.cad, from, to, true),
    avgPower: empty ? null : mean(data.power, from, to),
    maxPower: empty ? null : extreme(data.power, from, to, true),
    minTemp: empty ? null : extreme(data.temp, from, to, false),
    maxTemp: empty ? null : extreme(data.temp, from, to, true),
  };
}
