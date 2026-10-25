---
title: 'Platform compatibility'
description: 'Supported systems for each edition, what has been tested, and known limitations.'
section: Reference
order: 22
updated: '2026-10-25'
---

## Editions

| Edition              | Systems                                      | Architecture | Status                            |
| -------------------- | -------------------------------------------- | ------------ | --------------------------------- |
| macOS, Apple silicon | macOS 13 Ventura and later                   | arm64        | Released, 0.3.0                   |
| macOS, Intel         | macOS 10.13 High Sierra to 12 Monterey       | x86_64       | Released, 0.3.0                   |
| Windows              | Windows 10 version 1809 or later, Windows 11 | x64          | Released, 0.3.0                   |
| iPhone               | iOS                                          | arm64        | In development; no public release |
| Android              |                                              |              | No public build                   |
| Wear OS extension    |                                              |              | On hold                           |

Historical weather (from version 0.3.0) is in both macOS editions. The Windows edition and Web Lite do not have it.

## Tested

- The macOS 0.3.0 editions were tested on macOS 27; the Intel edition under Rosetta. Historical Weather has not been tested on macOS 10.13 to 12 hardware. The author has not tested macOS 13 to 26 for the Apple silicon edition, or macOS 10.14 to 12 for the Intel edition, since 7 October 2026. The 0.1.0 Intel edition was tested on a 2011 MacBook Pro with macOS 10.13.
- Later Intel systems (macOS 13 and later on Intel Macs) are not tested.

## Known limitations

- The applications are not signed with a developer certificate and not notarised.
- Microsoft Azure Maps has not been tested with a real key.
- On macOS 10.13, Apple Maps no longer serves the application, which uses OpenStreetMap or official imagery instead.
- Very large files (around 500,000 points) can use 0.9 to 1.8 GB of memory.
- New interface text on Mac is in English only.
- The Windows edition does not yet have every feature added to the Mac editions in October 2026; see Explore the project.
