import React, { useState } from 'react';
import { Sparkles, BookOpen, HelpCircle, Scale, FileText, ListOrdered } from 'lucide-react';

export default function ChatWelcomeScreen({
  notebookTitle,
  notebookDescription,
  sourceCount = 0,
  onSend
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isLong = notebookDescription && notebookDescription.length > 140;

  const starterChips = [
    {
      icon: <Sparkles size={13} color="#3b82f6" />,
      label: "Summarize Sources",
      query: "Provide a comprehensive, structured summary of the core themes, findings, and key takeaways across all sources."
    },
    {
      icon: <HelpCircle size={13} color="#10b981" />,
      label: "FAQ & Concepts",
      query: "Generate a 5-question FAQ explaining the most important concepts and mechanisms described in these sources."
    },
    {
      icon: <BookOpen size={13} color="#8b5cf6" />,
      label: "Study Guide",
      query: "Create a detailed study guide with key definitions, conceptual frameworks, and review questions based on the sources."
    },
    {
      icon: <Scale size={13} color="#f59e0b" />,
      label: "Compare Perspectives",
      query: "Analyze agreements, conflicting viewpoints, and differing methodologies presented across the sources."
    },
    {
      icon: <FileText size={13} color="#ec4899" />,
      label: "Briefing Doc",
      query: "Generate an executive briefing document outlining critical findings, practical implications, and future directions."
    },
    {
      icon: <ListOrdered size={13} color="#06b6d4" />,
      label: "Table of Contents",
      query: "Create a logical table of contents structuring the knowledge covered in all uploaded sources."
    }
  ];

  return (
    <div className="welcome-screen" style={{
      maxWidth: '680px',
      margin: '36px auto 20px auto',
      textAlign: 'center',
      padding: '0 16px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '20px'
    }}>
      {/* Notebook Brand Icon */}
      <div style={{
        width: '46px',
        height: '46px',
        borderRadius: '14px',
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.18), rgba(139, 92, 246, 0.18))',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        display: 'grid',
        placeItems: 'center',
        color: 'var(--accent-primary, #3b82f6)',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)'
      }}>
        <Sparkles size={22} />
      </div>

      {/* Header Info */}
      <div style={{ maxWidth: '600px' }}>
        <h1 style={{
          fontSize: '1.6rem',
          fontWeight: 700,
          letterSpacing: '-0.025em',
          color: 'var(--text-main, #f4f4f5)',
          margin: '0 0 8px 0'
        }}>
          {notebookTitle || 'Research Workspace'}
        </h1>
        <p style={{
          fontSize: '0.86rem',
          color: 'var(--text-muted, #a1a1aa)',
          lineHeight: '1.5',
          margin: 0
        }}>
          {isLong && !isExpanded 
            ? `${notebookDescription.slice(0, 140)}...` 
            : (notebookDescription || 'Grounded intelligence platform. Query all uploaded sources with verified numerical citations.')}
          {isLong && (
            <button 
              type="button" 
              onClick={() => setIsExpanded(!isExpanded)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--accent-primary, #3b82f6)',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                marginLeft: '6px'
              }}
            >
              {isExpanded ? 'Show less' : 'Read more'}
            </button>
          )}
        </p>
      </div>

      {/* NotebookLM Style Guide Card */}
      <div style={{
        width: '100%',
        background: 'rgba(255, 255, 255, 0.025)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        padding: '18px 20px',
        textAlign: 'left',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        backdropFilter: 'blur(8px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-main, #f4f4f5)' }}>
            <BookOpen size={16} color="var(--accent-primary, #3b82f6)" />
            <span>Notebook Guide</span>
          </div>
          <span style={{
            fontSize: '0.72rem',
            fontWeight: 500,
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '2px 10px',
            borderRadius: '12px',
            color: 'var(--text-muted, #a1a1aa)'
          }}>
            {sourceCount} {sourceCount === 1 ? 'source' : 'sources'} indexed
          </span>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted, #a1a1aa)', margin: '0 0 14px 0', lineHeight: '1.45' }}>
          Synthesize answers strictly grounded in your active documents with clickable citations, or choose a prompt to get started:
        </p>

        {/* NotebookLM Sleek Floating Pill Chips */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          {starterChips.map((chip, i) => (
            <button 
              key={i} 
              type="button"
              onClick={() => onSend(chip.query)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                padding: '7px 14px',
                borderRadius: '20px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'var(--text-main, #e4e4e7)',
                fontSize: '0.78rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {chip.icon}
              <span>{chip.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
