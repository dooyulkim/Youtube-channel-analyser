import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { ChannelConfig, ChannelEntry } from './models.js';

export async function loadChannelConfig(path: string): Promise<ChannelEntry[]> {
  if (!existsSync(path)) {
    throw new Error(`Channel config not found: ${path}`);
  }

  const content = await readFile(path, 'utf-8');
  const data: ChannelConfig = JSON.parse(content);
  const channels = data.channels || [];

  if (channels.length < 1) {
    throw new Error('Channel config must include at least one channel entry.');
  }

  return channels;
}

export function loadEnvFile(path: string = '.env'): void {
  if (!existsSync(path)) {
    return;
  }

  try {
    const content = require('fs').readFileSync(path, 'utf-8');
    const lines = content.split('\n');

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#') || !line.includes('=')) {
        continue;
      }

      const [key, ...valueParts] = line.split('=');
      const cleanKey = key.trim();
      const cleanValue = valueParts.join('=').trim();

      if (cleanKey && cleanValue && !process.env[cleanKey]) {
        process.env[cleanKey] = cleanValue;
      }
    }
  } catch {
    // Silently fail if env file can't be read
  }
}
