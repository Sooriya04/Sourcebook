import React, { useState } from 'react';
import { Search, Globe, ShieldCheck, Save, Layers, ChevronRight } from 'lucide-react';
import { pingSourceURL } from '../../services/sourcebookApi';
import {
  SettingsWorkspace,
  ServiceDirectory,
  ConfigurationPanel,
  ConnectionStatus
} from './workspace';
import { SettingsField, SettingsInput } from './common';
import Spinner from '../ui/Spinner';

const SEARCH_GROUPS = [
  {
    group: 'Metasearch & Web Discovery',
    items: [
      {
        id: 'searxng',
        name: 'SearXNG Metasearch',
        desc: 'Private self-hosted metasearch container aggregating 70+ web engines.',
        docsUrl: 'https://docs.searxng.org/',
        icon: <Search size={15} />
      },
      {
        id: 'duckduckgo',
        name: 'DuckDuckGo Scraper',
        desc: 'Fast HTML search fallback requiring no local container.',
        icon: <Globe size={15} />
      },
      {
        id: 'both',
        name: 'Dual Hybrid Search',
        desc: 'Parallel query dispatch merging SearXNG and DuckDuckGo results.',
        icon: <Layers size={15} />
      }
    ]
  }
];

export default function SearchSettingsTab({ settings, onChange, onSave, saving, isDirty }) {
  const [selectedService, setSelectedService] = useState(() => settings.search_provider || 'searxng');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [showMobileConfig, setShowMobileConfig] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

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

  const statusState = testing
    ? 'connecting'
    : testResult?.ok
      ? 'connected'
      : testResult?.ok === false
        ? 'error'
        : isActive
          ? 'active'
          : 'configured';

  return (
    <SettingsWorkspace>
      <div className={`settings-workspace-left ${showMobileConfig ? 'mobile-hidden' : ''}`}>
        <ServiceDirectory
          searchPlaceholder="Search integrations..."
          groups={SEARCH_GROUPS}
          selectedId={selectedService}
          onSelectItem={handleSelectService}
          activeId={activeProvider}
          getItemStatus={(id) => (id === activeProvider ? 'active' : 'configured')}
        />
      </div>

      <div className={`settings-workspace-right ${!showMobileConfig ? 'mobile-hidden' : ''}`}>
        <ConfigurationPanel
          title={currentItem.name}
          description={currentItem.desc}
          icon={currentItem.icon}
          docsUrl={currentItem.docsUrl}
          showBackButton={showMobileConfig}
          onBack={() => setShowMobileConfig(false)}
          isDirty={isDirty}
          statusIndicator={<ConnectionStatus state={statusState} />}
          actions={
            <>
              {(selectedService === 'searxng' || selectedService === 'both') && (
                <button
                  type="button"
                  onClick={handleTestSearxng}
                  disabled={testing}
                  className="btn-secondary compact"
                >
                  {testing ? (
                    <Spinner size={13} color="var(--text-primary)" />
                  ) : (
                    <ShieldCheck size={14} style={{ color: 'var(--accent)' }} />
                  )}
                  <span>{testing ? 'Testing...' : 'Test Connection'}</span>
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
          {testResult && (
            <div className={`settings-inline-banner ${testResult.ok ? 'success' : 'error'}`}>
              <span className="banner-dot" />
              <span>{testResult.message}</span>
            </div>
          )}

          <div className="config-fields-group">
            {(selectedService === 'searxng' || selectedService === 'both') && (
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
            )}

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
          </div>

          {selectedService === 'both' && (
            <div className="config-advanced-section">
              <button
                type="button"
                className="config-advanced-toggle"
                onClick={() => setAdvancedOpen((prev) => !prev)}
                aria-expanded={advancedOpen}
              >
                <ChevronRight size={14} className={`config-advanced-chevron ${advancedOpen ? 'open' : ''}`} />
                <span>Advanced Split Quotas</span>
              </button>

              {advancedOpen && (
                <div className="config-advanced-body">
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
                </div>
              )}
            </div>
          )}
        </ConfigurationPanel>
      </div>
    </SettingsWorkspace>
  );
}
