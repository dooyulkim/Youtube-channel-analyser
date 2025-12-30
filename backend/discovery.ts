import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { ChannelEntry } from './models.js';

const API_BASE_URL = 'https://www.googleapis.com/youtube/v3';

export async function discoverPopularChannels(
  apiKey: string,
  maxChannels: number,
  regionCode: string = 'US',
  excludeIds: Set<string> = new Set()
): Promise<ChannelEntry[]> {
  const collected = new Map<string, string>();
  let pageToken: string | undefined = undefined;

  while (collected.size < maxChannels) {
    const params: any = {
      part: 'snippet',
      chart: 'mostPopular',
      maxResults: 50,
      regionCode,
      key: apiKey,
    };

    if (pageToken) {
      params.pageToken = pageToken;
    }

    const axiosConfig: any = {
      params,
      timeout: 30000,
    };
    
    // Support corporate proxies
    const proxy = process.env.HTTP_PROXY || process.env.HTTPS_PROXY || process.env.http_proxy || process.env.https_proxy;
    if (proxy) {
      axiosConfig.httpsAgent = new HttpsProxyAgent(proxy);
      axiosConfig.proxy = false;
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/videos`, axiosConfig);

      const payload = response.data;
      const items = payload.items || [];

      for (const item of items) {
        const snippet = item.snippet || {};
        const channelId = snippet.channelId;
        const channelTitle = snippet.channelTitle;

        if (!channelId || !channelTitle) {
          continue;
        }

        if (excludeIds.has(channelId) || collected.has(channelId)) {
          continue;
        }

        collected.set(channelId, channelTitle);

        if (collected.size >= maxChannels) {
          break;
        }
      }

      pageToken = payload.nextPageToken;
      if (!pageToken) {
        break;
      }
    } catch (error: any) {
      throw new Error(
        `YouTube API error (${error.response?.status || 'unknown'}) during discovery: ${
          error.response?.data || error.message
        }`
      );
    }
  }

  return Array.from(collected.entries()).map(([id, name]) => ({
    id,
    name,
    category: 'Trending',
  }));
}
