import { useState, useEffect } from 'react';

const LOCAL_STORAGE_KEY = 'sourcebook_notebooks';

const INITIAL_NOTEBOOKS = [
  {
    id: 'nb-1',
    title: 'Internet Architecture & SearXNG',
    description: 'Deep dive research on SearXNG query synthesis and Searqon scraping.',
    createdAt: new Date().toISOString(),
    sources: [
      { index: 1, title: 'SearXNG Documentation', url: 'https://docs.searxng.org', type: 'web' },
      { index: 2, title: 'Go Net/HTTP stdlib', url: 'https://pkg.go.dev/net/http', type: 'web' }
    ],
    notes: [
      { id: 'n-1', title: 'Key Takeaway', content: 'SearXNG provides anonymous search result discovery across multiple web engines.' }
    ]
  },
  {
    id: 'nb-2',
    title: 'Machine Learning Models & Grounded RAG',
    description: 'Notes on LLM prompt engineering, numerical inline citations, and hallucination reduction.',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    sources: [],
    notes: []
  }
];

export function useNotebooks() {
  const [notebooks, setNotebooks] = useState(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_NOTEBOOKS;
  });

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(notebooks));
  }, [notebooks]);

  const createNotebook = (title, description = '') => {
    const newNotebook = {
      id: `nb-${Date.now()}`,
      title: title || 'Untitled Notebook',
      description,
      createdAt: new Date().toISOString(),
      sources: [],
      notes: []
    };
    setNotebooks(prev => [newNotebook, ...prev]);
    return newNotebook;
  };

  const deleteNotebook = (id) => {
    setNotebooks(prev => prev.filter(nb => nb.id !== id));
  };

  const getNotebook = (id) => {
    return notebooks.find(nb => nb.id === id);
  };

  const updateNotebook = (id, updates) => {
    setNotebooks(prev => prev.map(nb => nb.id === id ? { ...nb, ...updates } : nb));
  };

  return { notebooks, createNotebook, deleteNotebook, getNotebook, updateNotebook };
}
