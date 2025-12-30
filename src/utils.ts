export function toInt(value: any): number {
  try {
    const num = parseInt(value, 10);
    return isNaN(num) ? 0 : num;
  } catch {
    return 0;
  }
}

export function parseDateTime(value: string | null | undefined): Date | null {
  if (!value) {
    return null;
  }
  try {
    // Handle ISO 8601 format with Z suffix
    const dateStr = value.endsWith('Z') ? value : value + 'Z';
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

export function parseDurationSeconds(duration: string | null | undefined): number {
  if (!duration || !duration.startsWith('P')) {
    return 0.0;
  }

  let totalSeconds = 0;
  let days = 0;

  // Split into date and time parts
  const parts = duration.split('T');
  const datePart = parts[0];
  const timePart = parts[1] || '';

  // Parse days from date part (e.g., "P1D" or "P")
  if (datePart.length > 1) {
    const dayMatch = datePart.match(/(\d+)D/);
    if (dayMatch) {
      days = parseInt(dayMatch[1], 10);
    }
  }
  totalSeconds += days * 86400;

  // Parse time part (e.g., "1H30M15S")
  const units: Record<string, number> = { H: 3600, M: 60, S: 1 };
  let current = '';

  for (const char of timePart) {
    if (char >= '0' && char <= '9' || char === '.') {
      current += char;
    } else if (char in units && current) {
      totalSeconds += parseFloat(current) * units[char];
      current = '';
    }
  }

  return totalSeconds;
}
