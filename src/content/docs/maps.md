---
title: 'Map sources and attribution'
description: 'Who owns the maps GPX Viewer shows, which need your own key, and the rules GPX Viewer follows.'
section: Reference
order: 21
updated: '2026-10-25'
---

GPX Viewer does not own, host or sell any map. When you look at a map, your computer requests the images for the visible area from the map's owner, under that owner's terms. Every map shows its owner's credit; keep the credits when you share screenshots.

## Without a key

- **Apple Maps** (Mac only): standard, satellite and hybrid, through Apple's MapKit.
- **OpenStreetMap, OpenTopoMap, CyclOSM** and overlays from Waymarked Trails and CyclOSM.
- **Official national services:** Geoportail Luxembourg (with dated editions, a full layer catalogue and the official sign-in page), Wallonia, Flanders and Brussels aerial imagery and NGI maps (Belgium), IGN (France), PDOK (Netherlands), swisstopo and SwitzerlandMobility (Switzerland), basemap.at (Austria), basemap.de and state aerial imagery (Germany), and EOX Sentinel-2 cloudless 2016.

## With your own key

Thunderforest and Esri; on Mac also Microsoft Azure Maps, TomTom, HERE and Mapbox. You create the key under your own account and accept that provider's terms; usage limits and charges are yours. Keys are stored in the macOS Keychain or, on Windows, protected with DPAPI, and are sent only to their provider.

## Rules GPX Viewer follows

- Credits are always visible on the map.
- Only the images needed for what you are looking at are requested; there is no bulk download or offline prefetching.
- Caching follows each provider's terms: some maps are never stored on disk.

## Web Lite

Web Lite uses only OpenStreetMap (OpenStreetMap Foundation tile usage policy) and OpenTopoMap (CC BY-SA), with their credits on the map. You can also turn the map off.

The full list of providers, owners and licences is in the Legal notice.
