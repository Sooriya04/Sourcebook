import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle } from 'lucide-react';

export default function SentinelStatus() {
  const [status, setStatus] = useState({ running: false, empty_count: 0 });

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/sourcebook/v1/sentinel/status');
        if (res.ok) {
          const data = await res.json();
          setStatus(data);
        }
      } catch (err) {
        console.warn('Failed to fetch sentinel status:', err);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  if (status.running) {
    return (
      <div className="sentinel-status-pill repairing" title={`${status.empty_count} sources need scraping. Sentinel running: true`}>
        <RefreshCw size={12} className="spin-icon" />
        <span>Sentinel Scraping ({status.empty_count})</span>
      </div>
    );
  }

  if (status.empty_count > 0) {
    return (
      <div className="sentinel-status-pill pending" title={`${status.empty_count} sources need scraping. Sentinel is currently idle.`}>
        <RefreshCw size={12} />
        <span>{status.empty_count} sources pending</span>
      </div>
    );
  }

  return (
    <div className="sentinel-status-pill synced" title="All sources fully scraped and indexed">
      <CheckCircle size={12} />
      <span>Synced</span>
    </div>
  );
}
