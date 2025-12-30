const FALLBACK = "—";

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return FALLBACK;
  }
  if (Math.abs(value) >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return value.toLocaleString();
}

export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return FALLBACK;
  }
  return `${(value * 100).toFixed(1)}%`;
}

export function formatDuration(
  value: number | null | undefined,
  treatAsMinutes = false,
): string {
  if (value === null || value === undefined || value <= 0) {
    return FALLBACK;
  }
  if (treatAsMinutes) {
    if (value < 60) {
      return `${value.toFixed(1)} min`;
    }
    const hours = value / 60;
    return `${hours.toFixed(1)} hr`;
  }
  if (value < 1) {
    return `${(value * 24).toFixed(1)} hr`;
  }
  if (value < 7) {
    return `${value.toFixed(1)} d`;
  }
  const weeks = value / 7;
  return `${weeks.toFixed(1)} wk`;
}
