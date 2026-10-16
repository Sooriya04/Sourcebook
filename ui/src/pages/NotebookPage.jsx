import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Moon, Terminal, Check, Eye } from 'lucide-react';

import Sidebar from '../components/layout/Sidebar';
import ChatStudio from '../components/chat/ChatStudio';
import StudyStudio from '../components/study/StudyStudio';
import NotesPanel from '../components/layout/NotesPanel';
import NotebookHeader from '../components/notebook/NotebookHeader';
import CommandPaletteModal from '../components/notebook/CommandPaletteModal';
import DragDropOverlay from '../components/notebook/DragDropOverlay';
import AddSourceModal from '../components/sources/AddSourceModal';
import ErrorBoundary from '../components/ui/ErrorBoundary';

import { useSources } from '../hooks/useSources';
import { useChat } from '../hooks/useChat';
import { parseFileClientSide, parseYouTubeURL } from '../services/fileIngestor';
import { runPipeline, fetchNotebookDetail, updateNotebookOnServer, exportNotebook, fetchYouTubeTranscript } from '../services/sourcebookApi';

const EMPTY_ARR = [];

export default function NotebookPage({ getNotebook }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [notebook, setNotebook] = useState(() => getNotebook?.(id) || null);
  const [loadingNotebook, setLoadingNotebook] = useState(true);
  
  const [notes, setNotes] = useState(EMPTY_ARR);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [discoveryTopic, setDiscoveryTopic] = useState(null);
  const [activeMode, setActiveMode] = useState('chat');
  const [studyTab, setStudyTab] = useState('briefing');
  const [isSourcesCollapsed, setIsSourcesCollapsed] = useState(false);
  const [isStudioCollapsed, setIsStudioCollapsed] = useState(false);
  const [inspectingSource, setInspectingSource] = useState(null);

  // Drag & drop file ingestion
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const dragCounterRef = useRef(0);

  // Command palette
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const syncTimeoutRef = useRef(null);
  const hasLoadedRef = useRef(false);

  // Sources & Chat hooks
  const {
    sources, setSources,
    activeCitation, setActiveCitation, scopedSourceIds, setScopedSourceIds,
    toggleSourceScope, toggleAllSourcesScope, addSource, addMultipleSources,
    updateMultipleSources, removeSource
  } = useSources(EMPTY_ARR, id);

  const {
    messages, setMessages, loading: chatLoading, streamPhase,
    maxSources, setMaxSources, sendMessage, stopStream,
    regenerateMessage, editAndResendMessage, clearChat, chatEndRef
  } = useChat(EMPTY_ARR, (newSrcs) => addMultipleSources(newSrcs), id);

  // Load notebook data
  useEffect(() => {
    let isMounted = true;
    if (!id || id === 'undefined') {
      setLoadingNotebook(false);
      return;
    }
    fetchNotebookDetail(id)
      .then((data) => {
        if (!isMounted) return;
        setNotebook(data);
        setSources(data.sources || EMPTY_ARR);
        setNotes(data.notes || EMPTY_ARR);
        setMessages(data.messages || EMPTY_ARR);
        hasLoadedRef.current = true;
        setLoadingNotebook(false);
      })
      .catch((err) => {
        console.error('Failed to load notebook:', err);
        if (isMounted) setLoadingNotebook(false);
      });
    return () => { isMounted = false; };
  }, [id, setSources, setMessages]);

  // Auto-sync debounced
  useEffect(() => {
    if (!hasLoadedRef.current || !notebook?.title) return;
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(() => {
      updateNotebookOnServer(id, {
        title: notebook.title,
        description: notebook.description,
        sources, notes, messages
      }).catch((err) => console.error('Auto-sync failed:', err));
    }, 1000);
    return () => clearTimeout(syncTimeoutRef.current);
  }, [notebook, sources, notes, messages, id]);

  // Global Cmd+K keyboard listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const changeTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('sourcebook-theme', theme);
  };

  // Drag-and-drop file handlers
  const handleDragEnter = (e) => {
    e.preventDefault();
    dragCounterRef.current += 1;
    if (e.dataTransfer.items?.length > 0) setIsDraggingFile(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current <= 0) {
      setIsDraggingFile(false);
      dragCounterRef.current = 0;
    }
  };
  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDraggingFile(false);
    dragCounterRef.current = 0;
    const files = Array.from(e.dataTransfer.files || []);
    for (const file of files) {
      try {
        const parsed = await parseFileClientSide(file);
        addSource(parsed);
      } catch (err) {
        console.error('File drop ingest failed:', err);
      }
    }
  };

  const handleCitationClick = (index, foundSource) => {
    setActiveCitation(index);
    if (foundSource) {
      setInspectingSource(foundSource);
      setIsSourcesCollapsed(false);
    }
  };

  const handleExportNotebook = async () => {
    try {
      const markdown = await exportNotebook(id);
      const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(notebook?.title || 'notebook').replace(/\s+/g, '_')}_export.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const handleImportDiscovery = async (imported) => {
    const urls = imported.map((src) => src.url).filter(Boolean);
    if (imported.length === 0) return;
    setDiscoveryTopic(null);
    const pending = imported.map((item) => ({
      title: item.title || 'Web Source',
      url: item.url || '',
      snippet: item.snippet || '',
      type: 'web',
      status: 'Indexing...'
    }));
    addMultipleSources(pending);

    try {
      let scrapedDocsMap = new Map();
      if (urls.length > 0) {
        const res = await runPipeline({ query: 'discovery_import', urls });
        if (res?.data && Array.isArray(res.data)) {
          res.data.forEach((doc) => {
            const docUrl = (doc.url || doc.URL || '').toLowerCase();
            const text = doc.content || doc.Content || doc.markdown || '';
            if (docUrl && text) scrapedDocsMap.set(docUrl, text);
          });
        }
      }
      updateMultipleSources(pending.map((item) => ({
        ...item,
        content: scrapedDocsMap.get((item.url || '').toLowerCase()) || item.snippet || item.title,
        status: 'Ready'
      })));
    } catch {
      updateMultipleSources(pending.map((item) => ({ ...item, content: item.snippet || item.title, status: 'Ready' })));
    }
  };

  const commands = [
    { label: 'Switch to Midnight Obsidian theme', type: 'Theme', icon: <Moon size={14} />, action: () => changeTheme('obsidian') },
    { label: 'Switch to Cyberpunk Glass theme', type: 'Theme', icon: <Terminal size={14} />, action: () => changeTheme('cyberpunk') },
    { label: 'Switch to Clean Corporate theme', type: 'Theme', icon: <Check size={14} />, action: () => changeTheme('corporate') },
    { label: 'Open Chat Studio', type: 'Navigation', icon: <Eye size={14} />, action: () => setActiveMode('chat') },
    { label: 'Study Studio: Briefing Document', type: 'Study', icon: <Eye size={14} />, action: () => { setActiveMode('study'); setStudyTab('briefing'); } },
    { label: 'Study Studio: Audio Overview', type: 'Study', icon: <Eye size={14} />, action: () => { setActiveMode('study'); setStudyTab('audio'); } },
    { label: 'Study Studio: Quizzes', type: 'Study', icon: <Eye size={14} />, action: () => { setActiveMode('study'); setStudyTab('quiz'); } },
    { label: 'Study Studio: Mind Map', type: 'Study', icon: <Eye size={14} />, action: () => { setActiveMode('study'); setStudyTab('mindmap'); } },
    { label: 'Study Studio: Reports', type: 'Study', icon: <Eye size={14} />, action: () => { setActiveMode('study'); setStudyTab('reports'); } },
    ...sources.map((s) => ({
      label: `Open Source: ${s.title}`,
      type: 'Source',
      icon: <Eye size={14} />,
      action: () => handleCitationClick(s.index, s)
    }))
  ];

  if (loadingNotebook) {
    return (
      <div style={{ display: 'flex', height: '100%', width: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: '#09090b', color: '#71717a' }}>
        <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.85rem' }}>LOADING WORKSPACE...</p>
      </div>
    );
  }

  if (!notebook) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: '#09090b', color: '#f4f4f5' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '12px' }}>Notebook Not Found</h2>
        <button onClick={() => navigate('/')} style={{ padding: '8px 16px', backgroundColor: '#27272a', border: '1px solid #3f3f46', borderRadius: '8px', color: '#f4f4f5', cursor: 'pointer' }}>Return to Notebooks</button>
      </div>
    );
  }

  return (
    <div
      className="notebook-workspace-3panel"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#09090b' }}
    >
      <DragDropOverlay isDragging={isDraggingFile} />

      <NotebookHeader
        title={notebook.title}
        notebookId={notebook.id || id}
        onClearChat={clearChat}
        messageCount={messages.length}
        activeMode={activeMode}
        setActiveMode={setActiveMode}
        onExport={handleExportNotebook}
      />

      <div
        className="three-panel-body"
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'row',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          backgroundColor: '#09090b'
        }}
      >
        {!isSourcesCollapsed && (
          <ErrorBoundary title="Sources Panel Error">
            <Sidebar
              sources={sources}
              activeCitation={activeCitation}
              scopedSourceIds={scopedSourceIds}
              onToggleScope={toggleSourceScope}
              onToggleAllScope={toggleAllSourcesScope}
              onSelectSource={(s) => {
                setActiveCitation(s.index);
                setInspectingSource(s);
                setIsSourcesCollapsed(false);
              }}
              onDoubleClickSource={(s) => { setInspectingSource(s); setIsSourcesCollapsed(false); }}
              onDeleteSource={removeSource}
              onOpenAddModal={() => setIsAddModalOpen(true)}
              discoveryTopic={discoveryTopic}
              setDiscoveryTopic={setDiscoveryTopic}
              onImportDiscovery={handleImportDiscovery}
              isCollapsed={isSourcesCollapsed}
              onToggleCollapse={() => setIsSourcesCollapsed(!isSourcesCollapsed)}
              inspectingSource={inspectingSource}
              setInspectingSource={setInspectingSource}
              onExplainSource={(s) => { setActiveMode('chat'); sendMessage(`Explain source: "${s.title}"`, 'notebook', null, [s.id || String(s.index)]); }}
              onChatWithSource={(s) => { setScopedSourceIds(new Set([s.id || String(s.index)])); setInspectingSource(null); }}
            />
          </ErrorBoundary>
        )}

        <div
          className="center-workspace-wrapper"
          style={{
            flex: 1,
            minWidth: 0,
            minHeight: 0,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#09090b'
          }}
        >
          <ErrorBoundary title="Workspace Error">
            {activeMode === 'chat' ? (
              <ChatStudio
                messages={messages}
                loading={chatLoading}
                streamPhase={streamPhase}
                maxSources={maxSources}
                setMaxSources={setMaxSources}
                onSendMessage={(q, m, h) => sendMessage(q, m, h, Array.from(scopedSourceIds))}
                onStopStream={stopStream}
                onRegenerate={regenerateMessage}
                onEditAndResend={editAndResendMessage}
                onClearChat={clearChat}
                allSources={sources}
                scopedSourceIds={scopedSourceIds}
                onCitationClick={handleCitationClick}
                activeCitation={activeCitation}
                onSaveNote={(note) => setNotes((prev) => [note, ...prev])}
                chatEndRef={chatEndRef}
                notebookTitle={notebook.title}
                notebookDescription={notebook.description}
                isSourcesCollapsed={isSourcesCollapsed}
                onToggleSources={() => setIsSourcesCollapsed(!isSourcesCollapsed)}
                isStudioCollapsed={isStudioCollapsed}
                onToggleStudio={() => setIsStudioCollapsed(!isStudioCollapsed)}
                onOpenAddSources={() => setIsAddModalOpen(true)}
                onAddUrl={async (url) => {
                  if (url.includes('youtube.com') || url.includes('youtu.be')) {
                    const fallback = parseYouTubeURL(url);
                    addSource({ ...fallback, status: 'Indexing...' });
                    try {
                      const transcript = await fetchYouTubeTranscript(url);
                      updateMultipleSources([{ ...fallback, title: transcript.title || fallback.title, content: transcript.content, status: 'Ready' }]);
                    } catch {
                      updateMultipleSources([{ ...fallback, status: 'Ready' }]);
                    }
                  } else {
                    let title = url;
                    try { title = new URL(url).hostname; } catch {}
                    addSource({ title, url, type: 'web' });
                  }
                }}
              />
            ) : (
              <StudyStudio
                notebookId={id}
                sources={sources}
                activeTab={studyTab}
                setActiveTab={setStudyTab}
                setActiveMode={setActiveMode}
                isSourcesCollapsed={isSourcesCollapsed}
                onToggleSources={() => setIsSourcesCollapsed(!isSourcesCollapsed)}
                isStudioCollapsed={isStudioCollapsed}
                onToggleStudio={() => setIsStudioCollapsed(!isStudioCollapsed)}
              />
            )}
          </ErrorBoundary>
        </div>

        {!isStudioCollapsed && (
          <ErrorBoundary title="Notes Studio Error">
            <NotesPanel
              notes={notes}
              onAddNote={(n) => setNotes((prev) => [n, ...prev])}
              onUpdateNote={(n) => setNotes((prev) => prev.map((item) => (item.id === n.id ? n : item)))}
              onDeleteNote={(nId) => setNotes((prev) => prev.filter((item) => item.id !== nId))}
              activeMode={activeMode}
              setActiveMode={setActiveMode}
              isCollapsed={isStudioCollapsed}
              onToggleCollapse={() => setIsStudioCollapsed(!isStudioCollapsed)}
              studyTab={studyTab}
              setStudyTab={setStudyTab}
            />
          </ErrorBoundary>
        )}
      </div>

      <AddSourceModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddSource={(src) => addSource(src)}
        onSearchDiscovery={(topic) => setDiscoveryTopic(topic)}
      />

      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        commands={commands}
      />
    </div>
  );
}
