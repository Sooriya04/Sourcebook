import { useEffect, useState, useCallback } from 'react';

const getStorageKey = (nbId) => (nbId ? `sourcebook_scoped_sources_${nbId}` : null);

const getSavedScopedIds = (nbId) => {
  const key = getStorageKey(nbId);
  if (!key || typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem(key);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Failed to parse saved scoped sources', e);
  }
  return null;
};

const persistScopedIds = (nbId, ids) => {
  const key = getStorageKey(nbId);
  if (!key || typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(Array.from(ids)));
  } catch (e) {
    console.error('Failed to persist scoped sources', e);
  }
};

export function useSources(initialSources = [], notebookId = null) {
  const [sources, setSourcesState] = useState(() => {
    if (!initialSources || initialSources.length === 0) return [];
    return initialSources.map((s, idx) => ({ ...s, index: s.index || idx + 1 }));
  });
  const [selectedSource, setSelectedSource] = useState(null);
  const [activeCitation, setActiveCitation] = useState(null);
  const [scopedSourceIds, setScopedSourceIdsState] = useState(() => {
    const saved = getSavedScopedIds(notebookId);
    if (saved !== null) return new Set(saved);
    if (initialSources && initialSources.length > 0) {
      return new Set(initialSources.map((s, idx) => s.id || String(s.index || idx + 1)));
    }
    return new Set();
  });

  // Re-sync with saved scope when notebookId changes
  useEffect(() => {
    if (!notebookId) return;
    const saved = getSavedScopedIds(notebookId);
    if (saved !== null) {
      setScopedSourceIdsState(new Set(saved));
    } else if (sources.length > 0) {
      const allSet = new Set(sources.map((s) => s.id || String(s.index)));
      setScopedSourceIdsState(allSet);
      persistScopedIds(notebookId, allSet);
    }
  }, [notebookId]);

  const setScopedSourceIds = useCallback((updater) => {
    setScopedSourceIdsState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      persistScopedIds(notebookId, next);
      return next;
    });
  }, [notebookId]);

  const setSources = useCallback((newSourcesOrFn) => {
    setSourcesState((prev) => {
      const nextSources = typeof newSourcesOrFn === 'function' ? newSourcesOrFn(prev) : newSourcesOrFn;
      if (!Array.isArray(nextSources)) return nextSources;

      const indexed = nextSources.map((s, idx) => ({ ...s, index: s.index || idx + 1 }));
      const allIds = indexed.map((s) => s.id || String(s.index));

      // Reconcile scopedSourceIds with the newly loaded sources
      const savedList = getSavedScopedIds(notebookId);
      let nextScoped;
      if (savedList !== null) {
        const validSaved = savedList.filter((id) => allIds.includes(id));
        nextScoped = (validSaved.length > 0 || savedList.length === 0) ? new Set(validSaved) : new Set(allIds);
      } else {
        nextScoped = new Set(allIds);
      }

      setScopedSourceIdsState(nextScoped);
      persistScopedIds(notebookId, nextScoped);
      return indexed;
    });
  }, [notebookId]);

  const toggleSourceScope = useCallback((sourceId) => {
    setScopedSourceIdsState((prev) => {
      const next = new Set(prev);
      if (next.has(sourceId)) next.delete(sourceId);
      else next.add(sourceId);
      persistScopedIds(notebookId, next);
      return next;
    });
  }, [notebookId]);

  const toggleAllSourcesScope = useCallback(() => {
    setScopedSourceIdsState((prev) => {
      const allIds = sources.map((s) => s.id || String(s.index));
      const next = (prev.size === sources.length && sources.length > 0) ? new Set() : new Set(allIds);
      persistScopedIds(notebookId, next);
      return next;
    });
  }, [sources, notebookId]);

  const addSource = useCallback((sourceData) => {
    setSourcesState((prev) => {
      const nextIndex = prev.length + 1;
      const newSrc = { ...sourceData, index: nextIndex };
      const sourceId = newSrc.id || String(nextIndex);
      setScopedSourceIdsState((s) => {
        const next = new Set([...s, sourceId]);
        persistScopedIds(notebookId, next);
        return next;
      });
      return [...prev, newSrc];
    });
  }, [notebookId]);

  const addMultipleSources = useCallback((newSources) => {
    setSourcesState((prev) => {
      let startIndex = prev.length;
      const mapped = newSources.map((s) => ({ ...s, index: ++startIndex }));
      const newIds = mapped.map((s) => s.id || String(s.index));
      setScopedSourceIdsState((s) => {
        const next = new Set([...s, ...newIds]);
        persistScopedIds(notebookId, next);
        return next;
      });
      return [...prev, ...mapped];
    });
  }, [notebookId]);

  const removeSource = useCallback((target) => {
    setSourcesState((prev) => {
      const filtered = prev.filter((s, i) => {
        const currentIndex = s.index || i + 1;
        if (typeof target === 'number') return currentIndex !== target;
        if (typeof target === 'string') return s.id !== target && s.title !== target;
        return s !== target && (s.id ? s.id !== target?.id : currentIndex !== target?.index);
      });
      const reindexed = filtered.map((s, idx) => ({ ...s, index: idx + 1 }));
      const remainingIds = new Set(reindexed.map((s) => s.id || String(s.index)));
      setScopedSourceIdsState((s) => {
        const next = new Set([...s].filter((id) => remainingIds.has(id)));
        persistScopedIds(notebookId, next);
        return next;
      });
      return reindexed;
    });
    setSelectedSource(null);
    setActiveCitation(null);
  }, [notebookId]);

  const clearSources = useCallback(() => {
    setSourcesState([]);
    setScopedSourceIdsState(new Set());
    persistScopedIds(notebookId, new Set());
    setSelectedSource(null);
    setActiveCitation(null);
  }, [notebookId]);

  const updateMultipleSources = useCallback((updatedSources) => {
    setSourcesState((prev) => prev.map((s) => {
      const matched = updatedSources.find((us) => us.url === s.url || (s.id && us.id === s.id));
      return matched ? { ...s, ...matched } : s;
    }));
  }, []);

  return {
    sources, setSources, selectedSource, setSelectedSource,
    activeCitation, setActiveCitation, scopedSourceIds, setScopedSourceIds,
    toggleSourceScope, toggleAllSourcesScope, addSource,
    addMultipleSources, updateMultipleSources, removeSource, clearSources,
  };
}


