import React, { useState } from 'react';
import { Network, Info, Plus, Minus, Search, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

const NODES_DATA = {
  id: 'root',
  label: 'Workspace Intelligence',
  desc: 'Central knowledge hub combining local documents and dynamic online scraping.',
  children: [
    {
      id: 'rag',
      label: 'Grounded RAG Engine',
      desc: 'Retrieves relevant document chunks and synthesizes answers using Ollama/OpenAI.',
      children: [
        { id: 'eval', label: 'Self-Evaluation', desc: 'Checks retrieved context quality and confidence score.' },
        { id: 'react', label: 'ReAct Agent Loop', desc: 'Multi-step reasoning loops to call search tools dynamically.' }
      ]
    },
    {
      id: 'crawler',
      label: 'Scraping & Discovery',
      desc: 'Crawls and sanitizes web pages, PDFs, and YouTube transcripts.',
      children: [
        { id: 'searxng', label: 'SearXNG Provider', desc: 'Concurrent query routing to private search engines.' },
        { id: 'searqon', label: 'Searqon Scraper', desc: 'Converts target HTML pages into cleaned Markdown text.' }
      ]
    },
    {
      id: 'db',
      label: 'Local Storage',
      desc: 'Handles local indexing, episodic memory, and document vectors.',
      children: [
        { id: 'sqlite', label: 'SQLite DB', desc: 'Stores persistent notes, source metadata, and chat history.' },
        { id: 'vector', label: 'Vector Embeddings', desc: 'Indexes source paragraphs via Nomic embeddings.' }
      ]
    }
  ]
};

export default function MindMapView() {
  const [selectedNode, setSelectedNode] = useState(NODES_DATA);
  const [expandedNodes, setExpandedNodes] = useState({
    root: true,
    rag: true,
    crawler: true,
    db: true
  });
  const [zoom, setZoom] = useState(100);

  const toggleExpand = (nodeId, e) => {
    e.stopPropagation();
    setExpandedNodes(prev => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  const handleResetZoom = () => setZoom(100);
  const handleZoomIn = () => setZoom(z => Math.min(150, z + 10));
  const handleZoomOut = () => setZoom(z => Math.max(70, z - 10));

  return (
    <div className="mindmap-view" style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="study-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>
            <Network size={20} style={{ color: 'var(--accent-primary)' }} /> 
            <span>Interactive Mind Map</span>
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>Explore the conceptual hierarchy of your notebook's knowledge graphs. Click nodes to inspect.</p>
        </div>

        {/* Pan / Zoom Canvas Controls */}
        <div style={{ display: 'flex', gap: '4px', background: 'var(--canvas-2)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '2px' }}>
          <button onClick={handleZoomIn} title="Zoom In" style={{ background: 'transparent', border: 'none', padding: '6px', color: 'var(--text-muted)', cursor: 'pointer', borderRadius: '6px' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}><ZoomIn size={14} /></button>
          <button onClick={handleZoomOut} title="Zoom Out" style={{ background: 'transparent', border: 'none', padding: '6px', color: 'var(--text-muted)', cursor: 'pointer', borderRadius: '6px' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}><ZoomOut size={14} /></button>
          <button onClick={handleResetZoom} title="Reset" style={{ background: 'transparent', border: 'none', padding: '6px', color: 'var(--text-muted)', cursor: 'pointer', borderRadius: '6px' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}><RotateCcw size={14} /></button>
          <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', padding: '6px 8px', color: 'var(--text-dim)', alignSelf: 'center' }}>{zoom}%</span>
        </div>
      </div>

      <div 
        className="mindmap-container glass-card"
        style={{
          display: 'grid',
          gridTemplateColumns: '3fr 2fr',
          gap: '20px',
          background: 'var(--panel)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '24px',
          minHeight: '420px',
          boxShadow: 'var(--shadow)'
        }}
      >
        {/* Left Pane: Interactive Tree Diagram */}
        <div 
          className="map-tree-area" 
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'center', 
            gap: '30px', 
            borderRight: '1px solid var(--border-color)', 
            paddingRight: '20px',
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'center left',
            transition: 'transform 0.2s ease-out'
          }}
        >
          {/* Root Node */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => setSelectedNode(NODES_DATA)}
                style={{
                  background: selectedNode.id === NODES_DATA.id ? 'var(--accent-primary)' : 'var(--canvas-2)',
                  color: selectedNode.id === NODES_DATA.id ? 'var(--canvas)' : 'var(--text-main)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  padding: '10px 16px',
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow)',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {NODES_DATA.label}
              </button>
              <button 
                onClick={(e) => toggleExpand('root', e)} 
                style={{ background: 'var(--canvas-2)', border: '1px solid var(--border-color)', borderRadius: '50%', width: '20px', height: '20px', display: 'grid', placeItems: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                {expandedNodes.root ? <Minus size={10} /> : <Plus size={10} />}
              </button>
            </div>
          </div>

          {/* Level 1 & 2 */}
          {expandedNodes.root && (
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
              {NODES_DATA.children.map((child) => (
                <div key={child.id} style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', width: '100%' }}>
                    <button
                      onClick={() => setSelectedNode(child)}
                      style={{
                        background: selectedNode.id === child.id ? 'var(--accent-primary)' : 'var(--canvas-2)',
                        color: selectedNode.id === child.id ? 'var(--canvas)' : 'var(--text-main)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        padding: '8px 10px',
                        fontSize: '0.74rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        flex: 1,
                        textAlign: 'center',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {child.label}
                    </button>
                    <button 
                      onClick={(e) => toggleExpand(child.id, e)} 
                      style={{ background: 'var(--canvas-2)', border: '1px solid var(--border-color)', borderRadius: '50%', width: '18px', height: '18px', display: 'grid', placeItems: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}
                    >
                      {expandedNodes[child.id] ? <Minus size={8} /> : <Plus size={8} />}
                    </button>
                  </div>

                  {/* Level 2 Sub-children */}
                  {expandedNodes[child.id] && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '90%' }}>
                      {child.children.map((sub) => (
                        <button
                          key={sub.id}
                          onClick={() => setSelectedNode(sub)}
                          style={{
                            background: selectedNode.id === sub.id ? 'var(--accent-primary)' : 'var(--canvas-2)',
                            color: selectedNode.id === sub.id ? 'var(--canvas)' : 'var(--text-muted)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '6px',
                            padding: '6px 10px',
                            fontSize: '0.68rem',
                            cursor: 'pointer',
                            width: '100%',
                            textAlign: 'center',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {sub.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Pane: Inspector Panel */}
        <div className="map-detail-area" style={{ display: 'flex', flexDirection: 'column', gap: '16px', justifyContent: 'center' }}>
          <div 
            style={{ 
              background: 'var(--canvas-2)', 
              borderRadius: '12px', 
              padding: '20px', 
              border: '1px solid var(--border-color)' 
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--accent-primary)' }}>
              <Info size={16} />
              <span style={{ fontSize: '0.74rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--font-mono)' }}>
                Node Inspector
              </span>
            </div>

            <h3 style={{ margin: '0 0 8px 0', fontSize: '0.92rem', color: 'var(--text-main)', fontFamily: 'var(--font-sans)', fontWeight: 600 }}>
              {selectedNode.label}
            </h3>
            
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.6', fontFamily: 'var(--font-serif)' }}>
              {selectedNode.desc}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
