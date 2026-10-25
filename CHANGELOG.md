# Changelog

Published releases of GPX Viewer. Generated from `release/release-manifest.json`; releases in preparation are not listed.

## macOS 0.2.0 (build 3), 25 October 2026

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
| [GPX Viewer 0.2.0 Apple Silicon macOS 13+.pkg](https://sourceforge.net/projects/gpx-viewer/files/macOS/0.2.0/ARM64/GPX%20Viewer%200.2.0%20Apple%20Silicon%20macOS%2013%2B.pkg/download) | 4.4 MB | `02026cc723525aa78e775a4d77714644ba49e30c91845f9b109f93b0a4f6fa2a` |
| [GPX Viewer 0.2.0 Intel macOS 10.13-12.pkg](https://sourceforge.net/projects/gpx-viewer/files/macOS/0.2.0/X64/GPX%20Viewer%200.2.0%20Intel%20macOS%2010.13-12.pkg/download) | 6.1 MB | `5d6c7953b02d8497ff82a512cabad6a4c7162954462a1443d1c3ade0ec06aaf3` |
| [GPX-Viewer-0.2.0-source.zip](https://sourceforge.net/projects/gpx-viewer/files/macOS/0.2.0/GPX-Viewer-0.2.0-source.zip/download) | 2.7 MB | `48e2c446ae813220dc67f5e516518ce2b4426ee9d782bb1cb28730759e70dd58` |

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
