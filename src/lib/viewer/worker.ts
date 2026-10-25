// Parses GPX text off the main thread. Author: A097MPRUS.
// The file never leaves the browser: the worker receives text and returns typed arrays, which are
// transferred back without copying.
/// <reference lib="webworker" />
import { derive } from '../gpx/derive';
import { GpxError, parseGpx } from '../gpx/parse';

self.onmessage = (event: MessageEvent<{ id: number; text: string }>) => {
  const { id, text } = event.data;
  try {
    const data = parseGpx(text);
    const derived = derive(data);
    const buffers = [
      data.lat,
      data.lon,
      data.ele,
      data.time,
      data.hr,
      data.cad,
      data.power,
      data.temp,
      data.recSpeed,
      derived.dist,
      derived.elapsed,
      derived.moving,
      derived.speed,
      derived.smooth,
      derived.grade,
      derived.vspeed,
      derived.segment,
      derived.lonUnwrapped,
    ].map((a) => a.buffer);
    (self as unknown as Worker).postMessage({ id, ok: true, data, derived }, buffers);
  } catch (e) {
    const message = e instanceof GpxError ? e.message : 'The file could not be read.';
    (self as unknown as Worker).postMessage({ id, ok: false, message });
  }
};
