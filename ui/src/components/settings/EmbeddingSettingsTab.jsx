import React, { useState } from 'react';
import { Layers, Server, Bot, Save } from 'lucide-react';
import { 
  SettingsWorkspace, 
  ServiceDirectory, 
  ConfigurationPanel 
} from './workspace';
import { SettingsField, SettingsInput } from './common';
import Badge from '../ui/Badge';
import Spinner from '../ui/Spinner';

const EMBEDDING_GROUPS = [
  {
    group: 'Embedding Backends',
    items: [
      {
        id: 'local',
        name: 'Local Sentence-Transformers',
        desc: 'Built-in Python embedding engine running entirely offline on CPU/GPU',
        tag: 'Built-in',
        icon: <Layers size={14} />
      },
      {
        id: 'ollama',
        name: 'Ollama Embeddings API',
        desc: 'Dense embeddings generated via local Ollama daemon (/api/embeddings)',
        tag: 'Local Ollama',
        icon: <Server size={14} />
      },
      {
        id: 'openai',
        name: 'OpenAI Embeddings API',
        desc: 'Cloud or proxy embeddings using text-embedding-3-small or custom specs',
        tag: 'Cloud / Proxy',
        icon: <Bot size={14} />
      }
    ]
  }
];

export default function EmbeddingSettingsTab({ settings, onChange, onSave, saving }) {
  const [selectedService, setSelectedService] = useState(() => settings.embedding_provider || 'local');
  const [showMobileConfig, setShowMobileConfig] = useState(false);

  const activeProvider = settings.embedding_provider || 'local';

  const handleSelectService = (id) => {
    setSelectedService(id);
    onChange('embedding_provider', id);
    setShowMobileConfig(true);
  };

  const allServices = EMBEDDING_GROUPS.flatMap((g) => g.items);
  const currentItem = allServices.find((s) => s.id === selectedService) || allServices[0];
  const isActive = activeProvider === selectedService;

  return (
    <SettingsWorkspace>
      {/* Left Panel: Embeddings Directory */}
      <div className={`settings-workspace-left ${showMobileConfig ? 'mobile-hidden' : ''}`}>
        <ServiceDirectory
          searchPlaceholder="Search embedding backends..."
          groups={EMBEDDING_GROUPS}
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
            {/* Model Name */}
            <SettingsField
              label="Embedding Model Name"
              hint="Target model weights (e.g. nomic-embed-text, all-MiniLM-L6-v2, text-embedding-3-small)"
            >
              <SettingsInput
                type="text"
                value={settings.embedding_model || 'nomic-embed-text'}
                onChange={(e) => onChange('embedding_model', e.target.value)}
                placeholder="nomic-embed-text"
                mono
              />
            </SettingsField>

            {/* Endpoint URL (if not built-in local) */}
            {selectedService !== 'local' && (
              <SettingsField
                label="Embedding Endpoint URL"
                hint={selectedService === 'ollama' ? 'Ollama endpoint (e.g. http://localhost:11434)' : 'OpenAI-compatible embeddings URL'}
              >
                <SettingsInput
                  type="text"
                  value={settings.embedding_url || ''}
                  onChange={(e) => onChange('embedding_url', e.target.value)}
                  placeholder={selectedService === 'ollama' ? 'http://localhost:11434' : 'https://api.openai.com/v1'}
                  mono
                />
              </SettingsField>
            )}

            {selectedService === 'local' && (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', lineHeight: 1.5, marginTop: '8px' }}>
                Note: Built-in sentence-transformers runs locally without requiring an external daemon or API key.
              </p>
            )}
          </div>
        </ConfigurationPanel>
      </div>
    </SettingsWorkspace>
  );
}
