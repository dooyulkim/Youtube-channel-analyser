import type { ChannelSummary } from "../types";

const DEFAULT_DATA_PATH = "/data/channel_summary.json";

export async function fetchChannelSummaries(): Promise<ChannelSummary[]> {
  const dataPath = import.meta.env.VITE_DATA_PATH?.trim() || DEFAULT_DATA_PATH;
  const response = await fetch(dataPath, {
    headers: {
      "Cache-Control": "no-cache",
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch data from ${dataPath}`);
  }
  return (await response.json()) as ChannelSummary[];
}
