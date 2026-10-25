// Geographic extent of a track, independent of Leaflet so it can be tested. Author: A097MPRUS.
import type { Derived, GpxData } from '../gpx/types';

/** South, west, north, east in degrees; west and east use the unwrapped longitudes. */
export type TrackBounds = [number, number, number, number];

const valid = (lat: number, lon: number) =>
  Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90;

/**
 * Bounds of points `from` to `to` (inclusive), or of the waypoints when the file has no points.
 * Points with a missing or impossible coordinate are skipped; null when nothing valid remains.
 */
export function trackBounds(
  data: GpxData,
  derived: Derived,
  from = 0,
  to = data.count - 1,
): TrackBounds | null {
  let s = Infinity;
  let n = -Infinity;
  let w = Infinity;
  let e = -Infinity;
  const add = (lat: number, lon: number) => {
    if (!valid(lat, lon)) return;
    if (lat < s) s = lat;
    if (lat > n) n = lat;
    if (lon < w) w = lon;
    if (lon > e) e = lon;
  };
  for (let i = Math.max(0, from); i <= Math.min(to, data.count - 1); i++)
    add(data.lat[i]!, derived.lonUnwrapped[i]!);
  if (data.count === 0) for (const p of data.waypoints) add(p.lat, p.lon);
  return Number.isFinite(s) ? [s, w, n, e] : null;
}
