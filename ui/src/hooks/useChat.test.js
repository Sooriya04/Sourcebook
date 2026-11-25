import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChat } from './useChat';
import * as api from '../services/sourcebookApi';

vi.mock('../services/sourcebookApi', () => ({
  fetchSettings: vi.fn(),
  chatQueryStream: vi.fn(),
}));

describe('useChat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.fetchSettings.mockResolvedValue({ max_sources: 5 });
    Element.prototype.scrollIntoView = vi.fn();
  });

  it('sends a message and streams assistant tokens', async () => {
    api.chatQueryStream.mockImplementation(async ({ onChunk, onMetadata }) => {
      onMetadata({ sources: [{ index: 1, title: 'Doc 1' }], context: 'notebook' });
      onChunk('Hello ');
      onChunk('world');
    });

    const empty = [];
    const { result } = renderHook(() => useChat(empty, null, 'nb-1'));

    await act(async () => {
      await result.current.sendMessage('What is RAG?', 'web');
    });

    expect(api.chatQueryStream).toHaveBeenCalledWith(
      expect.objectContaining({
        query: 'What is RAG?',
        mode: 'web',
        notebookId: 'nb-1',
      })
    );
    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[0]).toEqual({ role: 'user', content: 'What is RAG?' });
    expect(result.current.messages[1].content).toBe('Hello world');
    expect(result.current.messages[1].sources).toHaveLength(1);
  });

  it('regenerates the last response without duplicating the user bubble', async () => {
    api.chatQueryStream.mockImplementation(async ({ onChunk }) => {
      onChunk('Regenerated answer');
    });

    const initial = [
      { role: 'user', content: 'First question' },
      { role: 'assistant', content: 'Old answer' },
    ];
    const { result } = renderHook(() => useChat(initial, null, 'nb-1'));

    await act(async () => {
      await result.current.regenerateMessage('hybrid');
    });

    expect(api.chatQueryStream).toHaveBeenCalledWith(
      expect.objectContaining({
        query: 'First question',
        mode: 'hybrid',
        history: [],
      })
    );
    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[0]).toEqual({ role: 'user', content: 'First question' });
    expect(result.current.messages[1].content).toBe('Regenerated answer');
  });
});
