// Drives a RouteStage: route drawing, profile reveal, marker and readouts. Author: A097MPRUS.
// Updates only set a few SVG attributes and text nodes, at most once per animation frame.
import { reducedMotion } from './site';

type Column = [number, number, number, number, number | null, number | null, number | null];

export class Stage {
  readonly root: HTMLElement;
  private columns: Column[];
  private route: SVGPathElement | null;
  private clip: SVGRectElement | null;
  private marker: SVGGElement | null;
  private cursor: SVGLineElement | null;
  private profile: HTMLElement | null;
  private out: Record<string, HTMLElement | null>;
  private profileWidth: number;
  index = 0;

  constructor(root: HTMLElement) {
    this.root = root;
    this.columns = JSON.parse(root.dataset['columns'] ?? '[]') as Column[];
    this.route = root.querySelector('[data-route]');
    this.clip = root.querySelector('[data-clip]');
    this.marker = root.querySelector('[data-marker]');
    this.cursor = root.querySelector('[data-cursor]');
    this.profile = root.querySelector('[data-profile]');
    this.profileWidth = Number(this.clip?.getAttribute('width') ?? '1000');
    const q = (k: string) => root.querySelector<HTMLElement>(`[data-out="${k}"]`);
    this.out = { dist: q('dist'), ele: q('ele'), grade: q('grade'), speed: q('speed') };
  }

  /** Portion of the route and profile drawn, 0 to 1. */
  draw(fraction: number): void {
    const f = Math.min(1, Math.max(0, fraction));
    this.route?.style.setProperty('stroke-dashoffset', String(1 - f));
    this.clip?.setAttribute('width', String(f * this.profileWidth));
  }

  /** Moves the marker, cursor and readouts to a fraction of the distance. */
  at(fraction: number): void {
    const f = Math.min(1, Math.max(0, fraction));
    const index = Math.round(f * (this.columns.length - 1));
    const c = this.columns[index];
    if (!c) return;
    this.index = index;
    this.marker?.setAttribute('transform', `translate(${c[0]} ${c[1]})`);
    const x = String((index / (this.columns.length - 1)) * this.profileWidth);
    this.cursor?.setAttribute('x1', x);
    this.cursor?.setAttribute('x2', x);
    const km = (c[2] / 1000).toFixed(1);
    if (this.out['dist']) this.out['dist'].textContent = km;
    if (this.out['ele']) this.out['ele'].textContent = String(c[3]);
    if (this.out['grade'])
      this.out['grade'].textContent =
        c[4] === null ? '-' : `${c[4] > 0 ? '+' : ''}${c[4].toFixed(1)}`;
    if (this.out['speed']) this.out['speed'].textContent = c[5] === null ? '-' : c[5].toFixed(1);
    this.profile?.setAttribute('aria-valuenow', String(c[2]));
    this.profile?.setAttribute('aria-valuetext', `${km} km, elevation ${c[3]} m`);
  }

  showSpeed(on: boolean): void {
    this.root.classList.toggle('show-speed', on);
  }

  /** Pointer, touch and keyboard scrubbing along the profile. Calls onUse on first use. */
  enableScrub(onUse?: () => void): void {
    const p = this.profile;
    if (!p) return;
    const last = this.columns.length - 1;
    const from = (e: PointerEvent) => {
      const r = p.getBoundingClientRect();
      this.at((e.clientX - r.left) / r.width);
    };
    p.addEventListener('pointerdown', (e) => {
      onUse?.();
      p.setPointerCapture(e.pointerId);
      from(e);
    });
    p.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'mouse' || p.hasPointerCapture(e.pointerId)) {
        onUse?.();
        from(e);
      }
    });
    p.addEventListener('keydown', (e) => {
      const step = e.shiftKey ? 10 : 1;
      let next = this.index;
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') next += step;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') next -= step;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = last;
      else return;
      e.preventDefault();
      onUse?.();
      this.at(next / last);
    });
  }
}

/** Introduction: the route draws once (about one second) with the marker, then waits. */
export function playIntro(root: HTMLElement): void {
  const stage = new Stage(root);
  let used = false;
  stage.enableScrub(() => {
    used = true;
    stage.draw(1);
  });
  if (reducedMotion()) {
    stage.draw(1);
    stage.at(0);
    return;
  }
  stage.draw(0);
  const start = performance.now() + 200;
  const tick = (now: number) => {
    if (used) return;
    const t = Math.min(1, Math.max(0, (now - start) / 1300));
    const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    stage.draw(eased);
    stage.at(eased);
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/**
 * Scroll story: the position of the visitor in the section drives the stage. Steps marked
 * data-step="n" become current as they cross the middle of the viewport.
 */
export function bindStory(section: HTMLElement): void {
  const root = section.querySelector<HTMLElement>('[data-stage]');
  if (!root) return;
  const stage = new Stage(root);
  const steps = [...section.querySelectorAll<HTMLElement>('[data-step]')];
  const setStep = (n: number) => {
    steps.forEach((s) => s.classList.toggle('is-current', Number(s.dataset['step']) === n));
    stage.showSpeed(n >= 4);
  };
  stage.enableScrub();
  if (reducedMotion()) {
    // Immediate states instead of continuous motion: everything drawn, marker per step.
    stage.draw(1);
    const marks: Record<number, number> = { 1: 0, 2: 0, 3: 0.42, 4: 0.68 };
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            const n = Number((e.target as HTMLElement).dataset['step']);
            setStep(n);
            stage.at(marks[n] ?? 0);
          }
        }
      },
      { rootMargin: '-45% 0px -45% 0px' },
    );
    steps.forEach((s) => observer.observe(s));
    return;
  }
  let active = false;
  let queued = false;
  const update = () => {
    queued = false;
    const r = section.getBoundingClientRect();
    const span = r.height - window.innerHeight;
    const p = span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0;
    // First quarter draws the route, the second reveals the profile, the rest moves the marker.
    stage.draw(Math.min(1, p / 0.3));
    stage.at(p <= 0.3 ? 0 : (p - 0.3) / 0.7);
    const n = p < 0.25 ? 1 : p < 0.45 ? 2 : p < 0.7 ? 3 : 4;
    setStep(n);
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
  }).observe(section);
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  stage.draw(0);
}
