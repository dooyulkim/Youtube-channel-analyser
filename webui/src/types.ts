export interface ChannelSummary {
  channel_id: string;
  channel_name: string;
  category: string;
  subscribers: number;
  total_views: number;
  total_videos: number;
  recent_video_count: number;
  avg_recent_views: number;
  median_recent_views: number;
  avg_duration_seconds: number;
  posting_interval_days: number | null;
  avg_engagement_rate: number;
  view_per_subscriber: number;
  latest_video_title: string | null;
  latest_video_url: string | null;
  latest_video_views: number | null;
  latest_video_published_at: string | null;
}
