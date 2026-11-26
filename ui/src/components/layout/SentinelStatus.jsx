import React, { useState, useEffect } from 'react';
import { RefreshCw, Check } from 'lucide-react';

export default function SentinelStatus({ notebookId }) {
  const [status, setStatus] = useState({ running: false, empty_count: 0, total_count: 0 });

  useEffect(() => {
    let isMounted = true;
    let timerId = null;

    const fetchStatus = async () => {
      try {
        const url = notebookId
          ? `/api/sourcebook/v1/sentinel/status?notebook_id=${encodeURIComponent(notebookId)}`
          : '/api/sourcebook/v1/sentinel/status';
        const res = await fetch(url);
        if (res.ok && isMounted) {
          const data = await res.json();
          setStatus(data);
          if (data.running && data.empty_count > 0) {
            timerId = setTimeout(fetchStatus, 5000);
          }
        }
      } catch (err) {
        console.warn('Failed to fetch sentinel status:', err);
      }
    };

    const handleFocus = () => {
      if (timerId) clearTimeout(timerId);
      fetchStatus();
    };

    fetchStatus();
    window.addEventListener('focus', handleFocus);
    return () => {
      isMounted = false;
      if (timerId) clearTimeout(timerId);
      window.removeEventListener('focus', handleFocus);
    };
  }, [notebookId]);

  if (!status.total_count || status.total_count === 0) {
    return null;
  }

  if (status.running && status.empty_count > 0) {
    return (
      <div 
        className="sentinel-badge-tasteful repairing" 
        title={`${status.empty_count} sources need scraping in this notebook. Sentinel running.`}
      >
        <RefreshCw size={11} className="spin text-amber-400" />
        <span>Scraping ({status.empty_count})</span>
      </div>
    );
  }

  if (status.empty_count > 0) {
    return (
      <div 
        className="sentinel-badge-tasteful pending" 
        title={`${status.empty_count} sources pending scraping. Sentinel idle.`}
      >
        <span className="sentinel-dot pending" />
        <span>{status.empty_count} pending</span>
      </div>
    );
  }

  return (
    <div 
      className="sentinel-badge-tasteful synced" 
      title="All sources in this notebook are fully indexed"
    >
      <Check size={11} className="text-emerald-400" />
      <span>Synced</span>
    </div>
  );
}
