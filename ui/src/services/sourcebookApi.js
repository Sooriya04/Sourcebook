// API service for Go SourceBook Backend loaded dynamically from environment
const API_BASE = import.meta.env.VITE_API_URL || '';

export async function chatQuery({ query, notebookId, maxSources = 5, scopedSourceIds = [] }) {
  const response = await fetch(`${API_BASE}/api/sourcebook/v1/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      query, 
      notebook_id: notebookId, 
      max_sources: maxSources, 
      scoped_source_ids: scopedSourceIds 
    }),
  });

  if (!response.ok) {
    throw new Error(`Server returned status ${response.status}`);
  }

  return await response.json();
}

export async function runPipeline({ query, maxSources = 5, urls = [] }) {
  const response = await fetch(`${API_BASE}/api/sourcebook/v1/pipeline`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, max_sources: maxSources, urls }),
  });

  if (!response.ok) {
    throw new Error(`Pipeline error: status ${response.status}`);
  }

  return await response.json();
}

export async function searchSources(query) {
  const response = await fetch(`${API_BASE}/api/sourcebook/v1/discovery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, limit: 10 }),
  });
  if (!response.ok) {
    throw new Error(`Search error: status ${response.status}`);
  }
  return await response.json();
}

export async function fetchNotebooks() {
  const response = await fetch(`${API_BASE}/api/sourcebook/v1/notebooks`);
  if (!response.ok) throw new Error(`Failed to fetch notebooks: ${response.status}`);
  return await response.json();
}

export async function createNotebookOnServer(title, description) {
  const response = await fetch(`${API_BASE}/api/sourcebook/v1/notebooks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, description }),
  });
  if (!response.ok) throw new Error(`Failed to create notebook: ${response.status}`);
  return await response.json();
}

export async function fetchNotebookDetail(id) {
  const response = await fetch(`${API_BASE}/api/sourcebook/v1/notebooks/${id}`);
  if (!response.ok) throw new Error(`Failed to fetch notebook detail: ${response.status}`);
  return await response.json();
}

export async function updateNotebookOnServer(id, payload) {
  const response = await fetch(`${API_BASE}/api/sourcebook/v1/notebooks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(`Failed to update notebook: ${response.status}`);
}

export async function deleteNotebookOnServer(id) {
  const response = await fetch(`${API_BASE}/api/sourcebook/v1/notebooks/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error(`Failed to delete notebook: ${response.status}`);
}

export async function fetchYouTubeTranscript(url) {
  const response = await fetch(`${API_BASE}/api/sourcebook/v1/youtube/transcript`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Failed to fetch YouTube transcript: ${response.status} ${errorData}`);
  }
  return await response.json();
}

export async function fetchSettings() {
  const response = await fetch(`${API_BASE}/api/sourcebook/v1/settings`);
  if (!response.ok) throw new Error(`Failed to fetch settings: ${response.status}`);
  return await response.json();
}

export async function updateSettings(settings) {
  const response = await fetch(`${API_BASE}/api/sourcebook/v1/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
  if (!response.ok) throw new Error(`Failed to update settings: ${response.status}`);
  return await response.json();
}

export async function generateFlashcards(notebookId) {
  const response = await fetch(`${API_BASE}/api/sourcebook/v1/study/flashcards`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notebook_id: notebookId }),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to generate flashcards: ${response.status}`);
  }
  
  return await response.json();
}

export async function chatQueryStream({ query, notebookId, maxSources = 5, scopedSourceIds = [], mode = 'web', history = [], onChunk, onMetadata, onError, abortSignal }) {
  try {
    const response = await fetch(`${API_BASE}/api/sourcebook/v1/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        query, 
        notebook_id: notebookId, 
        max_sources: maxSources, 
        scoped_source_ids: scopedSourceIds,
        mode,
        history
      }),
      signal: abortSignal
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Server returned status ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      
      buffer = lines.pop();

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;

        const jsonStr = trimmed.slice(6);
        try {
          const data = JSON.parse(jsonStr);
          if (data.error) {
            onError(data.error);
          } else if (data.token !== undefined) {
            onChunk(data.token);
          } else if (data.sources !== undefined || data.context !== undefined || data.status !== undefined || data.new_sources !== undefined) {
            onMetadata(data);
          }
        } catch (e) {
          console.error('Failed to parse SSE line:', jsonStr, e);
        }
      }
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      console.log('Chat stream aborted by client.');
    } else {
      onError(err.message);
    }
  }
}

export async function fetchLLMHealth() {
  const response = await fetch(`${API_BASE}/api/sourcebook/v1/health/llm`);
  if (!response.ok) throw new Error(`Failed to fetch LLM health: ${response.status}`);
  return await response.json();
}

export async function fetchModels() {
  const response = await fetch(`${API_BASE}/api/sourcebook/v1/models`);
  if (!response.ok) throw new Error(`Failed to fetch models: ${response.status}`);
  return await response.json();
}

export async function switchModel(modelName) {
  const response = await fetch(`${API_BASE}/api/sourcebook/v1/models`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: modelName }),
  });
  if (!response.ok) throw new Error(`Failed to switch model: ${response.status}`);
  return await response.json();
}

export async function exportNotebook(id) {
  const response = await fetch(`${API_BASE}/api/sourcebook/v1/notebooks/${id}/export`);
  if (!response.ok) throw new Error(`Failed to export notebook: ${response.status}`);
  return await response.text();
}

export async function pingSourceURL(url) {
  const response = await fetch(`${API_BASE}/api/sourcebook/v1/sources/ping`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  if (!response.ok) throw new Error(`Ping failed: ${response.status}`);
  return await response.json();
}
