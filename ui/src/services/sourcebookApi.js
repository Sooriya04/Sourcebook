// API service for Go SourceBook Backend loaded dynamically from environment
const API_BASE = import.meta.env.VITE_API_URL || '';

export async function chatQuery({ query, maxSources = 5 }) {
  const response = await fetch(`${API_BASE}/api/sourcebook/v1/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, max_sources: maxSources }),
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
