// GPX data model shared by the parser, the worker and the viewer. Author: A097MPRUS.
// Point values are stored column by column in typed arrays (fast, transferable to and from the
// worker without copying). A missing value is NaN, never zero.

export type LineKind = 'track' | 'route';

export interface Segment {
  /** Index of the first point. */
  start: number;
  /** Index after the last point. */
  end: number;
  kind: LineKind;
  /** Track or route name from the file, if any. */
  name: string | null;
  /** Position of the track or route in the file (0 based). */
  lineIndex: number;
}

export interface Waypoint {
  lat: number;
  lon: number;
  ele: number | null;
  time: number | null;
  name: string | null;
  desc: string | null;
  sym: string | null;
}

export interface Channels {
  ele: boolean;
  time: boolean;
  hr: boolean;
  cad: boolean;
  power: boolean;
  temp: boolean;
  recSpeed: boolean;
}

export interface GpxData {
  meta: {
    name: string | null;
    desc: string | null;
    creator: string | null;
    version: string | null;
    time: number | null;
  };
  count: number;
  lat: Float64Array;
  lon: Float64Array;
  /** Metres. */
  ele: Float64Array;
  /** Milliseconds since 1970 (UTC). */
  time: Float64Array;
  /** Beats per minute. */
  hr: Float64Array;
  /** Revolutions or steps per minute, as recorded. */
  cad: Float64Array;
  /** Watts. */
  power: Float64Array;
  /** Degrees Celsius. */
  temp: Float64Array;
  /** Metres per second, as recorded by the device. */
  recSpeed: Float64Array;
  segments: Segment[];
  waypoints: Waypoint[];
  has: Channels;
  warnings: string[];
}

/** Values derived from the points (see derive.ts). */
export interface Derived {
  /** Distance along the file in metres; never bridges a gap between segments. */
  dist: Float64Array;
  /** Seconds since the first timestamp; NaN without a time. */
  elapsed: Float64Array;
  /** Cumulative moving seconds (statistics rule). */
  moving: Float64Array;
  /** Calculated speed, metres per second. */
  speed: Float64Array;
  /** Elevation smoothed over 25 m on each side, within each segment. */
  smooth: Float64Array;
  /** Gradient in percent over a centred 50 m window, within each segment. */
  grade: Float64Array;
  /** Vertical speed in metres per minute over 30 s, within each segment. */
  vspeed: Float64Array;
  /** Segment number of every point. */
  segment: Int32Array;
  /** Longitudes unwrapped for drawing across the 180th meridian. */
  lonUnwrapped: Float64Array;
}

export interface Stats {
  distance: number;
  points: number;
  segments: number;
  gain: number | null;
  loss: number | null;
  minEle: number | null;
  maxEle: number | null;
  start: number | null;
  end: number | null;
  elapsed: number | null;
  moving: number | null;
  stopped: number | null;
  avgSpeed: number | null;
  movingSpeed: number | null;
  maxSpeed: number | null;
  avgHr: number | null;
  maxHr: number | null;
  avgCad: number | null;
  avgPower: number | null;
  maxPower: number | null;
  minTemp: number | null;
  maxTemp: number | null;
}
