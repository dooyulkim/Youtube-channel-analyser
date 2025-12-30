import axios, { AxiosInstance } from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { VideoRecord } from './models.js';
import { parseDateTime, parseDurationSeconds, toInt } from './utils.js';

const API_BASE_URL = 'https://www.googleapis.com/youtube/v3';

interface ChannelProfile {
  title: string;
  subscribers: number;
  views: number;
  videos: number;
  uploadsPlaylist: string | null;
}

interface VideoDetails {
  title?: string;
  publishedAt?: string;
  viewCount?: string;
  likeCount?: string;
  commentCount?: string;
  duration?: string;
}

export class YouTubeAnalyzer {
  private apiKey: string;
  private recentLimit: number;
  private session: AxiosInstance;

  constructor(apiKey: string, recentLimit: number) {
    this.apiKey = apiKey;
    this.recentLimit = Math.max(1, Math.min(recentLimit, 50));
    
    const axiosConfig: any = {
      timeout: 30000,
    };
    
    // Support corporate proxies
    const proxy = process.env.HTTP_PROXY || process.env.HTTPS_PROXY || process.env.http_proxy || process.env.https_proxy;
    if (proxy) {
      axiosConfig.httpsAgent = new HttpsProxyAgent(proxy);
      axiosConfig.proxy = false; // Disable axios default proxy handling
    }
    
    this.session = axios.create(axiosConfig);
  }

  private async get(resource: string, params: Record<string, any>): Promise<any> {
    const allParams = { ...params, key: this.apiKey };
    try {
      const response = await this.session.get(`${API_BASE_URL}/${resource}`, {
        params: allParams,
      });
      return response.data;
    } catch (error: any) {
      throw new Error(
        `YouTube API error (${error.response?.status || 'unknown'}): ${
          error.response?.data || error.message
        }`
      );
    }
  }

  async fetchChannelProfile(channelId: string): Promise<ChannelProfile> {
    const payload = await this.get('channels', {
      part: 'snippet,statistics,contentDetails',
      id: channelId,
    });

    const items = payload.items || [];
    if (items.length === 0) {
      throw new Error(`No channel found for ID ${channelId}`);
    }

    const channel = items[0];
    const stats = channel.statistics || {};
    const content = channel.contentDetails || {};
    const playlists = content.relatedPlaylists || {};

    return {
      title: channel.snippet?.title || channelId,
      subscribers: toInt(stats.subscriberCount),
      views: toInt(stats.viewCount),
      videos: toInt(stats.videoCount),
      uploadsPlaylist: playlists.uploads || null,
    };
  }

  async fetchRecentVideos(uploadsPlaylist: string | null): Promise<VideoRecord[]> {
    if (!uploadsPlaylist) {
      return [];
    }

    const records: Array<{ videoId: string; publishedAt: string }> = [];
    let nextToken: string | undefined = undefined;

    while (records.length < this.recentLimit) {
      const payload = await this.get('playlistItems', {
        part: 'contentDetails',
        playlistId: uploadsPlaylist,
        maxResults: Math.min(50, this.recentLimit),
        pageToken: nextToken,
      });

      for (const item of payload.items || []) {
        const videoId = item.contentDetails?.videoId;
        const publishedAt = item.contentDetails?.videoPublishedAt;
        if (videoId) {
          records.push({ videoId, publishedAt });
        }
        if (records.length >= this.recentLimit) {
          break;
        }
      }

      nextToken = payload.nextPageToken;
      if (!nextToken) {
        break;
      }
    }

    const videoIds = records.map(r => r.videoId).filter(id => id);
    if (videoIds.length === 0) {
      return [];
    }

    const details = await this.fetchVideoDetails(videoIds);
    const results: VideoRecord[] = [];

    for (const rec of records) {
      const detail = details[rec.videoId];
      if (!detail) {
        continue;
      }

      const publishedAt = rec.publishedAt || detail.publishedAt;
      results.push({
        videoId: rec.videoId,
        title: detail.title || rec.videoId,
        publishedAt: parseDateTime(publishedAt),
        views: toInt(detail.viewCount),
        likes: toInt(detail.likeCount),
        comments: toInt(detail.commentCount),
        durationSeconds: parseDurationSeconds(detail.duration),
        url: `https://www.youtube.com/watch?v=${rec.videoId}`,
      });
    }

    return results;
  }

  async fetchVideoDetails(videoIds: string[]): Promise<Record<string, VideoDetails>> {
    const details: Record<string, VideoDetails> = {};

    for (let start = 0; start < videoIds.length; start += 50) {
      const chunk = videoIds.slice(start, start + 50);
      const payload = await this.get('videos', {
        part: 'snippet,statistics,contentDetails',
        id: chunk.join(','),
        maxResults: 50,
      });

      for (const item of payload.items || []) {
        const stats = item.statistics || {};
        const snippet = item.snippet || {};
        const contentDetails = item.contentDetails || {};

        details[item.id] = {
          title: snippet.title,
          publishedAt: snippet.publishedAt,
          viewCount: stats.viewCount,
          likeCount: stats.likeCount,
          commentCount: stats.commentCount,
          duration: contentDetails.duration,
        };
      }
    }

    return details;
  }
}
