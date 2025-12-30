#!/usr/bin/env node
import { Command } from 'commander';
import { resolve } from 'path';
import * as dotenv from 'dotenv';
import { loadChannelConfig } from './config.js';
import { discoverPopularChannels } from './discovery.js';
import { YouTubeAnalyzer } from './youtube.js';
import { analyzeChannel } from './analysis.js';
import { printTable, writeReports, safePrint } from './reporting.js';
import { ChannelEntry, ChannelSummary } from './models.js';

// Load environment variables
dotenv.config();

async function main() {
  const program = new Command();

  program
    .name('analyze-channels')
    .description('Analyze top YouTube channels and generate benchmarking insights.')
    .option(
      '--channels <path>',
      'Path to the channel configuration JSON file',
      'channel_config.json'
    )
    .option(
      '--recent-videos <number>',
      'Number of recent videos per channel to analyze (max 50)',
      '10'
    )
    .option(
      '--api-key <key>',
      'Optional YouTube Data API key. Defaults to YOUTUBE_API_KEY env var'
    )
    .option(
      '--output-dir <path>',
      'Directory where JSON/CSV reports will be saved',
      'reports'
    )
    .option(
      '--skip-files',
      'If set, skip writing JSON/CSV output files and only print the table',
      false
    )
    .option(
      '--channel-count <number>',
      'Maximum number of channels to analyze',
      '50'
    )
    .option(
      '--discover-channels',
      'Automatically pull channel IDs from the most popular videos instead of using the config file',
      false
    )
    .option(
      '--region-code <code>',
      'ISO 3166-1 alpha-2 region code used during automatic discovery',
      'US'
    )
    .parse(process.argv);

  const options = program.opts();

  const apiKey = options.apiKey || process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    console.error(
      'Missing API key. Set YOUTUBE_API_KEY or use --api-key to provide one.'
    );
    process.exit(1);
  }

  let channels: ChannelEntry[];

  if (options.discoverChannels) {
    channels = await discoverPopularChannels(
      apiKey,
      parseInt(options.channelCount),
      options.regionCode,
      new Set()
    );
  } else {
    channels = await loadChannelConfig(options.channels);
    const channelCount = parseInt(options.channelCount);
    if (channelCount && channels.length < channelCount) {
      const needed = channelCount - channels.length;
      const excludeIds = new Set(channels.map(entry => entry.id));
      const supplemental = await discoverPopularChannels(
        apiKey,
        needed,
        options.regionCode,
        excludeIds
      );
      channels.push(...supplemental);
    }
  }

  if (options.channelCount) {
    channels = channels.slice(0, parseInt(options.channelCount));
  }

  const analyzer = new YouTubeAnalyzer(apiKey, parseInt(options.recentVideos));
  const summaries: ChannelSummary[] = [];

  for (const entry of channels) {
    const name = entry.name || entry.id;
    safePrint(`Analyzing ${name}...`);
    try {
      const summary = await analyzeChannel(analyzer, entry);
      summaries.push(summary);
    } catch (error: any) {
      console.error(`Failed to analyze ${name}: ${error.message}`);
    }
  }

  if (summaries.length === 0) {
    console.error('No channels were analyzed successfully.');
    process.exit(2);
  }

  // Sort by subscribers descending
  summaries.sort((a, b) => b.subscribers - a.subscribers);

  console.log();
  printTable(summaries);

  if (!options.skipFiles) {
    const outputDir = resolve(options.outputDir);
    await writeReports(summaries, outputDir);
    console.log(`\nReports saved to: ${outputDir}`);
  }
}

main().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});
