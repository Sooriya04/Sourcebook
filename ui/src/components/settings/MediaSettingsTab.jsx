import React, { useState } from 'react';
import { Globe, PlayCircle, Network, ShieldCheck, Save, ChevronRight } from 'lucide-react';
import { pingSourceURL } from '../../services/sourcebookApi';
import {
  SettingsWorkspace,
  ServiceDirectory,
  ConfigurationPanel,
  ConnectionStatus
} from './workspace';
import { SettingsField, SettingsInput, SettingsToggleRow } from './common';
import Spinner from '../ui/Spinner';

const MEDIA_GROUPS = [
  {
    group: 'Web & Media Extraction',
    items: [
      {
        id: 'searqon',
        name: 'Searqon Batch Scraper',
        desc: 'Parallel Go microservice extracting clean markdown from web URLs.',
        icon: <Globe size={15} />
      },
      {
        id: 'youtube',
        name: 'YouTube Transcript Service',
        desc: 'Extract video captions and audio transcripts via Whisper pipeline.',
        icon: <PlayCircle size={15} />
      },
      {
        id: 'deep_crawl',
        name: 'Deep Web Crawler',
        desc: 'Recursive multi-hop link discovery and citation tree indexing.',
        icon: <Network size={15} />
      }
    ]
  }
];

export default function MediaSettingsTab({ settings, onChange, onSave, saving, isDirty }) {
  const [selectedService, setSelectedService] = useState('searqon');
  const [testingSearqon, setTestingSearqon] = useState(false);
  const [searqonResult, setSearqonResult] = useState(null);
  const [testingYt, setTestingYt] = useState(false);
  const [ytResult, setYtResult] = useState(null);
  const [showMobileConfig, setShowMobileConfig] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

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

  const handleSelectService = (id) => {
    setSelectedService(id);
    setShowMobileConfig(true);
  };

  const allServices = MEDIA_GROUPS.flatMap((g) => g.items);
  const currentItem = allServices.find((s) => s.id === selectedService) || allServices[0];

  const getStatusState = () => {
    if (selectedService === 'searqon') {
      if (testingSearqon) return 'connecting';
      if (searqonResult?.ok) return 'connected';
      if (searqonResult?.ok === false) return 'error';
      return settings.searqon_url ? 'configured' : 'not_configured';
    }
    if (selectedService === 'youtube') {
      if (testingYt) return 'connecting';
      if (ytResult?.ok) return 'connected';
      if (ytResult?.ok === false) return 'error';
      return settings.youtube_enabled ? 'active' : 'disconnected';
    }
    return settings.deep_crawl_enabled ? 'active' : 'disconnected';
  };

  const activeBanner = selectedService === 'searqon' ? searqonResult : selectedService === 'youtube' ? ytResult : null;
  const isTesting = selectedService === 'searqon' ? testingSearqon : testingYt;

  return (
    <SettingsWorkspace>
      <div className={`settings-workspace-left ${showMobileConfig ? 'mobile-hidden' : ''}`}>
        <ServiceDirectory
          searchPlaceholder="Search integrations..."
          groups={MEDIA_GROUPS}
          selectedId={selectedService}
          onSelectItem={handleSelectService}
        />
      </div>

      <div className={`settings-workspace-right ${!showMobileConfig ? 'mobile-hidden' : ''}`}>
        <ConfigurationPanel
          title={currentItem.name}
          description={currentItem.desc}
          icon={currentItem.icon}
          showBackButton={showMobileConfig}
          onBack={() => setShowMobileConfig(false)}
          isDirty={isDirty}
          statusIndicator={<ConnectionStatus state={getStatusState()} />}
          actions={
            <>
              {(selectedService === 'searqon' || selectedService === 'youtube') && (
                <button
                  type="button"
                  onClick={selectedService === 'searqon' ? handleTestSearqon : handleTestYouTube}
                  disabled={isTesting}
                  className="btn-secondary compact"
                >
                  {isTesting ? (
                    <Spinner size={13} color="var(--text-primary)" />
                  ) : (
                    <ShieldCheck size={14} style={{ color: 'var(--accent)' }} />
                  )}
                  <span>{isTesting ? 'Testing...' : 'Test Connection'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={onSave}
                disabled={saving}
                className="btn-primary compact"
              >
                {saving ? <Spinner size={13} color="var(--text-primary)" /> : <Save size={14} />}
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </>
          }
        >
          {activeBanner && (
            <div className={`settings-inline-banner ${activeBanner.ok ? 'success' : 'error'}`}>
              <span className="banner-dot" />
              <span>{activeBanner.message}</span>
            </div>
          )}

          <div className="config-fields-group">
            {selectedService === 'searqon' && (
              <SettingsField
                label="Searqon Batch Scrape URL"
                hint="Endpoint for parallel web scraping daemon (default: http://127.0.0.1:4001/scrape/batch)"
              >
                <SettingsInput
                  type="text"
                  value={settings.searqon_url || ''}
                  onChange={(e) => onChange('searqon_url', e.target.value)}
                  placeholder="http://127.0.0.1:4001/scrape/batch"
                  mono
                />
              </SettingsField>
            )}

            {selectedService === 'youtube' && (
              <>
                <SettingsToggleRow
                  label="Enable YouTube Ingestion"
                  description="Extract transcripts and captions directly from YouTube video URLs"
                  checked={settings.youtube_enabled || false}
                  onChange={(e) => onChange('youtube_enabled', e.target.checked)}
                />

                <SettingsField
                  label="YouTube Service URL"
                  hint="Local transcript extractor service daemon (default: http://127.0.0.1:6001)"
                >
                  <SettingsInput
                    type="text"
                    value={settings.youtube_service_url || ''}
                    onChange={(e) => onChange('youtube_service_url', e.target.value)}
                    placeholder="http://127.0.0.1:6001"
                    mono
                  />
                </SettingsField>

                <SettingsField
                  label="Max Video Results Ingested"
                  hint="Upper bound of video captions extracted per search query"
                >
                  <SettingsInput
                    type="number"
                    value={settings.youtube_max_sources || 3}
                    onChange={(e) => onChange('youtube_max_sources', parseInt(e.target.value, 10) || 3)}
                    min={1}
                    max={10}
                  />
                </SettingsField>
              </>
            )}

            {selectedService === 'deep_crawl' && (
              <>
                <SettingsToggleRow
                  label="Enable Deep Web Crawling"
                  description="Recursively crawl hyperlinks found in search results to build deeper context"
                  checked={settings.deep_crawl_enabled || false}
                  onChange={(e) => onChange('deep_crawl_enabled', e.target.checked)}
                />

                <div className="config-advanced-section">
                  <button
                    type="button"
                    className="config-advanced-toggle"
                    onClick={() => setAdvancedOpen((prev) => !prev)}
                    aria-expanded={advancedOpen}
                  >
                    <ChevronRight size={14} className={`config-advanced-chevron ${advancedOpen ? 'open' : ''}`} />
                    <span>Crawl Limits & Depth</span>
                  </button>

                  {advancedOpen && (
                    <div className="config-advanced-body">
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <SettingsField label="Crawl Page Limit" hint="Maximum linked pages per crawl">
                          <SettingsInput
                            type="number"
                            value={settings.deep_crawl_limit || 5}
                            onChange={(e) => onChange('deep_crawl_limit', parseInt(e.target.value, 10) || 5)}
                            min={1}
                            max={20}
                          />
                        </SettingsField>

                        <SettingsField label="Crawl Depth" hint="Recursion depth limit (hops)">
                          <SettingsInput
                            type="number"
                            value={settings.deep_crawl_depth || 1}
                            onChange={(e) => onChange('deep_crawl_depth', parseInt(e.target.value, 10) || 1)}
                            min={1}
                            max={3}
                          />
                        </SettingsField>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </ConfigurationPanel>
      </div>
    </SettingsWorkspace>
  );
}
