# Quick Start Guide - Node.js Version

## Prerequisites
- Node.js 18.0.0 or higher
- YouTube Data API key ([Get one here](https://console.cloud.google.com/apis/credentials))

## Setup (3 steps)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure API Key
Create a `.env` file in the project root:
```
YOUTUBE_API_KEY=your_api_key_here
```

### 3. Run the Analyzer
```bash
# Quick run (development mode, no build required)
npm run analyze

# Or build and run (production mode)
npm run build
npm start
```

## Common Commands

### Analyze with custom channel list
```bash
npm run analyze -- --channels channel_config.json
```

### Auto-discover top 50 US channels
```bash
npm run analyze -- --discover-channels --channel-count 50 --region-code US
```

### Analyze top 100 trending channels in UK
```bash
npm run analyze -- --discover-channels --channel-count 100 --region-code GB
```

### Change output directory
```bash
npm run analyze -- --output-dir custom-reports
```

### Export data for web dashboard
```bash
npm run analyze -- --output-dir webui/public/data
```

### Analyze more recent videos
```bash
npm run analyze -- --recent-videos 20
```

### View all options
```bash
npm run analyze -- --help
```

## Example Output

```
Analyzing T-Series...
Analyzing MrBeast...
Analyzing Cocomelon - Nursery Rhymes...
...

Channel                    | Category      | Subs   | Views   | Videos | Avg Views | Engagement | Cadence | Avg Length
---------------------------|---------------|--------|---------|--------|-----------|------------|---------|------------
T-Series                   | Music         | 254.0M | 245.0B  | 20500  | 5.2M      | 0.8%       | 1.2d    | 4.5m
MrBeast                    | Entertainment | 230.0M | 45.0B   | 750    | 85.0M     | 3.2%       | 7.0d    | 15.2m
...

Reports saved to: C:\...\reports
```

## Output Files

After running, you'll find:
- `reports/channel_summary.json` - Detailed metrics in JSON format
- `reports/channel_summary.csv` - Spreadsheet-compatible CSV file

## Troubleshooting

### "Missing API key" error
Make sure you've created a `.env` file with `YOUTUBE_API_KEY=your_key`

### "YouTube API error (403)"
Check that your API key is valid and has YouTube Data API v3 enabled

### "No channels were analyzed"
Verify your `channel_config.json` has valid channel IDs

### Build errors
```bash
# Clean and rebuild
npm run clean
npm run build
```

## Next: Web Dashboard

To view results in the React dashboard:
```bash
# Generate reports in web directory
npm run analyze -- --output-dir webui/public/data

# Start the web UI
cd webui
npm install
npm run dev
```

Then open http://localhost:5173 in your browser.
