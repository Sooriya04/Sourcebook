import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle } from 'lucide-react';

export default function SentinelStatus({ notebookId }) {
  const [status, setStatus] = useState({ running: false, empty_count: 0, total_count: 0 });

  useEffect(() => {
    let isMounted = true;
    const fetchStatus = async () => {
      try {
        const url = notebookId
          ? `/api/sourcebook/v1/sentinel/status?notebook_id=${encodeURIComponent(notebookId)}`
          : '/api/sourcebook/v1/sentinel/status';
        const res = await fetch(url);
        if (res.ok && isMounted) {
          const data = await res.json();
          setStatus(data);
        }
      } catch (err) {
        console.warn('Failed to fetch sentinel status:', err);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [notebookId]);

  // If there are no sources in this notebook at all, do not render any sentinel badge
  if (!status.total_count || status.total_count === 0) {
    return null;
  }

  if (status.running && status.empty_count > 0) {
    return (
      <div className="sentinel-status-pill repairing" title={`${status.empty_count} sources need scraping in this notebook. Sentinel running.`}>
        <RefreshCw size={12} className="spin-icon" />
        <span>Sentinel Scraping ({status.empty_count})</span>
      </div>
    );
  }

  if (status.empty_count > 0) {
    return (
      <div className="sentinel-status-pill pending" title={`${status.empty_count} sources need scraping in this notebook. Sentinel is idle.`}>
        <RefreshCw size={12} />
        <span>{status.empty_count} sources pending</span>
      </div>
    );
  }

  return (
    <div className="sentinel-status-pill synced" title="All sources in this notebook are fully scraped and indexed">
      <CheckCircle size={12} />
      <span>Synced</span>
    </div>
  );
}
