import type { ChannelSummary } from "../types";
import {
  formatDuration,
  formatNumber,
  formatPercent,
} from "../utils/formatters";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";

interface MetricCardsProps {
  totalSubs: number;
  totalViews: number;
  bestEngagement: ChannelSummary | null;
  fastestCadence: ChannelSummary | null;
}

interface MetricCard {
  label: string;
  value: string;
  caption: string;
}

function MetricCards({
  totalSubs,
  totalViews,
  bestEngagement,
  fastestCadence,
}: MetricCardsProps) {
  const cards = [
    {
      label: "Total Subscribers",
      value: formatNumber(totalSubs),
      caption: "Combined audience across tracked channels",
    },
    {
      label: "Total All-Time Views",
      value: formatNumber(totalViews),
      caption: "Lifetime views across the cohort",
    },
    bestEngagement
      ? {
          label: "Top Engagement",
          value: `${bestEngagement.channel_name} • ${formatPercent(
            bestEngagement.avg_engagement_rate,
          )}`,
          caption: "Highest like + comment rate per view",
        }
      : null,
    fastestCadence
      ? {
          label: "Fastest Cadence",
          value: `${fastestCadence.channel_name} • ${formatDuration(
            fastestCadence.posting_interval_days,
          )}`,
          caption: "Shortest average gap between uploads",
        }
      : null,
  ].filter((card): card is MetricCard => Boolean(card));

  return (
    <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              {card.label}
            </CardTitle>
            <CardDescription className="text-3xl font-semibold text-foreground">
              {card.value}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground">{card.caption}</p>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}

export default MetricCards;
