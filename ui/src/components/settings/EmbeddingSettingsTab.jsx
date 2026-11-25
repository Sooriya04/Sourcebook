import React, { useState } from 'react';
import { Layers, Server, Bot, Save } from 'lucide-react';
import {
  SettingsWorkspace,
  ServiceDirectory,
  ConfigurationPanel,
  ConnectionStatus
} from './workspace';
import { SettingsField, SettingsInput } from './common';
import Spinner from '../ui/Spinner';

const EMBEDDING_GROUPS = [
  {
    group: 'Embedding Backends',
    items: [
      {
        id: 'local',
        name: 'Local Sentence-Transformers',
        desc: 'Built-in Python embedding engine running completely offline on CPU or GPU.',
        icon: <Layers size={15} />
      },
      {
        id: 'ollama',
        name: 'Ollama Embeddings API',
        desc: 'Dense vector embeddings generated via local Ollama daemon (/api/embeddings).',
        icon: <Server size={15} />
      },
      {
        id: 'openai',
        name: 'OpenAI Embeddings API',
        desc: 'Cloud or proxy embeddings using text-embedding-3-small or custom endpoints.',
        icon: <Bot size={15} />
      }
    ]
  }
];

export default function EmbeddingSettingsTab({ settings, onChange, onSave, saving, isDirty }) {
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
      <div className={`settings-workspace-left ${showMobileConfig ? 'mobile-hidden' : ''}`}>
        <ServiceDirectory
          searchPlaceholder="Search integrations..."
          groups={EMBEDDING_GROUPS}
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
          showBackButton={showMobileConfig}
          onBack={() => setShowMobileConfig(false)}
          isDirty={isDirty}
          statusIndicator={<ConnectionStatus state={isActive ? 'active' : 'configured'} />}
          actions={
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="btn-primary compact"
            >
              {saving ? <Spinner size={13} color="var(--text-primary)" /> : <Save size={14} />}
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          }
        >
          <div className="config-fields-group">
            <SettingsField
              label="Embedding Model Name"
              hint="Target model identifier (e.g. nomic-embed-text, all-MiniLM-L6-v2, text-embedding-3-small)"
            >
              <SettingsInput
                type="text"
                value={settings.embedding_model || 'nomic-embed-text'}
                onChange={(e) => onChange('embedding_model', e.target.value)}
                placeholder="nomic-embed-text"
                mono
              />
            </SettingsField>

            {selectedService !== 'local' && (
              <SettingsField
                label="Embedding Endpoint URL"
                hint={
                  selectedService === 'ollama'
                    ? 'Ollama endpoint (e.g. http://localhost:11434)'
                    : 'OpenAI-compatible embeddings URL'
                }
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
              <p className="config-helper-note">
                Built-in sentence-transformers runs locally without requiring an external daemon or API key.
              </p>
            )}
          </div>
        </ConfigurationPanel>
      </div>
    </SettingsWorkspace>
  );
}
