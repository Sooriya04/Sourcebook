// Prompt Studio persistence service backed by Go SQLite APIs,
// with localStorage fallback if the server is temporarily unreachable.

const API_BASE = '';
const PROMPTS_KEY = 'sourcebook_prompt_library_v1';
const HISTORY_KEY = 'sourcebook_prompt_history_v1';

function readLocal(key, fallback = []) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocal(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota errors
  }
}

export async function loadSavedPrompts() {
  try {
    const res = await fetch(`${API_BASE}/api/sourcebook/v1/prompts`);
    if (res.ok) {
      const data = await res.json();
      const list = Array.isArray(data.prompts) ? data.prompts : [];
      writeLocal(PROMPTS_KEY, list);
      return list;
    }
  } catch {
    // Fallback to local cache
  }
  return readLocal(PROMPTS_KEY, []);
}

export async function savePromptItem(prompt) {
  const payload = {
    id: prompt.id || undefined,
    name: (prompt.name || '').trim() || 'Untitled Prompt',
    description: (prompt.description || '').trim(),
    instructions: prompt.instructions || '',
    category: prompt.category || 'Saved',
    tags: Array.isArray(prompt.tags) ? prompt.tags : [],
    executionMode: prompt.executionMode === 'custom_priority' ? 'custom_priority' : 'standard'
  };

  try {
    const url = payload.id
      ? `${API_BASE}/api/sourcebook/v1/prompts/${encodeURIComponent(payload.id)}`
      : `${API_BASE}/api/sourcebook/v1/prompts`;
    const res = await fetch(url, {
      method: payload.id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      const item = await res.json();
      const list = await loadSavedPrompts();
      return { item, list };
    }
  } catch {
    // Fallback below
  }

  const now = new Date().toISOString();
  const item = {
    ...payload,
    id: payload.id || `prm_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    isBuiltin: false,
    createdAt: prompt.createdAt || now,
    updatedAt: now
  };
  const current = readLocal(PROMPTS_KEY, []);
  const idx = current.findIndex((p) => p.id === item.id);
  const next = idx >= 0 ? current.map((p) => (p.id === item.id ? item : p)) : [item, ...current];
  writeLocal(PROMPTS_KEY, next);
  return { item, list: next };
}

export async function deleteSavedPrompt(promptId) {
  try {
    const res = await fetch(`${API_BASE}/api/sourcebook/v1/prompts/${encodeURIComponent(promptId)}`, {
      method: 'DELETE'
    });
    if (res.ok) {
      return await loadSavedPrompts();
    }
  } catch {
    // Fallback below
  }
  const next = readLocal(PROMPTS_KEY, []).filter((p) => p.id !== promptId);
  writeLocal(PROMPTS_KEY, next);
  return next;
}

export async function duplicateSavedPrompt(prompt) {
  return savePromptItem({
    ...prompt,
    id: undefined,
    name: `${prompt.name || 'Untitled Prompt'} (Copy)`,
    createdAt: undefined
  });
}

export async function loadPromptHistory() {
  try {
    const res = await fetch(`${API_BASE}/api/sourcebook/v1/prompts/history`);
    if (res.ok) {
      const data = await res.json();
      const list = Array.isArray(data.history) ? data.history : [];
      writeLocal(HISTORY_KEY, list);
      return list;
    }
  } catch {
    // Fallback below
  }
  return readLocal(HISTORY_KEY, []);
}

export async function recordPromptExecution(entry) {
  const payload = {
    promptName: (entry.promptName || '').trim() || 'Custom Prompt',
    description: entry.description || '',
    instructions: entry.instructions || '',
    executionMode: entry.executionMode || 'standard',
    sourceMode: entry.sourceMode || 'all',
    sourceCount: Number.isFinite(entry.sourceCount) ? entry.sourceCount : 0,
    notebookId: entry.notebookId || '',
    notebookTitle: entry.notebookTitle || 'Untitled Notebook',
    status: entry.status || 'completed'
  };

  try {
    const res = await fetch(`${API_BASE}/api/sourcebook/v1/prompts/history`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      const item = await res.json();
      return { item };
    }
  } catch {
    // Fallback below
  }

  const item = {
    ...payload,
    id: `run_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    executedAt: new Date().toISOString()
  };
  const next = [item, ...readLocal(HISTORY_KEY, [])].slice(0, 50);
  writeLocal(HISTORY_KEY, next);
  return { item };
}

export async function updatePromptExecutionStatus(runId, status) {
  try {
    await fetch(`${API_BASE}/api/sourcebook/v1/prompts/history/${encodeURIComponent(runId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
  } catch {
    // Fallback below
  }
  const next = readLocal(HISTORY_KEY, []).map((h) => (h.id === runId ? { ...h, status } : h));
  writeLocal(HISTORY_KEY, next);
  return next;
}
