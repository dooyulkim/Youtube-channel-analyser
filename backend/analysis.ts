import { ChannelEntry, ChannelSummary, VideoRecord } from './models.js';
import { YouTubeAnalyzer } from './youtube.js';
import { computePostingInterval } from './metrics.js';

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((acc, val) => acc + val, 0) / values.length;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

function averageEngagement(videos: VideoRecord[]): number {
  const samples: number[] = [];
  for (const video of videos) {
    if (video.views > 0) {
      samples.push((video.likes + video.comments) / video.views);
    }
  }
  return samples.length > 0 ? mean(samples) : 0;
}

export async function analyzeChannel(
  analyzer: YouTubeAnalyzer,
  entry: ChannelEntry
): Promise<ChannelSummary> {
  const channelId = entry.id;
  const channelProfile = await analyzer.fetchChannelProfile(channelId);
  const category = entry.category || 'Uncategorized';

  const recentVideos = await analyzer.fetchRecentVideos(channelProfile.uploadsPlaylist);

  const avgViews = mean(recentVideos.map(v => v.views));
  const medianViews = median(recentVideos.map(v => v.views));
  const avgDuration = mean(recentVideos.map(v => v.durationSeconds));
  const avgEngagement = averageEngagement(recentVideos);
  const postingInterval = computePostingInterval(recentVideos);
  const latestVideo = recentVideos.length > 0 ? recentVideos[0] : null;
  const viewPerSub =
    channelProfile.subscribers > 0
      ? channelProfile.views / channelProfile.subscribers
      : 0;

  return {
    channelId,
    channelName: channelProfile.title,
    category,
    subscribers: channelProfile.subscribers,
    totalViews: channelProfile.views,
    totalVideos: channelProfile.videos,
    avgRecentViews: avgViews,
    medianRecentViews: medianViews,
    avgDurationSeconds: avgDuration,
    postingIntervalDays: postingInterval,
    avgEngagementRate: avgEngagement,
    viewPerSubscriber: viewPerSub,
    latestVideo,
    recentVideoCount: recentVideos.length,
  };
}
