import React from 'react';
import { 
  MessageSquare,
  Headphones, 
  BrainCircuit, 
  Network, 
  FileText, 
  HelpCircle, 
  FileBarChart
} from 'lucide-react';

export default function StudioToolsGrid({ activeMode, setActiveMode, studyTab, setStudyTab }) {
  const tools = [
    {
      id: 'chat',
      title: 'Chat Studio',
      icon: <MessageSquare size={14} color="#60a5fa" />,
      action: () => {
        setActiveMode?.('chat');
      },
      isActive: activeMode === 'chat'
    },
    {
      id: 'audio',
      title: 'Audio Overview',
      icon: <Headphones size={14} color="#34d399" />,
      action: () => {
        setActiveMode?.('study');
        setStudyTab?.('audio');
      },
      isActive: activeMode === 'study' && studyTab === 'audio'
    },
    {
      id: 'mindmap',
      title: 'Mind Map',
      icon: <Network size={14} color="#c084fc" />,
      action: () => {
        setActiveMode?.('study');
        setStudyTab?.('mindmap');
      },
      isActive: activeMode === 'study' && studyTab === 'mindmap'
    },
    {
      id: 'briefing',
      title: 'Briefing Doc',
      icon: <FileText size={14} color="#fbbf24" />,
      action: () => {
        setActiveMode?.('study');
        setStudyTab?.('briefing');
      },
      isActive: activeMode === 'study' && studyTab === 'briefing'
    },
    {
      id: 'flashcards',
      title: 'Flashcards',
      icon: <BrainCircuit size={14} color="#f472b6" />,
      action: () => {
        setActiveMode?.('study');
        setStudyTab?.('flashcards');
      },
      isActive: activeMode === 'study' && studyTab === 'flashcards'
    },
    {
      id: 'quiz',
      title: 'Quiz',
      icon: <HelpCircle size={14} color="#22d3ee" />,
      action: () => {
        setActiveMode?.('study');
        setStudyTab?.('quiz');
      },
      isActive: activeMode === 'study' && studyTab === 'quiz'
    },
    {
      id: 'reports',
      title: 'Reports',
      icon: <FileBarChart size={14} color="#a78bfa" />,
      action: () => {
        setActiveMode?.('study');
        setStudyTab?.('reports');
      },
      isActive: activeMode === 'study' && studyTab === 'reports'
    }
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
      {tools.map((tool) => (
        <button
          key={tool.id}
          type="button"
          onClick={tool.action}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '9px 14px',
            borderRadius: '9999px',
            backgroundColor: tool.isActive ? '#2b2d35' : '#202227',
            border: tool.isActive ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid rgba(255, 255, 255, 0.04)',
            color: tool.isActive ? '#ffffff' : '#d4d4d8',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'background-color 0.15s ease, border-color 0.15s ease'
          }}
          onMouseEnter={(e) => {
            if (!tool.isActive) {
              e.currentTarget.style.backgroundColor = '#282a31';
            }
          }}
          onMouseLeave={(e) => {
            if (!tool.isActive) {
              e.currentTarget.style.backgroundColor = '#202227';
            }
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {tool.icon}
          </span>
          <span style={{ fontSize: '0.76rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {tool.title}
          </span>
        </button>
      ))}
    </div>
  );
}
