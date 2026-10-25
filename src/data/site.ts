// Typed access to the public metadata synced from Setup/public. Author: A097MPRUS.
import manifestJson from './release-manifest.json';
import featuresJson from './features.json';
import screenshotsJson from './screenshots.json';

export type PlatformStatus = 'released' | 'in-development' | 'not-released' | 'on-hold';
export type FeatureStatus = 'yes' | 'partial' | 'no' | 'unverified';

export interface Asset {
  id: string;
  platform: string;
  kind: string;
  format: string;
  file: string;
  path: string;
  url: string;
  size: number;
  sha256: string;
  minimumOS: string | null;
  maximumOS: string | null;
  signed: boolean;
  notarized: boolean;
}

export interface Release {
  id: string;
  family: string;
  version: string;
  build: string | null;
  date: string;
  status: 'current' | 'archived';
  folder: string;
  checksums: string | null;
  notes: string | null;
  summary: string;
  hiddenUntil: string | null;
  assets: Asset[];
  changes: string[];
  limitations: string[];
}

export interface Platform {
  id: string;
  family: string;
  name: string;
  status: PlatformStatus;
  current: string | null;
  architecture: string | null;
  requirements: string | null;
  testedOn: string | null;
  note: string;
}

export interface Feature {
  id: string;
  title: string;
  detail: string;
  status: Record<string, FeatureStatus>;
  note?: Record<string, string>;
}

export interface Screenshot {
  file: string;
  group: string;
  edition: string;
  caption: string;
  alt: string;
  status: 'available' | 'requested';
  hero?: boolean;
}

export const manifest = manifestJson as unknown as {
  updated: string;
  product: {
    name: string;
    author: string;
    license: string;
    legalNoticeVersion: number;
    legalNoticeDate: string;
    sourceforge: string;
    sourceforgeFiles: string;
    tickets: string;
  };
  platforms: Platform[];
  releases: Release[];
};

export const features = featuresJson as unknown as {
  editions: { id: string; name: string; short: string }[];
  statusLegend: Record<FeatureStatus, string>;
  sources: Record<string, string>;
  categories: { id: string; title: string; features: Feature[] }[];
};

export const screenshots = screenshotsJson as unknown as {
  groups: { id: string; title: string }[];
  items: Screenshot[];
};

export const product = manifest.product;

/** Current release of a family ("macos", "windows"). */
export function currentRelease(family: string): Release | undefined {
  return manifest.releases.find((r) => r.family === family && r.status === 'current');
}

export const archivedReleases = manifest.releases.filter((r) => r.status === 'archived');
export const platform = (id: string) => manifest.platforms.find((p) => p.id === id);

/** True while SourceForge keeps a release staged (hidden); computed at build time. */
export function temporarilyHidden(release: Release, now = Date.now()): boolean {
  return release.hiddenUntil !== null && Date.parse(release.hiddenUntil) > now;
}

/**
 * GitHub links. The owner is never hard-coded: the deployment workflow passes the
 * authenticated repository owner in PUBLIC_GITHUB_OWNER. Without it (local preview) the links
 * are omitted rather than pointing to a placeholder account.
 */
const owner = (import.meta.env.PUBLIC_GITHUB_OWNER as string | undefined)?.trim() || null;
export const github = {
  owner,
  project: owner ? `https://github.com/${owner}/GPX-Viewer` : null,
  website: owner ? `https://github.com/${owner}/GPX-Viewer-Website` : null,
};

/** Joins a site path to the configured base (GitHub Pages serves projects under /<repo>/). */
export function url(path = ''): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const clean = path.replace(/^\//, '');
  return `${base}/${clean}`;
}

export function megabytes(bytes: number): string {
  // Decimal megabytes, as SourceForge shows them.
  return `${(bytes / 1e6).toFixed(1)} MB`;
}

export function longDate(iso: string): string {
  const d = new Date(`${iso}T12:00:00Z`);
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export const nav = [
  { href: 'explore/', label: 'Explore' },
  { href: 'viewer/', label: 'Web Lite' },
  { href: 'downloads/', label: 'Downloads' },
  { href: 'docs/', label: 'Documentation' },
  { href: 'changelog/', label: 'Changelog' },
];
