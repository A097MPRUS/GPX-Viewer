// Full-size screenshot viewer built on the native <dialog> element. Author: A097MPRUS.
let dialog: HTMLDialogElement | null = null;

function ensure(): HTMLDialogElement {
  if (dialog) return dialog;
  const d = document.createElement('dialog');
  d.className = 'lightbox';
  d.setAttribute('aria-label', 'Screenshot');
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'btn lightbox-close';
  close.textContent = 'Close';
  close.addEventListener('click', () => d.close());
  const img = document.createElement('img');
  img.decoding = 'async';
  const caption = document.createElement('p');
  caption.className = 'lightbox-caption';
  d.append(close, img, caption);
  d.addEventListener('click', (e) => {
    if (e.target === d) d.close();
  });
  document.body.append(d);
  dialog = d;
  return d;
}

export function openLightbox(
  src: string,
  alt: string,
  caption: string,
  returnFocus?: HTMLElement,
): void {
  const d = ensure();
  const img = d.querySelector('img');
  const text = d.querySelector('.lightbox-caption');
  if (img) {
    img.src = src;
    img.alt = alt;
  }
  if (text) text.textContent = caption;
  d.addEventListener('close', () => returnFocus?.focus(), { once: true });
  d.showModal();
}
