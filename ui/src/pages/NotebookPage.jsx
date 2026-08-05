import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import Sidebar from '../components/layout/Sidebar';
import ChatStudio from '../components/chat/ChatStudio';
import NotesPanel from '../components/layout/NotesPanel';
import NotebookHeader from '../components/notebook/NotebookHeader';

import AddSourceModal from '../components/sources/AddSourceModal';
import SourceInspectorDrawer from '../components/sources/SourceInspectorDrawer';

import { useSources } from '../hooks/useSources';
import { useChat } from '../hooks/useChat';
import { runPipeline, fetchNotebookDetail, updateNotebookOnServer } from '../services/sourcebookApi';

const EMPTY_SOURCES = [];
const EMPTY_NOTES = [];
const EMPTY_MESSAGES = [];

export default function NotebookPage({ getNotebook }) {
  const { id } = useParams();
  const navigate = useNavigate();
  // We still get the basic shell (title/desc) from the router for instant render
  const shellNotebook = getNotebook(id);

  const [notebook, setNotebook] = useState(shellNotebook || null);
  const [loadingNotebook, setLoadingNotebook] = useState(true);
  
  const [notes, setNotes] = useState(EMPTY_NOTES);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [discoveryTopic, setDiscoveryTopic] = useState(null);
  const [isScraping, setIsScraping] = useState(false);

  // Auto-sync debouncer ref
  const syncTimeoutRef = useRef(null);
  // Initial load flag to prevent saving empty state immediately on mount
  const hasLoadedRef = useRef(false);

  const {
    sources,
    setSources,
    selectedSource,
    setSelectedSource,
    activeCitation,
    setActiveCitation,
    addSource,
    addMultipleSources,
    updateMultipleSources,
    removeSource
  } = useSources(EMPTY_SOURCES);

  const handleNewSourcesFromAPI = (newSources) => {
    addMultipleSources(newSources);
  };

  const {
    messages,
    setMessages,
    loading: chatLoading,
    maxSources,
    setMaxSources,
    sendMessage,
    clearChat,
    chatEndRef
  } = useChat(EMPTY_MESSAGES, handleNewSourcesFromAPI);

  // Fetch full details on mount
  useEffect(() => {
    let isMounted = true;
    setLoadingNotebook(true);
    hasLoadedRef.current = false;

    if (!id || id === 'undefined') {
      setLoadingNotebook(false);
      return;
    }

    fetchNotebookDetail(id)
      .then(data => {
        if (!isMounted) return;
        setNotebook(data);
        setSources(data.sources || []);
        setNotes(data.notes || []);
        setMessages(data.messages || []);
        hasLoadedRef.current = true;
        setLoadingNotebook(false);
      })
      .catch(err => {
        console.error("Failed to fetch notebook details:", err);
        if (isMounted) setLoadingNotebook(false);
      });

    return () => { isMounted = false; };
  }, [id, setSources, setMessages]);

  // Auto-sync effect
  useEffect(() => {
    if (!hasLoadedRef.current || !notebook) return;

    // Debounce the save operation by 1 second
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(() => {
      const payload = {
        title: notebook.title,
        description: notebook.description,
        sources: sources,
        notes: notes,
        messages: messages
      };

      updateNotebookOnServer(id, payload).catch(err => {
        console.error("Failed to auto-sync notebook:", err);
      });
    }, 1000);

    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, [notebook, sources, notes, messages, id]);


  if (loadingNotebook) {
    return (
      <div className="not-found-container">
        <h2>Loading Workspace...</h2>
      </div>
    );
  }

  if (!notebook) {
    return (
      <div className="not-found-container">
        <h2>Notebook Not Found</h2>
        <button onClick={() => navigate('/')}>Return to Notebooks</button>
      </div>
    );
  }

  const handleAddSource = (srcData) => {
    addSource(srcData);
  };

  const handleUpdateSource = (updatedSource) => {
    setSources(prev => prev.map(s => (s.url === updatedSource.url || (s.id && s.id === updatedSource.id)) ? updatedSource : s));
    setSelectedSource(updatedSource);
  };

  const handleCitationClick = (index, foundSource) => {
    setActiveCitation(index);
    if (foundSource) {
      setSelectedSource(foundSource);
    }
  };

  const handleSaveNote = (newNote) => {
    setNotes(prev => [newNote, ...prev]);
  };

  const handleDeleteNote = (noteId) => {
    setNotes(prev => prev.filter(n => n.id !== noteId));
  };

  const handleImportDiscovery = async (imported) => {
    const urls = imported.map(src => src.url).filter(Boolean);
    if (imported.length === 0) return;
    
    setIsScraping(true);
    setDiscoveryTopic(null);

    // Immediately add sources with 'Indexing...' status
    const pendingSources = imported.map(item => ({
      title: item.title || 'Web Source',
      url: item.url || '',
      snippet: item.snippet || '',
      type: 'web',
      status: 'Indexing...'
    }));
    addMultipleSources(pendingSources);

    try {
      let scrapedDocsMap = new Map();
      if (urls.length > 0) {
        const response = await runPipeline({ query: "discovery_import", urls: urls });
        if (response && Array.isArray(response.data)) {
          response.data.forEach(doc => {
            const docUrl = (doc.url || doc.URL || '').toLowerCase();
            const text = doc.content || doc.Content || doc.markdown || doc.Markdown || '';
            if (docUrl && text) {
              scrapedDocsMap.set(docUrl, text);
            }
          });
        }
      }

      const finalSources = pendingSources.map(item => {
        const itemUrl = (item.url || '').toLowerCase();
        const scrapedText = scrapedDocsMap.get(itemUrl);
        return {
          ...item,
          content: scrapedText || item.snippet || item.title,
          status: 'Ready'
        };
      });

      updateMultipleSources(finalSources);
    } catch (err) {
      console.warn("Backend scraping pipeline offline, falling back to direct import:", err);
      updateMultipleSources(pendingSources.map(item => ({
        ...item,
        content: item.snippet || item.title,
        status: 'Ready'
      })));
    } finally {
      setIsScraping(false);
    }
  };

  return (
    <div className="notebook-workspace-3panel">
      <NotebookHeader
        title={notebook.title}
        onClearChat={clearChat}
        messageCount={messages.length}
      />

      <div className="three-panel-body">
        {/* Left Panel: Sources */}
        <Sidebar
          sources={sources}
          activeCitation={activeCitation}
          onSelectSource={setSelectedSource}
          onDeleteSource={removeSource}
          onOpenAddModal={() => setIsAddModalOpen(true)}
          discoveryTopic={discoveryTopic}
          setDiscoveryTopic={setDiscoveryTopic}
          onImportDiscovery={handleImportDiscovery}
        />

        {/* Center Panel: Chat Studio */}
        <ChatStudio
          messages={messages}
          loading={chatLoading}
          maxSources={maxSources}
          setMaxSources={setMaxSources}
          onSendMessage={sendMessage}
          allSources={sources}
          onCitationClick={handleCitationClick}
          activeCitation={activeCitation}
          onSaveNote={handleSaveNote}
          chatEndRef={chatEndRef}
          notebookTitle={notebook.title}
          notebookDescription={notebook.description}
        />

        {/* Right Panel: Notes & Audio Overview */}
        <NotesPanel
          notes={notes}
          onDeleteNote={handleDeleteNote}
        />
      </div>

      {/* Add Source Modal */}
      <AddSourceModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddSource={handleAddSource}
        onSearchDiscovery={(topic) => setDiscoveryTopic(topic)}
      />

      {/* Source Inspector Drawer */}
      <SourceInspectorDrawer
        source={selectedSource}
        onClose={() => setSelectedSource(null)}
        onUpdateSource={handleUpdateSource}
      />

      {/* Scraping Toast */}
      {isScraping && (
        <div className="scraping-overlay">
          <div className="scraping-modal">
            <div className="spinner"></div>
            <h3>Scraping sources...</h3>
          </div>
        </div>
      )}
    </div>
  );
}
