---
title: 'Privacy and data handling'
description: 'What stays on your device and what is sent to map and data services, in the applications and in Web Lite.'
section: Project
order: 31
updated: '2026-10-25'
---

## Applications

- Your files stay on your computer. Opening a file never changes it.
- No account, no analytics, no advertising, no tracking.
- Online services receive data only when you use them: map images for the visible area; place searches and addresses (Geoportail Luxembourg or Apple Maps); the route's coordinates when you ask for official terrain (Geoportail Luxembourg, IGN, or terrain tiles hosted on AWS), route analysis (Geoportail Luxembourg and the OpenStreetMap Overpass service) or route planning (BRouter); and, with your own key, the commercial map services you choose.
- API keys are stored in the macOS Keychain (DPAPI on Windows) and sent only to their provider. The applications never use your current location.

## Web Lite

- The GPX file is read and analysed in your browser and never uploaded.
- Map images for the visible area come from OpenStreetMap or OpenTopoMap, which see your IP address and the area shown, but not your file. Choose No basemap to make no map requests.
- Settings are stored in your browser only. The website has no analytics, cookies or third-party scripts.
