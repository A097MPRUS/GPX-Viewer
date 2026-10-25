---
title: 'Troubleshooting'
description: 'Installation warnings, maps that do not load, files that do not open, and Web Lite problems.'
section: Reference
order: 23
updated: '2026-10-25'
---

## macOS refuses to open the installer

The packages are not notarised. Control-click the package and choose Open. On macOS 15 and later, open System Settings, Privacy and Security, and choose Open Anyway. Install only packages whose SHA-256 matches the Downloads page.

## The Intel package refuses to install

The Intel package is for Intel Macs only. On a Mac with Apple silicon, install the Apple silicon package.

## Windows warns about an unknown publisher

The installer is not code-signed. Choose More info, then Run anyway, only for a file downloaded from the GPX Viewer website or SourceForge project.

## A map stays empty

- Check the internet connection; maps are downloaded as you look at them.
- A map that needs a key shows a message when the key is refused (HTTP 401 or 403) or its limit is reached (HTTP 429). Check the key under Map Providers.
- On macOS 10.13, Apple Maps is not available; choose another map.
- Official services are sometimes down for maintenance; choose another map meanwhile.

## Historical weather does not appear

- Weather needs timestamps in the file; a planned route without times has none.
- The archive covers 1940 to today; the last few days can be missing until the archive is updated.
- Without an internet connection only weather saved earlier is shown.
- If the service is limiting requests, wait a few minutes. Details: [Historical weather](../historical-weather/).

## A file does not open

- GPX Viewer opens GPX files only (not FIT, TCX or KML).
- A damaged file (for example cut off during a download) may not be valid XML. Web Lite shows the line where the problem was found and keeps the points read before the end of a truncated file.

## Web Lite

- **Map tiles do not load:** the graphs and statistics still work. Try the other map in Settings, or No basemap.
- **The file is too large:** Web Lite reads up to 200 MB and 3 million points. Use the desktop application for larger files.
- **iPhone or Android:** use Open GPX file and choose the file in Files or Downloads.

## Reporting a problem

Open a ticket on the SourceForge project. Do not attach private recordings; a short synthetic file that shows the problem is enough.
