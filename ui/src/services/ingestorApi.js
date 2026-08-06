// API service for Python Ingestor Microservice (proxied to 127.0.0.1:4002 via Vite)

export async function parsePDF(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/parse/pdf', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.detail || `PDF parse failed: ${response.status}`);
  }

  return await response.json();
}

export async function parseMarkdown(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/parse/markdown', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.detail || `Markdown parse failed: ${response.status}`);
  }

  return await response.json();
}

export async function parseYouTube(url) {
  const response = await fetch('/parse/youtube', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.detail || `YouTube parse failed: ${response.status}`);
  }

  return await response.json();
}
