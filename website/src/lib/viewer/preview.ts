// Homepage preview of Web Lite: the real map module with the synthetic sample. The map does not
// capture page scrolling; the marker follows the recorded timestamps once, then on request.
// Author: A097MPRUS.
import { loadUrl } from './load';
import { stylesReady, TrackMap, type BaseMapId } from './map';

export async function mountPreview(host: HTMLElement, sampleUrl: string): Promise<void> {
  const mapEl = document.createElement('div');
  mapEl.className = 'preview-map';
  const bar = document.createElement('div');
  bar.className = 'preview-bar';
  const styles: [BaseMapId, string][] = [
    ['osm', 'OpenStreetMap'],
    ['opentopomap', 'OpenTopoMap'],
  ];
  const group = document.createElement('div');
  group.setAttribute('role', 'group');
  group.setAttribute('aria-label', 'Map');
  const buttons = styles.map(([id, label]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = label;
    b.dataset['id'] = id;
    b.setAttribute('aria-pressed', String(id === 'osm'));
    group.append(b);
    return b;
  });
  const replay = document.createElement('button');
  replay.type = 'button';
  replay.textContent = 'Replay';
  replay.className = 'preview-replay';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) replay.hidden = true;
  bar.append(group, replay);
  host.replaceChildren(mapEl, bar);

  await stylesReady();
  const map = new TrackMap(mapEl, {}, { interactive: false });
  const loaded = await loadUrl(sampleUrl);
  map.setTrack(loaded.data, loaded.derived);
  // The map refreshes its own size; the preview also keeps the whole route in view.
  new ResizeObserver(() => map.fit(false)).observe(mapEl);

  buttons.forEach((b) =>
    b.addEventListener('click', () => {
      map.setBase(b.dataset['id'] as BaseMapId);
      buttons.forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
    }),
  );

  const { data, derived } = loaded;
  const total = derived.elapsed[data.count - 1] ?? 0;
  let frame = 0;
  const run = () => {
    cancelAnimationFrame(frame);
    if (reduce || !total) return;
    const started = performance.now();
    const duration = 7000;
    let i = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - started) / duration);
      const target = t * total;
      while (i < data.count - 1 && derived.elapsed[i + 1]! <= target) i++;
      map.showPosition(i);
      if (t < 1 && !document.hidden) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
  };
  replay.addEventListener('click', run);
  map.showPosition(0);
  run();
}
