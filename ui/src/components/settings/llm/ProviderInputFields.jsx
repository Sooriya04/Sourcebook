import React from 'react';
import { SettingsField, SettingsInput } from '../common';

export default function ProviderInputFields({ provider, currentConfig, meta, onChangeConfig }) {
  const isOllama = provider === 'ollama';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Base Endpoint URL */}
      <SettingsField
        label="Base Endpoint URL"
        hint="HTTP / HTTPS Root"
      >
        <SettingsInput
          type="text"
          value={currentConfig.baseUrl ?? meta.baseUrl}
          onChange={(e) => onChangeConfig(provider, 'baseUrl', e.target.value)}
          placeholder={meta.placeholderUrl}
          mono
        />
      </SettingsField>

      {/* Target Model Name */}
      <SettingsField
        label="Target Model Name"
        hint="Model architecture identifier"
      >
        <SettingsInput
          type="text"
          value={currentConfig.model ?? meta.model}
          onChange={(e) => onChangeConfig(provider, 'model', e.target.value)}
          placeholder={meta.placeholderModel}
          mono
        />
      </SettingsField>

      {/* API Key */}
      <SettingsField
        label="API Key"
        hint={isOllama ? 'Optional for local daemon' : 'Bearer credential token'}
      >
        <SettingsInput
          type="password"
          value={currentConfig.apiKey ?? ''}
          onChange={(e) => onChangeConfig(provider, 'apiKey', e.target.value)}
          placeholder={meta.placeholderKey}
          mono
        />
      </SettingsField>
    </div>
  );
}
