---
title: 'Using GPX Viewer Web Lite'
description: 'The browser viewer on this website: what it does, what it does not do, and how it handles your files.'
section: Start
order: 3
updated: '2026-10-25'
---

GPX Viewer Web Lite runs in your browser. It is a lighter companion to the desktop applications, not a port of them.

## What it does

- Opens one GPX 1.0 or 1.1 file at a time: tracks with their segments, routes and waypoints. Drop the file on the page or choose it; on iPhone and Android, choose it from Files or Downloads.
- Shows the file on OpenStreetMap or OpenTopoMap, or without a map. Start, end and waypoints are marked; hovering or tapping the track moves the graph cursor.
- Draws a graph of elevation (coloured by gradient), calculated or recorded speed, slope, vertical speed, heart rate, cadence, power or temperature, against distance, elapsed time or moving time, with a second measurement on its own scale.
- Calculates statistics for the whole file or for a section dragged on the graph, with a gain threshold of 5, 2 or 1 m.
- Replays the file along its recorded timestamps, with pause, seeking, speed and an option for the map to follow.

## What it does not do

No editing, saving, route drawing, official imagery, terrain or 3D, route analysis, File Info, recording or keyed map services. Use the desktop application for those.

Historical weather is not part of Web Lite. Retrieving it from a web page would send the places of your track from this website to a weather service and share that service's free quota among every visitor; it is therefore a feature of the macOS application (from version 0.3.0), where it runs only when you ask. See [Historical weather](../historical-weather/).

## Your file

The file is read and analysed in your browser and never uploaded. Only map images for the visible area are downloaded from the map servers. See [Privacy and data handling](../privacy-data/).

## Limits

Web Lite reads files up to 200 MB and 3 million points. Very large tracks are thinned for drawing on the map only; statistics and graphs use every point.

## Keyboard

- `o` opens a file.
- On the graph: Left and Right arrows move the cursor, with Shift for larger steps; Home and End go to the ends; Escape shows the whole file.
