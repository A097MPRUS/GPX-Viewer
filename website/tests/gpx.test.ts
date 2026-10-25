// GPX parser, distance, derived series and statistics. Author: A097MPRUS.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { derive } from '../src/lib/gpx/derive';
import { geodesic, greatCircle } from '../src/lib/gpx/geo';
import { GpxError, parseGpx, parseTime } from '../src/lib/gpx/parse';
import { computeStats } from '../src/lib/gpx/stats';
import { decodeEntities, tokenize, XmlError } from '../src/lib/gpx/xml';
import * as fmt from '../src/lib/gpx/format';

const fixture = (name: string) =>
  readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8');
const load = (name: string) => {
  const data = parseGpx(fixture(name));
  const derived = derive(data);
  return { data, derived, stats: computeStats(data, derived) };
};

describe('geodesic distance', () => {
  it('matches the Vincenty reference (Flinders Peak to Buninyong)', () => {
    expect(
      geodesic(-37.95103341666667, 144.42486788888888, -37.65282113888889, 143.92649552777777),
    ).toBeCloseTo(54972.271, 2);
  });
  it('is zero for identical points and symmetric', () => {
    expect(geodesic(50, 6, 50, 6)).toBe(0);
    expect(geodesic(50, 6, 50.01, 6.02)).toBeCloseTo(geodesic(50.01, 6.02, 50, 6), 9);
  });
  it('measures one minute of arc along the equator meridian', () => {
    // Meridian radius of curvature at the equator: 6 335 439.327 m.
    expect(geodesic(0, 0, 1 / 60, 0)).toBeCloseTo((6335439.327 * Math.PI) / 180 / 60, 1);
  });
  it('stays close to the great-circle distance for short steps', () => {
    const g = geodesic(49.6, 6.1, 49.601, 6.102);
    expect(Math.abs(g - greatCircle(49.6, 6.1, 49.601, 6.102)) / g).toBeLessThan(0.005);
  });
  it('crosses the 180th meridian the short way', () => {
    expect(geodesic(-16.5, 179.999, -16.5, -179.999)).toBeLessThan(300);
  });
});

describe('XML tokenizer', () => {
  it('decodes predefined and numeric entities only', () => {
    expect(decodeEntities('a &amp; b &lt;c&gt; &#233; &#x41; &unknown;')).toBe(
      'a & b <c> é A &unknown;',
    );
  });
  it('rejects DOCTYPE declarations', () => {
    expect(() =>
      tokenize('<!DOCTYPE x [<!ENTITY a "b">]><x/>', { open() {}, close() {}, text() {} }),
    ).toThrow(XmlError);
  });
  it('reports mismatched tags with a line number', () => {
    expect(() => tokenize('<a>\n<b></a>', { open() {}, close() {}, text() {} })).toThrow(/line 2/);
  });
  it('accepts attribute values containing ">" and CDATA text', () => {
    const texts: string[] = [];
    let attr = '';
    tokenize('<a x="1 > 0"><![CDATA[<raw>]]></a>', {
      open(_n, a) {
        attr = a['x'] ?? '';
      },
      close() {},
      text(t) {
        texts.push(t);
      },
    });
    expect(attr).toBe('1 > 0');
    expect(texts.join('')).toBe('<raw>');
  });
});

describe('timestamps', () => {
  it('parses UTC, offsets and fractions', () => {
    expect(parseTime('2026-01-01T10:00:00Z')?.ms).toBe(Date.UTC(2026, 0, 1, 10));
    expect(parseTime('2026-01-01T12:00:00+02:00')?.ms).toBe(Date.UTC(2026, 0, 1, 10));
    expect(parseTime('2026-01-01T10:00:00.250Z')?.ms).toBe(Date.UTC(2026, 0, 1, 10) + 250);
    expect(parseTime('2026-01-01T10:00:00')?.zone).toBe(false);
    expect(parseTime('yesterday')).toBeNull();
    expect(parseTime('2026-13-01T10:00:00Z')).toBeNull();
  });
});

describe('parsing', () => {
  it('reads a standard track', () => {
    const { data } = load('standard.gpx');
    expect(data.count).toBe(4);
    expect(data.meta.name).toBe('Standard');
    expect(data.segments).toHaveLength(1);
    expect(data.segments[0]?.name).toBe('Line north');
    expect(data.has).toMatchObject({ ele: true, time: true, hr: false });
  });
  it('keeps track segments apart', () => {
    const { data } = load('multi-segment.gpx');
    expect(data.segments.map((s) => [s.start, s.end])).toEqual([
      [0, 2],
      [2, 4],
    ]);
  });
  it('reads common extensions without inventing values', () => {
    const { data } = load('extensions.gpx');
    expect([...data.hr]).toEqual([130, 134, NaN]);
    expect([...data.cad]).toEqual([85, 0, NaN]);
    expect([...data.power]).toEqual([210, NaN, NaN]);
    expect(data.temp[0]).toBe(12.5);
    expect([...data.recSpeed]).toEqual([NaN, 8.5, NaN]);
  });
  it('reads GPX 1.0 metadata and recorded speed', () => {
    const { data } = load('gpx10.gpx');
    expect(data.meta.version).toBe('1.0');
    expect(data.meta.name).toBe('Old logger');
    expect([...data.recSpeed]).toEqual([4.2, 4.4]);
  });
  it('reads routes and waypoints and keeps names as plain text', () => {
    const { data } = load('route-waypoints.gpx');
    expect(data.segments[0]?.kind).toBe('route');
    expect(data.count).toBe(3);
    expect(data.waypoints).toHaveLength(1);
    expect(data.waypoints[0]?.name).toBe('Start & finish <b>bold</b>');
    expect(data.warnings.join(' ')).toMatch(/1 point without valid coordinates/);
  });
  it('explains unusable files', () => {
    expect(() => parseGpx(fixture('empty.gpx'))).toThrow(/empty/);
    expect(() => parseGpx(fixture('invalid-xml.gpx'))).toThrow(/not valid XML/);
    expect(() => parseGpx(fixture('doctype.gpx'))).toThrow(/DOCTYPE/);
    expect(() => parseGpx(fixture('not-gpx.gpx'))).toThrow(/not a GPX file/);
    expect(() => parseGpx(fixture('invalid-xml.gpx'))).toThrow(GpxError);
  });
  it('keeps the points of a truncated file with a warning', () => {
    const { data } = load('truncated.gpx');
    expect(data.count).toBe(2);
    expect(data.warnings.join(' ')).toMatch(/ends before/);
  });
  it('handles a large recording', () => {
    const parts = ['<gpx version="1.1"><trk><trkseg>'];
    const t0 = Date.UTC(2026, 0, 1);
    for (let i = 0; i < 200_000; i++)
      parts.push(
        `<trkpt lat="${(45 + i * 1e-5).toFixed(6)}" lon="7"><ele>${500 + (i % 50)}</ele><time>${new Date(t0 + i * 1000).toISOString()}</time></trkpt>`,
      );
    parts.push('</trkseg></trk></gpx>');
    const started = performance.now();
    const data = parseGpx(parts.join('\n'));
    const derived = derive(data);
    const stats = computeStats(data, derived);
    expect(data.count).toBe(200_000);
    expect(stats.distance).toBeGreaterThan(220_000);
    expect(performance.now() - started).toBeLessThan(15_000);
  });
});

describe('statistics', () => {
  it('computes distance, gain, loss and times of a standard track', () => {
    const { stats, derived } = load('standard.gpx');
    expect(stats.distance).toBeCloseTo(3 * 0.0009 * 110574.39, 0);
    expect(stats.gain).toBe(30);
    expect(stats.loss).toBe(10);
    expect(stats.elapsed).toBe(30);
    expect(stats.moving).toBe(30);
    expect(stats.points).toBe(4);
    expect(derived.speed[1]).toBeCloseTo((2 * 0.0009 * 110574.39) / 20, 1);
  });
  it('never bridges segments for distance or gain', () => {
    const { stats } = load('multi-segment.gpx');
    expect(stats.distance).toBeLessThan(230);
    expect(stats.distance).toBeGreaterThan(220);
    expect(stats.gain).toBe(12);
    expect(stats.segments).toBe(2);
    expect(stats.elapsed).toBe(1230);
    expect(stats.moving).toBe(60);
  });
  it('applies the gain hysteresis threshold', () => {
    const { data, derived } = load('no-time.gpx');
    expect(computeStats(data, derived, 5).gain).toBe(10);
    // A change counts once it reaches the threshold: the 5 m drop counts at 5 m, not at 6 m.
    expect(computeStats(data, derived, 5).loss).toBe(5);
    expect(computeStats(data, derived, 6).loss).toBe(0);
    expect(computeStats(data, derived, 6).gain).toBe(10);
  });
  it('reports no elevation or time values for files without them', () => {
    expect(load('no-elevation.gpx').stats.gain).toBeNull();
    const noTime = load('no-time.gpx');
    expect(noTime.stats.elapsed).toBeNull();
    expect(noTime.stats.moving).toBeNull();
    expect(noTime.stats.maxSpeed).toBeNull();
    expect([...noTime.derived.elapsed].every(Number.isNaN)).toBe(true);
  });
  it('excludes long gaps from moving time', () => {
    const { stats } = load('long-gap.gpx');
    expect(stats.elapsed).toBe(3640);
    expect(stats.moving).toBe(40);
    expect(stats.stopped).toBe(3600);
  });
  it('produces no infinite speed for duplicate timestamps', () => {
    const { derived, stats } = load('duplicate-times.gpx');
    expect([...derived.speed].every((v) => Number.isNaN(v) || Number.isFinite(v))).toBe(true);
    expect(stats.moving).toBe(10);
  });
  it('unwraps longitudes across the 180th meridian', () => {
    const { derived, stats } = load('dateline.gpx');
    expect(stats.distance).toBeLessThan(500);
    expect(derived.lonUnwrapped[1]).toBeCloseTo(180.001, 6);
  });
  it('averages cadence without coasting zeros', () => {
    expect(load('extensions.gpx').stats.avgCad).toBe(85);
  });
  it('computes statistics of a section', () => {
    const { data, derived } = load('standard.gpx');
    const section = computeStats(data, derived, 5, 1, 2);
    expect(section.points).toBe(2);
    expect(section.loss).toBe(10);
    expect(section.elapsed).toBe(10);
  });
  it('handles elevation noise with the hysteresis', () => {
    const parts = ['<gpx version="1.1"><trk><trkseg>'];
    for (let i = 0; i < 400; i++) {
      const noise = ((i * 7919) % 13) / 13 - 0.5; // deterministic, within +-0.5 m
      parts.push(
        `<trkpt lat="${45 + i * 1e-4}" lon="7"><ele>${(200 + noise * 3).toFixed(2)}</ele></trkpt>`,
      );
    }
    parts.push('</trkseg></trk></gpx>');
    const data = parseGpx(parts.join(''));
    const derived = derive(data);
    expect(computeStats(data, derived, 5).gain).toBe(0);
    expect(computeStats(data, derived, 1).gain).toBeGreaterThan(0);
  });
});

describe('derived series', () => {
  it('computes gradient within segments only', () => {
    const { derived, data } = load('multi-segment.gpx');
    for (const s of data.segments)
      expect(Number.isNaN(derived.grade[s.start]!) || Math.abs(derived.grade[s.start]!) < 20).toBe(
        true,
      );
  });
  it('keeps distance flat across a segment break', () => {
    const { derived } = load('multi-segment.gpx');
    expect(derived.dist[2]).toBe(derived.dist[1]);
  });
});

describe('formatting', () => {
  it('converts units', () => {
    expect(fmt.distance(1609.344, 'imperial')).toBe('1.00 mi');
    expect(fmt.distance(1500, 'metric')).toBe('1.50 km');
    expect(fmt.elevation(100, 'imperial')).toBe('328 ft');
    expect(fmt.speed(10, 'metric')).toBe('36.0 km/h');
    expect(fmt.speed(10, 'imperial')).toBe('22.4 mph');
    expect(fmt.duration(3909)).toBe('1:05:09');
    expect(fmt.duration(309)).toBe('5:09');
    expect(fmt.dateTime(Date.UTC(2026, 0, 1, 13, 5, 9), '12')).toBe('2026-01-01 1:05:09 PM UTC');
    expect(fmt.temperature(20, 'imperial')).toBe('68.0 °F');
  });
});
