import { useEffect, useMemo, useState } from "react";
import ChannelTable, {
  type SortableColumnKey,
  type SortDirection,
} from "./components/ChannelTable";
import MetricCards from "./components/MetricCards";
import LatestVideos from "./components/LatestVideos";
import SearchAndFilters from "./components/SearchAndFilters";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./components/ui/card";
import { fetchChannelSummaries } from "./services/api";
import type { ChannelSummary } from "./types";

function App() {
  const [channels, setChannels] = useState<ChannelSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] =
    useState<SortableColumnKey>("subscribers");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  useEffect(() => {
    let active = true;
    fetchChannelSummaries()
      .then((data) => {
        if (active) {
          setChannels(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          console.error(err);
          setError(err.message || "Failed to load data");
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const filteredChannels = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return channels
      .filter((channel) =>
        channel.channel_name
          .toLowerCase()
          .includes(normalizedSearch),
      )
      .filter((channel) =>
        selectedCategory ? channel.category === selectedCategory : true,
      );
  }, [channels, search, selectedCategory]);

  const sortedChannels = useMemo(() => {
    const next = [...filteredChannels];
    next.sort((a, b) => {
      if (sortKey === "channel_name") {
        return sortDir === "asc"
          ? a.channel_name.localeCompare(b.channel_name)
          : b.channel_name.localeCompare(a.channel_name);
      }
      const aValue = a[sortKey] ?? 0;
      const bValue = b[sortKey] ?? 0;
      if (aValue === bValue) {
        return a.channel_name.localeCompare(b.channel_name);
      }
      const direction = sortDir === "asc" ? 1 : -1;
      return aValue > bValue ? direction : -direction;
    });
    return next;
  }, [filteredChannels, sortKey, sortDir]);

  const headlineStats = useMemo(() => {
    if (!channels.length) {
      return null;
    }
    const totalSubs = channels.reduce((sum, c) => sum + c.subscribers, 0);
    const totalViews = channels.reduce((sum, c) => sum + c.total_views, 0);
    const bestEngagement =
      [...channels].sort(
        (a, b) => b.avg_engagement_rate - a.avg_engagement_rate,
      )[0] ?? null;
    const fastestCadence =
      [...channels]
        .filter((c) => c.posting_interval_days)
        .sort(
          (a, b) =>
            (a.posting_interval_days ?? Number.POSITIVE_INFINITY) -
            (b.posting_interval_days ?? Number.POSITIVE_INFINITY),
        )[0] ?? null;
    return {
      totalSubs,
      totalViews,
      bestEngagement,
      fastestCadence,
    };
  }, [channels]);

  const handleSortChange = (column: SortableColumnKey) => {
    if (column === sortKey) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(column);
      setSortDir("desc");
    }
  };

  const categories = useMemo(() => {
    return Array.from(
      new Set(channels.map((channel) => channel.category).filter(Boolean)),
    ).sort();
  }, [channels]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#1a2538,_#070910_70%)] text-foreground">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10">
        <Card className="border border-border/60 bg-gradient-to-br from-background to-muted/40">
          <CardHeader className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">
                Benchmark Dashboard
              </p>
              <CardTitle className="text-3xl font-semibold">
                YouTube Channel Analyzer
              </CardTitle>
              <CardDescription className="max-w-2xl text-base">
                Review the latest KPIs for the top channels so you can model
                content cadence, engagement, and video format.
              </CardDescription>
            </div>
            <SearchAndFilters
              search={search}
              onSearchChange={setSearch}
              categories={categories}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
            />
          </CardHeader>
        </Card>

        {loading && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Loading channel data…
            </CardContent>
          </Card>
        )}
        {error && (
          <Card className="border-destructive/40">
            <CardContent className="py-12 text-center text-destructive">
              Error: {error}
            </CardContent>
          </Card>
        )}

        {!loading && !error && (
          <>
            {headlineStats && (
              <MetricCards
                totalSubs={headlineStats.totalSubs}
                totalViews={headlineStats.totalViews}
                bestEngagement={headlineStats.bestEngagement}
                fastestCadence={headlineStats.fastestCadence}
              />
            )}

            <Card>
              <CardHeader>
                <CardTitle>Leaderboard</CardTitle>
                <CardDescription>
                  Click a column header to re-order by subscribers, cadence, or
                  engagement rate.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChannelTable
                  data={sortedChannels}
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSortChange={handleSortChange}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Latest Uploads</CardTitle>
                <CardDescription>
                  Quick links to each channel&apos;s most recent video, ordered by
                  publish date.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LatestVideos channels={channels} />
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
