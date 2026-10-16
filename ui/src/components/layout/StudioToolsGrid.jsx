import React from 'react';
import { 
  Headphones, 
  Play, 
  BrainCircuit, 
  Network, 
  FileText, 
  HelpCircle, 
  ChevronRight, 
  MessageSquare 
} from 'lucide-react';

export default function StudioToolsGrid({ activeMode, setActiveMode, studyTab, setStudyTab }) {
  const tools = [
    {
      id: 'chat',
      title: 'Chat Studio',
      icon: <MessageSquare size={14} />,
      action: () => {
        setActiveMode('chat');
        setStudyTab?.('chat');
      },
      isActive: activeMode === 'chat'
    },
    {
      id: 'briefing',
      title: 'Briefing Doc',
      icon: <FileText size={14} />,
      action: () => {
        setActiveMode('study');
        setStudyTab?.('briefing');
      },
      isActive: activeMode === 'study' && studyTab === 'briefing'
    },
    {
      id: 'flashcards',
      title: 'Flashcards',
      icon: <BrainCircuit size={14} />,
      action: () => {
        setActiveMode('study');
        setStudyTab?.('flashcards');
      },
      isActive: activeMode === 'study' && studyTab === 'flashcards'
    },
    {
      id: 'quiz',
      title: 'Quiz',
      icon: <HelpCircle size={14} />,
      action: () => {
        setActiveMode('study');
        setStudyTab?.('quiz');
      },
      isActive: activeMode === 'study' && studyTab === 'quiz'
    },
    {
      id: 'mindmap',
      title: 'Mind Map',
      icon: <Network size={14} />,
      action: () => {
        setActiveMode('study');
        setStudyTab?.('mindmap');
      },
      isActive: activeMode === 'study' && studyTab === 'mindmap'
    },
    {
      id: 'reports',
      title: 'Reports',
      icon: <FileText size={14} />,
      action: () => {
        setActiveMode('study');
        setStudyTab?.('reports');
      },
      isActive: activeMode === 'study' && studyTab === 'reports'
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Featured Audio Overview Card (Signature NotebookLM Style) */}
      <div 
        onClick={() => { setActiveMode('study'); setStudyTab?.('audio'); }}
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: (activeMode === 'study' && studyTab === 'audio') ? '1px solid rgba(99, 102, 241, 0.6)' : '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '14px',
          padding: '14px',
          cursor: 'pointer',
          transition: 'all 0.15s ease'
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.18)'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = (activeMode === 'study' && studyTab === 'audio') ? 'rgba(99, 102, 241, 0.6)' : 'rgba(255, 255, 255, 0.08)';
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', display: 'grid', placeItems: 'center', color: '#818cf8' }}>
              <Headphones size={14} />
            </div>
            <div>
              <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#f4f4f5' }}>Audio Overview</div>
              <div style={{ fontSize: '0.68rem', color: '#a1a1aa' }}>Deep Dive podcast</div>
            </div>
          </div>
          <ChevronRight size={14} style={{ color: '#71717a' }} />
        </div>
        <p style={{ fontSize: '0.74rem', color: '#a1a1aa', margin: '0 0 10px 0', lineHeight: '1.4' }}>
          Two AI hosts summarize and explore the core ideas from your sources.
        </p>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setActiveMode('study'); setStudyTab?.('audio'); }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 12px',
            borderRadius: '9999px',
            background: 'rgba(99, 102, 241, 0.15)',
            border: '1px solid rgba(99, 102, 241, 0.35)',
            color: '#a5b4fc',
            fontSize: '0.72rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          <Play size={10} fill="currentColor" />
          <span>Generate Deep Dive</span>
        </button>
      </div>

      {/* Grid of Other Study Tools */}
      <div className="studio-tools-grid">
        {tools.map((tool) => (
          <button
            key={tool.id}
            type="button"
            className={`studio-tool-tile ${tool.isActive ? 'active' : ''}`}
            onClick={tool.action}
          >
            <div className="studio-tile-top">
              <span className="studio-tile-icon">{tool.icon}</span>
              <ChevronRight size={12} className="studio-tile-chevron" />
            </div>
            <span className="studio-tile-title">{tool.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
