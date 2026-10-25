// Map geometry (the built map styles are checked by scripts/check-dist.mjs). Author: A097MPRUS.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { derive } from '../src/lib/gpx/derive';
import { parseGpx } from '../src/lib/gpx/parse';
import { trackBounds } from '../src/lib/viewer/bounds';

const load = (name: string) => {
  const data = parseGpx(readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8'));
  return { data, derived: derive(data) };
};
const sample = () => {
  const data = parseGpx(
    readFileSync(
      new URL('../public/samples/gpx-viewer-sample-mullerthal.gpx', import.meta.url),
      'utf8',
    ),
  );
  return { data, derived: derive(data) };
};

describe('track bounds', () => {
  it('covers the whole sample with valid, non-empty geographic bounds', () => {
    const { data, derived } = sample();
    const b = trackBounds(data, derived);
    expect(b).not.toBeNull();
    const [s, w, n, e] = b!;
    expect(s).toBeGreaterThanOrEqual(-90);
    expect(n).toBeLessThanOrEqual(90);
    expect(n).toBeGreaterThan(s);
    expect(e).toBeGreaterThan(w);
    for (let i = 0; i < data.count; i++) {
      expect(data.lat[i]).toBeGreaterThanOrEqual(s);
      expect(data.lat[i]).toBeLessThanOrEqual(n);
    }
  });
  it('spans every segment of a multi-segment file', () => {
    const { data, derived } = load('multi-segment.gpx');
    const all = trackBounds(data, derived)!;
    for (const seg of data.segments) {
      const part = trackBounds(data, derived, seg.start, seg.end - 1)!;
      expect(part[0]).toBeGreaterThanOrEqual(all[0]);
      expect(part[2]).toBeLessThanOrEqual(all[2]);
    }
  });
  it('stays narrow across the 180th meridian', () => {
    const { data, derived } = load('dateline.gpx');
    const [, w, , e] = trackBounds(data, derived)!;
    expect(e - w).toBeLessThan(1);
  });
  it('uses waypoints when a file has no track points', () => {
    const { data, derived } = load('route-waypoints.gpx');
    if (data.count === 0) expect(trackBounds(data, derived)).not.toBeNull();
    else expect(trackBounds(data, derived, 0, data.count - 1)).not.toBeNull();
  });
  it('returns null without valid coordinates and for an empty range', () => {
    const { data, derived } = sample();
    const lat = new Float64Array(data.count).fill(NaN);
    expect(trackBounds({ ...data, lat, waypoints: [] }, derived)).toBeNull();
    expect(trackBounds(data, derived, 10, 5)).toBeNull();
  });
  it('skips missing or impossible coordinates', () => {
    const { data, derived } = sample();
    const lat = Float64Array.from(data.lat);
    lat[0] = NaN;
    lat[1] = 95;
    const b = trackBounds({ ...data, lat }, derived)!;
    expect(b[2]).toBeLessThanOrEqual(90);
    expect(Number.isFinite(b[0])).toBe(true);
  });
});
