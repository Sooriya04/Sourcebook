export function formatDuration(ms) {
  if (!ms || ms <= 0) return '';
  return `${(ms / 1000).toFixed(2)}s`;
}

export function truncateUrl(url, maxLen = 35) {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    const domain = parsed.hostname.replace('www.', '');
    const path = parsed.pathname;
    const full = domain + path;
    if (full.length > maxLen) {
      return full.substring(0, maxLen - 3) + '...';
    }
    return full;
  } catch {
    return url.length > maxLen ? url.substring(0, maxLen - 3) + '...' : url;
  }
}

export function formatDate(dateString) {
  if (!dateString) return 'Today';
  const d = new Date(dateString);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
