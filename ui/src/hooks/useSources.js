import { useEffect, useState, useRef } from 'react';

export function useSources(initialSources = []) {
  const [sources, setSources] = useState(initialSources);
  const [selectedSource, setSelectedSource] = useState(null);
  const [activeCitation, setActiveCitation] = useState(null);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    if (!isInitializedRef.current && initialSources && initialSources.length > 0) {
      const indexed = initialSources.map((s, idx) => ({
        ...s,
        index: s.index || (idx + 1)
      }));
      setSources(indexed);
      isInitializedRef.current = true;
    }
  }, [initialSources]);

  const addSource = (sourceData) => {
    setSources(prev => {
      const nextIndex = prev.length + 1;
      const newSrc = { ...sourceData, index: nextIndex };
      return [...prev, newSrc];
    });
  };

  const addMultipleSources = (newSources) => {
    setSources(prev => {
      let startIndex = prev.length;
      const mapped = newSources.map(s => {
        startIndex += 1;
        return { ...s, index: startIndex };
      });
      return [...prev, ...mapped];
    });
  };

  const removeSource = (target) => {
    setSources(prev => {
      const filtered = prev.filter((s, i) => {
        const currentIndex = s.index || (i + 1);
        if (typeof target === 'number') {
          return currentIndex !== target;
        }
        if (typeof target === 'string') {
          return s.id !== target && s.title !== target;
        }
        return s !== target && (s.id ? s.id !== target?.id : currentIndex !== target?.index);
      });
      // Re-index remaining sources sequentially
      return filtered.map((s, idx) => ({ ...s, index: idx + 1 }));
    });
    setSelectedSource(null);
    setActiveCitation(null);
  };

  const clearSources = () => {
    setSources([]);
    setSelectedSource(null);
    setActiveCitation(null);
  };
  const updateMultipleSources = (updatedSources) => {
    setSources(prev => {
      return prev.map(s => {
        const matched = updatedSources.find(us => us.url === s.url || (s.id && us.id === s.id));
        if (matched) {
          return { ...s, ...matched };
        }
        return s;
      });
    });
  };

  return {
    sources,
    setSources,
    selectedSource,
    setSelectedSource,
    activeCitation,
    setActiveCitation,
    addSource,
    addMultipleSources,
    updateMultipleSources,
    removeSource,
    clearSources
  };
}

