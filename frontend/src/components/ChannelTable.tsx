import { useEffect, useMemo, useRef, useState } from "react";
import type { ChannelSummary } from "../types";
import { cn } from "../lib/utils";
import {
  formatDuration,
  formatNumber,
  formatPercent,
} from "../utils/formatters";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";

const columns = [
  { key: "channel_name", label: "Channel" },
  { key: "subscribers", label: "Subscribers" },
  { key: "total_views", label: "Total Views" },
  { key: "avg_recent_views", label: "Avg Recent Views" },
  { key: "avg_engagement_rate", label: "Engagement" },
  { key: "posting_interval_days", label: "Cadence" },
  { key: "avg_duration_seconds", label: "Avg Length" },
] as const;

export type SortableColumnKey = (typeof columns)[number]["key"];
export type SortDirection = "asc" | "desc";

interface ChannelTableProps {
  data: ChannelSummary[];
  sortKey: SortableColumnKey;
  sortDir: SortDirection;
  onSortChange: (column: SortableColumnKey) => void;
  batchSize?: number;
}

function ChannelTable({
  data,
  sortKey,
  sortDir,
  onSortChange,
  batchSize = 10,
}: ChannelTableProps) {
  const [visibleCount, setVisibleCount] = useState(batchSize);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setVisibleCount(batchSize);
  }, [batchSize, data]);

  const visibleRows = useMemo(() => data.slice(0, visibleCount), [data, visibleCount]);
  const hasMore = visibleCount < data.length;

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleCount((prev) => Math.min(prev + batchSize, data.length));
          }
        });
      },
      { threshold: 1.0 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [batchSize, data.length, hasMore]);

  const handleSortChange = (column: SortableColumnKey) => {
    setVisibleCount(batchSize);
    onSortChange(column);
  };

  return (
    <div className="max-h-[32rem] overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/20 hover:[&::-webkit-scrollbar-thumb]:bg-white/35">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => {
              const isActive = sortKey === column.key;
              return (
                <TableHead key={column.key}>
                  <button
                    type="button"
                    onClick={() => handleSortChange(column.key)}
                    className={cn(
                      "flex items-center gap-1 text-left text-xs font-semibold uppercase tracking-[0.2em] transition-colors",
                      isActive ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {column.label}
                    <span className="text-muted-foreground">
                      {isActive ? (sortDir === "asc" ? "▲" : "▼") : ""}
                    </span>
                  </button>
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {visibleRows.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="py-10 text-center text-muted-foreground"
              >
                No channels match the filters.
              </TableCell>
            </TableRow>
          )}
          {visibleRows.map((channel) => (
            <TableRow key={channel.channel_id}>
              <TableCell>
                <a
                  href={`https://www.youtube.com/channel/${channel.channel_id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-white underline underline-offset-4"
                >
                  {channel.channel_name}
                </a>
              </TableCell>
              <TableCell>{formatNumber(channel.subscribers)}</TableCell>
              <TableCell>{formatNumber(channel.total_views)}</TableCell>
              <TableCell>{formatNumber(channel.avg_recent_views)}</TableCell>
              <TableCell>{formatPercent(channel.avg_engagement_rate)}</TableCell>
              <TableCell>{formatDuration(channel.posting_interval_days)}</TableCell>
              <TableCell>
                {formatDuration(channel.avg_duration_seconds / 60, true)}
              </TableCell>
            </TableRow>
          ))}
          {hasMore && (
            <TableRow>
              <TableCell colSpan={columns.length}>
                <div ref={sentinelRef} className="py-2 text-center text-xs text-muted-foreground">
                  Loading more...
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export default ChannelTable;
