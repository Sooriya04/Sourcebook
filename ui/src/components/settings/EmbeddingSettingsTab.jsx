import React from 'react';
import { Layers } from 'lucide-react';
import {
  SettingsCard,
  SettingsField,
  SettingsInput,
  SettingsSelect
} from './common';

export default function EmbeddingSettingsTab({ settings, onChange }) {
  const providerOptions = [
    { value: 'local', label: 'Local Python Sentence-Transformers (Built-in)' },
    { value: 'ollama', label: 'Ollama Embeddings API' },
    { value: 'openai', label: 'OpenAI / Compatible Embeddings API' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      <SettingsCard
        icon={<Layers size={16} />}
        title="Vector Embeddings & Semantic Index"
        description="Configure dense vector models for chunk embeddings, semantic reranking, and context retrieval."
      >
        <SettingsField
          label="Embedding Provider"
          hint="Vector computation backend"
        >
          <SettingsSelect
            value={settings.embedding_provider || 'local'}
            onChange={(e) => onChange('embedding_provider', e.target.value)}
            options={providerOptions}
          />
        </SettingsField>

        <SettingsField
          label="Embedding Endpoint URL"
          hint="Leave blank if using local provider"
        >
          <SettingsInput
            value={settings.embedding_url || ''}
            onChange={(e) => onChange('embedding_url', e.target.value)}
            placeholder="http://localhost:11434 (leave blank for local)"
            mono
          />
        </SettingsField>

        <SettingsField
          label="Embedding Model Name"
          hint="Target model weights identifier"
        >
          <SettingsInput
            value={settings.embedding_model || 'nomic-embed-text'}
            onChange={(e) => onChange('embedding_model', e.target.value)}
            placeholder="nomic-embed-text"
            mono
          />
        </SettingsField>
      </SettingsCard>
    </div>
  );
}
