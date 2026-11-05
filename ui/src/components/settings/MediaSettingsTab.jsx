import React, { useState } from 'react';
import { PlayCircle, Globe, ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';
import ToggleSwitch from '../ui/ToggleSwitch';
import { pingSourceURL } from '../../services/sourcebookApi';
import Spinner from '../ui/Spinner';

export default function MediaSettingsTab({ settings, onChange }) {
  const [testingSearqon, setTestingSearqon] = useState(false);
  const [searqonResult, setSearqonResult] = useState(null);

  const [testingYt, setTestingYt] = useState(false);
  const [ytResult, setYtResult] = useState(null);

  const handleTestSearqon = async () => {
    let url = settings.searqon_url || 'http://127.0.0.1:4001/scrape/batch';
    // If it's the batch endpoint, test /health or test ping directly
    setTestingSearqon(true);
    setSearqonResult(null);
    try {
      // Test base health endpoint first, fallback to pinging the specified endpoint
      const healthUrl = url.replace(/\/scrape\/batch\/?$/, '/health');
      const res = await pingSourceURL(healthUrl);
      if (res.online) {
        setSearqonResult({ ok: true, message: `Connected to Searqon Scraper (${res.status} OK)` });
      } else {
        // try direct ping
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
    let url = settings.youtube_service_url || 'http://127.0.0.1:6001';
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
      {/* Searqon Scraper & Crawler */}
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
            <Globe size={16} color="#a8c7fa" />
            <span>Searqon Web Scraper & Crawler</span>
          </h3>
          <p style={{ fontSize: '0.78rem', color: '#8e918f', margin: 0 }}>
            Parallel web scraping daemon that extracts structured markdown from target URLs.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 500, color: '#c4c7c5' }}>
                Searqon Batch Scrape URL
              </label>
              <span style={{ fontSize: '0.72rem', color: '#8e918f' }}>
                Go microservice endpoint
              </span>
            </div>
            <input
              type="text"
              value={settings.searqon_url || ''}
              onChange={(e) => onChange('searqon_url', e.target.value)}
              placeholder="http://127.0.0.1:4001/scrape/batch"
              style={inputStyle}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </div>

          {/* Test Searqon Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleTestSearqon}
              disabled={testingSearqon}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '7px 16px',
                backgroundColor: '#131314',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#e3e3e3',
                borderRadius: '9999px',
                cursor: testingSearqon ? 'not-allowed' : 'pointer',
                fontWeight: 500,
                fontSize: '0.8rem',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                if (!testingSearqon) {
                  e.currentTarget.style.backgroundColor = '#282a2d';
                  e.currentTarget.style.color = '#ffffff';
                }
              }}
              onMouseLeave={(e) => {
                if (!testingSearqon) {
                  e.currentTarget.style.backgroundColor = '#131314';
                  e.currentTarget.style.color = '#e3e3e3';
                }
              }}
            >
              {testingSearqon ? <Spinner size={13} color="#a8c7fa" /> : <ShieldCheck size={13} color="#a8c7fa" />}
              <span>{testingSearqon ? 'Verifying Searqon...' : 'Test Scraper Connection'}</span>
            </button>

            {searqonResult && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.76rem',
                  fontFamily: "'IBM Plex Mono', monospace",
                  padding: '5px 12px',
                  borderRadius: '6px',
                  backgroundColor: searqonResult.ok ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                  border: searqonResult.ok ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                  color: searqonResult.ok ? '#6ee7b7' : '#fca5a5'
                }}
              >
                {searqonResult.ok ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                <span>{searqonResult.message}</span>
              </div>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '16px',
              borderTop: '1px solid rgba(255, 255, 255, 0.05)',
              gap: '16px'
            }}
          >
            <div>
              <div style={{ fontWeight: 500, fontSize: '0.84rem', color: '#e3e3e3' }}>
                Recursive Domain Crawling
              </div>
              <div style={{ fontSize: '0.74rem', color: '#8e918f', marginTop: '2px' }}>
                Discover and ingest linked pages under discovered domains automatically.
              </div>
            </div>
            <ToggleSwitch
              checked={!!settings.deep_crawl_enabled}
              onChange={(val) => onChange('deep_crawl_enabled', val)}
            />
          </div>
        </div>
      </div>

      {/* YouTube Integration */}
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
            <PlayCircle size={16} color="#ef4444" />
            <span>YouTube Transcript Microservice</span>
          </h3>
          <p style={{ fontSize: '0.78rem', color: '#8e918f', margin: 0 }}>
            Extract spoken audio transcripts from YouTube URLs added as notebook sources.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 500, color: '#c4c7c5' }}>
                YouTube Microservice URL
              </label>
              <span style={{ fontSize: '0.72rem', color: '#8e918f' }}>
                Local transcript proxy daemon
              </span>
            </div>
            <input
              type="text"
              value={settings.youtube_service_url || ''}
              onChange={(e) => onChange('youtube_service_url', e.target.value)}
              placeholder="http://127.0.0.1:6001"
              style={inputStyle}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </div>

          {/* Test YouTube Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleTestYouTube}
              disabled={testingYt}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '7px 16px',
                backgroundColor: '#131314',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#e3e3e3',
                borderRadius: '9999px',
                cursor: testingYt ? 'not-allowed' : 'pointer',
                fontWeight: 500,
                fontSize: '0.8rem',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                if (!testingYt) {
                  e.currentTarget.style.backgroundColor = '#282a2d';
                  e.currentTarget.style.color = '#ffffff';
                }
              }}
              onMouseLeave={(e) => {
                if (!testingYt) {
                  e.currentTarget.style.backgroundColor = '#131314';
                  e.currentTarget.style.color = '#e3e3e3';
                }
              }}
            >
              {testingYt ? <Spinner size={13} color="#a8c7fa" /> : <ShieldCheck size={13} color="#a8c7fa" />}
              <span>{testingYt ? 'Verifying YouTube Service...' : 'Test YouTube Service Connection'}</span>
            </button>

            {ytResult && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.76rem',
                  fontFamily: "'IBM Plex Mono', monospace",
                  padding: '5px 12px',
                  borderRadius: '6px',
                  backgroundColor: ytResult.ok ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                  border: ytResult.ok ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                  color: ytResult.ok ? '#6ee7b7' : '#fca5a5'
                }}
              >
                {ytResult.ok ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                <span>{ytResult.message}</span>
              </div>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '16px',
              borderTop: '1px solid rgba(255, 255, 255, 0.05)',
              gap: '16px'
            }}
          >
            <div>
              <div style={{ fontWeight: 500, fontSize: '0.84rem', color: '#e3e3e3' }}>
                Auto-Fetch Video Transcripts
              </div>
              <div style={{ fontSize: '0.74rem', color: '#8e918f', marginTop: '2px' }}>
                Extract and index spoken transcripts when YouTube videos appear in search results.
              </div>
            </div>
            <ToggleSwitch
              checked={!!settings.youtube_enabled}
              onChange={(val) => onChange('youtube_enabled', val)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
