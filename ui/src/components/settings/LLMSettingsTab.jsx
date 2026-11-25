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
  EyeOff 
} from 'lucide-react';
import { 
  SettingsWorkspace, 
  ServiceDirectory, 
  ConfigurationPanel 
} from './workspace';
import { SettingsField, SettingsInput } from './common';
import Badge from '../ui/Badge';
import Spinner from '../ui/Spinner';
import { DEFAULT_PROVIDER_CONFIGS } from '../../constants/providerDefaults';

const PROVIDER_GROUPS = [
  {
    group: 'Local Inference',
    items: [
      {
        id: 'ollama',
        name: 'Ollama Native',
        desc: 'Local daemon running on localhost:11434',
        tag: 'Local Offline',
        icon: <Server size={14} />
      },
      {
        id: 'lmstudio',
        name: 'LM Studio',
        desc: 'Local model server on localhost:1234',
        tag: 'Local Desktop',
        icon: <Server size={14} />
      },
      {
        id: 'localai',
        name: 'LocalAI',
        desc: 'Self-hosted local OpenAI drop-in replacement',
        tag: 'Self-Hosted',
        icon: <Cpu size={14} />
      },
      {
        id: 'vllm',
        name: 'vLLM Server',
        desc: 'High-throughput local LLM serving engine',
        tag: 'GPU Engine',
        icon: <Zap size={14} />
      }
    ]
  },
  {
    group: 'Cloud Providers',
    items: [
      {
        id: 'gemini',
        name: 'Google Gemini',
        desc: 'gemini-1.5-flash, gemini-2.0 via OpenAI spec',
        tag: 'Google Cloud',
        icon: <Sparkles size={14} />
      },
      {
        id: 'openai',
        name: 'OpenAI',
        desc: 'gpt-4o, gpt-4o-mini, o3-mini models',
        tag: 'Standard API',
        icon: <Bot size={14} />
      },
      {
        id: 'anthropic',
        name: 'Anthropic Claude',
        desc: 'Claude 3.5 Sonnet & Haiku via compatible gateway',
        tag: 'Anthropic Spec',
        icon: <Sparkles size={14} />
      },
      {
        id: 'groq',
        name: 'Groq Cloud',
        desc: 'Ultra low-latency LPU inference',
        tag: 'Fast LPUs',
        icon: <Zap size={14} />
      },
      {
        id: 'deepseek',
        name: 'DeepSeek',
        desc: 'deepseek-chat and reasoning models',
        tag: 'Reasoning API',
        icon: <Cpu size={14} />
      },
      {
        id: 'openrouter',
        name: 'OpenRouter',
        desc: 'Unified gateway across 200+ foundation models',
        tag: 'Multi-Model',
        icon: <Network size={14} />
      },
      {
        id: 'nvidia',
        name: 'NVIDIA NIM',
        desc: 'NVIDIA accelerated microservice endpoints',
        tag: 'Enterprise NIM',
        icon: <Cpu size={14} />
      }
    ]
  },
  {
    group: 'Custom Endpoints',
    items: [
      {
        id: 'openai_compatible',
        name: 'OpenAI Compatible',
        desc: 'Custom private proxy or third-party OpenAI-compatible API',
        tag: 'Custom API',
        icon: <Bot size={14} />
      }
    ]
  }
];

export default function LLMSettingsTab({
  provider,
  savedProvider,
  setProvider,
  providerConfigs,
  onChangeConfig,
  testingKey,
  testStatus,
  onTestConnection,
  onSave,
  saving
}) {
  const [showKey, setShowKey] = useState(false);
  const [showMobileConfig, setShowMobileConfig] = useState(false);

  // Flatten items to look up metadata
  const allProviders = PROVIDER_GROUPS.flatMap((g) => g.items);
  const currentItem = allProviders.find((p) => p.id === provider) || allProviders[0];

  const meta = DEFAULT_PROVIDER_CONFIGS[provider] || DEFAULT_PROVIDER_CONFIGS.ollama || DEFAULT_PROVIDER_CONFIGS.openai;
  const currentConfig = (providerConfigs && providerConfigs[provider]) || meta;

  const isPending = savedProvider && provider !== savedProvider;
  const isActive = savedProvider === provider;

  const handleSelect = (id) => {
    setProvider(id);
    setShowMobileConfig(true);
  };

  return (
    <SettingsWorkspace>
      {/* Left Panel: Searchable Provider Directory */}
      <div className={`settings-workspace-left ${showMobileConfig ? 'mobile-hidden' : ''}`}>
        <ServiceDirectory
          searchPlaceholder="Search providers (Ollama, Gemini, Groq...)"
          groups={PROVIDER_GROUPS}
          selectedId={provider}
          onSelectItem={handleSelect}
          activeId={savedProvider}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {isActive ? (
                <Badge variant="primary" size="sm">
                  Active Engine
                </Badge>
              ) : isPending ? (
                <Badge variant="warning" size="sm">
                  Selected (Unsaved)
                </Badge>
              ) : (
                <Badge variant="neutral" size="sm">
                  Inactive
                </Badge>
              )}
            </div>
          }
          actions={
            <div className="settings-form-actions-cluster">
              <button
                type="button"
                onClick={onTestConnection}
                disabled={testingKey}
                className="btn-secondary compact"
              >
                {testingKey ? <Spinner size={13} color="var(--text-primary)" /> : <ShieldCheck size={14} style={{ color: 'var(--accent)' }} />}
                <span>{testingKey ? 'Verifying...' : 'Test Connection'}</span>
              </button>

              <button
                type="button"
                onClick={onSave}
                disabled={saving}
                className="btn-primary compact"
              >
                {saving ? <Spinner size={13} color="var(--text-primary)" /> : <Save size={14} />}
                <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
              </button>
            </div>
          }
        >
          {testStatus && (
            <div className={`settings-inline-banner ${testStatus.valid ? 'success' : 'error'}`}>
              <span className="banner-dot" />
              <span>{testStatus.message || testStatus.error}</span>
            </div>
          )}

          <div className="settings-fields-stack">
            {/* Base Endpoint URL */}
            <SettingsField
              label="Base Endpoint URL"
              hint="HTTP/HTTPS address of the inference server"
            >
              <SettingsInput
                type="text"
                value={currentConfig.baseUrl || ''}
                onChange={(e) => onChangeConfig(provider, 'baseUrl', e.target.value)}
                placeholder={meta.placeholderUrl || 'http://localhost:11434'}
                mono
              />
            </SettingsField>

            {/* Target Model Name */}
            <SettingsField
              label="Target Model Name"
              hint="Canonical model identifier accepted by the backend"
            >
              <SettingsInput
                type="text"
                value={currentConfig.model || ''}
                onChange={(e) => onChangeConfig(provider, 'model', e.target.value)}
                placeholder={meta.placeholderModel || 'gemma2'}
                mono
              />
            </SettingsField>

            {/* API Key */}
            {provider !== 'ollama' && provider !== 'lmstudio' && (
              <SettingsField
                label="Provider API Key"
                hint="Authentication credential. Stored securely in SQLite"
              >
                <div style={{ position: 'relative', width: '100%' }}>
                  <SettingsInput
                    type={showKey ? 'text' : 'password'}
                    value={currentConfig.apiKey || ''}
                    onChange={(e) => onChangeConfig(provider, 'apiKey', e.target.value)}
                    placeholder={meta.placeholderKey || 'API Secret Key'}
                    mono
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="password-toggle-btn"
                    title={showKey ? 'Hide secret key' : 'Show secret key'}
                    aria-label="Toggle password visibility"
                  >
                    {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </SettingsField>
            )}
          </div>
        </ConfigurationPanel>
      </div>
    </SettingsWorkspace>
  );
}
