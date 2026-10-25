// Full-size screenshot viewer built on the native <dialog> element. Author: A097MPRUS.
// - Shows the original screenshot fitted to the window; Zoom (or a click on the image) switches
//   to its actual size, scrollable in both directions.
// - Screenshots that share a set can be browsed with Previous and Next, the arrow keys or a
//   horizontal swipe; Escape closes (native dialog), focus returns to the opening button.
// - Works with keyboard, pointer and touch; nothing animates when reduced motion is requested.

export interface LightboxItem {
  src: string;
  alt: string;
  caption: string;
  width?: number;
  height?: number;
}

let dialog: HTMLDialogElement | null = null;
let items: LightboxItem[] = [];
let index = 0;
let opener: HTMLElement | undefined;

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls: string, text?: string) {
  const e = document.createElement(tag);
  e.className = cls;
  if (text) e.textContent = text;
  return e;
}

function ensure(): HTMLDialogElement {
  if (dialog) return dialog;
  const d = document.createElement('dialog');
  d.className = 'lightbox';
  d.setAttribute('aria-label', 'Screenshot');
  const bar = el('div', 'lightbox-bar');
  const count = el('p', 'lightbox-count');
  count.setAttribute('aria-live', 'polite');
  const tools = el('div', 'lightbox-tools');
  const prev = el('button', 'btn btn-compact lightbox-prev', 'Previous');
  const next = el('button', 'btn btn-compact lightbox-next', 'Next');
  const zoom = el('button', 'btn btn-compact lightbox-zoom', 'Actual size');
  const close = el('button', 'btn btn-compact lightbox-close', 'Close');
  for (const b of [prev, next, zoom, close]) b.type = 'button';
  zoom.setAttribute('aria-pressed', 'false');
  tools.append(prev, next, zoom, close);
  bar.append(count, tools);
  const frame = el('div', 'lightbox-frame');
  const img = document.createElement('img');
  img.decoding = 'async';
  frame.append(img);
  const caption = el('p', 'lightbox-caption');
  d.append(bar, frame, caption);

  close.addEventListener('click', () => d.close());
  prev.addEventListener('click', () => show(index - 1));
  next.addEventListener('click', () => show(index + 1));
  const toggleZoom = () => {
    const on = !d.classList.contains('is-actual');
    d.classList.toggle('is-actual', on);
    zoom.setAttribute('aria-pressed', String(on));
    zoom.textContent = on ? 'Fit to window' : 'Actual size';
  };
  zoom.addEventListener('click', toggleZoom);
  img.addEventListener('click', toggleZoom);
  d.addEventListener('click', (e) => {
    if (e.target === d) d.close();
  });
  d.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      show(index + 1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      show(index - 1);
    }
  });
  // Horizontal swipe on touch screens (not while zoomed, where the finger pans the image).
  let startX = 0;
  let startY = 0;
  frame.addEventListener(
    'touchstart',
    (e) => {
      const t = e.touches[0];
      if (t) {
        startX = t.clientX;
        startY = t.clientY;
      }
    },
    { passive: true },
  );
  frame.addEventListener(
    'touchend',
    (e) => {
      if (d.classList.contains('is-actual')) return;
      const t = e.changedTouches[0];
      if (!t) return;
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) show(index + (dx < 0 ? 1 : -1));
    },
    { passive: true },
  );
  d.addEventListener('close', () => {
    d.classList.remove('is-actual');
    opener?.focus();
  });
  document.body.append(d);
  dialog = d;
  return d;
}

function show(i: number): void {
  const d = ensure();
  if (items.length === 0) return;
  index = Math.max(0, Math.min(items.length - 1, i));
  const item = items[index]!;
  const img = d.querySelector<HTMLImageElement>('.lightbox-frame img')!;
  img.src = item.src;
  img.alt = item.alt;
  if (item.width && item.height) {
    img.width = item.width;
    img.height = item.height;
  }
  d.querySelector('.lightbox-caption')!.textContent = item.caption;
  const many = items.length > 1;
  d.querySelector('.lightbox-count')!.textContent = many ? `${index + 1} of ${items.length}` : '';
  const prev = d.querySelector<HTMLButtonElement>('.lightbox-prev')!;
  const next = d.querySelector<HTMLButtonElement>('.lightbox-next')!;
  prev.hidden = next.hidden = !many;
  prev.disabled = index === 0;
  next.disabled = index === items.length - 1;
  d.classList.remove('is-actual');
  const zoom = d.querySelector<HTMLButtonElement>('.lightbox-zoom')!;
  zoom.setAttribute('aria-pressed', 'false');
  zoom.textContent = 'Actual size';
}

/** Opens one screenshot, or a set starting at `start`. */
export function openLightbox(
  list: LightboxItem[] | string,
  altOrStart: string | number = 0,
  caption = '',
  returnFocus?: HTMLElement,
): void {
  const d = ensure();
  if (typeof list === 'string') {
    items = [{ src: list, alt: String(altOrStart), caption }];
    index = 0;
  } else {
    items = list;
    index = typeof altOrStart === 'number' ? altOrStart : 0;
  }
  opener = returnFocus;
  show(index);
  if (!d.open) d.showModal();
  d.querySelector<HTMLButtonElement>('.lightbox-close')?.focus();
}

/**
 * Connects every [data-shot] button on the page: buttons with the same data-set open as one
 * browsable set, in page order.
 */
export function bindShots(root: ParentNode = document): void {
  const buttons = [...root.querySelectorAll<HTMLButtonElement>('[data-shot]')];
  for (const b of buttons) {
    if (b.dataset['bound']) continue;
    b.dataset['bound'] = '1';
    b.addEventListener('click', () => {
      const set = b.dataset['set'];
      const group = set ? buttons.filter((o) => o.dataset['set'] === set) : [b];
      const list = group.map((o) => ({
        src: o.dataset['full'] ?? '',
        alt: o.dataset['alt'] ?? '',
        caption: o.dataset['caption'] ?? '',
        width: Number(o.dataset['w']) || undefined,
        height: Number(o.dataset['h']) || undefined,
      }));
      openLightbox(list, group.indexOf(b), '', b);
    });
  }
}
