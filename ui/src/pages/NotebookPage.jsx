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

const EMPTY_SOURCES = [];

export default function NotebookPage({ getNotebook, updateNotebook }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentNotebook = getNotebook(id);

  const [notes, setNotes] = useState(currentNotebook?.notes || []);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

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
  }, [currentNotebook?.id]);

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
      />

      {/* Source Inspector Drawer */}
      <SourceInspectorDrawer
        source={selectedSource}
        onClose={() => setSelectedSource(null)}
      />
    </div>
  );
}
