import React, { useState } from 'react';
import { Network, Info, Layers } from 'lucide-react';

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

  return (
    <div className="mindmap-view" style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="study-header">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Network size={20} /> 
          <span>Interactive Mind Map</span>
          <span style={{ fontSize: '0.62rem', background: '#374151', color: '#9ca3af', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 'bold', border: '1px solid rgba(255,255,255,0.08)' }}>Mockup Preview</span>
        </h2>
        <p>Explore the conceptual hierarchy of your notebook's knowledge graphs. Click any node to inspect details.</p>
      </div>

      <div 
        className="mindmap-container"
        style={{
          display: 'grid',
          gridTemplateColumns: '3fr 2fr',
          gap: '20px',
          background: '#22242a',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: '16px',
          padding: '24px',
          minHeight: '400px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
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
            borderRight: '1px solid rgba(255, 255, 255, 0.05)', 
            paddingRight: '20px' 
          }}
        >
          {/* Root Node */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button
              onClick={() => setSelectedNode(NODES_DATA)}
              style={{
                background: selectedNode.id === NODES_DATA.id ? '#3b82f6' : '#1e293b',
                color: '#ffffff',
                border: selectedNode.id === NODES_DATA.id ? '2px solid #60a5fa' : '1px solid rgba(255,255,255,0.15)',
                borderRadius: '12px',
                padding: '12px 18px',
                fontSize: '0.82rem',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
                transition: 'all 120ms ease'
              }}
            >
              {NODES_DATA.label}
            </button>
          </div>

          {/* Level 1 & 2 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
            {NODES_DATA.children.map((child) => (
              <div key={child.id} style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, alignItems: 'center' }}>
                <button
                  onClick={() => setSelectedNode(child)}
                  style={{
                    background: selectedNode.id === child.id ? 'rgba(59, 130, 246, 0.25)' : '#1b1d22',
                    color: selectedNode.id === child.id ? '#60a5fa' : '#c4c6cd',
                    border: selectedNode.id === child.id ? '2px solid #3b82f6' : '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '10px',
                    padding: '8px 12px',
                    fontSize: '0.74rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    width: '100%',
                    textAlign: 'center',
                    transition: 'all 120ms ease'
                  }}
                >
                  {child.label}
                </button>

                {/* Level 2 Sub-children */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '90%' }}>
                  {child.children.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => setSelectedNode(sub)}
                      style={{
                        background: selectedNode.id === sub.id ? 'rgba(139, 92, 246, 0.2)' : '#131518',
                        color: selectedNode.id === sub.id ? '#a78bfa' : '#8b8d97',
                        border: selectedNode.id === sub.id ? '1px solid #8b5cf6' : '1px solid rgba(255,255,255,0.04)',
                        borderRadius: '8px',
                        padding: '6px 10px',
                        fontSize: '0.68rem',
                        cursor: 'pointer',
                        width: '100%',
                        textAlign: 'center',
                        transition: 'all 120ms ease'
                      }}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Pane: Inspector Panel */}
        <div className="map-detail-area" style={{ display: 'flex', flexDirection: 'column', gap: '16px', justifyContent: 'center' }}>
          <div 
            style={{ 
              background: '#1b1d22', 
              borderRadius: '12px', 
              padding: '20px', 
              border: '1px solid rgba(255, 255, 255, 0.04)' 
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#3b82f6' }}>
              <Info size={16} />
              <span style={{ fontSize: '0.74rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Node Inspector
              </span>
            </div>

            <h3 style={{ margin: '0 0 8px 0', fontSize: '0.92rem', color: '#e3e4e8' }}>
              {selectedNode.label}
            </h3>
            
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#8b8d97', lineHeight: '1.6' }}>
              {selectedNode.desc}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
