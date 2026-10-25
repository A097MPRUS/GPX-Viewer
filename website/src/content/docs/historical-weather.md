---
title: 'Historical weather'
description: 'Estimated weather for the time and place of a recording: how to retrieve it, what each value means, its accuracy, the timeline and graphs, caching, offline use and privacy.'
section: Using GPX Viewer
order: 16
updated: '2026-10-25'
release: '0.3.0'
---

GPX Viewer for macOS can show the weather that a weather model estimates for the time and the places of a recording: temperature, wind, precipitation, humidity, air pressure and cloud cover. Both Mac editions have it (Apple silicon and Intel). The Windows edition and GPX Viewer Web Lite do not.

## Opening the Weather inspector

- Choose the **Weather** tab in the inspector (the cloud and sun symbol), or **View, Weather**.
- **Track, Retrieve Historical Weather** opens the tab and starts a retrieval at once.

When the tab opens, GPX Viewer only looks in its local cache. Nothing is sent until you press **Retrieve historical weather**. The button's caption tells you beforehand how many places along the route will be asked for and for which days.

## How weather is matched to a recording

1. **Places.** The route is divided into places about every 10 km (along the route or in a straight line, whichever comes first) and wherever the height changes by 300 m. A long route uses at most 40 places. Each place is rounded to 0.01 degree, about 1 km.
2. **Times.** Each track point keeps its own timestamp. The weather service answers with one value per hour per place, in UTC. GPX Viewer matches every point to those hours in UTC, so time zones and daylight-saving changes cannot shift the match; times are only converted to your Mac's time zone for display.
3. **Between hours.** Temperatures, humidity, pressure, cloud cover and wind speed are interpolated linearly between two consecutive hours that both have a value. Wind direction is interpolated as a vector (so 350° and 10° give north, not south), weighted by wind speed. The weather condition is taken from the nearest hour.
4. **Precipitation.** Precipitation, rain and snowfall are totals of the preceding hour. A point gets the total of the hour it falls in; it is never interpolated like a temperature. The total for a recording shares each hour's amount out by the time spent in that hour.
5. **Between places.** Values are blended along the route between neighbouring places, so a new grid cell does not appear as a step. Across a gap between track segments, each segment keeps its own place.
6. **Missing data.** A point without a timestamp has no weather. A missing hour stays missing; nothing is filled in from another time or place.

## What the values mean

| Value                                  | Unit                      | Notes                                                                              |
| -------------------------------------- | ------------------------- | ---------------------------------------------------------------------------------- |
| Air temperature                        | °C or °F                  | At 2 m above ground                                                                |
| Feels like                             | °C or °F                  | Apparent temperature: air temperature combined with wind, humidity and sun         |
| Dew point                              | °C or °F                  |                                                                                    |
| Relative humidity                      | %                         | At 2 m                                                                             |
| Precipitation, rain, snowfall          | mm (in), snowfall cm (in) | Totals of an hour                                                                  |
| Wind speed and gusts                   | km/h or mph               | At 10 m above ground                                                               |
| Wind direction                         | degrees and compass point | Where the wind comes from                                                          |
| Along the track                        | km/h or mph               | Wind component along your direction of travel: headwind or tailwind                |
| Pressure (sea level), surface pressure | hPa                       | Surface pressure is at the model's ground height                                   |
| Cloud cover                            | %                         | Total cloud cover                                                                  |
| Conditions                             | text                      | WMO weather code: clear, cloudy, fog, drizzle, rain, snow, showers or thunderstorm |
| Visibility                             |                           | Not provided by this archive; shown as such                                        |

The inspector sections are **Recording conditions**, **Weather timeline**, the weather at the pointer or fixed point, **Temperature**, **Wind**, **Precipitation**, **Atmospheric conditions** and **Data source and accuracy**. With a section selected on the graph, the summaries cover that section only.

## Model estimates, not measurements

Every weather value is marked **Modelled**. It is an estimate for a grid cell of about 9 km (ECMWF IFS, from 2017) to 25 km (ERA5 reanalysis) and for a whole hour, not a measurement where you were. Valleys, ridges, lakes, towns, forests and short showers can make real conditions very different.

A temperature recorded by a sensor in your file stays a separate, **Recorded** value and is shown beside the modelled air temperature. It is never replaced. Sensors on a device or a bike often read warmer in the sun or close to the body.

The most recent days can be missing or provisional until the archive is updated; retrieve again a few days later.

## Weather timeline

The timeline shows the air temperature as a line, the hourly precipitation as bars and arrows pointing where the wind blows, over the recording time. Moving along it moves the marker on the map and the cursor on the graphs, and the weather at that moment appears below it. A click fixes the point.

## Weather on the graph

Under **Show on the graph**, switch on any of eight weather lines: air temperature, wind speed, wind gusts, headwind, precipitation, sea-level pressure, relative humidity and cloud cover. They are drawn beside the main measurement on their own scale (the graph switches to the combined layout if needed), so you can compare, for example, temperature with elevation. The legend marks them **Modelled** and shows the credit "Weather data by Open-Meteo.com". The same lines can also be chosen as the main graph.

## Cache and offline use

- Every answer is stored on your Mac (at most 20 MB; the least recently used answers go first).
- Answers for recordings more than eight days old are final and kept. Answers that include the last eight days are asked again after six hours.
- Without an internet connection, saved weather is shown and marked as a saved copy. Without a saved answer, the inspector explains that weather needs a connection. Opening, analysing, editing and graphing GPX files never need one.
- **Clear weather cache** in the inspector deletes every saved answer.

## Privacy

Only when you press Retrieve, GPX Viewer sends Open-Meteo (`archive-api.open-meteo.com`) the rounded places (about 1 km) and the days of the recording in UTC. It never sends the GPX file, exact times, elevations, names, waypoints or sensor values. Open-Meteo receives the request, including your IP address as with any web request, under its own terms. See [Privacy and data](../privacy-data/).

## When retrieval fails

| Message                                         | What to do                                                                            |
| ----------------------------------------------- | ------------------------------------------------------------------------------------- |
| Needs timestamps                                | The file has no times; weather cannot be matched.                                     |
| Older than the weather archive or in the future | The archive starts in 1940 and ends today.                                            |
| No data for this time and place yet             | The last days are added with a delay; try again later.                                |
| Needs an internet connection                    | Connect and retrieve again; saved answers work offline.                               |
| Did not answer in time, or limiting requests    | Wait a few minutes; GPX Viewer spaces its requests and respects the service's limits. |
| Could not read the answer                       | Try again later; if it persists, report it in the project's tickets.                  |

## Source and attribution

Weather data by [Open-Meteo.com](https://open-meteo.com/), under the [Creative Commons Attribution 4.0](https://creativecommons.org/licenses/by/4.0/) licence. The values are based on data and products of the European Centre for Medium-Range Weather Forecasts (ECMWF) and contain modified Copernicus Climate Change Service information. Neither the European Commission nor ECMWF is responsible for any use of this information. GPX Viewer interpolates and blends the values as described above. GPX Viewer uses Open-Meteo's free service, which is offered for non-commercial use; GPX Viewer is free and has no advertising or subscriptions.
