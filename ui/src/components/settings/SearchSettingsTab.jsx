import React, { useState } from 'react';
import { Search, ShieldCheck } from 'lucide-react';
import { pingSourceURL } from '../../services/sourcebookApi';
import {
  SettingsCard,
  SettingsField,
  SettingsInput,
  SettingsSelect,
  SettingsActionBtn,
  SettingsStatusBanner
} from './common';

export default function SearchSettingsTab({ settings, onChange }) {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const handleTestSearxng = async () => {
    const url = settings.searxng_url || 'http://localhost:8080';
    setTesting(true);
    setTestResult(null);
    try {
      const res = await pingSourceURL(url);
      if (res.online) {
        setTestResult({ ok: true, message: `Connected to SearXNG (${res.status} OK)` });
      } else {
        setTestResult({ ok: false, message: `SearXNG unreachable at ${url} (status: ${res.status || 'timeout'})` });
      }
    } catch (err) {
      setTestResult({ ok: false, message: `Connection failed: ${err.message}` });
    } finally {
      setTesting(false);
    }
  };

  const providerOptions = [
    { value: 'duckduckgo', label: 'DuckDuckGo (Fast, Scraped Fallback)' },
    { value: 'searxng', label: 'SearXNG (Private, Multi-Engine Metasearch)' },
    { value: 'both', label: 'Both (Parallel Discovery & Result Merging)' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      <SettingsCard
        icon={<Search size={16} />}
        title="Search Discovery Engine & Routing"
        description="Configure live web discovery providers and metasearch query parameters."
      >
        {/* Primary Discovery Provider */}
        <SettingsField
          label="Primary Discovery Provider"
          hint="Search indexing method"
        >
          <SettingsSelect
            value={settings.search_provider || 'duckduckgo'}
            onChange={(e) => onChange('search_provider', e.target.value)}
            options={providerOptions}
          />
        </SettingsField>

        {/* SearXNG Instance URL */}
        <SettingsField
          label="SearXNG Instance URL"
          hint="Metasearch container endpoint"
        >
          <SettingsInput
            type="text"
            value={settings.searxng_url || ''}
            onChange={(e) => onChange('searxng_url', e.target.value)}
            placeholder="http://localhost:8080"
            mono
          />
        </SettingsField>

        {/* Test SearXNG Connection */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <SettingsActionBtn
            onClick={handleTestSearxng}
            disabled={testing}
            loading={testing}
            icon={<ShieldCheck size={14} style={{ color: 'var(--accent)' }} />}
          >
            {testing ? 'Verifying SearXNG...' : 'Test SearXNG Connection'}
          </SettingsActionBtn>

          <SettingsStatusBanner status={testResult} />
        </div>

        {/* Max Scraped Pages per Query */}
        <SettingsField
          label="Max Scraped Pages per Query"
          hint="Range: 1 - 25 sources"
        >
          <SettingsInput
            type="number"
            value={settings.max_sources || 5}
            onChange={(e) => onChange('max_sources', parseInt(e.target.value, 10) || 5)}
            min={1}
            max={25}
          />
        </SettingsField>
      </SettingsCard>
    </div>
  );
}
