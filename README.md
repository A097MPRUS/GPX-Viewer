# GPX Viewer website

Source of the GPX Viewer website and of **GPX Viewer Web Lite**, the browser viewer it contains. The application itself, its downloads and its release notes are described in the GPX-Viewer repository of the same GitHub account and on [SourceForge](https://sourceforge.net/projects/gpx-viewer/).

Author: A097MPRUS. MIT License.

## What is here

| Path                 | Content                                                                                                                 |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `src/pages/`         | Home, Explore, Web Lite, Downloads, Documentation, Changelog, Privacy, Legal notice                                     |
| `src/content/docs/`  | Documentation articles (Markdown)                                                                                       |
| `src/content/legal/` | Legal notice, application privacy statement, third-party list and licence, synced from the application project          |
| `src/data/`          | `release-manifest.json`, `features.json`, `screenshots.json`, synced from the application project; `site.ts` reads them |
| `src/assets/`        | Application icon and screenshots (optimised at build time)                                                              |
| `src/lib/gpx/`       | GPX parser, geodesic distance, derived series and statistics (no dependencies, runs in a worker)                        |
| `src/lib/viewer/`    | Web Lite: worker, Leaflet map, canvas graph, controller, homepage preview                                               |
| `public/samples/`    | Synthetic sample GPX (see `samples/make-sample.py`)                                                                     |
| `tests/`             | Unit tests and GPX fixtures                                                                                             |
| `scripts/`           | Metadata validation, built-site checks, icon generation                                                                 |

## Requirements

Node.js 22.23.4 or later (24 recommended, see `.nvmrc`) and npm.

## Commands

```
npm ci                 # install exactly the locked dependencies
npm run dev            # local preview at http://localhost:4321
npm run verify         # everything CI runs: metadata, format, lint, types, tests, build, built-site checks
npm run build          # static site in dist/
npm run icons          # favicons and preview image from src/assets/icon-1024.png
```

Build variables:

| Variable              | Purpose                                                                                | Default                 |
| --------------------- | -------------------------------------------------------------------------------------- | ----------------------- |
| `SITE_URL`            | Public origin, for canonical links                                                     | `http://localhost:4321` |
| `SITE_BASE`           | Path the site is served under (GitHub Pages project sites use `/<repository>/`)        | `/`                     |
| `PUBLIC_GITHUB_OWNER` | GitHub account for repository links; links are omitted when unset                      | unset                   |
| `PUBLIC_SITE_STAGE`   | `public` only for the approved public build; anything else is a preview with `noindex` | preview                 |

## Content and metadata

Do not edit `src/data/*.json`, `src/content/legal/*`, `src/assets/icon-*.png` or `src/assets/screenshots/` here. Their source of truth is `Setup/public/` and `release/` in the application project; copy them with `Setup/scripts/sync-public-site.sh`. `npm run validate:data` rejects inconsistent releases, download links that are not SourceForge download links, malformed checksums, download buttons for unreleased platforms and screenshots marked available without a file.

## Web Lite

- GPX files are read with the File API and parsed in a Web Worker by a small tokenizer (`src/lib/gpx/xml.ts`) that refuses DOCTYPE declarations, so no entity can be defined or expanded. Text from the file is only ever inserted with `textContent`; ESLint forbids `innerHTML`.
- Nothing about a file leaves the browser. Only map images are requested from OpenStreetMap or OpenTopoMap; `scripts/check-dist.mjs` fails the build if any other host, analytics service or network API appears.
- Calculations follow the desktop application (see `src/lib/gpx/derive.ts` and `stats.ts`); distance is measured on the WGS 84 ellipsoid.

## Deployment

- **Private preview:** Cloudflare Pages builds this repository and serves it behind Cloudflare Access, so only the owner can open it. Build command `npm ci && npm run build:preview`, output `dist`, environment `NODE_VERSION=24.19.0` and `PUBLIC_GITHUB_OWNER`. `public/_headers` adds security headers and `X-Robots-Tag: noindex`.
- **Public site:** `.github/workflows/pages.yml` publishes to GitHub Pages only when the repository variable `PUBLIC_LAUNCH` is `approved`. On a free GitHub plan, Pages also needs this repository to be public. Both steps happen only after the owner approves the launch.

## Licences

Code: MIT (`LICENSE`). Fonts: IBM Plex Sans and IBM Plex Mono, SIL Open Font License 1.1 (through Fontsource). Map library: Leaflet, BSD 2-Clause. Map images: OpenStreetMap and OpenTopoMap, under their terms. The sample route is derived from OpenStreetMap data (ODbL 1.0).
