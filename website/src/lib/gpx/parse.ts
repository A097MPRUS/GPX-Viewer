// GPX 1.0 and 1.1 parser. Author: A097MPRUS.
// Reads tracks (each track segment separately), routes and waypoints, plus common point
// extensions. Never invents values: anything absent stays NaN.
import type { GpxData, Segment, Waypoint, LineKind } from './types';
import { localName, tokenize, XmlError } from './xml';

export class GpxError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GpxError';
  }
}

export const LIMITS = {
  /** Largest file the viewer reads, in bytes. */
  maxBytes: 200 * 1024 * 1024,
  /** Largest number of track and route points. */
  maxPoints: 3_000_000,
  maxWaypoints: 20_000,
};

class Column {
  data = new Float64Array(1024);
  length = 0;
  push(v: number): void {
    if (this.length === this.data.length) {
      const next = new Float64Array(this.data.length * 2);
      next.set(this.data);
      this.data = next;
    }
    this.data[this.length++] = v;
  }
  set(v: number): void {
    this.data[this.length - 1] = v;
  }
  finish(): Float64Array {
    return this.data.slice(0, this.length);
  }
}

const ISO =
  /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2})(\.\d+)?)?(Z|[+-]\d{2}(?::?\d{2})?)?$/;

/** Parses an ISO 8601 timestamp to milliseconds (UTC). Returns null when invalid. */
export function parseTime(text: string): { ms: number; zone: boolean } | null {
  const m = ISO.exec(text.trim());
  if (!m) return null;
  const [, y, mo, d, h, mi, s, frac, zone] = m;
  const month = Number(mo);
  const day = Number(d);
  const hour = Number(h);
  const minute = Number(mi);
  const second = Number(s ?? '0');
  if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 24 || minute > 59 || second > 60)
    return null;
  let ms = Date.UTC(Number(y), month - 1, day, hour, minute, second);
  if (frac) ms += Math.round(Number(frac) * 1000);
  if (zone && zone !== 'Z') {
    const sign = zone[0] === '-' ? -1 : 1;
    const digits = zone.slice(1).replace(':', '');
    const offset = Number(digits.slice(0, 2)) * 60 + Number(digits.slice(2, 4) || '0');
    ms -= sign * offset * 60_000;
  }
  return Number.isFinite(ms) ? { ms, zone: Boolean(zone) } : null;
}

const HR = new Set(['hr', 'heartrate', 'heart_rate', 'HeartRateBpm']);
const CAD = new Set(['cad', 'cadence', 'RunCadence']);
const POWER = new Set(['power', 'watts', 'PowerInWatts', 'Watts']);
const TEMP = new Set(['atemp', 'temp', 'temperature', 'wtemp']);

function number(text: string): number {
  const t = text.trim();
  if (!t) return NaN;
  const v = Number(t);
  return Number.isFinite(v) ? v : NaN;
}

function clean(text: string): string | null {
  const t = text.replace(/\s+/g, ' ').trim();
  return t ? t.slice(0, 500) : null;
}

/** Parses GPX text. Throws GpxError with a readable message for unusable input. */
export function parseGpx(input: string): GpxData {
  if (!input.trim()) throw new GpxError('The file is empty.');
  const lat = new Column();
  const lon = new Column();
  const ele = new Column();
  const time = new Column();
  const hr = new Column();
  const cad = new Column();
  const power = new Column();
  const temp = new Column();
  const recSpeed = new Column();
  const segments: Segment[] = [];
  const waypoints: Waypoint[] = [];
  const warnings = new Set<string>();
  const meta: GpxData['meta'] = {
    name: null,
    desc: null,
    creator: null,
    version: null,
    time: null,
  };

  const path: string[] = [];
  let text = '';
  let root: string | null = null;
  let lineIndex = -1;
  let lineName: string | null = null;
  let lineKind: LineKind = 'track';
  let segStart = -1;
  let inPoint = false;
  let wpt: Waypoint | null = null;
  let skipped = 0;
  let noZone = false;
  let badTime = 0;

  const openSegment = () => {
    segStart = lat.length;
  };
  const closeSegment = () => {
    if (segStart >= 0 && lat.length > segStart)
      segments.push({
        start: segStart,
        end: lat.length,
        kind: lineKind,
        name: lineName,
        lineIndex,
      });
    segStart = -1;
  };
  const readTime = (value: string): number => {
    const t = parseTime(value);
    if (!t) {
      if (value.trim()) badTime++;
      return NaN;
    }
    if (!t.zone) noZone = true;
    return t.ms;
  };

  let result;
  try {
    result = tokenize(input, {
      open(qname, attrs) {
        const name = localName(qname);
        const parent = path[path.length - 1];
        path.push(name);
        text = '';
        if (path.length === 1) {
          root = name;
          if (name !== 'gpx')
            throw new GpxError(
              `This is not a GPX file: the root element is <${qname}>, not <gpx>.`,
            );
          meta.version = attrs['version'] ?? null;
          meta.creator = attrs['creator'] ? clean(attrs['creator']) : null;
          return;
        }
        if ((name === 'trk' || name === 'rte') && parent === 'gpx') {
          lineIndex++;
          lineName = null;
          lineKind = name === 'trk' ? 'track' : 'route';
          if (name === 'rte') openSegment();
          return;
        }
        if (name === 'trkseg' && parent === 'trk') {
          openSegment();
          return;
        }
        if (name === 'trkpt' || name === 'rtept' || (name === 'wpt' && parent === 'gpx')) {
          const la = Number(attrs['lat']);
          const lo = Number(attrs['lon']);
          const valid =
            attrs['lat'] !== undefined &&
            attrs['lon'] !== undefined &&
            Number.isFinite(la) &&
            Number.isFinite(lo) &&
            Math.abs(la) <= 90 &&
            Math.abs(lo) <= 180;
          if (name === 'wpt') {
            if (!valid) {
              skipped++;
              wpt = null;
              return;
            }
            if (waypoints.length >= LIMITS.maxWaypoints)
              throw new GpxError(`The file has more than ${LIMITS.maxWaypoints} waypoints.`);
            wpt = { lat: la, lon: lo, ele: null, time: null, name: null, desc: null, sym: null };
            return;
          }
          if (!valid) {
            skipped++;
            inPoint = false;
            return;
          }
          if (name === 'trkpt' && segStart < 0) openSegment(); // trkpt directly in <trk>
          if (lat.length >= LIMITS.maxPoints)
            throw new GpxError(
              `The file has more than ${LIMITS.maxPoints.toLocaleString('en')} points, more than Web Lite can show safely. The desktop application handles larger files.`,
            );
          inPoint = true;
          lat.push(la);
          lon.push(lo);
          ele.push(NaN);
          time.push(NaN);
          hr.push(NaN);
          cad.push(NaN);
          power.push(NaN);
          temp.push(NaN);
          recSpeed.push(NaN);
        }
      },
      text(value) {
        text += value;
      },
      close(qname) {
        const name = localName(qname);
        path.pop();
        const parent = path[path.length - 1];
        const value = text;
        text = '';
        if (name === 'trkseg') return closeSegment();
        if (name === 'rte') return closeSegment();
        if (name === 'trk') return closeSegment();
        if (name === 'trkpt' || name === 'rtept') {
          inPoint = false;
          return;
        }
        if (name === 'wpt' && parent === 'gpx') {
          if (wpt) waypoints.push(wpt);
          wpt = null;
          return;
        }
        if (wpt && path.includes('wpt')) {
          if (parent !== 'wpt') return;
          if (name === 'name') wpt.name = clean(value);
          else if (name === 'desc' || (name === 'cmt' && !wpt.desc)) wpt.desc = clean(value);
          else if (name === 'sym') wpt.sym = clean(value);
          else if (name === 'ele') wpt.ele = Number.isFinite(number(value)) ? number(value) : null;
          else if (name === 'time') {
            const t = readTime(value);
            wpt.time = Number.isFinite(t) ? t : null;
          }
          return;
        }
        if (inPoint) {
          const inExtensions = path.includes('extensions');
          if (!inExtensions) {
            if (name === 'ele') ele.set(number(value));
            else if (name === 'time') time.set(readTime(value));
            else if (name === 'speed') recSpeed.set(number(value));
            return;
          }
          const v = number(value);
          if (!Number.isFinite(v)) return;
          if (HR.has(name)) hr.set(v);
          else if (CAD.has(name)) cad.set(v);
          else if (POWER.has(name)) power.set(v);
          else if (TEMP.has(name)) temp.set(v);
          else if (name === 'speed') recSpeed.set(v);
          return;
        }
        if ((parent === 'trk' || parent === 'rte') && name === 'name') {
          lineName = clean(value);
          return;
        }
        if (parent === 'metadata' || parent === 'gpx') {
          if (name === 'name' && !meta.name) meta.name = clean(value);
          else if (name === 'desc' && !meta.desc) meta.desc = clean(value);
          else if (name === 'time' && meta.time === null) {
            const t = readTime(value);
            meta.time = Number.isFinite(t) ? t : null;
          }
        }
      },
    });
  } catch (e) {
    if (e instanceof GpxError) throw e;
    if (e instanceof XmlError)
      throw new GpxError(
        `The file is not valid XML: ${e.message}. It may be damaged or not a GPX file.`,
      );
    throw e;
  }
  if (root !== 'gpx') throw new GpxError('This is not a GPX file.');
  if (result.unclosed.length) {
    closeSegment();
    warnings.add(
      `The file ends before the GPX document is complete (open element <${result.unclosed[result.unclosed.length - 1]}>). The points read before the end are shown.`,
    );
  }
  if (skipped)
    warnings.add(
      `${skipped} point${skipped === 1 ? '' : 's'} without valid coordinates were skipped.`,
    );
  if (badTime)
    warnings.add(
      `${badTime} timestamp${badTime === 1 ? ' was' : 's were'} not readable and were ignored.`,
    );
  if (noZone)
    warnings.add(
      'Some timestamps have no time zone; they were read as UTC, as the GPX standard requires.',
    );

  const count = lat.length;
  if (!count && !waypoints.length)
    throw new GpxError('The file contains no track, route or waypoint.');
  const columns = {
    lat: lat.finish(),
    lon: lon.finish(),
    ele: ele.finish(),
    time: time.finish(),
    hr: hr.finish(),
    cad: cad.finish(),
    power: power.finish(),
    temp: temp.finish(),
    recSpeed: recSpeed.finish(),
  };
  const any = (a: Float64Array) => a.some((v) => !Number.isNaN(v));
  return {
    meta,
    count,
    ...columns,
    segments,
    waypoints,
    has: {
      ele: any(columns.ele),
      time: any(columns.time),
      hr: any(columns.hr),
      cad: any(columns.cad),
      power: any(columns.power),
      temp: any(columns.temp),
      recSpeed: any(columns.recSpeed),
    },
    warnings: [...warnings],
  };
}
