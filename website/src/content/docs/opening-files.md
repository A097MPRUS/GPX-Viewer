---
title: 'Opening GPX files'
description: 'Open one or several GPX files, read the file list and what happens to the original file.'
section: Using GPX Viewer
order: 10
updated: '2026-10-25'
---

## Open files

- Drop one or several GPX files on the window, or use the Open button in the toolbar or the File menu.
- Each file appears in the Files list with its distance and number of points. Tracks and routes are listed under Tracks and Routes with their segments and points.
- On macOS, GPX Viewer can be chosen in Finder's Open With menu for `.gpx` files without becoming the default application.

## What is read

GPX 1.0 and 1.1 tracks, track segments, routes and waypoints, with their names, times and elevations, and common extensions such as heart rate, cadence, power and temperature. See [Supported GPX features](../gpx-support/).

Track segments are kept apart. A gap between two segments is never bridged: it adds no distance, no moving time and no slope.

## The original file

Opening a file never changes it. Edits are kept in GPX Viewer until you save, and every edit can be undone. Keep a copy of any original you care about before saving over it.

## Files that do not open

- **Not a GPX file:** GPX Viewer opens GPX only. FIT files are not supported in the public releases.
- **Damaged XML:** a file cut off during a transfer, or edited by hand, may be invalid. The application reports where.

See [Troubleshooting](../troubleshooting/).
