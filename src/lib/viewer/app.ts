// GPX Viewer Web Lite: wiring of file loading, map, graph, statistics and playback.
// Author: A097MPRUS.
// Privacy: the file is read with the File API and parsed in a worker in this browser. Nothing
// about the file is sent anywhere; only map tiles for the visible area are requested.
import * as fmt from '../gpx/format';
import { computeStats } from '../gpx/stats';
import type { GpxData, Stats } from '../gpx/types';
import { Chart, type ChartModel, type Series } from './chart';
import { METRIC_COLORS } from './colors';
import { loadFile, loadUrl, type Loaded } from './load';
import { TrackMap, type BaseMapId } from './map';

type MetricId =
  'elevation' | 'speed' | 'recspeed' | 'grade' | 'vspeed' | 'hr' | 'cad' | 'power' | 'temp';
type AxisId = 'distance' | 'elapsed' | 'moving';

interface Settings {
  units: fmt.Units;
  clock: fmt.Clock;
  basemap: BaseMapId;
  gain: number;
  main: MetricId;
  compare: MetricId | 'none';
  axis: AxisId;
  speed: number;
  follow: boolean;
}

const DEFAULTS: Settings = {
  units: 'metric',
  clock: '24',
  basemap: 'osm',
  gain: 5,
  main: 'elevation',
  compare: 'none',
  axis: 'distance',
  speed: 30,
  follow: true,
};

function readSettings(): Settings {
  try {
    const raw = localStorage.getItem('gpxv-lite');
    if (!raw) return { ...DEFAULTS };
    const saved = JSON.parse(raw) as Partial<Settings>;
    return { ...DEFAULTS, ...saved };
  } catch {
    return { ...DEFAULTS };
  }
}

function saveSettings(s: Settings): void {
  try {
    localStorage.setItem('gpxv-lite', JSON.stringify(s));
  } catch {
    /* Storage unavailable: settings last for this visit. */
  }
}

const METRICS: { id: MetricId; label: string }[] = [
  { id: 'elevation', label: 'Elevation' },
  { id: 'speed', label: 'Speed (calculated)' },
  { id: 'recspeed', label: 'Recorded speed' },
  { id: 'grade', label: 'Slope' },
  { id: 'vspeed', label: 'Vertical speed' },
  { id: 'hr', label: 'Heart rate' },
  { id: 'cad', label: 'Cadence' },
  { id: 'power', label: 'Power' },
  { id: 'temp', label: 'Temperature' },
];

const $ = <T extends HTMLElement = HTMLElement>(root: ParentNode, sel: string) =>
  root.querySelector<T>(sel);

export function initViewer(root: HTMLElement): void {
  const settings = readSettings();
  const el = {
    input: $<HTMLInputElement>(root, '[data-file-input]')!,
    sample: $<HTMLButtonElement>(root, '[data-load-sample]')!,
    emptySample: $<HTMLButtonElement>(root, '[data-empty-sample]'),
    emptyOpen: $<HTMLButtonElement>(root, '[data-empty-open]'),
    fileName: $(root, '[data-file-name]')!,
    fileMeta: $(root, '[data-file-meta]')!,
    fit: $<HTMLButtonElement>(root, '[data-fit]')!,
    basemap: $<HTMLSelectElement>(root, '[data-basemap]')!,
    units: $<HTMLSelectElement>(root, '[data-units]')!,
    clock: $<HTMLSelectElement>(root, '[data-clock]')!,
    gain: $<HTMLSelectElement>(root, '[data-gain]')!,
    main: $<HTMLSelectElement>(root, '[data-main]')!,
    compare: $<HTMLSelectElement>(root, '[data-compare]')!,
    axis: $<HTMLSelectElement>(root, '[data-axis]')!,
    reset: $<HTMLButtonElement>(root, '[data-reset]')!,
    rangeLabel: $(root, '[data-range-label]')!,
    map: $(root, '[data-map]')!,
    chart: $(root, '[data-chart]')!,
    tooltip: $(root, '[data-tooltip]')!,
    stats: $(root, '[data-stats]')!,
    keyStats: $(root, '[data-key-stats]'),
    statsTitle: $(root, '[data-stats-title]')!,
    point: $(root, '[data-point]')!,
    warnings: $(root, '[data-warnings]')!,
    empty: $(root, '[data-empty]')!,
    drop: $(root, '[data-drop]')!,
    error: $(root, '[data-error]')!,
    status: $(root, '[data-status]')!,
    tiles: $(root, '[data-tile-notice]')!,
    play: $<HTMLButtonElement>(root, '[data-play]')!,
    seek: $<HTMLInputElement>(root, '[data-seek]')!,
    speed: $<HTMLSelectElement>(root, '[data-speed]')!,
    follow: $<HTMLInputElement>(root, '[data-follow]')!,
    playNote: $(root, '[data-play-note]')!,
    playTime: $(root, '[data-play-time]')!,
    graphToggle: $<HTMLButtonElement>(root, '[data-graph-toggle]'),
  };

  let loaded: Loaded | null = null;
  let fileLabel = '';
  let cursor: number | null = null;
  let selection: [number, number] | null = null;
  const cache = new Map<string, Float64Array>();

  const map = new TrackMap(el.map, {
    hover: (i) => {
      if (playing) return;
      setCursor(i, 'map');
    },
    pick: (i) => setCursor(i, 'map'),
    tiles: (ok) => {
      el.tiles.hidden = ok;
    },
  });
  const chart = new Chart(el.chart, {
    hover: (i) => {
      if (playing) return;
      setCursor(i, 'chart');
    },
    pick: (i) => setCursor(i, 'chart'),
    select: (a, b) => select(a, b),
    reset: () => clearSelection(),
  });
  new ResizeObserver(() => map.invalidate()).observe(el.map);

  // ---- Settings controls
  el.units.value = settings.units;
  el.clock.value = settings.clock;
  el.basemap.value = settings.basemap;
  el.gain.value = String(settings.gain);
  el.speed.value = String(settings.speed);
  el.follow.checked = settings.follow;
  map.setBase(settings.basemap);
  const persist = () => saveSettings(settings);
  el.basemap.addEventListener('change', () => {
    settings.basemap = el.basemap.value as BaseMapId;
    map.setBase(settings.basemap);
    persist();
  });
  el.units.addEventListener('change', () => {
    settings.units = el.units.value as fmt.Units;
    cache.clear();
    persist();
    refreshChart(true);
    refreshStats();
    showPoint();
  });
  el.clock.addEventListener('change', () => {
    settings.clock = el.clock.value as fmt.Clock;
    persist();
    refreshStats();
    showPoint();
  });
  el.gain.addEventListener('change', () => {
    settings.gain = Number(el.gain.value);
    persist();
    refreshStats();
  });
  for (const [select, key] of [
    [el.main, 'main'],
    [el.compare, 'compare'],
    [el.axis, 'axis'],
  ] as const) {
    select.addEventListener('change', () => {
      (settings as unknown as Record<string, string>)[key] = select.value;
      persist();
      refreshChart(key !== 'axis');
    });
  }
  el.speed.addEventListener('change', () => {
    settings.speed = Number(el.speed.value);
    persist();
  });
  el.follow.addEventListener('change', () => {
    settings.follow = el.follow.checked;
    persist();
  });
  el.fit.addEventListener('click', () =>
    selection ? map.fit(true, selection[0], selection[1]) : map.fit(true),
  );
  el.reset.addEventListener('click', () => clearSelection());
  el.graphToggle?.addEventListener('click', () => {
    const open = root.classList.toggle('graph-collapsed') === false;
    el.graphToggle?.setAttribute('aria-expanded', String(open));
  });

  // ---- File loading
  const status = (text: string) => {
    el.status.textContent = text;
  };
  const showError = (message: string | null) => {
    el.error.hidden = message === null;
    el.error.textContent = message ?? '';
  };
  const busy = (on: boolean, text = '') => {
    root.toggleAttribute('aria-busy', on);
    root.classList.toggle('is-loading', on);
    if (text) el.fileMeta.textContent = text;
  };

  async function open(source: () => Promise<Loaded>, label: string, size?: number) {
    stop();
    showError(null);
    busy(true, size ? `Reading ${fmt.bytes(size)}` : 'Reading');
    try {
      const result = await source();
      loaded = result;
      fileLabel = label;
      cache.clear();
      selection = null;
      cursor = null;
      onLoaded();
      status(
        `Opened ${label}: ${result.data.count.toLocaleString('en')} points in ${result.data.segments.length} segments.`,
      );
      root.classList.add('just-opened');
      window.setTimeout(() => root.classList.remove('just-opened'), 900);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'The file could not be read.';
      showError(message);
      status(message);
      el.fileMeta.textContent = loaded ? describe(loaded.data) : '';
    } finally {
      busy(false);
    }
  }

  const openFile = (file: File) => open(() => loadFile(file), file.name, file.size);
  const sampleUrl = root.dataset['sample'] ?? '';
  const openSample = () => open(() => loadUrl(sampleUrl), 'Synthetic sample (Mullerthal loop)');

  el.input.addEventListener('change', () => {
    const file = el.input.files?.[0];
    if (file) void openFile(file);
    el.input.value = '';
  });
  el.sample.addEventListener('click', () => void openSample());
  el.emptySample?.addEventListener('click', () => void openSample());
  el.emptyOpen?.addEventListener('click', () => el.input.click());

  let dragDepth = 0;
  const hasFiles = (e: DragEvent) => [...(e.dataTransfer?.types ?? [])].includes('Files');
  root.addEventListener('dragenter', (e) => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    dragDepth++;
    el.drop.hidden = false;
  });
  root.addEventListener('dragover', (e) => {
    if (hasFiles(e)) e.preventDefault();
  });
  root.addEventListener('dragleave', () => {
    dragDepth = Math.max(0, dragDepth - 1);
    if (!dragDepth) el.drop.hidden = true;
  });
  root.addEventListener('drop', (e) => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    dragDepth = 0;
    el.drop.hidden = true;
    const files = [...(e.dataTransfer?.files ?? [])];
    const file = files[0];
    if (!file) return;
    if (files.length > 1) status(`Web Lite opens one file at a time; opened ${file.name}.`);
    void openFile(file);
  });

  // ---- Data views
  function describe(data: GpxData): string {
    const parts = [
      `${data.count.toLocaleString('en')} points`,
      `${data.segments.length} segment${data.segments.length === 1 ? '' : 's'}`,
    ];
    if (data.waypoints.length)
      parts.push(`${data.waypoints.length} waypoint${data.waypoints.length === 1 ? '' : 's'}`);
    if (data.meta.version) parts.push(`GPX ${data.meta.version}`);
    return parts.join(', ');
  }

  function available(id: MetricId, data: GpxData): string | null {
    const h = data.has;
    switch (id) {
      case 'elevation':
        return h.ele ? null : 'no elevation in the file';
      case 'speed':
        return h.time ? null : 'needs timestamps';
      case 'recspeed':
        return h.recSpeed ? null : 'not recorded in the file';
      case 'grade':
        return h.ele ? null : 'needs elevation';
      case 'vspeed':
        return h.ele && h.time ? null : 'needs elevation and timestamps';
      case 'hr':
        return h.hr ? null : 'not in the file';
      case 'cad':
        return h.cad ? null : 'not in the file';
      case 'power':
        return h.power ? null : 'not in the file';
      case 'temp':
        return h.temp ? null : 'not in the file';
    }
  }

  function fillSelect(select: HTMLSelectElement, data: GpxData, withNone: boolean) {
    select.replaceChildren();
    if (withNone) select.append(new Option('None', 'none'));
    for (const m of METRICS) {
      const reason = available(m.id, data);
      const option = new Option(reason ? `${m.label} (${reason})` : m.label, m.id);
      option.disabled = reason !== null;
      select.append(option);
    }
  }

  function series(id: MetricId): Series {
    const { data, derived } = loaded!;
    const u = settings.units;
    const key = `${id}:${u}`;
    const convert = (source: Float64Array, factor: number, offset = 0) => {
      let out = cache.get(key);
      if (!out) {
        out = new Float64Array(source.length);
        for (let i = 0; i < source.length; i++) out[i] = source[i]! * factor + offset;
        cache.set(key, out);
      }
      return out;
    };
    const imperial = u === 'imperial';
    const speedFactor = imperial ? 2.2369363 : 3.6;
    const def = (
      label: string,
      unit: string,
      values: Float64Array,
      baseline: Series['baseline'],
      decimals: number,
    ): Series => ({
      id,
      label,
      unit,
      color: METRIC_COLORS[id] ?? '#5d6169',
      values,
      baseline,
      decimals,
    });
    switch (id) {
      case 'elevation':
        return def(
          'Elevation',
          imperial ? 'ft' : 'm',
          imperial ? convert(data.ele, 1 / fmt.FT) : data.ele,
          'data',
          0,
        );
      case 'speed':
        return def(
          'Speed',
          imperial ? 'mph' : 'km/h',
          convert(derived.speed, speedFactor),
          'zero',
          1,
        );
      case 'recspeed':
        return def(
          'Recorded speed',
          imperial ? 'mph' : 'km/h',
          convert(data.recSpeed, speedFactor),
          'zero',
          1,
        );
      case 'grade':
        return def('Slope', '%', derived.grade, 'symmetric', 1);
      case 'vspeed':
        return def(
          'Vertical speed',
          imperial ? 'ft/min' : 'm/min',
          imperial ? convert(derived.vspeed, 1 / fmt.FT) : derived.vspeed,
          'symmetric',
          1,
        );
      case 'hr':
        return def('Heart rate', 'bpm', data.hr, 'data', 0);
      case 'cad':
        return def('Cadence', 'rpm', data.cad, 'zero', 0);
      case 'power':
        return def('Power', 'W', data.power, 'zero', 0);
      case 'temp':
        return def(
          'Temperature',
          imperial ? '°F' : '°C',
          imperial ? convert(data.temp, 9 / 5, 32) : data.temp,
          'data',
          1,
        );
    }
  }

  function axisValues(axis: AxisId): Float64Array {
    const { derived } = loaded!;
    if (axis === 'elapsed') return derived.elapsed;
    if (axis === 'moving') return derived.moving;
    const key = `x:${settings.units}`;
    let out = cache.get(key);
    if (!out) {
      const f = settings.units === 'imperial' ? 1 / fmt.MILE : 1 / 1000;
      out = new Float64Array(derived.dist.length);
      for (let i = 0; i < out.length; i++) out[i] = derived.dist[i]! * f;
      cache.set(key, out);
    }
    return out;
  }

  function refreshChart(keepRange: boolean) {
    if (!loaded || !loaded.data.count) return;
    const { data, derived } = loaded;
    if (available(settings.main, data))
      settings.main = available('elevation', data) ? 'speed' : 'elevation';
    if (available(settings.main, data))
      settings.main = METRICS.find((m) => !available(m.id, data))?.id ?? 'elevation';
    if (
      settings.compare !== 'none' &&
      (available(settings.compare, data) || settings.compare === settings.main)
    )
      settings.compare = 'none';
    if (!data.has.time && settings.axis !== 'distance') settings.axis = 'distance';
    el.main.value = settings.main;
    el.compare.value = settings.compare;
    el.axis.value = settings.axis;
    const model: ChartModel = {
      x: axisValues(settings.axis),
      axis: settings.axis,
      distanceUnit: settings.units === 'imperial' ? 'mi' : 'km',
      segment: derived.segment,
      main: series(settings.main),
      compare: settings.compare === 'none' ? null : series(settings.compare),
      grade: settings.main === 'elevation' ? derived.grade : null,
    };
    chart.setModel(model, false);
    if (keepRange && selection) chart.setRange(model.x[selection[0]]!, model.x[selection[1]]!);
    else if (selection) chart.setRange(model.x[selection[0]]!, model.x[selection[1]]!);
    chart.setCursor(cursor);
    updateRangeLabel();
  }

  function statRows(s: Stats, data: GpxData): [string, string][] {
    const u = settings.units;
    const rows: [string, string][] = [
      ['Distance', fmt.distance(s.distance, u)],
      ['Elapsed time', fmt.duration(s.elapsed)],
      ['Moving time', fmt.duration(s.moving)],
      ['Stopped time', fmt.duration(s.stopped)],
      ['Average speed', fmt.speed(s.avgSpeed, u)],
      ['Moving average', fmt.speed(s.movingSpeed, u)],
      ['Maximum speed', fmt.speed(s.maxSpeed, u)],
      ['Elevation gain', fmt.elevation(s.gain, u)],
      ['Elevation loss', fmt.elevation(s.loss, u)],
      ['Lowest point', fmt.elevation(s.minEle, u)],
      ['Highest point', fmt.elevation(s.maxEle, u)],
      ['Points', s.points.toLocaleString('en')],
      ['Segments', String(s.segments)],
      ['Start', fmt.dateTime(s.start, settings.clock)],
      ['End', fmt.dateTime(s.end, settings.clock)],
    ];
    if (data.has.hr)
      rows.push(
        ['Average heart rate', fmt.integer(s.avgHr, 'bpm')],
        ['Maximum heart rate', fmt.integer(s.maxHr, 'bpm')],
      );
    if (data.has.cad) rows.push(['Average cadence', fmt.integer(s.avgCad, 'rpm')]);
    if (data.has.power)
      rows.push(
        ['Average power', fmt.integer(s.avgPower, 'W')],
        ['Maximum power', fmt.integer(s.maxPower, 'W')],
      );
    if (data.has.temp)
      rows.push([
        'Temperature',
        `${fmt.temperature(s.minTemp, u)} to ${fmt.temperature(s.maxTemp, u)}`,
      ]);
    if (data.waypoints.length) rows.push(['Waypoints', String(data.waypoints.length)]);
    return rows;
  }

  function refreshStats() {
    if (!loaded) return;
    const { data, derived } = loaded;
    const [from, to] = selection ?? [0, data.count - 1];
    const s = computeStats(data, derived, settings.gain, from, to);
    el.statsTitle.textContent = selection ? 'Selected section' : 'Whole file';
    const frag = document.createDocumentFragment();
    for (const [label, value] of statRows(s, data)) {
      if (value === '-' && !['Distance', 'Points', 'Segments'].includes(label)) continue;
      const dt = document.createElement('dt');
      dt.textContent = label;
      const dd = document.createElement('dd');
      dd.textContent = value;
      const row = document.createElement('div');
      row.append(dt, dd);
      frag.append(row);
    }
    el.stats.replaceChildren(frag);
    if (el.keyStats) {
      const u = settings.units;
      const keys: [string, string][] = [
        ['Distance', fmt.distance(s.distance, u)],
        ['Gain', fmt.elevation(s.gain, u)],
        ['Moving', fmt.duration(s.moving)],
        ['Average', fmt.speed(s.movingSpeed ?? s.avgSpeed, u)],
      ];
      el.keyStats.replaceChildren(
        ...keys.map(([label, value]) => {
          const row = document.createElement('div');
          const dt = document.createElement('dt');
          dt.textContent = label;
          const dd = document.createElement('dd');
          dd.textContent = value;
          row.append(dt, dd);
          return row;
        }),
      );
    }
  }

  function pointRows(i: number): [string, string, 'recorded' | 'calculated'][] {
    const { data, derived } = loaded!;
    const u = settings.units;
    const rows: [string, string, 'recorded' | 'calculated'][] = [];
    const add = (label: string, v: number, text: string, kind: 'recorded' | 'calculated') => {
      if (!Number.isNaN(v)) rows.push([label, text, kind]);
    };
    rows.push(['Distance', fmt.distance(derived.dist[i]!, u), 'calculated']);
    add('Time', data.time[i]!, fmt.dateTime(data.time[i]!, settings.clock), 'recorded');
    add('Elapsed', derived.elapsed[i]!, fmt.duration(derived.elapsed[i]!), 'calculated');
    add('Elevation', data.ele[i]!, fmt.elevation(data.ele[i]!, u), 'recorded');
    add('Gradient', derived.grade[i]!, `${derived.grade[i]!.toFixed(1)} %`, 'calculated');
    add('Speed', derived.speed[i]!, fmt.speed(derived.speed[i]!, u), 'calculated');
    add('Recorded speed', data.recSpeed[i]!, fmt.speed(data.recSpeed[i]!, u), 'recorded');
    add('Heart rate', data.hr[i]!, fmt.integer(data.hr[i]!, 'bpm'), 'recorded');
    add('Cadence', data.cad[i]!, fmt.integer(data.cad[i]!, 'rpm'), 'recorded');
    add('Power', data.power[i]!, fmt.integer(data.power[i]!, 'W'), 'recorded');
    add('Temperature', data.temp[i]!, fmt.temperature(data.temp[i]!, u), 'recorded');
    rows.push([
      'Coordinates',
      `${data.lat[i]!.toFixed(6)}, ${data.lon[i]!.toFixed(6)}`,
      'recorded',
    ]);
    rows.push([
      'Point',
      `${(i + 1).toLocaleString('en')} of ${data.count.toLocaleString('en')}, segment ${derived.segment[i]! + 1}`,
      'recorded',
    ]);
    return rows;
  }

  function renderRows(target: HTMLElement, rows: [string, string, string][]) {
    const frag = document.createDocumentFragment();
    for (const [label, value, kind] of rows) {
      const dt = document.createElement('dt');
      dt.textContent = label;
      const dd = document.createElement('dd');
      dd.textContent = value;
      const tag = document.createElement('span');
      tag.className = `kind kind-${kind}`;
      tag.textContent = kind;
      dd.append(' ', tag);
      frag.append(dt, dd);
    }
    target.replaceChildren(frag);
  }

  let pointFrame = 0;
  function showPoint() {
    cancelAnimationFrame(pointFrame);
    pointFrame = requestAnimationFrame(() => {
      if (!loaded || cursor === null) {
        el.point.replaceChildren();
        const p = document.createElement('p');
        p.className = 'muted small';
        p.textContent = 'Move along the graph or the route to inspect a point.';
        el.point.append(p);
        return;
      }
      renderRows(el.point, pointRows(cursor));
    });
  }

  let tipSource: 'map' | 'chart' | 'play' = 'chart';
  function setCursor(i: number | null, source: 'map' | 'chart' | 'play') {
    if (!loaded) return;
    cursor = i;
    tipSource = source;
    chart.setCursor(i);
    map.showPosition(i, source === 'play' && settings.follow);
    showPoint();
    updateTooltip();
    if (i !== null && !playing && loaded.data.has.time) {
      const t = timeline(i);
      el.seek.value = String(t);
      el.playTime.textContent = fmt.duration(t);
    }
  }

  function updateTooltip() {
    if (cursor === null || tipSource !== 'chart' || !loaded) {
      el.tooltip.hidden = true;
      return;
    }
    const rows = pointRows(cursor)
      .filter((r) => !['Coordinates', 'Point', 'Time'].includes(r[0]))
      .slice(0, 6);
    renderRows(el.tooltip, rows);
    el.tooltip.hidden = false;
    const host = el.chart.getBoundingClientRect();
    const [x0, x1] = chart.range;
    const axis = axisValues(settings.axis);
    const frac = (axis[cursor]! - x0) / (x1 - x0);
    const px = 52 + frac * (host.width - 52 - (settings.compare === 'none' ? 16 : 52));
    const tipWidth = el.tooltip.offsetWidth;
    const left = px + 14 + tipWidth > host.width ? px - 14 - tipWidth : px + 14;
    el.tooltip.style.transform = `translate(${Math.max(4, left)}px, 8px)`;
  }

  function updateRangeLabel() {
    if (!loaded) return;
    el.reset.disabled = selection === null;
    if (!selection) {
      el.rangeLabel.textContent = 'Whole file';
      return;
    }
    const d = loaded.derived.dist;
    el.rangeLabel.textContent = `${fmt.distance(d[selection[0]]!, settings.units)} to ${fmt.distance(d[selection[1]]!, settings.units)}`;
  }

  function select(a: number, b: number) {
    if (!loaded) return;
    selection = [a, b];
    const x = axisValues(settings.axis);
    chart.setRange(x[a]!, x[b]!);
    map.showSection(a, b);
    map.fit(true, a, b);
    refreshStats();
    updateRangeLabel();
    status(`Selected ${el.rangeLabel.textContent}.`);
  }

  function clearSelection() {
    if (!loaded) return;
    selection = null;
    chart.resetRange();
    map.showSection(null);
    refreshStats();
    updateRangeLabel();
  }

  // ---- Playback: recorded time when available, otherwise a constant 18 km/h (as on Mac).
  let playing = false;
  let playFrame = 0;
  let playClock = 0;
  let lastTick = 0;
  const NO_TIME_SPEED = 5; // m/s, 18 km/h

  function timeline(i: number): number {
    const { data, derived } = loaded!;
    return data.has.time ? derived.elapsed[i]! : derived.dist[i]! / NO_TIME_SPEED;
  }
  function indexAtTime(t: number): number {
    const { data, derived } = loaded!;
    const arr = data.has.time ? derived.elapsed : derived.dist;
    const target = data.has.time ? t : t * NO_TIME_SPEED;
    let lo = 0;
    let hi = arr.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (arr[mid]! <= target) lo = mid;
      else hi = mid;
    }
    return arr[hi]! <= target ? hi : lo;
  }
  function stop() {
    playing = false;
    cancelAnimationFrame(playFrame);
    el.play.textContent = 'Play';
    el.play.setAttribute('aria-pressed', 'false');
  }
  function tick(now: number) {
    if (!playing || !loaded) return;
    const dt = Math.min(0.25, (now - lastTick) / 1000);
    lastTick = now;
    playClock += dt * settings.speed;
    const max = Number(el.seek.max);
    if (playClock >= max) {
      playClock = max;
      stop();
    }
    el.seek.value = String(playClock);
    el.playTime.textContent = fmt.duration(playClock);
    setCursor(indexAtTime(playClock), 'play');
    if (playing) playFrame = requestAnimationFrame(tick);
  }
  el.play.addEventListener('click', () => {
    if (!loaded || !loaded.data.count) return;
    if (playing) return stop();
    const max = Number(el.seek.max);
    playClock = Number(el.seek.value);
    if (playClock >= max) playClock = 0;
    playing = true;
    el.play.textContent = 'Pause';
    el.play.setAttribute('aria-pressed', 'true');
    lastTick = performance.now();
    playFrame = requestAnimationFrame(tick);
  });
  el.seek.addEventListener('input', () => {
    if (!loaded) return;
    playClock = Number(el.seek.value);
    el.playTime.textContent = fmt.duration(playClock);
    setCursor(indexAtTime(playClock), 'play');
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && playing) stop();
  });

  function onLoaded() {
    if (!loaded) return;
    const { data, derived } = loaded;
    root.classList.add('has-file');
    el.empty.hidden = true;
    el.fileName.textContent = data.meta.name ?? fileLabel;
    el.fileName.title = fileLabel;
    el.fileMeta.textContent = describe(data);
    el.warnings.replaceChildren(
      ...data.warnings.map((w) => {
        const li = document.createElement('li');
        li.textContent = w;
        return li;
      }),
    );
    el.warnings.hidden = data.warnings.length === 0;
    fillSelect(el.main, data, false);
    fillSelect(el.compare, data, true);
    for (const option of el.axis.options)
      option.disabled = option.value !== 'distance' && !data.has.time;
    map.setTrack(data, derived);
    const hasPoints = data.count > 0;
    root.classList.toggle('no-points', !hasPoints);
    if (hasPoints) {
      const duration = timeline(data.count - 1);
      el.seek.max = String(Math.max(1, Math.ceil(duration)));
      el.seek.value = '0';
      el.playTime.textContent = fmt.duration(0);
      el.playNote.textContent = data.has.time
        ? 'Replays the recorded timestamps; gaps between segments are skipped.'
        : 'This file has no timestamps: playback uses a constant 18 km/h.';
      refreshChart(false);
    }
    refreshStats();
    updateRangeLabel();
    showPoint();
    // The layout changes once a file is shown (empty state gone, graph visible): fit again then.
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        map.invalidate();
        map.fit(false);
      }),
    );
  }

  // Keyboard: "o" opens a file when focus is not in a form field.
  document.addEventListener('keydown', (e) => {
    const target = e.target as HTMLElement;
    if (
      e.key === 'o' &&
      !e.metaKey &&
      !e.ctrlKey &&
      !e.altKey &&
      !/INPUT|SELECT|TEXTAREA/.test(target.tagName)
    )
      el.input.click();
  });

  const params = new URLSearchParams(location.search);
  if (params.has('sample')) void openSample();
}
