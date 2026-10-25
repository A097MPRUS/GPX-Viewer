// Canvas graph for Web Lite. Author: A097MPRUS.
// The plot layer is redrawn only when the data, range, size or appearance changes; the cursor and
// selection live on a separate overlay. Points are bucketed per pixel column (minimum, maximum and
// a representative point), so drawing time depends on the width, not on the file size.
// Missing values, segment breaks and (on time axes) pauses over 60 s lift the pen.
import { gradeColor } from './colors';

export interface Series {
  id: string;
  label: string;
  unit: string;
  color: string;
  values: Float64Array;
  baseline: 'zero' | 'symmetric' | 'data';
  decimals: number;
}

export interface ChartModel {
  x: Float64Array;
  /** 'distance' axis values are kilometres or miles; time axes are seconds. */
  axis: 'distance' | 'elapsed' | 'moving';
  distanceUnit: string;
  segment: Int32Array;
  main: Series;
  compare: Series | null;
  /** Gradient per point; when set the main series is drawn as a gradient-coloured area. */
  grade: Float64Array | null;
}

export interface ChartCallbacks {
  hover(index: number | null): void;
  pick(index: number): void;
  select(from: number, to: number): void;
  reset(): void;
}

interface Bucket {
  min: number;
  max: number;
  last: number;
  rep: number;
  first: number;
  end: number;
}

const PAD = { top: 14, right: 52, bottom: 26, left: 52 };

function niceStep(span: number, count: number): number {
  const raw = span / Math.max(1, count);
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const f = raw / mag;
  return (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * mag;
}

function timeLabel(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return h ? `${h}:${String(m).padStart(2, '0')}` : `${m} min`;
}

function cssVar(name: string, fallback: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

export class Chart {
  private host: HTMLElement;
  private base: HTMLCanvasElement;
  private over: HTMLCanvasElement;
  private callbacks: ChartCallbacks;
  private model: ChartModel | null = null;
  private x0 = 0;
  private x1 = 1;
  private width = 0;
  private height = 0;
  private dpr = 1;
  private cursor: number | null = null;
  private dragFrom: number | null = null;
  private dragTo: number | null = null;
  private yMain = { lo: 0, hi: 1 };
  private yCompare = { lo: 0, hi: 1 };
  private frame = 0;
  private observer: ResizeObserver;

  constructor(host: HTMLElement, callbacks: ChartCallbacks) {
    this.host = host;
    this.callbacks = callbacks;
    this.base = document.createElement('canvas');
    this.over = document.createElement('canvas');
    this.base.setAttribute('aria-hidden', 'true');
    this.over.setAttribute('aria-hidden', 'true');
    host.append(this.base, this.over);
    this.observer = new ResizeObserver(() => this.schedule());
    this.observer.observe(host);
    this.bindPointer();
    document.addEventListener('gpxv-theme', () => this.schedule());
  }

  setModel(model: ChartModel, keepRange = false): void {
    this.model = model;
    if (!keepRange) this.resetRange(false);
    this.schedule();
  }

  get range(): [number, number] {
    return [this.x0, this.x1];
  }

  setRange(x0: number, x1: number): void {
    if (!this.model) return;
    const n = this.model.x.length;
    const lo = this.model.x[0] ?? 0;
    const hi = this.model.x[n - 1] ?? 1;
    this.x0 = Math.max(lo, Math.min(x0, x1));
    this.x1 = Math.min(hi, Math.max(x0, x1));
    if (this.x1 - this.x0 < 1e-9) this.x1 = this.x0 + 1e-9;
    this.schedule();
  }

  resetRange(render = true): void {
    if (!this.model) return;
    const n = this.model.x.length;
    this.x0 = this.model.x[0] ?? 0;
    this.x1 = this.model.x[n - 1] ?? 1;
    if (this.x1 <= this.x0) this.x1 = this.x0 + 1;
    if (render) this.schedule();
  }

  setCursor(index: number | null): void {
    this.cursor = index;
    this.drawOverlay();
  }

  /** Index of the point nearest to an axis value (binary search; axis values never decrease). */
  indexAt(value: number): number {
    const x = this.model?.x;
    if (!x || !x.length) return 0;
    let lo = 0;
    let hi = x.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (x[mid]! < value) lo = mid;
      else hi = mid;
    }
    return Math.abs(x[lo]! - value) <= Math.abs(x[hi]! - value) ? lo : hi;
  }

  /** Visible index range. */
  visible(): [number, number] {
    return [this.indexAt(this.x0), this.indexAt(this.x1)];
  }

  destroy(): void {
    this.observer.disconnect();
    cancelAnimationFrame(this.frame);
  }

  private schedule(): void {
    cancelAnimationFrame(this.frame);
    this.frame = requestAnimationFrame(() => this.render());
  }

  private size(): void {
    const r = this.host.getBoundingClientRect();
    this.dpr = Math.min(window.devicePixelRatio || 1, 3);
    this.width = Math.max(1, Math.floor(r.width));
    this.height = Math.max(1, Math.floor(r.height));
    for (const c of [this.base, this.over]) {
      c.width = Math.round(this.width * this.dpr);
      c.height = Math.round(this.height * this.dpr);
      c.style.width = `${this.width}px`;
      c.style.height = `${this.height}px`;
    }
  }

  private plotWidth(): number {
    return Math.max(1, this.width - PAD.left - (this.model?.compare ? PAD.right : 16));
  }

  private xToPx(v: number): number {
    return PAD.left + ((v - this.x0) / (this.x1 - this.x0)) * this.plotWidth();
  }

  private pxToX(px: number): number {
    return this.x0 + ((px - PAD.left) / this.plotWidth()) * (this.x1 - this.x0);
  }

  private bucket(values: Float64Array, columns: number): (Bucket | null)[] {
    const m = this.model!;
    const out: (Bucket | null)[] = new Array(columns).fill(null);
    const [from, to] = this.visible();
    const span = this.x1 - this.x0;
    for (let i = Math.max(0, from - 1); i <= Math.min(m.x.length - 1, to + 1); i++) {
      const v = values[i]!;
      if (Number.isNaN(v)) continue;
      const c = Math.floor(((m.x[i]! - this.x0) / span) * columns);
      if (c < 0 || c >= columns) continue;
      const b = out[c];
      if (!b) out[c] = { min: v, max: v, last: v, rep: i, first: i, end: i };
      else {
        if (v < b.min) b.min = v;
        if (v > b.max) b.max = v;
        b.last = v;
        b.end = i;
      }
    }
    return out;
  }

  private scale(
    buckets: (Bucket | null)[],
    baseline: Series['baseline'],
  ): { lo: number; hi: number } {
    let lo = Infinity;
    let hi = -Infinity;
    for (const b of buckets) {
      if (!b) continue;
      if (b.min < lo) lo = b.min;
      if (b.max > hi) hi = b.max;
    }
    if (!Number.isFinite(lo)) return { lo: 0, hi: 1 };
    if (baseline === 'zero') lo = Math.min(0, lo);
    if (baseline === 'symmetric') {
      const a = Math.max(Math.abs(lo), Math.abs(hi), 1);
      return { lo: -a * 1.1, hi: a * 1.1 };
    }
    const pad = (hi - lo || Math.abs(hi) || 1) * 0.08;
    return { lo: baseline === 'zero' ? lo : lo - pad, hi: hi + pad };
  }

  private connected(a: Bucket, b: Bucket): boolean {
    const m = this.model!;
    if (m.segment[a.end] !== m.segment[b.first]) return false;
    // Index gap with missing values in between, or a pause on a time axis.
    if (m.axis !== 'distance' && m.x[b.first]! - m.x[a.end]! > 60) return false;
    return true;
  }

  private render(): void {
    if (!this.model) return;
    this.size();
    const ctx = this.base.getContext('2d');
    if (!ctx) return;
    const m = this.model;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.width, this.height);
    const text = cssVar('--muted', '#5d6169');
    const line = cssVar('--line', '#e1e1dd');
    const ink = cssVar('--text', '#16171a');
    const pw = this.plotWidth();
    const ph = this.height - PAD.top - PAD.bottom;
    const columns = Math.max(2, Math.floor(pw));
    const main = this.bucket(m.main.values, columns);
    this.yMain = this.scale(main, m.main.baseline);
    const cmp = m.compare ? this.bucket(m.compare.values, columns) : null;
    if (m.compare && cmp) this.yCompare = this.scale(cmp, m.compare.baseline);
    const yPx = (v: number, s: { lo: number; hi: number }) =>
      PAD.top + ph - ((v - s.lo) / (s.hi - s.lo)) * ph;
    ctx.font = '11px "IBM Plex Mono", ui-monospace, monospace';
    ctx.textBaseline = 'middle';

    // Horizontal grid and left axis.
    const yStep = niceStep(this.yMain.hi - this.yMain.lo, Math.max(2, Math.floor(ph / 42)));
    ctx.strokeStyle = line;
    ctx.lineWidth = 1;
    ctx.fillStyle = text;
    ctx.textAlign = 'right';
    for (let v = Math.ceil(this.yMain.lo / yStep) * yStep; v <= this.yMain.hi; v += yStep) {
      const y = Math.round(yPx(v, this.yMain)) + 0.5;
      ctx.beginPath();
      ctx.moveTo(PAD.left, y);
      ctx.lineTo(PAD.left + pw, y);
      ctx.stroke();
      ctx.fillText(`${+v.toFixed(m.main.decimals > 0 ? 1 : 0)}`, PAD.left - 8, y);
    }
    // Vertical grid and bottom axis.
    const span = this.x1 - this.x0;
    const xStep =
      m.axis === 'distance'
        ? niceStep(span, Math.max(2, Math.floor(pw / 90)))
        : ([60, 120, 300, 600, 900, 1800, 3600, 7200, 14400].find(
            (s) => span / s <= Math.max(2, Math.floor(pw / 90)),
          ) ?? 28800);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let v = Math.ceil(this.x0 / xStep) * xStep; v <= this.x1; v += xStep) {
      const x = Math.round(this.xToPx(v)) + 0.5;
      ctx.beginPath();
      ctx.moveTo(x, PAD.top);
      ctx.lineTo(x, PAD.top + ph);
      ctx.stroke();
      const label =
        m.axis === 'distance' ? `${+v.toFixed(xStep < 1 ? 1 : 0)} ${m.distanceUnit}` : timeLabel(v);
      ctx.fillText(label, x, PAD.top + ph + 7);
    }
    ctx.textBaseline = 'middle';
    // Unit labels.
    ctx.textAlign = 'left';
    ctx.fillText(m.main.unit, 6, PAD.top - 2);

    const colX = (c: number) => PAD.left + c + 0.5;
    // Main series: gradient-coloured area for elevation, line with a light fill otherwise.
    if (m.grade) {
      for (let c = 0; c < columns; c++) {
        const b = main[c];
        if (!b) continue;
        const y = yPx(b.max, this.yMain);
        ctx.fillStyle = gradeColor(m.grade[b.rep]!);
        ctx.globalAlpha = 0.85;
        ctx.fillRect(PAD.left + c, y, 1.02, PAD.top + ph - y);
      }
      ctx.globalAlpha = 1;
    }
    const stroke = (
      buckets: (Bucket | null)[],
      s: { lo: number; hi: number },
      color: string,
      width: number,
    ) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      let prev: Bucket | null = null;
      for (let c = 0; c < columns; c++) {
        const b = buckets[c];
        if (!b) continue;
        if (!prev || !this.connected(prev, b))
          ctx.moveTo(colX(c), yPx(b.min === b.max ? b.min : (b.min + b.max) / 2, s));
        if (b.min !== b.max) {
          ctx.lineTo(colX(c), yPx(b.max, s));
          ctx.lineTo(colX(c), yPx(b.min, s));
        }
        ctx.lineTo(colX(c), yPx(b.last, s));
        prev = b;
      }
      ctx.stroke();
    };
    stroke(main, this.yMain, m.grade ? ink : m.main.color, m.grade ? 1.2 : 1.8);
    if (m.compare && cmp) {
      stroke(cmp, this.yCompare, m.compare.color, 1.6);
      const cStep = niceStep(this.yCompare.hi - this.yCompare.lo, Math.max(2, Math.floor(ph / 42)));
      ctx.fillStyle = m.compare.color;
      ctx.textAlign = 'left';
      for (let v = Math.ceil(this.yCompare.lo / cStep) * cStep; v <= this.yCompare.hi; v += cStep) {
        ctx.fillText(
          `${+v.toFixed(m.compare.decimals > 0 ? 1 : 0)}`,
          PAD.left + pw + 8,
          yPx(v, this.yCompare),
        );
      }
      ctx.textAlign = 'right';
      ctx.fillText(m.compare.unit, this.width - 6, PAD.top - 2);
    }
    this.drawOverlay();
  }

  private drawOverlay(): void {
    const ctx = this.over.getContext('2d');
    if (!ctx || !this.model) return;
    const m = this.model;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.width, this.height);
    const ph = this.height - PAD.top - PAD.bottom;
    if (this.dragFrom !== null && this.dragTo !== null) {
      const a = Math.min(this.dragFrom, this.dragTo);
      const b = Math.max(this.dragFrom, this.dragTo);
      ctx.fillStyle = cssVar('--route-soft', 'rgba(31,95,214,0.14)');
      ctx.fillRect(a, PAD.top, b - a, ph);
    }
    if (this.cursor === null) return;
    const v = m.x[this.cursor];
    if (v === undefined || v < this.x0 || v > this.x1) return;
    const x = Math.round(this.xToPx(v)) + 0.5;
    const marker = cssVar('--marker', '#e8590c');
    ctx.strokeStyle = marker;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, PAD.top);
    ctx.lineTo(x, PAD.top + ph);
    ctx.stroke();
    const dot = (value: number, s: { lo: number; hi: number }, color: string) => {
      if (Number.isNaN(value)) return;
      const y = PAD.top + ph - ((value - s.lo) / (s.hi - s.lo)) * ph;
      ctx.beginPath();
      ctx.arc(x, y, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = cssVar('--surface', '#ffffff');
      ctx.stroke();
    };
    dot(m.main.values[this.cursor]!, this.yMain, m.grade ? marker : m.main.color);
    if (m.compare) dot(m.compare.values[this.cursor]!, this.yCompare, m.compare.color);
  }

  private bindPointer(): void {
    const host = this.host;
    const local = (e: PointerEvent) => e.clientX - host.getBoundingClientRect().left;
    const indexFromPx = (px: number) =>
      this.indexAt(this.pxToX(Math.max(PAD.left, Math.min(px, PAD.left + this.plotWidth()))));
    let pointer: number | null = null;
    host.addEventListener('pointerdown', (e) => {
      if (!this.model || e.button > 0) return;
      pointer = e.pointerId;
      host.setPointerCapture(e.pointerId);
      const i = indexFromPx(local(e));
      this.callbacks.pick(i);
      if (e.pointerType === 'mouse') {
        this.dragFrom = local(e);
        this.dragTo = this.dragFrom;
      }
    });
    host.addEventListener('pointermove', (e) => {
      if (!this.model) return;
      const px = local(e);
      if (pointer === e.pointerId && this.dragFrom !== null) this.dragTo = px;
      if (e.pointerType === 'mouse' || pointer === e.pointerId)
        this.callbacks.hover(indexFromPx(px));
      if (this.dragFrom !== null) this.drawOverlay();
    });
    const end = (e: PointerEvent) => {
      if (pointer !== e.pointerId) return;
      pointer = null;
      if (
        this.dragFrom !== null &&
        this.dragTo !== null &&
        Math.abs(this.dragTo - this.dragFrom) > 8
      ) {
        const a = indexFromPx(Math.min(this.dragFrom, this.dragTo));
        const b = indexFromPx(Math.max(this.dragFrom, this.dragTo));
        if (b > a) this.callbacks.select(a, b);
      }
      this.dragFrom = null;
      this.dragTo = null;
      this.drawOverlay();
    };
    host.addEventListener('pointerup', end);
    host.addEventListener('pointercancel', end);
    host.addEventListener('pointerleave', (e) => {
      if (e.pointerType === 'mouse' && pointer === null) this.callbacks.hover(null);
    });
    host.addEventListener('dblclick', () => this.callbacks.reset());
    host.addEventListener('keydown', (e) => {
      if (!this.model) return;
      const [from, to] = this.visible();
      const step = Math.max(1, Math.round((to - from) / (e.shiftKey ? 20 : 200)));
      let i = this.cursor ?? from;
      if (e.key === 'ArrowRight') i += step;
      else if (e.key === 'ArrowLeft') i -= step;
      else if (e.key === 'Home') i = from;
      else if (e.key === 'End') i = to;
      else if (e.key === 'Escape') {
        this.callbacks.reset();
        return;
      } else return;
      e.preventDefault();
      this.callbacks.pick(Math.max(from, Math.min(to, i)));
    });
  }
}
