import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import Sidebar from '../components/layout/Sidebar';
import ChatStudio from '../components/chat/ChatStudio';
import NotesPanel from '../components/layout/NotesPanel';
import NotebookHeader from '../components/notebook/NotebookHeader';

import AddSourceModal from '../components/sources/AddSourceModal';
import SourceInspectorDrawer from '../components/sources/SourceInspectorDrawer';

import { useSources } from '../hooks/useSources';
import { useChat } from '../hooks/useChat';
import { runPipeline } from '../services/sourcebookApi';

const EMPTY_SOURCES = [];

export default function NotebookPage({ getNotebook }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentNotebook = getNotebook(id);

  const [notes, setNotes] = useState(currentNotebook?.notes || []);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [discoveryTopic, setDiscoveryTopic] = useState(null);
  const [isScraping, setIsScraping] = useState(false);

  const {
    sources,
    selectedSource,
    setSelectedSource,
    activeCitation,
    setActiveCitation,
    addSource,
    addMultipleSources,
    removeSource
  } = useSources(currentNotebook?.sources ?? EMPTY_SOURCES);

  const handleNewSourcesFromAPI = (newSources) => {
    addMultipleSources(newSources);
  };

  const {
    messages,
    loading,
    maxSources,
    setMaxSources,
    sendMessage,
    clearChat,
    chatEndRef
  } = useChat(handleNewSourcesFromAPI);

  useEffect(() => {
    setNotes(currentNotebook?.notes || []);
  }, [currentNotebook?.id, currentNotebook?.notes]);

  if (!currentNotebook) {
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
    const urls = imported.map(src => src.url);
    if (urls.length === 0) return;
    
    setIsScraping(true);
    setDiscoveryTopic(null);

    try {
      const response = await runPipeline({ query: "discovery_import", urls: urls });
      
      if (response && Array.isArray(response.data) && response.data.length > 0) {
        const cleanedDocs = response.data.map(doc => ({
          title: doc.Title || doc.title || 'Untitled Web Source',
          url: doc.URL || doc.url,
          content: doc.Content || doc.content || '',
          type: 'web'
        }));
        addMultipleSources(cleanedDocs);
      } else {
        // Fallback if backend returns empty data
        addMultipleSources(imported.map(item => ({
          title: item.title,
          url: item.url,
          content: item.snippet || item.title,
          type: 'web'
        })));
      }
    } catch (err) {
      console.warn("Backend scraping pipeline offline, falling back to direct import:", err);
      addMultipleSources(imported.map(item => ({
        title: item.title,
        url: item.url,
        content: item.snippet || item.title,
        type: 'web'
      })));
    } finally {
      setIsScraping(false);
    }
  };

  return (
    <div className="notebook-workspace-3panel">
      <NotebookHeader
        title={currentNotebook.title}
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
          loading={loading}
          maxSources={maxSources}
          setMaxSources={setMaxSources}
          onSendMessage={sendMessage}
          allSources={sources}
          onCitationClick={handleCitationClick}
          activeCitation={activeCitation}
          onSaveNote={handleSaveNote}
          chatEndRef={chatEndRef}
          notebookTitle={currentNotebook.title}
          notebookDescription={currentNotebook.description}
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
