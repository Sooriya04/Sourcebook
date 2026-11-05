import React, { useState } from 'react';
import { Search, ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';
import { pingSourceURL } from '../../services/sourcebookApi';
import Spinner from '../ui/Spinner';

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

  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '12px',
    backgroundColor: '#131314',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    color: '#e3e3e3',
    fontSize: '0.84rem',
    fontFamily: "'IBM Plex Mono', 'JetBrains Mono', ui-monospace, monospace",
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
  };

  const handleFocus = (e) => {
    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
    e.currentTarget.style.boxShadow = '0 0 0 2px rgba(168, 199, 250, 0.25)';
  };

  const handleBlur = (e) => {
    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
    e.currentTarget.style.boxShadow = 'none';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      <div
        style={{
          backgroundColor: '#1e1f20',
          padding: '24px',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.05)'
        }}
      >
        <div style={{ marginBottom: '20px' }}>
          <h3
            style={{
              fontSize: '0.94rem',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#e3e3e3',
              margin: '0 0 4px 0'
            }}
          >
            <Search size={16} color="#a8c7fa" />
            <span>Search Discovery Engine & Routing</span>
          </h3>
          <p style={{ fontSize: '0.78rem', color: '#8e918f', margin: 0 }}>
            Configure live web discovery providers and metasearch query parameters.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 500, color: '#c4c7c5' }}>
                Primary Discovery Provider
              </label>
              <span style={{ fontSize: '0.72rem', color: '#8e918f' }}>
                Search indexing method
              </span>
            </div>
            <select
              value={settings.search_provider || 'duckduckgo'}
              onChange={(e) => onChange('search_provider', e.target.value)}
              style={{ ...inputStyle, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}
              onFocus={handleFocus}
              onBlur={handleBlur}
            >
              <option value="duckduckgo">DuckDuckGo (Fast, Local Scraped)</option>
              <option value="searxng">SearXNG (Private, Multi-Engine Metasearch)</option>
              <option value="both">Both (Parallel Search & Merge)</option>
            </select>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 500, color: '#c4c7c5' }}>
                SearXNG Instance URL
              </label>
              <span style={{ fontSize: '0.72rem', color: '#8e918f' }}>
                Metasearch container endpoint
              </span>
            </div>
            <input
              type="text"
              value={settings.searxng_url || ''}
              onChange={(e) => onChange('searxng_url', e.target.value)}
              placeholder="http://localhost:8080"
              style={inputStyle}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </div>

          {/* Test SearXNG Connection */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleTestSearxng}
              disabled={testing}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '7px 16px',
                backgroundColor: '#131314',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#e3e3e3',
                borderRadius: '9999px',
                cursor: testing ? 'not-allowed' : 'pointer',
                fontWeight: 500,
                fontSize: '0.8rem',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                if (!testing) {
                  e.currentTarget.style.backgroundColor = '#282a2d';
                  e.currentTarget.style.color = '#ffffff';
                }
              }}
              onMouseLeave={(e) => {
                if (!testing) {
                  e.currentTarget.style.backgroundColor = '#131314';
                  e.currentTarget.style.color = '#e3e3e3';
                }
              }}
            >
              {testing ? <Spinner size={13} color="#a8c7fa" /> : <ShieldCheck size={13} color="#a8c7fa" />}
              <span>{testing ? 'Verifying SearXNG...' : 'Test SearXNG Connection'}</span>
            </button>

            {testResult && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.76rem',
                  fontFamily: "'IBM Plex Mono', monospace",
                  padding: '5px 12px',
                  borderRadius: '6px',
                  backgroundColor: testResult.ok ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                  border: testResult.ok ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                  color: testResult.ok ? '#6ee7b7' : '#fca5a5'
                }}
              >
                {testResult.ok ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 500, color: '#c4c7c5' }}>
                Max Scraped Pages per Query
              </label>
              <span style={{ fontSize: '0.72rem', color: '#8e918f' }}>
                Range: 1 - 25 sources
              </span>
            </div>
            <input
              type="number"
              value={settings.max_sources || 5}
              onChange={(e) => onChange('max_sources', parseInt(e.target.value, 10) || 5)}
              min="1"
              max="25"
              style={inputStyle}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
