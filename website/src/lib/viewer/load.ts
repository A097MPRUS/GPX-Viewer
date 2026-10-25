// Loads GPX text through the worker, or on the main thread when workers are unavailable.
// Author: A097MPRUS.
import { derive } from '../gpx/derive';
import { GpxError, LIMITS, parseGpx } from '../gpx/parse';
import type { Derived, GpxData } from '../gpx/types';

export interface Loaded {
  data: GpxData;
  derived: Derived;
}

let worker: Worker | null = null;
let nextId = 1;
const pending = new Map<number, { resolve: (v: Loaded) => void; reject: (e: Error) => void }>();

function getWorker(): Worker | null {
  if (worker) return worker;
  try {
    worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (e: MessageEvent) => {
      const msg = e.data as {
        id: number;
        ok: boolean;
        data?: GpxData;
        derived?: Derived;
        message?: string;
      };
      const p = pending.get(msg.id);
      if (!p) return;
      pending.delete(msg.id);
      if (msg.ok && msg.data && msg.derived) p.resolve({ data: msg.data, derived: msg.derived });
      else p.reject(new GpxError(msg.message ?? 'The file could not be read.'));
    };
    worker.onerror = () => {
      for (const p of pending.values()) p.reject(new GpxError('The file could not be read.'));
      pending.clear();
      worker = null;
    };
  } catch {
    worker = null;
  }
  return worker;
}

export function loadText(text: string): Promise<Loaded> {
  const w = getWorker();
  if (!w) {
    return new Promise((resolve, reject) => {
      // Let the "reading" state paint before the synchronous work.
      setTimeout(() => {
        try {
          const data = parseGpx(text);
          resolve({ data, derived: derive(data) });
        } catch (e) {
          reject(e instanceof Error ? e : new Error(String(e)));
        }
      }, 30);
    });
  }
  const id = nextId++;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    w.postMessage({ id, text });
  });
}

export async function loadFile(file: File): Promise<Loaded> {
  if (file.size > LIMITS.maxBytes)
    throw new GpxError(
      `This file is ${(file.size / 1024 / 1024).toFixed(0)} MB. Web Lite reads files up to ${LIMITS.maxBytes / 1024 / 1024} MB; the desktop application handles larger ones.`,
    );
  if (file.size === 0) throw new GpxError('The file is empty.');
  const text = await file.text();
  return loadText(text);
}

export async function loadUrl(url: string): Promise<Loaded> {
  const response = await fetch(url);
  if (!response.ok) throw new GpxError(`The sample could not be loaded (HTTP ${response.status}).`);
  return loadText(await response.text());
}
