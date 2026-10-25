// Leaflet map for Web Lite. Author: A097MPRUS.
//
// Basemaps (checked 25 Oct 2026):
// - OpenStreetMap standard tiles: OSMF tile usage policy. Visible attribution, normal
//   interactive viewing only (no prefetching or offline use), the browser's own User-Agent and
//   Referer (this site never sets a restrictive Referrer-Policy), caching as the server allows.
// - OpenTopoMap: CC BY-SA, free use with attribution; no mass downloads.
// No key-based or proprietary map service is used. Track names and waypoint text from the file
// are always inserted as text, never as HTML.
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Derived, GpxData } from '../gpx/types';

export type BaseMapId = 'osm' | 'opentopomap' | 'none';

export const BASEMAPS: Record<
  Exclude<BaseMapId, 'none'>,
  { name: string; url: string; options: L.TileLayerOptions }
> = {
  osm: {
    name: 'OpenStreetMap',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    options: {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | <a href="https://www.openstreetmap.org/fixthemap">Report a map issue</a>',
    },
  },
  opentopomap: {
    name: 'OpenTopoMap',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    options: {
      maxZoom: 17,
      subdomains: 'abc',
      attribution:
        'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, SRTM | Map display: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC BY-SA</a>)',
    },
  },
};

const DISPLAY_LIMIT = 80_000;

export interface MapCallbacks {
  /** Pointer near the track (index of the data point) or away from it (null). */
  hover?: (index: number | null) => void;
  /** Click or tap on the track. */
  pick?: (index: number) => void;
  /** Tiles failed repeatedly, or recovered. */
  tiles?: (ok: boolean) => void;
}

export class TrackMap {
  readonly map: L.Map;
  private base: L.TileLayer | null = null;
  private baseId: BaseMapId = 'osm';
  private renderer: L.Canvas;
  private trackLayer = L.layerGroup();
  private overlay = L.layerGroup();
  private position: L.CircleMarker;
  private section: L.Polyline | null = null;
  private data: GpxData | null = null;
  private derived: Derived | null = null;
  /** Data indices of the points drawn (thinned for very large files). */
  private shown: Int32Array = new Int32Array(0);
  private grid = new Map<number, number[]>();
  private gridProjected: Float64Array = new Float64Array(0);
  private tileErrors = 0;
  private callbacks: MapCallbacks;
  private reduceMotion: boolean;

  constructor(
    element: HTMLElement,
    callbacks: MapCallbacks = {},
    options: { interactive?: boolean } = {},
  ) {
    this.callbacks = callbacks;
    this.reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.renderer = L.canvas({ padding: 0.4, tolerance: 6 });
    const interactive = options.interactive ?? true;
    this.map = L.map(element, {
      zoomControl: interactive,
      attributionControl: true,
      preferCanvas: true,
      renderer: this.renderer,
      zoomSnap: 0.25,
      dragging: interactive,
      scrollWheelZoom: interactive ? 'center' : false,
      doubleClickZoom: interactive,
      touchZoom: interactive,
      boxZoom: interactive,
      keyboard: interactive,
      fadeAnimation: !this.reduceMotion,
      zoomAnimation: !this.reduceMotion,
      markerZoomAnimation: !this.reduceMotion,
      worldCopyJump: false,
    });
    this.map.attributionControl.setPrefix('<a href="https://leafletjs.com">Leaflet</a>');
    this.map.setView([49.8, 6.35], 9);
    this.trackLayer.addTo(this.map);
    this.overlay.addTo(this.map);
    this.position = L.circleMarker([0, 0], {
      radius: 7,
      color: '#ffffff',
      weight: 2.5,
      fillColor: '#e8590c',
      fillOpacity: 1,
      interactive: false,
      renderer: this.renderer,
    });
    this.setBase('osm');
    this.map.on('zoomend moveend', () => this.buildGrid());
    if (interactive) {
      this.map.on('mousemove', (e: L.LeafletMouseEvent) =>
        this.callbacks.hover?.(this.nearest(e.containerPoint)),
      );
      this.map.on('mouseout', () => this.callbacks.hover?.(null));
      this.map.on('click', (e: L.LeafletMouseEvent) => {
        const i = this.nearest(e.containerPoint, 22);
        if (i !== null) this.callbacks.pick?.(i);
      });
    }
  }

  setBase(id: BaseMapId): void {
    this.baseId = id;
    if (this.base) this.map.removeLayer(this.base);
    this.base = null;
    this.tileErrors = 0;
    this.callbacks.tiles?.(true);
    if (id === 'none') return;
    const def = BASEMAPS[id];
    const layer = L.tileLayer(def.url, { ...def.options, crossOrigin: false });
    layer.on('tileerror', () => {
      this.tileErrors++;
      if (this.tileErrors === 6) this.callbacks.tiles?.(false);
    });
    layer.on('tileload', () => {
      if (this.tileErrors >= 6) this.callbacks.tiles?.(true);
      this.tileErrors = 0;
    });
    layer.addTo(this.map);
    layer.bringToBack();
    this.base = layer;
  }

  get currentBase(): BaseMapId {
    return this.baseId;
  }

  setTrack(data: GpxData, derived: Derived): void {
    this.data = data;
    this.derived = derived;
    this.trackLayer.clearLayers();
    this.overlay.clearLayers();
    this.section = null;
    const lon = derived.lonUnwrapped;
    // Thin very large files for drawing only; statistics and graphs use every point.
    const step = data.count > DISPLAY_LIMIT ? data.count / DISPLAY_LIMIT : 1;
    const shown: number[] = [];
    for (const s of data.segments) {
      let next = s.start;
      for (let i = s.start; i < s.end; i++) {
        if (i >= next || i === s.end - 1) {
          shown.push(i);
          next = i + step;
        }
      }
    }
    this.shown = Int32Array.from(shown);
    const route =
      getComputedStyle(document.documentElement).getPropertyValue('--route').trim() || '#1f5fd6';
    for (const s of data.segments) {
      const pts: L.LatLngExpression[] = [];
      for (const i of this.shown) if (i >= s.start && i < s.end) pts.push([data.lat[i]!, lon[i]!]);
      if (!pts.length) continue;
      L.polyline(pts, {
        color: '#ffffff',
        weight: 7,
        opacity: 0.85,
        renderer: this.renderer,
        interactive: false,
      }).addTo(this.trackLayer);
      L.polyline(pts, {
        color: route,
        weight: 3.5,
        opacity: 1,
        renderer: this.renderer,
        interactive: false,
        dashArray: s.kind === 'route' ? '8 6' : undefined,
      }).addTo(this.trackLayer);
    }
    const first = data.segments[0];
    const last = data.segments[data.segments.length - 1];
    if (first && last) {
      this.pin(first.start, '#17713a', 'Start');
      this.pin(last.end - 1, '#b42318', 'End');
    }
    for (const w of data.waypoints) {
      const label = document.createElement('span');
      label.textContent = w.name ?? 'Waypoint';
      L.circleMarker([w.lat, w.lon], {
        radius: 5,
        color: '#ffffff',
        weight: 2,
        fillColor: '#5d6169',
        fillOpacity: 1,
        renderer: this.renderer,
      })
        .bindTooltip(label, { direction: 'top', offset: [0, -6] })
        .addTo(this.overlay);
    }
    this.fit(false);
    this.buildGrid();
  }

  private pin(index: number, color: string, title: string): void {
    if (!this.data || !this.derived) return;
    const label = document.createElement('span');
    label.textContent = title;
    L.circleMarker([this.data.lat[index]!, this.derived.lonUnwrapped[index]!], {
      radius: 6.5,
      color: '#ffffff',
      weight: 2.5,
      fillColor: color,
      fillOpacity: 1,
      renderer: this.renderer,
    })
      .bindTooltip(label, { direction: 'top', offset: [0, -6] })
      .addTo(this.overlay);
  }

  bounds(from = 0, to = (this.data?.count ?? 1) - 1): L.LatLngBounds | null {
    if (!this.data || !this.derived || to < from) return null;
    let s = Infinity;
    let n = -Infinity;
    let w = Infinity;
    let e = -Infinity;
    for (let i = from; i <= to; i++) {
      const la = this.data.lat[i]!;
      const lo = this.derived.lonUnwrapped[i]!;
      if (la < s) s = la;
      if (la > n) n = la;
      if (lo < w) w = lo;
      if (lo > e) e = lo;
    }
    if (this.data.count === 0)
      for (const p of this.data.waypoints) {
        s = Math.min(s, p.lat);
        n = Math.max(n, p.lat);
        w = Math.min(w, p.lon);
        e = Math.max(e, p.lon);
      }
    return Number.isFinite(s) ? L.latLngBounds([s, w], [n, e]) : null;
  }

  fit(animate = true, from?: number, to?: number): void {
    const b = this.bounds(from, to);
    if (!b) return;
    this.map.fitBounds(b.pad(0.08), { animate: animate && !this.reduceMotion, maxZoom: 16 });
  }

  /** Marks the current position; follow pans the map when the point leaves the middle area. */
  showPosition(index: number | null, follow = false): void {
    if (index === null || !this.data || !this.derived) {
      this.position.remove();
      return;
    }
    const ll = L.latLng(this.data.lat[index]!, this.derived.lonUnwrapped[index]!);
    this.position.setLatLng(ll);
    if (!this.map.hasLayer(this.position)) this.position.addTo(this.map);
    if (follow) {
      const inner = this.map.getBounds().pad(-0.25);
      if (!inner.contains(ll)) this.map.panTo(ll, { animate: !this.reduceMotion, duration: 0.35 });
    }
  }

  /** Highlights a section of the track (data indices, inclusive) or clears it. */
  showSection(from: number | null, to?: number): void {
    if (this.section) this.overlay.removeLayer(this.section);
    this.section = null;
    if (from === null || to === undefined || !this.data || !this.derived) return;
    const pts: L.LatLngExpression[] = [];
    for (const i of this.shown)
      if (i >= from && i <= to) pts.push([this.data.lat[i]!, this.derived.lonUnwrapped[i]!]);
    if (pts.length < 2) return;
    this.section = L.polyline(pts, {
      color: '#e8590c',
      weight: 5,
      opacity: 0.9,
      renderer: this.renderer,
      interactive: false,
    });
    this.section.addTo(this.overlay);
  }

  invalidate(): void {
    this.map.invalidateSize({ animate: false });
  }

  destroy(): void {
    this.map.remove();
  }

  /** Spatial grid of drawn points in screen pixels, rebuilt after each zoom or pan. */
  private buildGrid(): void {
    this.grid.clear();
    if (!this.data || !this.derived) return;
    const n = this.shown.length;
    const proj = new Float64Array(n * 2);
    const size = this.map.getSize();
    for (let k = 0; k < n; k++) {
      const i = this.shown[k]!;
      const p = this.map.latLngToContainerPoint([this.data.lat[i]!, this.derived.lonUnwrapped[i]!]);
      proj[2 * k] = p.x;
      proj[2 * k + 1] = p.y;
      if (p.x < -50 || p.y < -50 || p.x > size.x + 50 || p.y > size.y + 50) continue;
      const key = Math.floor(p.x / 24) * 4096 + Math.floor(p.y / 24);
      const cell = this.grid.get(key);
      if (cell) cell.push(k);
      else this.grid.set(key, [k]);
    }
    this.gridProjected = proj;
  }

  private nearest(point: L.Point, radius = 14): number | null {
    const cx = Math.floor(point.x / 24);
    const cy = Math.floor(point.y / 24);
    let best: number | null = null;
    let bestD = radius * radius;
    for (let dx = -1; dx <= 1; dx++)
      for (let dy = -1; dy <= 1; dy++) {
        const cell = this.grid.get((cx + dx) * 4096 + (cy + dy));
        if (!cell) continue;
        for (const k of cell) {
          const x = this.gridProjected[2 * k]! - point.x;
          const y = this.gridProjected[2 * k + 1]! - point.y;
          const d = x * x + y * y;
          if (d < bestD) {
            bestD = d;
            best = this.shown[k]!;
          }
        }
      }
    return best;
  }
}
