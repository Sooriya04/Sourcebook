// API service for Go SourceBook Backend (/api/sourcebook/v1/)

export async function chatQuery({ query, maxSources = 5 }) {
  const response = await fetch('/api/sourcebook/v1/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, max_sources: maxSources }),
  });

  if (!response.ok) {
    throw new Error(`Server returned status ${response.status}`);
  }

  return await response.json();
}

export async function runPipeline({ query, maxSources = 5 }) {
  const response = await fetch('/api/sourcebook/v1/pipeline', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, max_sources: maxSources }),
  });

  if (!response.ok) {
    throw new Error(`Pipeline error: status ${response.status}`);
  }

  return await response.json();
}

export async function searchSources(query) {
  const response = await fetch(`/api/sourcebook/v1/search?q=${encodeURIComponent(query)}`);
  if (!response.ok) {
    throw new Error(`Search error: status ${response.status}`);
  }
  return await response.json();
}
