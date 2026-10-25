// Small site-wide behaviours: appearance, header, mobile menu, entry motion. Author: A097MPRUS.

type Mode = 'system' | 'light' | 'dark';

function readMode(): Mode {
  try {
    const v = localStorage.getItem('gpxv-theme');
    return v === 'light' || v === 'dark' ? v : 'system';
  } catch {
    return 'system';
  }
}

function writeMode(mode: Mode): void {
  try {
    if (mode === 'system') localStorage.removeItem('gpxv-theme');
    else localStorage.setItem('gpxv-theme', mode);
  } catch {
    /* Storage unavailable: the choice lasts for this page only. */
  }
}

export function effectiveTheme(): 'light' | 'dark' {
  const set = document.documentElement.dataset['theme'];
  if (set === 'light' || set === 'dark') return set;
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function initThemeToggle(): void {
  const button = document.querySelector<HTMLButtonElement>('[data-theme-toggle]');
  if (!button) return;
  const root = document.documentElement;
  const update = (mode: Mode) => {
    if (mode === 'system') delete root.dataset['theme'];
    else root.dataset['theme'] = mode;
    const effective = effectiveTheme();
    button.dataset['effective'] = effective;
    button.setAttribute(
      'aria-label',
      mode === 'system' ? `Appearance: follows the system (${effective})` : `Appearance: ${mode}`,
    );
    button.title = button.getAttribute('aria-label') ?? '';
    document.dispatchEvent(new CustomEvent('gpxv-theme', { detail: effective }));
  };
  let mode = readMode();
  update(mode);
  button.addEventListener('click', () => {
    // System, then the opposite of the current look, then the other one.
    const effective = effectiveTheme();
    mode =
      mode === 'system'
        ? effective === 'dark'
          ? 'light'
          : 'dark'
        : mode === 'light'
          ? 'dark'
          : 'system';
    writeMode(mode);
    update(mode);
  });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => update(mode));
}

export function initMenu(): void {
  const toggle = document.querySelector<HTMLButtonElement>('[data-menu-toggle]');
  const menu = document.querySelector<HTMLElement>('[data-menu]');
  if (!toggle || !menu) return;
  const set = (open: boolean, returnFocus = false) => {
    toggle.setAttribute('aria-expanded', String(open));
    menu.hidden = !open;
    if (open) menu.querySelector<HTMLAnchorElement>('a')?.focus();
    else if (returnFocus) toggle.focus();
  };
  toggle.addEventListener('click', () => set(toggle.getAttribute('aria-expanded') !== 'true'));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !menu.hidden) set(false, true);
  });
  menu.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('a')) set(false);
  });
  // A window that grows past the small-screen layout closes the sheet.
  matchMedia('(min-width: 901px)').addEventListener('change', (e) => {
    if (e.matches) set(false);
  });
}

/** Adds a hairline under the header once the page has scrolled. */
export function initHeader(): void {
  const header = document.querySelector<HTMLElement>('[data-header]');
  if (!header) return;
  let queued = false;
  const update = () => {
    queued = false;
    header.classList.toggle('is-scrolled', window.scrollY > 4);
  };
  window.addEventListener(
    'scroll',
    () => {
      if (!queued) {
        queued = true;
        requestAnimationFrame(update);
      }
    },
    { passive: true },
  );
  update();
}

export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Elements with data-enter play their entry transition once, when they first become visible. */
export function initEnter(): void {
  const items = document.querySelectorAll<HTMLElement>('[data-enter]');
  if (!items.length) return;
  if (!('IntersectionObserver' in window) || reducedMotion()) {
    items.forEach((el) => el.classList.add('is-in'));
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          observer.unobserve(entry.target);
        }
      }
    },
    { rootMargin: '0px 0px -10% 0px', threshold: 0.05 },
  );
  items.forEach((el) => observer.observe(el));
}

/**
 * Numbers with data-count="<value>" (and data-decimals) reveal their measured value once, the
 * first time they are seen. The final text is already in the HTML for no-script and reduced motion.
 */
export function initCounters(): void {
  const items = document.querySelectorAll<HTMLElement>('[data-count]');
  if (!items.length || reducedMotion() || !('IntersectionObserver' in window)) return;
  const run = (el: HTMLElement) => {
    const target = Number(el.dataset['count']);
    const decimals = Number(el.dataset['decimals'] ?? '0');
    const finalText = el.textContent ?? '';
    if (!Number.isFinite(target)) return;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / 900);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = t < 1 ? (target * eased).toFixed(decimals) : finalText;
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          run(entry.target as HTMLElement);
          observer.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.6 },
  );
  items.forEach((el) => observer.observe(el));
}

/** Copy buttons: <button data-copy="text">. */
export function initCopyButtons(): void {
  document.querySelectorAll<HTMLButtonElement>('[data-copy]').forEach((button) => {
    button.addEventListener('click', async () => {
      const text = button.dataset['copy'] ?? '';
      const label = button.querySelector('[data-copy-label]');
      try {
        await navigator.clipboard.writeText(text);
        if (label) label.textContent = 'Copied';
      } catch {
        if (label) label.textContent = 'Select and copy';
      }
      window.setTimeout(() => {
        if (label) label.textContent = 'Copy';
      }, 1800);
    });
  });
}
