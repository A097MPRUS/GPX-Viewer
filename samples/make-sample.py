#!/usr/bin/env python3
"""Builds the synthetic sample recording shipped with GPX Viewer Web Lite.

Author: A097MPRUS.

Input: samples/source/brouter-mullerthal-loop.gpx, one route computed by the public BRouter
server (trekking profile) between public places in the Mullerthal region of Luxembourg.
Its geometry is derived from OpenStreetMap data (c) OpenStreetMap contributors, ODbL 1.0;
its heights come from SRTM through BRouter.

Everything else is synthetic and deterministic (fixed random seed): timestamps from a simple
speed model, a four minute stop, a 90 second recording gap that starts a second track segment,
elevation noise, heart rate, cadence, power and air temperature. Nobody rode this route; no
personal recording is involved.

Usage: python3 -I samples/make-sample.py  (writes public/samples/gpx-viewer-sample-mullerthal.gpx)
"""
import math
import random
import re
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "samples" / "source" / "brouter-mullerthal-loop.gpx"
OUTPUT = ROOT / "public" / "samples" / "gpx-viewer-sample-mullerthal.gpx"

R = 6_371_008.8
rng = random.Random(20261025)


def haversine(a, b):
    p1, p2 = math.radians(a[0]), math.radians(b[0])
    dp, dl = p2 - p1, math.radians(b[1] - a[1])
    h = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * R * math.atan2(math.sqrt(h), math.sqrt(max(0.0, 1 - h)))


def read_route():
    text = SOURCE.read_text(encoding="utf-8")
    pts = []
    for m in re.finditer(r'<trkpt lon="([-\d.]+)" lat="([-\d.]+)"><ele>([-\d.]+)</ele>', text):
        pts.append((float(m.group(2)), float(m.group(1)), float(m.group(3))))
    return pts


def cumulative(pts):
    d = [0.0]
    for i in range(1, len(pts)):
        d.append(d[-1] + haversine(pts[i - 1], pts[i]))
    return d


def at(pts, dist, s):
    """Position and height at distance s along the route (linear interpolation)."""
    lo, hi = 0, len(dist) - 1
    while hi - lo > 1:
        mid = (lo + hi) // 2
        if dist[mid] <= s:
            lo = mid
        else:
            hi = mid
    span = dist[hi] - dist[lo]
    t = 0.0 if span <= 0 else (s - dist[lo]) / span
    a, b = pts[lo], pts[hi]
    return (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t)


def grade_at(pts, dist, s, half=60.0):
    s0, s1 = max(0.0, s - half), min(dist[-1], s + half)
    if s1 - s0 < 10:
        return 0.0
    return (at(pts, dist, s1)[2] - at(pts, dist, s0)[2]) / (s1 - s0)


def main():
    pts = read_route()
    dist = cumulative(pts)
    total = dist[-1]
    start = datetime(2026, 9, 12, 7, 45, 0, tzinfo=timezone.utc)
    stop_at, stop_len = 9_000.0, 240
    gap_at, gap_len, gap_skip = 16_200.0, 90, 420.0

    segments = [[]]
    t, s, step = 0.0, 0.0, 2.0
    hr, temp, noise = 104.0, 13.6, 0.0
    stopped = gap_done = False
    stop_point = None
    while s <= total:
        g = grade_at(pts, dist, s)
        v = max(2.3, min(12.5, 6.4 - g * 42 + rng.gauss(0, 0.25)))
        if not stopped and s >= stop_at:
            # Four minutes standing still: positions jitter by a metre, speed is nil.
            stopped = True
            lat, lon, ele = at(pts, dist, s)
            stop_point = (lat, lon, ele)
            for k in range(int(stop_len / step)):
                t += step
                hr += (92 - hr) * 0.05
                jitter = (lat + rng.gauss(0, 0.000006), lon + rng.gauss(0, 0.000009))
                segments[-1].append((jitter[0], jitter[1], ele + rng.gauss(0, 0.4), t, hr, 0, 0, temp))
            continue
        if not gap_done and s >= gap_at:
            # Recording gap: no fixes for 90 s, the track resumes 420 m further in a new segment.
            gap_done = True
            t += gap_len
            s += gap_skip
            segments.append([])
            continue
        lat, lon, ele = at(pts, dist, s)
        noise = noise * 0.9 + rng.gauss(0, 0.06)
        coasting = g < -0.035
        target = 112 + max(-8.0, min(55.0, g * 900)) + (v - 6) * 1.5
        hr += (target - hr) * 0.06 + rng.gauss(0, 0.6)
        hr = max(88.0, min(178.0, hr))
        cad = 0 if coasting else int(round(max(55, min(102, 82 + g * 120 + rng.gauss(0, 3)))))
        power = 85 * 9.81 * v * (g + 0.005) + 0.5 * 0.4 * 1.2 * v ** 3
        power = 0 if coasting or power < 0 else int(round(power / 0.97 + rng.gauss(0, 12)))
        temp = 13.6 + 4.2 * (t / 6000) + rng.gauss(0, 0.08)
        segments[-1].append((lat, lon, ele + noise, t, hr, cad, max(0, power), temp))
        s += v * step
        t += step

    def iso(sec):
        return (start + timedelta(seconds=sec)).strftime("%Y-%m-%dT%H:%M:%SZ")

    out = []
    out.append('<?xml version="1.0" encoding="UTF-8"?>')
    out.append(
        '<gpx version="1.1" creator="GPX Viewer sample generator (synthetic)"'
        ' xmlns="http://www.topografix.com/GPX/1/1"'
        ' xmlns:gpxtpx="http://www.garmin.com/xmlschemas/TrackPointExtension/v1"'
        ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"'
        ' xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">'
    )
    out.append("  <metadata>")
    out.append("    <name>Mullerthal loop (synthetic sample)</name>")
    out.append(
        "    <desc>Synthetic sample for GPX Viewer. Route geometry derived from OpenStreetMap data"
        " (c) OpenStreetMap contributors, ODbL 1.0, computed with BRouter; heights from SRTM."
        " Timestamps, stop, recording gap, heart rate, cadence, power and temperature are"
        " generated and do not describe a real activity.</desc>"
    )
    out.append('    <copyright author="OpenStreetMap contributors"><license>https://opendatacommons.org/licenses/odbl/1-0/</license></copyright>')
    out.append(f"    <time>{iso(0)}</time>")
    out.append("  </metadata>")
    first, last = segments[0][0], segments[-1][-1]
    stop = stop_point
    for name, p, sym in (("Start (synthetic)", first, "Flag, Green"), ("Four minute stop", stop, "Rest Area"), ("Finish", last, "Flag, Red")):
        out.append(f'  <wpt lat="{p[0]:.7f}" lon="{p[1]:.7f}"><ele>{p[2]:.1f}</ele><name>{name}</name><sym>{sym}</sym></wpt>')
    out.append("  <trk>")
    out.append("    <name>Mullerthal loop (synthetic sample)</name>")
    out.append("    <type>cycling</type>")
    for seg in segments:
        out.append("    <trkseg>")
        for lat, lon, ele, sec, hr, cad, power, temp in seg:
            out.append(
                f'      <trkpt lat="{lat:.7f}" lon="{lon:.7f}"><ele>{ele:.1f}</ele><time>{iso(sec)}</time>'
                f"<extensions><power>{power}</power><gpxtpx:TrackPointExtension><gpxtpx:atemp>{temp:.1f}</gpxtpx:atemp>"
                f"<gpxtpx:hr>{int(round(hr))}</gpxtpx:hr><gpxtpx:cad>{cad}</gpxtpx:cad></gpxtpx:TrackPointExtension></extensions></trkpt>"
            )
        out.append("    </trkseg>")
    out.append("  </trk>")
    out.append("</gpx>")
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text("\n".join(out) + "\n", encoding="utf-8")
    n = sum(len(x) for x in segments)
    print(f"{OUTPUT.relative_to(ROOT)}: {n} points, {len(segments)} segments, route {total / 1000:.2f} km")


if __name__ == "__main__":
    main()
