---
title: 'Understanding track metrics'
description: 'How distance, speed, moving time, elevation gain and gradient are calculated, and why values can differ between applications.'
section: Using GPX Viewer
order: 12
updated: '2026-10-25'
---

GPX Viewer calculates values from the positions and times in the file. It never invents measurements: a value the file does not contain stays empty.

## Distance

The sum of the distances between consecutive points within each segment. A gap between segments adds nothing.

- The desktop applications measure each step on a sphere with the mean Earth radius (6,371,008.8 m).
- Web Lite measures each step on the WGS 84 ellipsoid (Vincenty's formula).

The two methods differ by up to about 0.5 % depending on latitude and direction.

## Time

- **Elapsed time:** from the earliest to the latest timestamp.
- **Moving time:** the sum of the steps, within one segment, that last more than 0 and at most 300 seconds and cover at least 0.5 m/s.
- **Stopped time:** elapsed time minus moving time.

## Speed

- **Calculated speed:** the distance covered within about 5 seconds on each side of a point, divided by the time between them. It is never calculated across a recording gap, a segment break or a timestamp that goes backwards, and not over windows of 120 seconds or more.
- **Recorded speed:** the speed written by the device, shown separately when present.
- **Average speed** is distance over elapsed time; **moving average** is moving distance over moving time; **maximum speed** is the highest calculated speed.

## Elevation gain and loss

Recorded elevation rises and falls by small amounts because of measurement noise. GPX Viewer counts a climb or descent only once the elevation has changed by at least the gain threshold from the last counted level: 5 m by default, or 2 m or 1 m. The level restarts in every segment. A lower threshold counts more of the noise, so it usually gives a higher gain.

The desktop applications can also use official terrain heights instead of the recorded elevation; each source keeps its own gain.

## Gradient and vertical speed

- **Gradient:** the elevation, smoothed over 25 m on each side, compared over a centred 50 m window. It is not calculated where less than 40 % of the window is available.
- **Vertical speed:** the change of smoothed elevation over 30 seconds, in metres or feet per minute, within each segment.

## Climbs

The desktop applications list climbs of at least 20 m at 3 % or more, starting where the route leaves the valley floor.

## Recorded and calculated

Point details and graph tooltips label every value as recorded (from the file) or calculated (by GPX Viewer).
