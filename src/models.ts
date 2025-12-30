export interface VideoRecord {
  videoId: string;
  title: string;
  publishedAt: Date | null;
  views: number;
  likes: number;
  comments: number;
  durationSeconds: number;
  url: string;
}

export interface ChannelSummary {
  channelId: string;
  channelName: string;
  category: string;
  subscribers: number;
  totalViews: number;
  totalVideos: number;
  avgRecentViews: number;
  medianRecentViews: number;
  avgDurationSeconds: number;
  postingIntervalDays: number | null;
  avgEngagementRate: number;
  viewPerSubscriber: number;
  latestVideo: VideoRecord | null;
  recentVideoCount: number;
}

export interface ChannelConfig {
  channels: ChannelEntry[];
}

export interface ChannelEntry {
  id: string;
  name?: string;
  category?: string;
}

export interface AnalyzerOptions {
  apiKey: string;
  recentLimit: number;
}
