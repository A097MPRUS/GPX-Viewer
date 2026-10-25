// Build-time geometry of the synthetic sample used by the homepage visuals. Author: A097MPRUS.
// Every number shown comes from the same parser and calculations as Web Lite.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { derive } from './gpx/derive';
import { parseGpx } from './gpx/parse';
import { computeStats } from './gpx/stats';
import type { Stats } from './gpx/types';
import { gradeColor } from './viewer/colors';

export interface SampleGeometry {
  width: number;
  height: number;
  /** One SVG path containing every segment as a sub-path. */
  route: string;
  start: [number, number];
  end: [number, number];
  profile: {
    width: number;
    height: number;
    area: string;
    ridge: string;
    speed: string;
    low: number;
    high: number;
    speedMax: number;
  };
  stops: { offset: number; color: string }[];
  /** Per profile column: x, y on the map, distance (m), elevation (m), grade (%), speed (km/h), elapsed (s). */
  columns: [number, number, number, number, number | null, number | null, number | null][];
  stats: Stats;
  points: number;
  segments: number;
}

let cache: SampleGeometry | null = null;

export function sampleGeometry(): SampleGeometry {
  if (cache) return cache;
  const text = readFileSync(
    join(process.cwd(), 'public/samples/gpx-viewer-sample-mullerthal.gpx'),
    'utf8',
  );
  const data = parseGpx(text);
  const d = derive(data);
  const stats = computeStats(data, d);

  const W = 800;
  const H = 500;
  const PAD = 40;
  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLon = Infinity;
  let maxLon = -Infinity;
  for (let i = 0; i < data.count; i++) {
    minLat = Math.min(minLat, data.lat[i]!);
    maxLat = Math.max(maxLat, data.lat[i]!);
    minLon = Math.min(minLon, data.lon[i]!);
    maxLon = Math.max(maxLon, data.lon[i]!);
  }
  const k = Math.cos((((minLat + maxLat) / 2) * Math.PI) / 180);
  const scale = Math.min(
    (W - 2 * PAD) / ((maxLon - minLon) * k),
    (H - 2 * PAD) / (maxLat - minLat),
  );
  const offX = (W - (maxLon - minLon) * k * scale) / 2;
  const offY = (H - (maxLat - minLat) * scale) / 2;
  const px = (i: number) => +(offX + (data.lon[i]! - minLon) * k * scale).toFixed(1);
  const py = (i: number) => +(H - offY - (data.lat[i]! - minLat) * scale).toFixed(1);

  const parts: string[] = [];
  for (const s of data.segments) {
    let lx = Infinity;
    let ly = Infinity;
    for (let i = s.start; i < s.end; i++) {
      const x = px(i);
      const y = py(i);
      if (i === s.start || i === s.end - 1 || Math.hypot(x - lx, y - ly) > 1.6) {
        parts.push(`${i === s.start ? 'M' : 'L'}${x} ${y}`);
        lx = x;
        ly = y;
      }
    }
  }

  const COLS = 240;
  const PW = 1000;
  const PH = 200;
  const total = d.dist[data.count - 1]!;
  const idx: number[] = [];
  let j = 0;
  for (let c = 0; c < COLS; c++) {
    const target = (c / (COLS - 1)) * total;
    while (j < data.count - 1 && d.dist[j + 1]! <= target) j++;
    idx.push(j);
  }
  const ele = idx.map((i) => d.smooth[i]!);
  const finite = ele.filter(Number.isFinite);
  const low = Math.floor((Math.min(...finite) - 15) / 50) * 50;
  const high = Math.ceil((Math.max(...finite) + 15) / 50) * 50;
  const ex = (c: number) => +((c / (COLS - 1)) * PW).toFixed(1);
  const ey = (e: number) => +(PH - ((e - low) / (high - low)) * (PH - 12)).toFixed(1);
  const area = `M0 ${PH}` + ele.map((e, c) => `L${ex(c)} ${ey(e)}`).join('') + `L${PW} ${PH}Z`;
  const ridge = ele.map((e, c) => `${c ? 'L' : 'M'}${ex(c)} ${ey(e)}`).join('');
  const speeds = idx.map((i) => (Number.isFinite(d.speed[i]!) ? d.speed[i]! * 3.6 : NaN));
  const speedMax = Math.ceil(Math.max(...speeds.filter(Number.isFinite)) / 10) * 10;
  let pen = false;
  const speed = speeds
    .map((v, c) => {
      if (!Number.isFinite(v)) {
        pen = false;
        return '';
      }
      const cmd = `${pen ? 'L' : 'M'}${ex(c)} ${(PH - (v / speedMax) * (PH - 12)).toFixed(1)}`;
      pen = true;
      return cmd;
    })
    .join('');

  const columns = idx.map((i, c) => [
    px(i),
    py(i),
    Math.round(d.dist[i]!),
    Math.round(ele[c]!),
    Number.isFinite(d.grade[i]!) ? +d.grade[i]!.toFixed(1) : null,
    Number.isFinite(speeds[c]!) ? +speeds[c]!.toFixed(1) : null,
    Number.isFinite(d.elapsed[i]!) ? Math.round(d.elapsed[i]!) : null,
  ]) as SampleGeometry['columns'];

  cache = {
    width: W,
    height: H,
    route: parts.join(''),
    start: [px(0), py(0)],
    end: [px(data.count - 1), py(data.count - 1)],
    profile: { width: PW, height: PH, area, ridge, speed, low, high, speedMax },
    stops: idx.map((i, c) => ({
      offset: +((c / (COLS - 1)) * 100).toFixed(2),
      color: gradeColor(d.grade[i]!),
    })),
    columns,
    stats,
    points: data.count,
    segments: data.segments.length,
  };
  return cache;
}
