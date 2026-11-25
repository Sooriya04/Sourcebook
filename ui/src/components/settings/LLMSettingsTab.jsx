import React, { useState } from 'react';
import {
  Server,
  Bot,
  Sparkles,
  Zap,
  Network,
  Cpu,
  ShieldCheck,
  Save,
  Eye,
  EyeOff,
  ChevronRight
} from 'lucide-react';
import {
  SettingsWorkspace,
  ServiceDirectory,
  ConfigurationPanel,
  ConnectionStatus
} from './workspace';
import { SettingsField, SettingsInput } from './common';
import Spinner from '../ui/Spinner';
import { DEFAULT_PROVIDER_CONFIGS } from '../../constants/providerDefaults';

const PROVIDER_GROUPS = [
  {
    group: 'Local Inference',
    items: [
      {
        id: 'ollama',
        name: 'Ollama Native',
        desc: 'Run open-weight models locally via Ollama daemon on port 11434.',
        docsUrl: 'https://github.com/ollama/ollama/blob/main/docs/api.md',
        icon: <Server size={15} />
      },
      {
        id: 'lmstudio',
        name: 'LM Studio',
        desc: 'Local OpenAI-compatible model server running on localhost:1234.',
        docsUrl: 'https://lmstudio.ai/docs/api',
        icon: <Server size={15} />
      },
      {
        id: 'localai',
        name: 'LocalAI',
        desc: 'Self-hosted drop-in OpenAI API replacement for local inference.',
        docsUrl: 'https://localai.io/basics/getting_started/',
        icon: <Cpu size={15} />
      },
      {
        id: 'vllm',
        name: 'vLLM Server',
        desc: 'High-throughput PagedAttention inference server for GPU clusters.',
        docsUrl: 'https://docs.vllm.ai/en/latest/serving/openai_compatible_server.html',
        icon: <Zap size={15} />
      }
    ]
  },
  {
    group: 'Cloud Providers',
    items: [
      {
        id: 'gemini',
        name: 'Google Gemini',
        desc: 'Gemini 1.5 Flash, 2.0 Flash, and Pro models via Google OpenAI endpoint.',
        docsUrl: 'https://ai.google.dev/gemini-api/docs/openai',
        icon: <Sparkles size={15} />
      },
      {
        id: 'openai',
        name: 'OpenAI',
        desc: 'GPT-4o, GPT-4o Mini, and o3-mini reasoning models.',
        docsUrl: 'https://platform.openai.com/docs/api-reference',
        icon: <Bot size={15} />
      },
      {
        id: 'anthropic',
        name: 'Anthropic Claude',
        desc: 'Claude 3.5 Sonnet and Haiku via OpenAI-compatible gateway.',
        docsUrl: 'https://docs.anthropic.com/en/api/getting-started',
        icon: <Sparkles size={15} />
      },
      {
        id: 'groq',
        name: 'Groq Cloud',
        desc: 'Ultra low-latency LPU inference for Llama 3.3 and Mixtral.',
        docsUrl: 'https://console.groq.com/docs/openai',
        icon: <Zap size={15} />
      },
      {
        id: 'deepseek',
        name: 'DeepSeek',
        desc: 'DeepSeek-V3 chat and DeepSeek-R1 reasoning models.',
        docsUrl: 'https://api-docs.deepseek.com/',
        icon: <Cpu size={15} />
      },
      {
        id: 'openrouter',
        name: 'OpenRouter',
        desc: 'Unified routing gateway across 200+ foundation models.',
        docsUrl: 'https://openrouter.ai/docs/quick-start',
        icon: <Network size={15} />
      },
      {
        id: 'nvidia',
        name: 'NVIDIA NIM',
        desc: 'Enterprise GPU-accelerated inference microservices.',
        docsUrl: 'https://docs.api.nvidia.com/nim/reference/llm-apis',
        icon: <Cpu size={15} />
      }
    ]
  },
  {
    group: 'Custom',
    items: [
      {
        id: 'openai_compatible',
        name: 'OpenAI Compatible',
        desc: 'Any custom private proxy or third-party OpenAI-spec endpoint.',
        icon: <Bot size={15} />
      }
    ]
  }
];

const LOCAL_PROVIDERS = new Set(['ollama', 'lmstudio', 'localai', 'vllm']);

export default function LLMSettingsTab({
  provider,
  savedProvider,
  setProvider,
  providerConfigs,
  onChangeConfig,
  testingKey,
  testStatus,
  testStatuses = {},
  onTestConnection,
  onSave,
  saving,
  isDirty
}) {
  const [showKey, setShowKey] = useState(false);
  const [showMobileConfig, setShowMobileConfig] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const allProviders = PROVIDER_GROUPS.flatMap((g) => g.items);
  const currentItem = allProviders.find((p) => p.id === provider) || allProviders[0];

  const meta = DEFAULT_PROVIDER_CONFIGS[provider] || DEFAULT_PROVIDER_CONFIGS.ollama || DEFAULT_PROVIDER_CONFIGS.openai;
  const currentConfig = (providerConfigs && providerConfigs[provider]) || meta;

  const isLocal = LOCAL_PROVIDERS.has(provider);
  const isActive = savedProvider === provider;

  const resolveConnectionState = (pId) => {
    const t = testStatuses[pId];
    if (t?.status === 'connecting') return 'connecting';
    if (t?.status === 'connected') return 'connected';
    if (t?.status === 'error') return 'error';
    const cfg = (providerConfigs && providerConfigs[pId]) || DEFAULT_PROVIDER_CONFIGS[pId];
    if (!LOCAL_PROVIDERS.has(pId) && !cfg?.apiKey?.trim()) {
      return 'not_configured';
    }
    if (savedProvider === pId) return 'active';
    return 'configured';
  };

  const currentStatusState = resolveConnectionState(provider);

  const handleSelect = (id) => {
    setProvider(id);
    setShowMobileConfig(true);
  };

  return (
    <SettingsWorkspace>
      <div className={`settings-workspace-left ${showMobileConfig ? 'mobile-hidden' : ''}`}>
        <ServiceDirectory
          searchPlaceholder="Search integrations..."
          groups={PROVIDER_GROUPS}
          selectedId={provider}
          onSelectItem={handleSelect}
          activeId={savedProvider}
          getItemStatus={resolveConnectionState}
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
          statusIndicator={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ConnectionStatus state={currentStatusState} />
              {isActive && currentStatusState !== 'active' && (
                <ConnectionStatus state="active" />
              )}
            </div>
          }
          actions={
            <>
              <button
                type="button"
                onClick={onTestConnection}
                disabled={testingKey}
                className="btn-secondary compact"
              >
                {testingKey ? (
                  <Spinner size={13} color="var(--text-primary)" />
                ) : (
                  <ShieldCheck size={14} style={{ color: 'var(--accent)' }} />
                )}
                <span>{testingKey ? 'Testing...' : 'Test Connection'}</span>
              </button>

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
          {testStatus && testStatus.status !== 'connecting' && (
            <div className={`settings-inline-banner ${testStatus.valid ? 'success' : 'error'}`}>
              <span className="banner-dot" />
              <span>{testStatus.message || testStatus.error}</span>
            </div>
          )}

          <div className="config-fields-group">
            <SettingsField
              label="Base Endpoint URL"
              hint="HTTP/HTTPS base URL for the inference API"
            >
              <SettingsInput
                type="text"
                value={currentConfig.baseUrl || ''}
                onChange={(e) => onChangeConfig(provider, 'baseUrl', e.target.value)}
                placeholder={meta.placeholderUrl || 'https://api.openai.com/v1'}
                mono
              />
            </SettingsField>

            <SettingsField
              label="Target Model Name"
              hint="Model identifier passed to the inference backend"
            >
              <SettingsInput
                type="text"
                value={currentConfig.model || ''}
                onChange={(e) => onChangeConfig(provider, 'model', e.target.value)}
                placeholder={meta.placeholderModel || 'gemma2'}
                mono
              />
            </SettingsField>

            {!isLocal && (
              <SettingsField
                label="API Key"
                hint="Stored locally in SQLite. Never shared externally."
              >
                <div style={{ position: 'relative', width: '100%' }}>
                  <SettingsInput
                    type={showKey ? 'text' : 'password'}
                    value={currentConfig.apiKey || ''}
                    onChange={(e) => onChangeConfig(provider, 'apiKey', e.target.value)}
                    placeholder={meta.placeholderKey || 'Enter API secret key'}
                    mono
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="password-toggle-btn"
                    title={showKey ? 'Hide API key' : 'Show API key'}
                    aria-label="Toggle API key visibility"
                  >
                    {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </SettingsField>
            )}
          </div>

          {/* Collapsible Advanced Configuration */}
          <div className="config-advanced-section">
            <button
              type="button"
              className="config-advanced-toggle"
              onClick={() => setAdvancedOpen((prev) => !prev)}
              aria-expanded={advancedOpen}
            >
              <ChevronRight size={14} className={`config-advanced-chevron ${advancedOpen ? 'open' : ''}`} />
              <span>Advanced Configuration</span>
            </button>

            {advancedOpen && (
              <div className="config-advanced-body">
                <SettingsField
                  label="Organization / Project ID"
                  hint="Optional organization identifier for enterprise OpenAI or proxy routing"
                >
                  <SettingsInput
                    type="text"
                    value={currentConfig.orgId || ''}
                    onChange={(e) => onChangeConfig(provider, 'orgId', e.target.value)}
                    placeholder="org-... (optional)"
                    mono
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
