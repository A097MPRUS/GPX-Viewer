---
title: 'Installing GPX Viewer'
description: 'Install the macOS packages or the Windows installer, confirm the first launch and verify checksums.'
section: Start
order: 2
updated: '2026-10-25'
---

All downloads are hosted on SourceForge and listed, with SHA-256 checksums, on the Downloads page.

## macOS

GPX Viewer 0.2.0 comes as two native Installer packages:

- **Apple silicon:** `GPX Viewer 0.2.0 Apple Silicon macOS 13+.pkg`, for macOS 13 Ventura and later.
- **Intel:** `GPX Viewer 0.2.0 Intel macOS 10.13-12.pkg`, for macOS 10.13 High Sierra to 12 Monterey. The package refuses Apple silicon Macs, which should use the Apple silicon edition.

Both install `GPX Viewer.app` in the Applications folder and upgrade an earlier version in place. They contain no scripts, background agents or helpers.

The packages are not signed with an Apple Developer ID and not notarised. The first time:

1. Open the downloaded package. If macOS refuses to open it, Control-click it and choose Open.
2. On macOS 15 and later, open System Settings, Privacy and Security, and choose Open Anyway.
3. Follow the installer. It shows a read-me and the licence before installing.

An older "GPX Viewer Intel" app copied by drag and drop stays in Applications; delete it after installing 0.2.0.

## Windows

Run `GpxViewer-0.3.0-Setup-x64.exe` (Windows 10 version 1809 or later, or Windows 11, 64-bit). The installer is not code-signed, so Microsoft Defender SmartScreen may warn about an unknown publisher: choose More info, then Run anyway, only for a file from the GPX Viewer website or SourceForge project.

## Verify a download

On macOS, in Terminal:

```
shasum -a 256 ~/Downloads/"GPX Viewer 0.2.0 Apple Silicon macOS 13+.pkg"
```

On Windows, in PowerShell:

```
Get-FileHash $env:USERPROFILE\Downloads\GpxViewer-0.3.0-Setup-x64.exe -Algorithm SHA256
```

The result must equal the SHA-256 shown on the Downloads page.
