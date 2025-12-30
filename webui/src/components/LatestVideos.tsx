import type { ChannelSummary } from "../types";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface LatestVideosProps {
  channels: ChannelSummary[];
}

interface VideoSummary {
  id: string;
  channel: string;
  title: string;
  url: string;
  videoId: string;
  views: number | null;
  publishedAt: string | null;
}

function getVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.replace("/", "");
    }
    if (parsed.searchParams.has("v")) {
      return parsed.searchParams.get("v");
    }
    return null;
  } catch {
    return null;
  }
}

function LatestVideos({ channels }: LatestVideosProps) {
  const videos = channels
    .filter(
      (channel): channel is ChannelSummary & {
        latest_video_url: string;
      } => Boolean(channel.latest_video_url),
    )
    .map<VideoSummary>((channel) => ({
      id: channel.channel_id,
      channel: channel.channel_name,
      title: channel.latest_video_title ?? "Latest video",
      url: channel.latest_video_url,
      videoId: getVideoId(channel.latest_video_url) ?? "",
      views: channel.latest_video_views,
      publishedAt: channel.latest_video_published_at,
    }))
    .sort((a, b) => {
      const aDate = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const bDate = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return bDate - aDate;
    });

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {videos.map((video) => (
        <Card key={`${video.id}-${video.url}`}>
          <CardHeader className="pb-2">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              {video.channel}
            </p>
            <CardTitle className="text-base leading-tight">
              <a
                href={video.url}
                target="_blank"
                rel="noreferrer"
                className="underline-offset-4 hover:underline"
              >
                {video.title}
              </a>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {video.videoId && (
              <div className="mb-3 overflow-hidden rounded-2xl border border-border/40">
                <iframe
                  title={video.title}
                  src={`https://www.youtube.com/embed/${video.videoId}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="aspect-video h-full w-full"
                />
              </div>
            )}
            <p>
              {video.publishedAt
                ? new Date(video.publishedAt).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                  })
                : "—"}
              {" · "}
              {video.views?.toLocaleString() ?? "—"} views
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default LatestVideos;
