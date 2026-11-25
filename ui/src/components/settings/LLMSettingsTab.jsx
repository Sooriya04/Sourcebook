import React from 'react';
import { Cpu } from 'lucide-react';
import ProviderCardSelector from './llm/ProviderCardSelector';
import ProviderInputFields from './llm/ProviderInputFields';
import TestConnectionBar from './llm/TestConnectionBar';
import { SettingsCard } from './common';
import Badge from '../ui/Badge';
import { DEFAULT_PROVIDER_CONFIGS } from '../../constants/providerDefaults';

export default function LLMSettingsTab({
  provider,
  savedProvider,
  setProvider,
  providerConfigs,
  onChangeConfig,
  testingKey,
  testStatus,
  onTestConnection
}) {
  const meta = DEFAULT_PROVIDER_CONFIGS[provider] || DEFAULT_PROVIDER_CONFIGS.ollama || DEFAULT_PROVIDER_CONFIGS.openai;
  const current = (providerConfigs && providerConfigs[provider]) || meta;
  const isPending = savedProvider && provider !== savedProvider;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      <SettingsCard
        icon={<Cpu size={16} />}
        title="Inference Provider & Model Protocol"
        description="Select the inference backend and configure connection parameters for grounded RAG synthesis."
        badge={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Badge variant="primary" size="sm">
              Active: {savedProvider || provider}
            </Badge>
            {isPending && (
              <Badge variant="warning" size="sm">
                Selected: {provider} (Unsaved)
              </Badge>
            )}
          </div>
        }
      >
        <ProviderCardSelector
          provider={provider}
          savedProvider={savedProvider}
          onSelectProvider={setProvider}
        />

        <ProviderInputFields
          provider={provider}
          currentConfig={current}
          meta={meta}
          onChangeConfig={onChangeConfig}
        />

        <TestConnectionBar
          testingKey={testingKey}
          testStatus={testStatus}
          onTestConnection={onTestConnection}
        />
      </SettingsCard>
    </div>
  );
}
