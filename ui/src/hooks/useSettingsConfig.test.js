import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSettingsConfig } from './useSettingsConfig';
import * as api from '../services/sourcebookApi';

vi.mock('../services/sourcebookApi', () => ({
  fetchSettings: vi.fn(),
  fetchModels: vi.fn(),
  updateSettings: vi.fn(),
  updateModelConfig: vi.fn(),
  testModelConfig: vi.fn(),
}));

describe('useSettingsConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    api.updateSettings.mockResolvedValue({ success: true });
    api.updateModelConfig.mockResolvedValue({ success: true });
  });

  it('restores saved backend provider (gemini) instead of resetting to ollama', async () => {
    api.fetchSettings.mockResolvedValue({
      llm_provider: 'gemini',
      llm_base_url: 'https://generativelanguage.googleapis.com/v1beta/openai',
      llm_model: 'gemini-2.0-flash',
      llm_api_key: 'AIzaTestKey',
    });
    api.fetchModels.mockResolvedValue({ provider: 'gemini', active: 'gemini-2.0-flash' });

    const { result } = renderHook(() => useSettingsConfig());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.provider).toBe('gemini');
    expect(result.current.savedProvider).toBe('gemini');
    expect(result.current.providerConfigs.gemini.model).toBe('gemini-2.0-flash');
  });

  it('keeps savedProvider separate from selected provider until save', async () => {
    api.fetchSettings.mockResolvedValue({ llm_provider: 'ollama' });
    api.fetchModels.mockResolvedValue({ provider: 'ollama', active: 'gemma2' });

    const { result } = renderHook(() => useSettingsConfig());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.setProvider('openai_compatible');
    });

    expect(result.current.provider).toBe('openai_compatible');
    expect(result.current.savedProvider).toBe('ollama');
    expect(result.current.isDirty).toBe(true);

    await act(async () => {
      await result.current.handleSave();
    });

    expect(result.current.savedProvider).toBe('openai_compatible');
    expect(result.current.isDirty).toBe(false);
    expect(api.updateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        llm_provider: 'openai_compatible',
        llm_base_url: 'https://api.openai.com/v1',
      })
    );
  });
});
