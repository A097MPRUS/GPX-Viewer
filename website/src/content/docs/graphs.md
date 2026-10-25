---
title: 'Understanding the graphs'
description: 'The main graph, combined and stacked layouts, distance and time axes, overlay switches and graph interaction.'
section: Using GPX Viewer
order: 13
updated: '2026-10-25'
---

## Main graph

Choose the main measurement in the Main graph menu: elevation (the default, coloured by gradient), calculated speed, recorded speed, slope, vertical speed, heart rate, cadence, temperature, power, horizontal and vertical GPS accuracy, barometric altitude, air pressure or device temperature. Measurements the file lacks are disabled with the reason. A file without the chosen measurement shows elevation and keeps your choice for the next file.

Scales: speed, power, cadence and accuracy start at zero; slope and vertical speed are symmetric around zero; the other measurements use their range. Missing values are gaps, never zero.

## Layouts

- **Single:** one measurement.
- **Combined:** up to three measurements in one plot, each on its own scale.
- **Stacked:** one plot per measurement, sharing the cursor, zoom and selection.

## Horizontal axis

Distance (default), elapsed time or moving time. On time axes the line stops at pauses longer than 60 seconds. The zoomed range stays the same section of the route when you change the axis.

## Overlay switches

The switches above the graph add channels such as the GPX elevation compared with terrain, the route grade, speed, heart rate, cadence, temperature, power, land cover and infrastructure bands. Each switch explains itself in a tooltip and has an accessible name.

From version 0.3.0, after retrieving [historical weather](../historical-weather/), eight weather lines (air temperature, wind speed, gusts, headwind, precipitation, sea-level pressure, humidity and cloud cover) can be drawn beside the main measurement or chosen as the main graph. They are marked Modelled and credited to Open-Meteo in the legend.

## Interaction

- Hover to inspect a point; click to fix it.
- Drag to select a section: the graph zooms and the map fits the section; the statistics can follow the section.
- Pinch or use the zoom buttons; turn on Drag pans to move a zoomed graph.
- Double-click shows the whole route.

## Gradient colours

| Gradient           | Colour     |
| ------------------ | ---------- |
| Steeper than -12 % | dark blue  |
| -12 to -6 %        | blue       |
| -6 to -1 %         | light blue |
| -1 to 1 %          | pale green |
| 1 to 3 %           | green      |
| 3 to 6 %           | yellow     |
| 6 to 9 %           | orange     |
| 9 to 12 %          | red        |
| 12 % and more      | dark red   |

The same colours are used in the desktop applications, on Windows and in Web Lite.
