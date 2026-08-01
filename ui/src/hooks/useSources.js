import { useEffect, useState } from 'react';

export function useSources(initialSources = []) {
  const [sources, setSources] = useState(initialSources);
  const [selectedSource, setSelectedSource] = useState(null);
  const [activeCitation, setActiveCitation] = useState(null);

  useEffect(() => {
    setSources(initialSources);
    setSelectedSource(null);
    setActiveCitation(null);
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

  const removeSource = (index) => {
    setSources(prev => prev.filter(s => s.index !== index));
    if (selectedSource?.index === index) setSelectedSource(null);
    if (activeCitation === index) setActiveCitation(null);
  };

  const clearSources = () => {
    setSources([]);
    setSelectedSource(null);
    setActiveCitation(null);
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
    removeSource,
    clearSources
  };
}
