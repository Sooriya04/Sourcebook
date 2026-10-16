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

export function formatRelativeTime(dateString) {
  if (!dateString) return 'Updated recently';
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    if (diffMs < 0 || isNaN(diffMs)) return 'Updated recently';

    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Updated just now';
    if (diffMins < 60) return `Updated ${diffMins}m ago`;
    if (diffHours === 1) return 'Updated 1 hour ago';
    if (diffHours < 24) return `Updated ${diffHours} hours ago`;
    if (diffDays === 1) return 'Updated yesterday';
    if (diffDays < 7) return `Updated ${diffDays} days ago`;
    return `Updated ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  } catch {
    return 'Updated recently';
  }
}

