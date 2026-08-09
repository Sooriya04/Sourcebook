import React, { useState, useRef, useEffect } from 'react';
import { 
  BookOpen, 
  Send, 
  Cpu,
  Globe, 
  ExternalLink, 
  Clock, 
  Copy, 
  Check, 
  Trash2, 
  Layers, 
  X,
  FileText,
  Bot,
  User
} from 'lucide-react';

export default function App() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([]);
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [maxSources, setMaxSources] = useState(5);
  const [selectedSource, setSelectedSource] = useState(null);
  const [activeCitation, setActiveCitation] = useState(null);
  const [copiedIdx, setCopiedIdx] = useState(null);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        setSelectedSource(null);
      }
    };
    if (selectedSource) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [selectedSource]);

  const handleSubmit = async (overrideQuery) => {
    const q = overrideQuery || query;
    if (!q.trim() || loading) return;

    const userMessage = { role: 'user', content: q };
    setMessages((prev) => [...prev, userMessage]);
    setQuery('');
    setLoading(true);

    try {
      const response = await fetch('/api/sourcebook/v1/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, max_sources: maxSources }),
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const data = await response.json();

      const aiMessage = {
        role: 'assistant',
        content: data.answer || 'No response generated.',
        sources: data.sources || [],
        duration: data.duration_ms || 0,
      };

      setMessages((prev) => [...prev, aiMessage]);

      if (data.sources && data.sources.length > 0) {
        setSources(data.sources);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Error synthesizing response: ${err.message}`,
          sources: [],
          duration: 0,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  // Parses text and renders interactive citation pills [1], [2]
  const renderFormattedAnswer = (text, msgSources) => {
    if (!text) return null;
    const citationRegex = /\[(\d+)\]/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = citationRegex.exec(text)) !== null) {
      const citeNum = parseInt(match[1], 10);
      const textChunk = text.substring(lastIndex, match.index);
      if (textChunk) parts.push(textChunk);

      const foundSource = msgSources?.find((s) => s.index === citeNum) || sources.find((s) => s.index === citeNum);

      parts.push(
        <button
          key={`cite-${match.index}`}
          className={`citation-pill ${activeCitation === citeNum ? 'active' : ''}`}
          onClick={() => {
            setActiveCitation(citeNum);
            if (foundSource) setSelectedSource(foundSource);
          }}
          title={foundSource ? foundSource.title : `Source [${citeNum}]`}
        >
          [{citeNum}]
        </button>
      );
      lastIndex = citationRegex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts;
  };

  return (
    <div className="app-container">
      {/* Left Sidebar: Sources & Knowledge Context */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="brand-title">
            <BookOpen size={20} color="var(--text-main)" />
            <span>SourceBook</span>
            <span className="brand-badge">V2 RAG</span>
          </div>
        </div>

        <div className="sources-section">
          <div className="section-title">
            <span>Sources</span>
            <span style={{ background: 'var(--bg-card)', padding: '2px 8px', borderRadius: '10px' }}>
              {sources.length} Active
            </span>
          </div>

          {sources.length === 0 ? (
            <div style={{ padding: '30px 10px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
              <Layers size={32} style={{ margin: '0 auto 10px auto', opacity: 0.4 }} />
              <p>No active sources yet.</p>
              <p style={{ fontSize: '0.75rem', marginTop: '4px' }}>Ask a question to retrieve live web knowledge.</p>
            </div>
          ) : (
            sources.map((src) => (
              <div
                key={src.index}
                className={`source-card ${activeCitation === src.index ? 'active' : ''}`}
                onClick={() => setSelectedSource(src)}
              >
                <div className="source-card-header">
                  <span className="source-index">[{src.index}]</span>
                  <span className="source-title">{src.title}</span>
                </div>
                <div className="source-url">
                  <Globe size={11} style={{ display: 'inline', marginRight: '4px' }} />
                  {src.url}
                </div>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* Main Studio Workspace */}
      <main className="main-studio">
        <header className="studio-header">
          <div className="header-status">
            <span className="status-dot"></span>
            <span>Local Grounded Pipeline Connected</span>
          </div>
          {messages.length > 0 && (
            <button
              onClick={() => { setMessages([]); setSources([]); }}
              style={{
                background: 'transparent',
                border: '1px solid var(--border-color)',
                color: 'var(--text-muted)',
                padding: '6px 12px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.8rem'
              }}
            >
              <Trash2 size={14} /> Clear Chat
            </button>
          )}
        </header>

        {/* Chat Timeline or Welcome Screen */}
        {messages.length === 0 ? (
          <div className="welcome-screen">
            <div className="welcome-icon">
              <Cpu size={28} />
            </div>
            <h1 className="welcome-title">What would you like to explore today?</h1>
            <p className="welcome-subtitle">
              SourceBook queries live internet sources, cleans scraped markdown, and synthesizes grounded answers with verifiable citations.
            </p>
            <div className="quick-prompts">
              {[
                "Who is the CEO of Google?",
                "What are the latest features in Go 1.22?",
                "Explain the architecture of NotebookLM",
              ].map((sample, idx) => (
                <button key={idx} className="prompt-chip" onClick={() => handleSubmit(sample)}>
                  {sample}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="chat-container">
            {messages.map((msg, idx) => (
              <div key={idx} className="message-card">
                <div className={`avatar ${msg.role === 'user' ? 'user' : 'ai'}`}>
                  {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
                </div>
                <div className="message-content-box">
                  <div className="message-sender">
                    <span>{msg.role === 'user' ? 'You' : 'SourceBook AI'}</span>
                    {msg.role === 'assistant' && msg.duration > 0 && (
                      <span className="duration-tag">
                        <Clock size={11} style={{ display: 'inline', marginRight: '3px' }} />
                        {(msg.duration / 1000).toFixed(2)}s
                      </span>
                    )}
                  </div>

                  <div className="message-text">
                    {msg.role === 'user'
                      ? msg.content
                      : renderFormattedAnswer(msg.content, msg.sources)}
                  </div>

                  {msg.role === 'assistant' && msg.content && (
                    <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <button
                        onClick={() => handleCopy(msg.content, idx)}
                        style={{
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border-color)',
                          color: 'var(--text-muted)',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        {copiedIdx === idx ? <Check size={12} color="var(--text-main)" /> : <Copy size={12} />}
                        {copiedIdx === idx ? 'Copied' : 'Copy Response'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="message-card">
                <div className="avatar ai">
                  <Cpu size={18} />
                </div>
                <div className="message-content-box" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  <span>Searching SearXNG & scraping sources via Searqon...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        )}

        {/* Input Bar Area */}
        <div className="prompt-area">
          <form
            className="prompt-bar"
            onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
          >
            <textarea
              className="prompt-input"
              placeholder="Ask SourceBook anything..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
            <div className="prompt-actions">
              <div className="controls-group">
                <Globe size={14} color="var(--text-main)" />
                <span>Max Sources:</span>
                <select
                  className="select-control"
                  value={maxSources}
                  onChange={(e) => setMaxSources(Number(e.target.value))}
                >
                  <option value={3}>3 Sources</option>
                  <option value={5}>5 Sources</option>
                  <option value={8}>8 Sources</option>
                  <option value={10}>10 Sources</option>
                </select>
              </div>

              <button
                type="submit"
                className="send-btn"
                disabled={!query.trim() || loading}
              >
                <Send size={16} />
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Source Inspector Modal / Drawer */}
      {selectedSource && (
        <div className="modal-overlay" onClick={() => setSelectedSource(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} color="var(--text-main)" />
                <span style={{ fontWeight: 600 }}>Source [{selectedSource.index}]: {selectedSource.title}</span>
              </div>
              <button
                onClick={() => setSelectedSource(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: '12px', fontSize: '0.8rem', color: 'var(--accent-primary)' }}>
                <ExternalLink size={12} style={{ display: 'inline', marginRight: '4px' }} />
                <a href={selectedSource.url} target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>
                  {selectedSource.url}
                </a>
              </p>
              <p style={{ color: 'var(--text-muted)' }}>
                This source was ingested and passed to the LLM synthesis engine for grounded citation.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
