export function formatLargeNumber(value: number): string {
  const thresholds: [number, string][] = [
    [1_000_000_000, 'B'],
    [1_000_000, 'M'],
    [1_000, 'K'],
  ];

  for (const [threshold, suffix] of thresholds) {
    if (Math.abs(value) >= threshold) {
      return `${(value / threshold).toFixed(1)}${suffix}`;
    }
  }
  return value.toFixed(0);
}

export function formatDuration(seconds: number): string {
  if (seconds <= 0) {
    return '—';
  }

  const minutes = seconds / 60;
  if (minutes < 60) {
    return `${minutes.toFixed(1)}m`;
  }

  const hours = minutes / 60;
  return `${hours.toFixed(1)}h`;
}

export function formatDays(value: number | null): string {
  if (value === null || value <= 0) {
    return '—';
  }

  if (value < 7) {
    return `${value.toFixed(1)}d`;
  }

  const weeks = value / 7;
  return `${weeks.toFixed(1)}w`;
}
