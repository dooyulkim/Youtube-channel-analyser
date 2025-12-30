import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { ChannelSummary, VideoRecord } from './models.js';
import { formatLargeNumber, formatDuration, formatDays } from './formatters.js';

export function safePrint(text: string): void {
  console.log(text);
}

export function printTable(summaries: ChannelSummary[]): void {
  const headers = [
    'Channel',
    'Category',
    'Subs',
    'Views',
    'Videos',
    'Avg Views',
    'Engagement',
    'Cadence',
    'Avg Length',
  ];

  const rows = summaries.map(summary => [
    summary.channelName,
    summary.category,
    formatLargeNumber(summary.subscribers),
    formatLargeNumber(summary.totalViews),
    String(summary.totalVideos),
    formatLargeNumber(summary.avgRecentViews),
    `${(summary.avgEngagementRate * 100).toFixed(1)}%`,
    formatDays(summary.postingIntervalDays),
    formatDuration(summary.avgDurationSeconds),
  ]);

  const colWidths = headers.map(h => h.length);
  for (const row of rows) {
    for (let i = 0; i < row.length; i++) {
      colWidths[i] = Math.max(colWidths[i], row[i].length);
    }
  }

  const formatRow = (row: string[]): string =>
    row.map((cell, i) => cell.padEnd(colWidths[i])).join(' | ');

  const separator = colWidths.map(w => '-'.repeat(w)).join('-+-');

  console.log(formatRow(headers));
  console.log(separator);
  for (const row of rows) {
    console.log(formatRow(row));
  }
}

export async function writeReports(
  summaries: ChannelSummary[],
  outputDir: string
): Promise<void> {
  await mkdir(outputDir, { recursive: true });

  const jsonPath = join(outputDir, 'channel_summary.json');
  const csvPath = join(outputDir, 'channel_summary.csv');

  // Write JSON
  const jsonData = summaries.map(summaryToDict);
  await writeFile(jsonPath, JSON.stringify(jsonData, null, 2), 'utf-8');

  // Write CSV
  if (summaries.length > 0) {
    const keys = Object.keys(summaryToDict(summaries[0]));
    const csvHeader = keys.join(',');
    const csvRows = summaries.map(summary => {
      const dict = summaryToDict(summary);
      return keys.map(key => {
        const value = dict[key];
        if (value === null || value === undefined) return '';
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`;
        }
        return String(value);
      }).join(',');
    });
    const csvContent = [csvHeader, ...csvRows].join('\n');
    await writeFile(csvPath, csvContent, 'utf-8');
  }
}

function summaryToDict(summary: ChannelSummary): Record<string, any> {
  const latestVideo = summary.latestVideo;
  return {
    channel_id: summary.channelId,
    channel_name: summary.channelName,
    category: summary.category,
    subscribers: summary.subscribers,
    total_views: summary.totalViews,
    total_videos: summary.totalVideos,
    recent_video_count: summary.recentVideoCount,
    avg_recent_views: Math.round(summary.avgRecentViews * 100) / 100,
    median_recent_views: Math.round(summary.medianRecentViews * 100) / 100,
    avg_duration_seconds: Math.round(summary.avgDurationSeconds * 100) / 100,
    posting_interval_days:
      summary.postingIntervalDays !== null
        ? Math.round(summary.postingIntervalDays * 100) / 100
        : null,
    avg_engagement_rate: Math.round(summary.avgEngagementRate * 10000) / 10000,
    view_per_subscriber: Math.round(summary.viewPerSubscriber * 100) / 100,
    latest_video_id: latestVideo?.videoId || null,
    latest_video_title: latestVideo?.title || null,
    latest_video_url: latestVideo?.url || null,
    latest_video_views: latestVideo?.views || null,
    latest_video_published: latestVideo?.publishedAt?.toISOString() || null,
  };
}
