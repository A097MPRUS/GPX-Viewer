// Colours shared with the desktop applications. Author: A097MPRUS.
// Gradient scale: Sources/GpxCore/GradeColours.swift (identical to Windows gradeColor).
// Measurement colours: Sources/GpxCore/Shared/GraphMetrics.swift.

export function gradeColor(grade: number): string {
  if (!Number.isFinite(grade)) return '#9ca3af';
  if (grade < -12) return '#1e3a8a';
  if (grade < -6) return '#3b82f6';
  if (grade < -1) return '#93c5fd';
  if (grade < 1) return '#86efac';
  if (grade < 3) return '#4ade80';
  if (grade < 6) return '#facc15';
  if (grade < 9) return '#f97316';
  if (grade < 12) return '#dc2626';
  return '#7f1d1d';
}

export const GRADE_LEGEND: { label: string; color: string }[] = [
  { label: 'below -12 %', color: '#1e3a8a' },
  { label: '-12 to -6 %', color: '#3b82f6' },
  { label: '-6 to -1 %', color: '#93c5fd' },
  { label: '-1 to 1 %', color: '#86efac' },
  { label: '1 to 3 %', color: '#4ade80' },
  { label: '3 to 6 %', color: '#facc15' },
  { label: '6 to 9 %', color: '#f97316' },
  { label: '9 to 12 %', color: '#dc2626' },
  { label: '12 % and more', color: '#7f1d1d' },
];

export const METRIC_COLORS: Record<string, string> = {
  elevation: '#16a34a',
  speed: '#2563eb',
  recspeed: '#0ea5e9',
  grade: '#b45309',
  vspeed: '#0d9488',
  hr: '#dc2626',
  cad: '#0891b2',
  temp: '#ea580c',
  power: '#7c3aed',
};
