# Installing GPX Viewer

Author: A097MPRUS. Current versions and checksums: [README.md](../README.md#downloads).

## Choose the edition

| Your computer | Edition |
| --- | --- |
| Mac with Apple silicon (M1 or later), macOS 13 or later | Apple silicon package |
| Intel Mac, macOS 10.13 to 12 | Intel package |
| Windows 10 (1809 or later) or Windows 11, 64-bit | Windows installer |

On a Mac, the Apple menu, About This Mac shows "Apple M..." for Apple silicon or "Intel".

## macOS

1. Download the package for your Mac.
2. Verify it (below).
3. Open the package. If macOS refuses to open it, Control-click it and choose Open. On macOS 15 and later, open System Settings, Privacy and Security, and choose Open Anyway.
4. Follow the installer: it shows the read-me and the licence and installs `GPX Viewer.app` in Applications, upgrading an earlier version in place. It runs no scripts and installs no background agents.

The Intel package refuses Apple silicon Macs. An older "GPX Viewer Intel" app copied by drag and drop stays in Applications; delete it after installing.

## Windows

1. Download `GpxViewer-<version>-Setup-x64.exe` and verify it (below).
2. Run it. The installer is not code-signed, so Microsoft Defender SmartScreen may warn about an unknown publisher: choose More info, then Run anyway, only for a file from the GPX Viewer SourceForge project.

## Verify a download

macOS (Terminal):

```
shasum -a 256 ~/Downloads/"GPX Viewer 0.2.0 Apple Silicon macOS 13+.pkg"
```

Windows (PowerShell):

```
Get-FileHash $env:USERPROFILE\Downloads\GpxViewer-0.3.0-Setup-x64.exe -Algorithm SHA256
```

The printed value must equal the SHA-256 in the README. SourceForge also lists SHA-256, SHA-1 and MD5 for every file.
