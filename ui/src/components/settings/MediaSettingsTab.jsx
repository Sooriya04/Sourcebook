import React, { useState } from 'react';
import { PlayCircle, Globe, ShieldCheck } from 'lucide-react';
import { pingSourceURL } from '../../services/sourcebookApi';
import {
  SettingsCard,
  SettingsField,
  SettingsInput,
  SettingsToggleRow,
  SettingsActionBtn,
  SettingsStatusBanner
} from './common';

export default function MediaSettingsTab({ settings, onChange }) {
  const [testingSearqon, setTestingSearqon] = useState(false);
  const [searqonResult, setSearqonResult] = useState(null);

  const [testingYt, setTestingYt] = useState(false);
  const [ytResult, setYtResult] = useState(null);

  const handleTestSearqon = async () => {
    const url = settings.searqon_url || 'http://127.0.0.1:4001/scrape/batch';
    setTestingSearqon(true);
    setSearqonResult(null);
    try {
      const healthUrl = url.replace(/\/scrape\/batch\/?$/, '/health');
      const res = await pingSourceURL(healthUrl);
      if (res.online) {
        setSearqonResult({ ok: true, message: `Connected to Searqon Scraper (${res.status} OK)` });
      } else {
        const directRes = await pingSourceURL(url);
        if (directRes.online) {
          setSearqonResult({ ok: true, message: `Connected to Searqon Endpoint (${directRes.status} OK)` });
        } else {
          setSearqonResult({ ok: false, message: `Searqon unreachable at ${url}` });
        }
      }
    } catch (err) {
      setSearqonResult({ ok: false, message: `Test failed: ${err.message}` });
    } finally {
      setTestingSearqon(false);
    }
  };

  const handleTestYouTube = async () => {
    const url = settings.youtube_service_url || 'http://127.0.0.1:6001';
    setTestingYt(true);
    setYtResult(null);
    try {
      const healthUrl = `${url.replace(/\/$/, '')}/health`;
      const res = await pingSourceURL(healthUrl);
      if (res.online) {
        setYtResult({ ok: true, message: `Connected to YouTube Service (${res.status} OK)` });
      } else {
        const directRes = await pingSourceURL(url);
        if (directRes.online) {
          setYtResult({ ok: true, message: `Connected to YouTube Service (${directRes.status} OK)` });
        } else {
          setYtResult({ ok: false, message: `YouTube service offline at ${url}` });
        }
      }
    } catch (err) {
      setYtResult({ ok: false, message: `Test failed: ${err.message}` });
    } finally {
      setTestingYt(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      {/* Searqon Web Scraper & Crawler */}
      <SettingsCard
        icon={<Globe size={16} />}
        title="Searqon Web Scraper & Crawler"
        description="Parallel web scraping daemon that extracts structured markdown from target URLs."
      >
        <SettingsField
          label="Searqon Batch Scrape URL"
          hint="Go microservice endpoint"
        >
          <SettingsInput
            type="text"
            value={settings.searqon_url || ''}
            onChange={(e) => onChange('searqon_url', e.target.value)}
            placeholder="http://127.0.0.1:4001/scrape/batch"
            mono
          />
        </SettingsField>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <SettingsActionBtn
            onClick={handleTestSearqon}
            disabled={testingSearqon}
            loading={testingSearqon}
            icon={<ShieldCheck size={14} style={{ color: 'var(--accent)' }} />}
          >
            {testingSearqon ? 'Verifying Searqon...' : 'Test Scraper Connection'}
          </SettingsActionBtn>

          <SettingsStatusBanner status={searqonResult} />
        </div>

        <SettingsToggleRow
          title="Recursive Domain Crawling"
          description="Discover and ingest linked pages under discovered domains automatically."
          checked={Boolean(settings.deep_crawl_enabled)}
          onChange={(val) => onChange('deep_crawl_enabled', val)}
        />
      </SettingsCard>

      {/* YouTube Transcript Microservice */}
      <SettingsCard
        icon={<PlayCircle size={16} style={{ color: '#ef4444' }} />}
        title="YouTube Transcript Microservice"
        description="Extract spoken audio transcripts from YouTube URLs added as notebook sources."
      >
        <SettingsField
          label="YouTube Microservice URL"
          hint="Local transcript proxy daemon"
        >
          <SettingsInput
            type="text"
            value={settings.youtube_service_url || ''}
            onChange={(e) => onChange('youtube_service_url', e.target.value)}
            placeholder="http://127.0.0.1:6001"
            mono
          />
        </SettingsField>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <SettingsActionBtn
            onClick={handleTestYouTube}
            disabled={testingYt}
            loading={testingYt}
            icon={<ShieldCheck size={14} style={{ color: 'var(--accent)' }} />}
          >
            {testingYt ? 'Verifying YouTube Service...' : 'Test YouTube Service Connection'}
          </SettingsActionBtn>

          <SettingsStatusBanner status={ytResult} />
        </div>

        <SettingsToggleRow
          title="Auto-Fetch Video Transcripts"
          description="Extract and index spoken transcripts when YouTube videos appear in search results."
          checked={Boolean(settings.youtube_enabled)}
          onChange={(val) => onChange('youtube_enabled', val)}
        />
      </SettingsCard>
    </div>
  );
}
