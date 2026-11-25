import React, { useState } from 'react';
import { Globe, PlayCircle, Network, ShieldCheck, Save } from 'lucide-react';
import { pingSourceURL } from '../../services/sourcebookApi';
import { 
  SettingsWorkspace, 
  ServiceDirectory, 
  ConfigurationPanel 
} from './workspace';
import { 
  SettingsField, 
  SettingsInput, 
  SettingsToggleRow, 
  SettingsActionBtn, 
  SettingsStatusBanner 
} from './common';
import Badge from '../ui/Badge';
import Spinner from '../ui/Spinner';

const MEDIA_GROUPS = [
  {
    group: 'Web & Media Extraction',
    items: [
      {
        id: 'searqon',
        name: 'Searqon Batch Scraper',
        desc: 'High-throughput parallel Go microservice extracting markdown from web pages',
        tag: 'Core Scraper',
        icon: <Globe size={14} />
      },
      {
        id: 'youtube',
        name: 'YouTube Transcript Service',
        desc: 'Direct YouTube video extraction and Whisper audio transcript pipeline',
        tag: 'Media Ingestion',
        icon: <PlayCircle size={14} />
      },
      {
        id: 'deep_crawl',
        name: 'Deep Web Crawler',
        desc: 'Multi-hop recursive hyperlink discovery and citation tree indexing',
        tag: 'Crawl Engine',
        icon: <Network size={14} />
      }
    ]
  }
];

export default function MediaSettingsTab({ settings, onChange, onSave, saving }) {
  const [selectedService, setSelectedService] = useState('searqon');
  const [testingSearqon, setTestingSearqon] = useState(false);
  const [searqonResult, setSearqonResult] = useState(null);
  const [testingYt, setTestingYt] = useState(false);
  const [ytResult, setYtResult] = useState(null);
  const [showMobileConfig, setShowMobileConfig] = useState(false);

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

  return (
    <SettingsWorkspace>
      {/* Left Panel: Media Services Directory */}
      <div className={`settings-workspace-left ${showMobileConfig ? 'mobile-hidden' : ''}`}>
        <ServiceDirectory
          searchPlaceholder="Search scraping & media services..."
          groups={MEDIA_GROUPS}
          selectedId={selectedService}
          onSelectItem={handleSelectService}
        />
      </div>

      {/* Right Panel: Configuration Workspace */}
      <div className={`settings-workspace-right ${!showMobileConfig ? 'mobile-hidden' : ''}`}>
        <ConfigurationPanel
          title={currentItem.name}
          description={currentItem.desc}
          icon={currentItem.icon}
          showBackButton={showMobileConfig}
          onBack={() => setShowMobileConfig(false)}
          badge={
            <Badge variant="neutral" size="sm">
              Service
            </Badge>
          }
          actions={
            <div className="settings-form-actions-cluster">
              <button
                type="button"
                onClick={onSave}
                disabled={saving}
                className="btn-primary compact"
              >
                {saving ? <Spinner size={13} color="var(--text-primary)" /> : <Save size={14} />}
                <span>{saving ? 'Saving...' : 'Save Settings'}</span>
              </button>
            </div>
          }
        >
          <div className="settings-fields-stack">
            {/* Searqon Scraper Config */}
            {selectedService === 'searqon' && (
              <>
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
              </>
            )}

            {/* YouTube Service Config */}
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

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <SettingsActionBtn
                    onClick={handleTestYouTube}
                    disabled={testingYt}
                    loading={testingYt}
                    icon={<ShieldCheck size={14} style={{ color: 'var(--accent)' }} />}
                  >
                    {testingYt ? 'Verifying YouTube Service...' : 'Test YouTube Connection'}
                  </SettingsActionBtn>
                  <SettingsStatusBanner status={ytResult} />
                </div>

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

            {/* Deep Crawler Config */}
            {selectedService === 'deep_crawl' && (
              <>
                <SettingsToggleRow
                  label="Enable Deep Web Crawling"
                  description="Recursively crawl hyperlinks found in search results to build deeper context"
                  checked={settings.deep_crawl_enabled || false}
                  onChange={(e) => onChange('deep_crawl_enabled', e.target.checked)}
                />

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
              </>
            )}
          </div>
        </ConfigurationPanel>
      </div>
    </SettingsWorkspace>
  );
}
