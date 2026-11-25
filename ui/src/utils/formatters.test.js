import { describe, it, expect } from 'vitest';
import { formatDuration, truncateUrl, formatRelativeTime } from './formatters';

describe('formatters', () => {
  it('formats positive durations in seconds and returns empty for non-positive', () => {
    expect(formatDuration(1500)).toBe('1.50s');
    expect(formatDuration(0)).toBe('');
    expect(formatDuration(-100)).toBe('');
  });

  it('truncates long URLs while preserving domain', () => {
    expect(truncateUrl('https://www.example.com/a/very/long/path/to/document.html', 30))
      .toBe('example.com/a/very/long/pat...');
    expect(truncateUrl('not-a-url', 20)).toBe('not-a-url');
  });

  it('formats recent timestamps safely', () => {
    const now = new Date().toISOString();
    expect(formatRelativeTime(now)).toBe('Updated just now');
    expect(formatRelativeTime('')).toBe('Updated recently');
  });
});
