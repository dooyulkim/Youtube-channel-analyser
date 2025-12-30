# YouTube Channel Analyzer

This project provides a lightweight Node.js/TypeScript application that benchmarks popular YouTube channels. The script pulls data from the YouTube Data API, summarizes performance metrics, and produces actionable insights that can help you model your own content strategy.

## Key Features

- Fetches channel statistics (subscribers, views, total videos) for a curated list of top channels.
- Collects data on the most recent uploads (view counts, like counts, duration, publish date).
- Generates derived insights such as posting frequency, engagement ratios, and video length trends.
- Outputs a concise report directly in the terminal and saves machine-readable results to JSON/CSV.

## Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set your YouTube Data API key**
   
   Create a `.env` file (automatically loaded) with:
   ```
   YOUTUBE_API_KEY=<YOUR_API_KEY>
   ```
   
   Or set environment variable:
   ```powershell
   # PowerShell
   $env:YOUTUBE_API_KEY = "<YOUR_API_KEY>"
   ```
   ```bash
   # Bash/Linux/Mac
   export YOUTUBE_API_KEY="<YOUR_API_KEY>"
   ```

3. **Build the project**
   ```bash
   npm run build
   ```

4. **Run the analyzer**
   ```bash
   # Use your own list (channel_config.json)
   npm start
   
   # Or run directly in development mode
   npm run analyze
   
   # Auto-discover the top 100 trending channels in a region
   npm run analyze -- --discover-channels --channel-count 100 --region-code US
   ```

## Configuration

- `channel_config.json` lists channels (name + ID) that will be benchmarked when discovery is disabled. Update this file if you prefer a custom cohort.
- Each channel entry can optionally include a `"category"` (used for filtering in the React dashboard). Missing categories default to `Uncategorized` (or `Trending` when discovered automatically).
- `--discover-channels` tells the CLI to pull popular channel IDs from the YouTube "most popular" video feed; combine it with `--channel-count` (default 50) and `--region-code` to control scope.
- Command-line options let you override defaults such as the number of recent videos to analyze or the output format. Run `npm run analyze -- --help` for details.

## Output

The script prints a ranked table in the terminal and writes two files:

- `reports/channel_summary.json`: Raw metrics and derived KPIs for each channel.
- `reports/channel_summary.csv`: Flattened table that can be opened in Excel/Sheets for further comparison.

## React Dashboard

`webui/` hosts a Vite + React (TypeScript) SPA styled with Tailwind CSS +
shadcn/ui components for a cohesive dashboard experience.

1. Export the fresh dataset straight into the web app:
   ```bash
   npm run analyze -- --output-dir webui/public/data
   ```
   (If you keep the JSON elsewhere, set `VITE_DATA_PATH` when starting Vite.)
2. Install dependencies and launch the dev server:
   ```bash
   cd webui
   npm install
   npm run dev
   ```
3. Build for production hosting:
   ```bash
   npm run build
   ```
   The static bundle is emitted to `webui/dist`.

The dashboard offers search + category filters (fed by the `"category"` property), a sortable leaderboard, and quick links to each channel's latest upload—all using reusable shadcn/ui primitives you can extend for new views.

## CLI Options

Run with `--help` to see all available options:

```bash
npm run analyze -- --help
```

Available options:
- `--channels <path>` - Path to channel configuration JSON file (default: channel_config.json)
- `--recent-videos <number>` - Number of recent videos to analyze per channel (default: 10, max: 50)
- `--api-key <key>` - YouTube Data API key (or use YOUTUBE_API_KEY env var)
- `--output-dir <path>` - Directory for JSON/CSV reports (default: reports)
- `--skip-files` - Only print table, don't write files
- `--channel-count <number>` - Maximum channels to analyze (default: 50)
- `--discover-channels` - Auto-discover popular channels instead of using config file
- `--region-code <code>` - Region code for discovery (default: US)

## Next Steps

- Expand the config to include competitors within your niche.
- Feed the JSON output into dashboards (e.g., Power BI, Tableau) for richer visual analysis.
- Schedule the script (Task Scheduler, cron) to keep benchmarks fresh.
