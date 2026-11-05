import React from 'react';
import { Cpu } from 'lucide-react';
import ProviderCardSelector from './llm/ProviderCardSelector';
import ProviderInputFields from './llm/ProviderInputFields';
import TestConnectionBar from './llm/TestConnectionBar';
import { DEFAULT_PROVIDER_CONFIGS } from '../../constants/providerDefaults';

export default function LLMSettingsTab({
  provider,
  setProvider,
  providerConfigs,
  onChangeConfig,
  testingKey,
  testStatus,
  onTestConnection
}) {
  const meta = DEFAULT_PROVIDER_CONFIGS[provider] || DEFAULT_PROVIDER_CONFIGS.openai;
  const current = (providerConfigs && providerConfigs[provider]) || meta;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      <div
        style={{
          backgroundColor: '#1e1f20',
          padding: '24px',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.05)'
        }}
      >
        <div style={{ marginBottom: '20px' }}>
          <h3
            style={{
              fontSize: '0.94rem',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#e3e3e3',
              margin: '0 0 4px 0'
            }}
          >
            <Cpu size={16} color="#a8c7fa" />
            <span>Inference Provider & Model Protocol</span>
          </h3>
          <p style={{ fontSize: '0.78rem', color: '#8e918f', margin: 0 }}>
            Select the inference backend and specify connection parameters for grounded synthesis.
          </p>
        </div>

        <ProviderCardSelector
          provider={provider}
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
      </div>
    </div>
  );
}
