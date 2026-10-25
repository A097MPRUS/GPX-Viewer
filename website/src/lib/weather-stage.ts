// Controller of the homepage weather stage (src/components/WeatherStage.astro). Author: A097MPRUS.
// The moment shown follows the stage's position in the viewport, until the visitor scrubs the
// timeline (pointer, touch, arrow keys, Home and End); then it stays where they left it. With
// reduced motion the scroll does not move it and every value stays reachable from the timeline.
// Updates touch a few attributes and text nodes, at most once per animation frame.
import { reducedMotion } from './site';

type Frame = [number, number, number, number | null, number | null, number | null, number | null];

const CODES: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  71: 'Slight snowfall',
  73: 'Moderate snowfall',
  75: 'Heavy snowfall',
  80: 'Slight rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  95: 'Thunderstorm',
};
const COMPASS = [
  'N',
  'NNE',
  'NE',
  'ENE',
  'E',
  'ESE',
  'SE',
  'SSE',
  'S',
  'SSW',
  'SW',
  'WSW',
  'W',
  'WNW',
  'NW',
  'NNW',
];

export function bindWeatherStage(root: HTMLElement): void {
  const frames = JSON.parse(root.dataset['frames'] ?? '[]') as Frame[];
  const start = Number(root.dataset['start']);
  if (!frames.length) return;
  const marker = root.querySelector<SVGGElement>('[data-wx-marker]');
  const wind = root.querySelector<SVGGElement>('[data-wx-wind]');
  const cursor = root.querySelector<SVGLineElement>('[data-wx-cursor]');
  const timeline = root.querySelector<HTMLElement>('[data-wx-timeline]');
  const out = (k: string) => root.querySelector<HTMLElement>(`[data-wx="${k}"]`);
  const o = {
    time: out('time'),
    temp: out('temp'),
    wind: out('wind'),
    from: out('from'),
    cond: out('cond'),
  };
  let index = -1;
  let pinned = false;
  const show = (i: number) => {
    i = Math.max(0, Math.min(frames.length - 1, Math.round(i)));
    if (i === index) return;
    index = i;
    const [x, y, t, temp, w, dir, code] = frames[i]!;
    marker?.setAttribute('transform', `translate(${x} ${y})`);
    if (dir !== null) wind?.setAttribute('transform', `rotate(${dir + 180})`);
    const cx = (i / (frames.length - 1)) * 1000;
    cursor?.setAttribute('x1', String(cx));
    cursor?.setAttribute('x2', String(cx));
    const d = new Date(start + t * 1000);
    const clock = `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
    if (o.time) o.time.textContent = clock;
    if (o.temp) o.temp.textContent = temp === null ? '-' : temp.toFixed(1);
    if (o.wind) o.wind.textContent = w === null ? '-' : (w * 3.6).toFixed(1);
    if (o.from)
      o.from.textContent = dir === null ? '' : `from ${COMPASS[Math.round(dir / 22.5) % 16]}`;
    if (o.cond) o.cond.textContent = code === null ? 'No data' : (CODES[code] ?? `Code ${code}`);
    timeline?.setAttribute('aria-valuenow', String(t));
    timeline?.setAttribute(
      'aria-valuetext',
      `${clock} UTC, ${temp === null ? 'no temperature' : `${temp.toFixed(1)} degrees`}, wind ${w === null ? 'unknown' : `${(w * 3.6).toFixed(0)} km/h`}`,
    );
  };
  show(0);

  // Scrubbing on the timeline.
  if (timeline) {
    const fromPointer = (clientX: number) => {
      const r = timeline.getBoundingClientRect();
      show(((clientX - r.left) / r.width) * (frames.length - 1));
    };
    timeline.addEventListener('pointerdown', (e) => {
      pinned = true;
      timeline.setPointerCapture(e.pointerId);
      fromPointer(e.clientX);
    });
    timeline.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'mouse' || timeline.hasPointerCapture(e.pointerId)) {
        pinned = true;
        fromPointer(e.clientX);
      }
    });
    timeline.addEventListener('keydown', (e) => {
      const step = e.shiftKey ? 10 : 1;
      const keys: Record<string, number> = {
        ArrowRight: index + step,
        ArrowUp: index + step,
        ArrowLeft: index - step,
        ArrowDown: index - step,
        Home: 0,
        End: frames.length - 1,
      };
      if (e.key in keys) {
        e.preventDefault();
        pinned = true;
        show(keys[e.key]!);
      }
    });
  }

  if (reducedMotion()) {
    show((frames.length - 1) / 2);
    return;
  }
  // Scroll: from the stage's top entering the lower part of the window to its bottom reaching
  // the header.
  let queued = false;
  let active = false;
  const update = () => {
    queued = false;
    if (pinned) return;
    const r = root.getBoundingClientRect();
    const startY = window.innerHeight * 0.85;
    const endY = 80 - r.height * 0.4;
    show(
      Math.min(1, Math.max(0, (startY - r.top) / Math.max(1, startY - endY))) * (frames.length - 1),
    );
  };
  const onScroll = () => {
    if (active && !queued) {
      queued = true;
      requestAnimationFrame(update);
    }
  };
  new IntersectionObserver((entries) => {
    active = entries.some((e) => e.isIntersecting);
    if (active) onScroll();
  }).observe(root);
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
}
