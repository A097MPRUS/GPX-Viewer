# Changelog

Published releases of GPX Viewer. Generated from `release/release-manifest.json`; releases in preparation are not listed.

## macOS 0.3.0 (build 4): Historical Weather, 25 October 2026

Historical weather for the time and place of a recording in both Mac editions: a Weather inspector with summaries, a timeline linked to the map and graphs, eight modelled graph lines, a local cache and clear attribution.

### New features

- Weather inspector in both Mac editions (the cloud and sun tab; also Track, Retrieve Historical Weather and View, Weather).
- Weather is matched to the recording itself: places sampled along the route about every 10 km and at height changes of 300 m, hourly values matched to each point's timestamp in UTC and blended between neighbouring places.
- Air temperature, feels-like temperature, dew point, relative humidity, precipitation, rain, snowfall, wind speed, wind direction, gusts, sea-level and surface pressure, cloud cover and the weather condition. Visibility is shown as not provided by the source.
- Weather timeline over the recording time (temperature, hourly precipitation, wind arrows), linked to the map marker, the graph cursor and the Point inspector.
- Eight modelled graph lines beside any main measurement: temperature, wind speed, gusts, headwind, precipitation, sea-level pressure, humidity and cloud cover, marked Modelled and credited in the legend.
- Summaries for the whole recording or the selected section: ranges and time-weighted averages, precipitation shared out by the time spent in each hour, prevailing wind, wind along the direction of travel and the most frequent condition.
- A temperature recorded by a sensor in the file is shown beside the modelled air temperature, never replaced.

### Improvements

- Answers are cached on the Mac (at most 20 MB): opening the Weather inspector again or working offline shows saved weather without a request; Clear weather cache deletes them.
- Clear messages for missing timestamps, recordings in the future or before 1940, no data yet for recent days, no connection, timeouts and rate limits.
- Installer read-me and welcome screens describe Historical Weather and what it sends.

### Compatibility

- Apple silicon edition: macOS 13 and later. Intel edition: built for macOS 10.13 to 12 with the same weather features; its weather code uses only APIs available on macOS 10.13.
- Historical Weather is not available in the Windows edition or in GPX Viewer Web Lite.

### Privacy and legal information

- Weather is requested only when you press Retrieve. Open-Meteo receives a few places along the route, rounded to about 1 km, and the dates of the recording; never the GPX file, exact times, names or sensor values.
- Legal notice version 6, privacy and third-party texts describe the weather source, its licence and attribution.

### Known limitations

- Weather values are model estimates for grid cells of about 9 to 25 km and whole hours, not measurements at the track.
- The most recent days can be missing or provisional until the archive is updated.
- Uses Open-Meteo's free service for non-commercial use; very heavy use can be rate limited.
- Not signed with an Apple Developer ID and not notarized.
- Tested on macOS 27 (Apple silicon; the Intel edition under Rosetta). Historical Weather has not been tested on macOS 10.13 to 12 hardware.

Weather data by Open-Meteo.com (CC BY 4.0), based on data and products of ECMWF; contains modified Copernicus Climate Change Service information.

| File | Size | SHA-256 |
| --- | --- | --- |
| [GPX Viewer 0.3.0 Apple Silicon macOS 13+.pkg](https://sourceforge.net/projects/gpx-viewer/files/macOS/0.3.0/ARM64/GPX%20Viewer%200.3.0%20Apple%20Silicon%20macOS%2013%2B.pkg/download) ([GitHub](https://github.com/A097MPRUS/GPX-Viewer/releases/download/v0.3.0/GPX.Viewer.0.3.0.Apple.Silicon.macOS.13%2B.pkg)) | 4.5 MB | `1036e9d2454673f449bb6cb66d16d0ce896a6d23236958e5f80c76f5f46b1711` |
| [GPX Viewer 0.3.0 Intel macOS 10.13-12.pkg](https://sourceforge.net/projects/gpx-viewer/files/macOS/0.3.0/X64/GPX%20Viewer%200.3.0%20Intel%20macOS%2010.13-12.pkg/download) ([GitHub](https://github.com/A097MPRUS/GPX-Viewer/releases/download/v0.3.0/GPX.Viewer.0.3.0.Intel.macOS.10.13-12.pkg)) | 6.2 MB | `70ea3288940ffacbeec8315dc607f21e4bf2201c76a03647a225af089707d312` |
| [GPX-Viewer-0.3.0-source.zip](https://sourceforge.net/projects/gpx-viewer/files/macOS/0.3.0/GPX-Viewer-0.3.0-source.zip/download) ([GitHub](https://github.com/A097MPRUS/GPX-Viewer/releases/download/v0.3.0/GPX-Viewer-0.3.0-source.zip)) | 2.8 MB | `6cce8e6570e6cc0a7830ac438baf02e1deecf4dac47f774650e81b55e41f8476` |

GitHub Release: https://github.com/A097MPRUS/GPX-Viewer/releases/tag/v0.3.0 (sign-in required while the repository is private).

## macOS 0.2.0 (build 3), 25 October 2026 (archived)

Native Installer packages replace the disk images; selectable main graph with combined and stacked layouts and time axes; commercial map services with your own key in both Mac editions.

- Choose the graph's main measurement: elevation, speed, recorded speed, slope, vertical speed, heart rate, cadence, temperature, power, GPS accuracy, barometric altitude, air pressure or device temperature.
- Combined graphs (up to three measurements on their own scales) and stacked graphs (one plot each, shared cursor and zoom).
- Distance, elapsed time or moving time as the horizontal axis.
- Microsoft Azure Maps, TomTom, HERE and Mapbox with your own key, now also in the Intel edition; live map credits for Azure Maps and HERE.
- New app icon for the Apple silicon edition.
- Native Installer packages with read-me, licence and architecture checks.
- Distinct graph switch icons with explanatory tooltips; VoiceOver reads each switch and tool by name.
- Map credits, Apple's Legal link, compass and zoom buttons no longer overlap; the tool strip scrolls on small windows.
- Intel edition: sharper commercial maps on Retina screens and lighter 256 pixel tiles on non-Retina screens.
- Map tiles: no patches of mismatched detail while tiles load.
- Terrain Tiles (elevation data) is no longer offered as a map.
- Two graph and tool icons that were missing on macOS 13 now show.

Known limitations:

- Not signed with an Apple Developer ID and not notarized: Control-click the installer and choose Open (macOS 15 and later: System Settings, Privacy and Security, Open Anyway).
- Tested on macOS 27 (Apple silicon; the Intel edition under Rosetta). Earlier macOS versions have not been tested by the author since 7 October 2026.
- Microsoft Azure Maps has not been tested with a real key.
- An older GPX Viewer Intel app installed by drag and drop stays in Applications; delete it after installing.

| File | Size | SHA-256 |
| --- | --- | --- |
| [GPX Viewer 0.2.0 Apple Silicon macOS 13+.pkg](https://sourceforge.net/projects/gpx-viewer/files/macOS/0.2.0/ARM64/GPX%20Viewer%200.2.0%20Apple%20Silicon%20macOS%2013%2B.pkg/download) ([GitHub](https://github.com/A097MPRUS/GPX-Viewer/releases/download/v0.2.0/GPX.Viewer.0.2.0.Apple.Silicon.macOS.13%2B.pkg)) | 4.4 MB | `02026cc723525aa78e775a4d77714644ba49e30c91845f9b109f93b0a4f6fa2a` |
| [GPX Viewer 0.2.0 Intel macOS 10.13-12.pkg](https://sourceforge.net/projects/gpx-viewer/files/macOS/0.2.0/X64/GPX%20Viewer%200.2.0%20Intel%20macOS%2010.13-12.pkg/download) ([GitHub](https://github.com/A097MPRUS/GPX-Viewer/releases/download/v0.2.0/GPX.Viewer.0.2.0.Intel.macOS.10.13-12.pkg)) | 6.1 MB | `5d6c7953b02d8497ff82a512cabad6a4c7162954462a1443d1c3ade0ec06aaf3` |
| [GPX-Viewer-0.2.0-source.zip](https://sourceforge.net/projects/gpx-viewer/files/macOS/0.2.0/GPX-Viewer-0.2.0-source.zip/download) ([GitHub](https://github.com/A097MPRUS/GPX-Viewer/releases/download/v0.2.0/GPX-Viewer-0.2.0-source.zip)) | 2.7 MB | `48e2c446ae813220dc67f5e516518ce2b4426ee9d782bb1cb28730759e70dd58` |

GitHub Release: https://github.com/A097MPRUS/GPX-Viewer/releases/tag/v0.2.0 (sign-in required while the repository is private).

## Windows 0.3.0, 12 October 2026

Current Windows release. Release notes for this version have not been published.

Known limitations:

- The installer is not code-signed: Microsoft Defender SmartScreen may warn about an unknown publisher. Choose More info, then Run anyway, only for a file downloaded from the GPX Viewer SourceForge project.

| File | Size | SHA-256 |
| --- | --- | --- |
| [GpxViewer-0.3.0-Setup-x64.exe](https://sourceforge.net/projects/gpx-viewer/files/Windows/0.3.0/GpxViewer-0.3.0-Setup-x64.exe/download) | 45.3 MB | `691445205bed57f0ca5578252836cbc1c686e0ed46b382f3a369ae77acab7626` |

## macOS 0.1.0, 7 October 2026 (archived)

First public macOS release, distributed as disk images. Archived; use 0.2.0 for new installations.

- Native Mac applications: an Apple silicon edition for macOS 13 to 27 and an Intel edition for macOS 10.13 to 12.
- Published under the MIT License without any Garmin FIT SDK code; GPX is the only supported file format.

Known limitations:

- Disk images, unsigned and not notarized.
- Superseded by 0.2.0.

| File | Size | SHA-256 |
| --- | --- | --- |
| [GPX Viewer 0.1.0 macOS 13-27.dmg](https://sourceforge.net/projects/gpx-viewer/files/macOS/0.1.0/ARM64/GPX%20Viewer%200.1.0%20macOS%2013-27.dmg/download) | 3.3 MB | `769b747fbea9ad2014ae244dcbabb2b6bb3be218c959ee62c8b02ec686d9c367` |
| [GPX Viewer Intel 0.1.0 macOS 10.13-12.dmg](https://sourceforge.net/projects/gpx-viewer/files/macOS/0.1.0/X64/GPX%20Viewer%20Intel%200.1.0%20macOS%2010.13-12.dmg/download) | 7.0 MB | `e1525c90ed40b203c3d64029fe47c3ed6886a3508e92b01247a5192554889bf4` |
| [GPX-Viewer-0.1.0-source.zip](https://sourceforge.net/projects/gpx-viewer/files/macOS/0.1.0/GPX-Viewer-0.1.0-source.zip/download) | 1.6 MB | `1d97c79b39b4e4469801aab2f6b7dfeb93d0a6691b73e93f75cebcb28e8c37e6` |

The files of this release are temporarily hidden on SourceForge until 27 October 2026.

## Windows 0.2.0, 7 October 2026 (archived)

First public Windows release. Superseded by 0.3.0.

Known limitations:

- Superseded by 0.3.0.

| File | Size | SHA-256 |
| --- | --- | --- |
| [GpxViewer-0.2.0-Setup-x64.exe](https://sourceforge.net/projects/gpx-viewer/files/Windows/GpxViewer-0.2.0-Setup-x64.exe/download) | 45.3 MB | `2d930642e98cd270cd4689bb52b7c7484216e5d6d2ca2d3f4a28d9c519f68df0` |
