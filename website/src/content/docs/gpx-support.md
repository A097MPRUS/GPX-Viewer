---
title: 'Supported GPX features and extensions'
description: 'Which parts of GPX 1.0 and 1.1 GPX Viewer reads, which extensions it understands and what it keeps when saving.'
section: Reference
order: 20
updated: '2026-10-25'
---

## GPX elements

| Element                            | Desktop applications                        | Web Lite                            |
| ---------------------------------- | ------------------------------------------- | ----------------------------------- |
| Tracks and track segments          | Read, shown and edited; segments kept apart | Read and shown; segments kept apart |
| Routes and route points            | Read, shown and edited                      | Read and shown as dashed lines      |
| Waypoints                          | Read, shown and edited                      | Read and shown with their names     |
| Metadata (name, description, time) | Read and written                            | Read                                |
| Point time and elevation           | Read and written                            | Read                                |
| GPX 1.0 speed and course           | Read                                        | Speed read as recorded speed        |

## Extensions

- **Heart rate, cadence, temperature:** Garmin TrackPointExtension v1 and v2 (`hr`, `cad`, `atemp`) and common equivalents.
- **Power:** `power` elements, as written by many cycling applications.
- **GPX Viewer recordings (iPhone, in development):** horizontal, vertical, speed and course accuracy, barometric altitude, air pressure, ellipsoidal height and heading values, under the namespace `urn:a097mprus:gpxviewer:recording:v1`.

Unknown extensions are kept when the desktop applications save a file.

## Not supported

- FIT, TCX and KML files.
- GPX files that declare a DOCTYPE (Web Lite refuses them because such declarations can define entities).

## Robustness

Files without times, without elevation, with duplicate timestamps, with long gaps, or crossing the 180th meridian are read normally. Points with invalid coordinates are skipped and reported. A file that stops before its end shows the points read so far, with a warning.
