import { VideoRecord } from './models.js';

export function computePostingInterval(videos: VideoRecord[]): number | null {
  if (videos.length < 2) {
    return null;
  }

  const dates = videos
    .map(v => v.publishedAt)
    .filter((d): d is Date => d !== null);

  if (dates.length < 2) {
    return null;
  }

  // Sort dates
  dates.sort((a, b) => a.getTime() - b.getTime());

  const deltas: number[] = [];
  for (let i = 0; i < dates.length - 1; i++) {
    const delta = (dates[i + 1].getTime() - dates[i].getTime()) / 86400000; // Convert ms to days
    if (delta > 0) {
      deltas.push(delta);
    }
  }

  if (deltas.length === 0) {
    return null;
  }

  // Calculate mean
  const sum = deltas.reduce((acc, val) => acc + val, 0);
  return sum / deltas.length;
}
