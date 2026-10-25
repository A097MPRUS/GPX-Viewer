// Historical weather of the synthetic sample for the homepage, prepared at build time.
// Author: A097MPRUS.
// The values come from src/data/weather-sample.json, written by Setup/scripts/make-weather-sample.sh
// with the application's own core: real Open-Meteo model values for the sample's real places and
// date, matched to the sample's synthetic timestamps. Nothing is requested when the site is built
// or viewed.
import weather from '../data/weather-sample.json';
import { sampleGeometry } from './sample';

export interface WeatherFrame {
  /** Map position, elapsed seconds since the start, then the weather at that moment. */
  x: number;
  y: number;
  t: number;
  temp: number | null;
  wind: number | null;
  dir: number | null;
  rain: number | null;
  cloud: number | null;
  code: number | null;
}

const W = weather as unknown as {
  points: number;
  temperature: (number | null)[];
  windSpeed: (number | null)[];
  windDirection: (number | null)[];
  precipitation: (number | null)[];
  cloudCover: (number | null)[];
  weatherCode: (number | null)[];
  summary: Record<string, number | null>;
  retrieved: string;
  attribution: string;
  note: string;
  places: { lat: number; lon: number }[];
};

export const weatherInfo = {
  retrieved: W.retrieved,
  attribution: W.attribution,
  note: W.note,
  places: W.places.length,
  summary: W.summary,
};

/** Frames evenly spaced in recording time (the recording gap and the stop included). */
export function weatherFrames(count = 160): { frames: WeatherFrame[]; start: number; end: number } {
  const g = sampleGeometry();
  if (W.points !== g.points)
    throw new Error('weather-sample.json was made for another sample file');
  const timed = g.times.map((t, i) => [t, i] as const).filter(([t]) => Number.isFinite(t));
  const start = timed[0]![0];
  const end = timed[timed.length - 1]![0];
  const frames: WeatherFrame[] = [];
  let k = 0;
  for (let c = 0; c < count; c++) {
    const target = start + ((end - start) * c) / (count - 1);
    while (k < timed.length - 1 && timed[k + 1]![0] <= target) k++;
    const i = timed[k]![1];
    frames.push({
      x: g.pointX[i]!,
      y: g.pointY[i]!,
      t: Math.round((target - start) / 1000),
      temp: W.temperature[i] ?? null,
      wind: W.windSpeed[i] ?? null,
      dir: W.windDirection[i] ?? null,
      rain: W.precipitation[i] ?? null,
      cloud: W.cloudCover[i] ?? null,
      code: W.weatherCode[i] ?? null,
    });
  }
  return { frames, start, end };
}

/** WMO weather codes in words (the same texts as the application). */
export function conditionText(code: number | null): string {
  if (code === null) return 'No data';
  const names: Record<number, string> = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    56: 'Freezing drizzle',
    57: 'Freezing drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    66: 'Freezing rain',
    67: 'Freezing rain',
    71: 'Slight snowfall',
    73: 'Moderate snowfall',
    75: 'Heavy snowfall',
    77: 'Snow grains',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    85: 'Slight snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with hail',
    99: 'Thunderstorm with hail',
  };
  return names[code] ?? `Code ${code}`;
}
