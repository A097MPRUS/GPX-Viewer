# Features by edition

Generated from `release/features.json`. "Not verified" means the feature exists on macOS but the Windows edition has not been re-checked for it since the 2 October 2026 reference copy.

## Files and GPX data

| Feature | macOS, Apple silicon | macOS, Intel | Windows | Web Lite |
| --- | --- | --- | --- | --- |
| **Open GPX 1.0 and 1.1**<br>Tracks, track segments, routes and waypoints. Segments are never joined; files without time or elevation open normally. | Yes | Yes | Yes | Yes |
| **Several files and drag and drop**<br>Open several files at once, by dialog or by dropping them on the window. | Yes | Yes | Yes | Partly (1) |
| **GPX extensions**<br>Heart rate, cadence, power and temperature from common extensions (Garmin TrackPointExtension and similar), GPS accuracy, barometric altitude and pressure from GPX Viewer recordings. Unknown extensions are kept when saving. | Yes | Yes | Yes | Partly (2) |
| **File Info**<br>Which device and application recorded a file, sections, findings, raw XML and comparison, based on the file's own content. | Yes | Yes | Yes | No |
| **FIT files**<br>Not supported in public releases: the Garmin FIT SDK was removed for licensing reasons on 7 Oct 2026. | No | No | No | No |

## Maps

| Feature | macOS, Apple silicon | macOS, Intel | Windows | Web Lite |
| --- | --- | --- | --- | --- |
| **Apple Maps**<br>Standard, satellite and hybrid through Apple's MapKit. | Yes | Partly (3) | No | No |
| **OpenStreetMap, OpenTopoMap, CyclOSM**<br>Community maps with visible attribution. | Yes | Yes | Yes | Partly (4) |
| **Official aerial and topographic maps**<br>National and regional services from Luxembourg, Belgium, France, the Netherlands, Switzerland, Austria and Germany, with coverage masks; best satellite and hybrid mosaics prefer official imagery by country. | Yes | Yes | Yes | No |
| **Geoportail Luxembourg catalogue**<br>The full layer catalogue with dated editions, legends and the official sign-in page. | Yes | Yes | Yes | No |
| **Thunderforest and Esri with your own key**<br>Keys are entered by the user and stored securely (Keychain on Mac, DPAPI on Windows). | Yes | Yes | Yes | No |
| **Azure Maps, TomTom, HERE and Mapbox with your own key**<br>54 map styles with correct high-resolution tiles and live credits for Azure Maps and HERE. | Yes | Yes (5) | Not verified | No |
| **Overlays**<br>Cycle infrastructure, hiking, MTB and signposted cycle routes, roads and place names, with opacity per overlay. | Yes | Yes | Yes | No |

## Elevation profile and graphs

| Feature | macOS, Apple silicon | macOS, Intel | Windows | Web Lite |
| --- | --- | --- | --- | --- |
| **Elevation profile coloured by gradient**<br>Smoothed elevation over 25 m, gradient over a centred 50 m window, the same colour scale on Mac and Windows. | Yes | Yes | Yes | Yes |
| **Speed, heart rate, cadence, power and temperature**<br>Recorded and calculated values are labelled separately; missing values are gaps, never zero. | Yes | Yes | Yes | Yes |
| **Selectable main graph**<br>Fourteen measurements, including slope, vertical speed, GPS accuracy, barometric altitude and air pressure; unavailable ones are disabled with the reason. | Yes | Yes | Not verified | Partly (6) |
| **Combined and stacked graphs**<br>Up to three measurements on their own scales in one plot, or one plot each with a shared cursor and zoom. | Yes | Yes | Not verified | Partly (7) |
| **Distance, elapsed time and moving time axes**<br>Moving time follows the statistics rule; pauses over 60 s lift the pen on time axes. | Yes | Yes | Not verified | Yes |
| **Graph and map in step**<br>Hovering the graph moves a marker on the map, hovering the route moves the graph cursor; dragging selects and zooms a section. | Yes | Yes | Yes | Yes |
| **Graph zoom and pan**<br>Zoom buttons, pinch, drag to pan, double-click resets. | Yes | Yes | Not verified | Partly (8) |

## Statistics and analysis

| Feature | macOS, Apple silicon | macOS, Intel | Windows | Web Lite |
| --- | --- | --- | --- | --- |
| **Track statistics**<br>Distance, elapsed, moving and stopped time, average, moving and maximum speed, gain and loss, minimum and maximum elevation, points and segments. | Yes | Yes | Yes | Yes |
| **Elevation gain with selectable hysteresis**<br>Gain and loss count changes of at least 5, 2 or 1 m, per elevation source (recorded or official terrain). | Yes | Yes | Yes | Yes (9) |
| **Statistics for a selected section**<br>Select a section on the graph to see its own statistics. | Yes | Yes | Partly | Yes |
| **Climbs**<br>Climbs of at least 20 m and 3 % from where the route leaves the valley floor. | Yes | Yes | Yes | No |
| **Point inspection**<br>Coordinates, time, distance, elevation, grade and speed of any point, with recorded or calculated provenance; terrain, slope, aspect, land cover and address on demand. | Yes | Yes | Yes | Partly (10) |
| **Playback**<br>Replays the ride along the map at selectable speed, jumping recording gaps. | Yes | Yes | Not verified | No |
| **Metric or imperial units, 12 or 24 hour time** | Yes | Yes | Not verified | Yes |

## Terrain and route context

| Feature | macOS, Apple silicon | macOS, Intel | Windows | Web Lite |
| --- | --- | --- | --- | --- |
| **Official terrain elevation**<br>Terrain heights from Geoportail Luxembourg and IGN France, Terrain Tiles elsewhere; DTM and DSM labelled correctly. | Yes | Yes | Yes | No |
| **3D relief**<br>A local terrain model around the route. | Yes | Yes | Yes | No |
| **Surface and route context analysis**<br>Land cover per point, cycle network, OpenStreetMap ways, surfaces, bridges and tunnels. Optional; sends route coordinates to the named services. | Yes | Yes | Yes | No |
| **Cross-section and line profile** | Yes | Yes | Yes | No |

## Historical weather

| Feature | macOS, Apple silicon | macOS, Intel | Windows | Web Lite |
| --- | --- | --- | --- | --- |
| **Historical weather for a recording**<br>Retrieved on request from the Open-Meteo archive for the recording's places and dates; nothing is sent until you ask. | Yes | Yes | No | No |
| **Matched to timestamps and positions**<br>Places about every 10 km and at 300 m height changes; hourly values matched in UTC, blended between places; points without a timestamp get no weather. | Yes | Yes | No | No |
| **Temperature, wind, precipitation, humidity, pressure, cloud cover**<br>Air and feels-like temperature, dew point, wind speed, direction and gusts, precipitation, rain and snowfall, sea-level and surface pressure, cloud cover, weather condition. Visibility is not provided by the source. | Yes | Yes | No | No |
| **Weather timeline linked to map and graphs**<br>Temperature, hourly precipitation and wind over the recording time, sharing the pointer with the map and graphs. | Yes | Yes | No | No |
| **Modelled weather lines on the graph**<br>Temperature, wind, gusts, headwind, precipitation, pressure, humidity and cloud cover beside any main measurement, marked Modelled. | Yes | Yes | No | No |
| **Local weather cache and offline use**<br>Answers kept on the Mac (at most 20 MB) and shown offline; can be cleared. | Yes | Yes | No | No |

## Editing and tools

| Feature | macOS, Apple silicon | macOS, Intel | Windows | Web Lite |
| --- | --- | --- | --- | --- |
| **Route drawing with routing**<br>Draw a route freehand or along roads and paths (BRouter profiles). | Yes | Yes | Yes | No |
| **Split, merge, simplify, clean, reverse, time and elevation tools**<br>Every edit can be undone; the original file is never changed. | Yes | Yes | Yes | No |
| **Measure tool** | Yes | Yes | Not verified | No |

## Privacy

| Feature | macOS, Apple silicon | macOS, Intel | Windows | Web Lite |
| --- | --- | --- | --- | --- |
| **Files stay on your computer**<br>No account, no analytics, no advertising, no tracking. Map tiles, searches and optional analyses contact the named services only when used. | Yes | Yes | Yes | Yes (11) |

## Notes

1. Several files and drag and drop, Web Lite: One file at a time.
2. GPX extensions, Web Lite: Reads heart rate, cadence, power and temperature; does not save files.
3. Apple Maps, macOS, Intel: Apple no longer serves macOS 10.13; the app falls back to OpenStreetMap or official imagery there.
4. OpenStreetMap, OpenTopoMap, CyclOSM, Web Lite: OpenStreetMap and OpenTopoMap.
5. Azure Maps, TomTom, HERE and Mapbox with your own key, macOS, Intel: Not tested live with a key in the Intel edition.
6. Selectable main graph, Web Lite: Elevation, speed, slope, vertical speed, heart rate, cadence, power and temperature.
7. Combined and stacked graphs, Web Lite: One measurement compared with the main graph on its own scale.
8. Graph zoom and pan, Web Lite: Drag to zoom a section, double-click or Reset to show the whole route.
9. Elevation gain with selectable hysteresis, Web Lite: 5, 2 or 1 m on the recorded elevation.
10. Point inspection, Web Lite: Values from the file and calculated values; no online lookups.
11. Files stay on your computer, Web Lite: Files are read in the browser; only map tile requests leave the device.

## Sources

- macOS, Apple silicon: Source code and Setup/docs of the 0.2.0 release (25 Oct 2026).
- macOS, Intel: Source code and Setup/docs of the 0.2.0 release (25 Oct 2026).
- Windows: Windows reference source of 2 Oct 2026; Windows 0.3.0 (12 Oct 2026) has not been re-audited, so items added to the Mac in October are marked as not verified.
- Web Lite: GPX Viewer Web Lite in this website.
