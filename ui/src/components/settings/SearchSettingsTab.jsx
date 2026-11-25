import React, { useState } from 'react';
import { Search, Globe, ShieldCheck, Save, Layers } from 'lucide-react';
import { pingSourceURL } from '../../services/sourcebookApi';
import { 
  SettingsWorkspace, 
  ServiceDirectory, 
  ConfigurationPanel 
} from './workspace';
import { 
  SettingsField, 
  SettingsInput, 
  SettingsActionBtn, 
  SettingsStatusBanner 
} from './common';
import Badge from '../ui/Badge';
import Spinner from '../ui/Spinner';

const SEARCH_GROUPS = [
  {
    group: 'Discovery Engines',
    items: [
      {
        id: 'searxng',
        name: 'SearXNG Metasearch',
        desc: 'Private metasearch container aggregating 70+ search engines',
        tag: 'Recommended',
        icon: <Search size={14} />
      },
      {
        id: 'duckduckgo',
        name: 'DuckDuckGo Scraper',
        desc: 'Direct HTML search scraper without local container requirements',
        tag: 'Fallback',
        icon: <Globe size={14} />
      },
      {
        id: 'both',
        name: 'Dual Hybrid Search',
        desc: 'Parallel discovery dispatch querying SearXNG and DDG simultaneously',
        tag: 'Hybrid',
        icon: <Layers size={14} />
      }
    ]
  }
];

export default function SearchSettingsTab({ settings, onChange, onSave, saving }) {
  const [selectedService, setSelectedService] = useState(() => settings.search_provider || 'searxng');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [showMobileConfig, setShowMobileConfig] = useState(false);

  const activeProvider = settings.search_provider || 'searxng';

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

  const handleSelectService = (id) => {
    setSelectedService(id);
    onChange('search_provider', id);
    setShowMobileConfig(true);
  };

  const allServices = SEARCH_GROUPS.flatMap((g) => g.items);
  const currentItem = allServices.find((s) => s.id === selectedService) || allServices[0];
  const isActive = activeProvider === selectedService;

  return (
    <SettingsWorkspace>
      {/* Left Panel: Search Directory */}
      <div className={`settings-workspace-left ${showMobileConfig ? 'mobile-hidden' : ''}`}>
        <ServiceDirectory
          searchPlaceholder="Search discovery engines..."
          groups={SEARCH_GROUPS}
          selectedId={selectedService}
          onSelectItem={handleSelectService}
          activeId={activeProvider}
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
            isActive ? (
              <Badge variant="primary" size="sm">
                Active Provider
              </Badge>
            ) : (
              <Badge variant="neutral" size="sm">
                Configuring
              </Badge>
            )
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
            {/* SearXNG Specific Endpoint Settings */}
            {(selectedService === 'searxng' || selectedService === 'both') && (
              <>
                <SettingsField
                  label="SearXNG Instance URL"
                  hint="Metasearch container address (default: http://localhost:8080)"
                >
                  <SettingsInput
                    type="text"
                    value={settings.searxng_url || ''}
                    onChange={(e) => onChange('searxng_url', e.target.value)}
                    placeholder="http://localhost:8080"
                    mono
                  />
                </SettingsField>

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
              </>
            )}

            {/* Max Scraped Pages per Query */}
            <SettingsField
              label="Max Scraped Pages per Query"
              hint="Upper bound of search result pages ingested into RAG context (Range: 1 - 25)"
            >
              <SettingsInput
                type="number"
                value={settings.max_sources || 5}
                onChange={(e) => onChange('max_sources', parseInt(e.target.value, 10) || 5)}
                min={1}
                max={25}
              />
            </SettingsField>

            {/* Split controls if dual hybrid */}
            {selectedService === 'both' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <SettingsField label="SearXNG Quota" hint="Sources allocated to SearXNG">
                  <SettingsInput
                    type="number"
                    value={settings.searxng_split || 3}
                    onChange={(e) => onChange('searxng_split', parseInt(e.target.value, 10) || 3)}
                    min={1}
                    max={15}
                  />
                </SettingsField>

                <SettingsField label="DuckDuckGo Quota" hint="Sources allocated to DuckDuckGo">
                  <SettingsInput
                    type="number"
                    value={settings.ddg_split || 2}
                    onChange={(e) => onChange('ddg_split', parseInt(e.target.value, 10) || 2)}
                    min={1}
                    max={15}
                  />
                </SettingsField>
              </div>
            )}
          </div>
        </ConfigurationPanel>
      </div>
    </SettingsWorkspace>
  );
}
