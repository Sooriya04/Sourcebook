import React, { useState } from 'react';
import { Sparkles, BookOpen, HelpCircle, Scale, FileText, ListOrdered, Plus } from 'lucide-react';

const STARTER_CHIPS = [
  { icon: <Sparkles size={13} color="#818cf8" />, label: "Summarize sources", query: "Provide a comprehensive, structured summary of the core themes, findings, and key takeaways across all sources." },
  { icon: <HelpCircle size={13} color="#34d399" />, label: "FAQ & Core concepts", query: "Generate a 5-question FAQ explaining the most important concepts and mechanisms described in these sources." },
  { icon: <BookOpen size={13} color="#a78bfa" />, label: "Study guide", query: "Create a detailed study guide with key definitions, conceptual frameworks, and review questions based on the sources." },
  { icon: <Scale size={13} color="#fbbf24" />, label: "Compare perspectives", query: "Analyze agreements, conflicting viewpoints, and differing methodologies presented across the sources." },
  { icon: <FileText size={13} color="#f472b6" />, label: "Briefing document", query: "Generate an executive briefing document outlining critical findings, practical implications, and future directions." },
  { icon: <ListOrdered size={13} color="#38bdf8" />, label: "Table of contents", query: "Create a logical table of contents structuring the knowledge covered in all uploaded sources." }
];

export default function ChatWelcomeScreen({ notebookTitle, notebookDescription, sourceCount = 0, onSend, onOpenAddSources }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isLong = notebookDescription && notebookDescription.length > 140;

  return (
    <div style={{ maxWidth: '680px', margin: '48px auto 20px', textAlign: 'center', padding: '0 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Brand Sparkle Icon */}
      <div style={{
        width: '44px',
        height: '44px',
        borderRadius: '12px',
        background: 'rgba(99, 102, 241, 0.12)',
        border: '1px solid rgba(99, 102, 241, 0.25)',
        display: 'grid',
        placeItems: 'center',
        color: '#818cf8',
        marginBottom: '18px'
      }}>
        <Sparkles size={20} />
      </div>

      {/* Notebook Title & Description */}
      <h1 style={{
        fontSize: '1.75rem',
        fontWeight: 600,
        letterSpacing: '-0.025em',
        color: '#f4f4f5',
        margin: '0 0 10px 0',
        lineHeight: 1.2
      }}>
        {notebookTitle || 'Research Workspace'}
      </h1>

      <p style={{
        fontSize: '0.9rem',
        color: '#a1a1aa',
        lineHeight: 1.55,
        margin: '0 0 28px 0',
        maxWidth: '560px'
      }}>
        {isLong && !isExpanded ? `${notebookDescription.slice(0, 140)}...` : (notebookDescription || 'Grounded intelligence platform. Query your sources with strict numerical citations.')}
        {isLong && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            style={{ background: 'transparent', border: 'none', color: '#818cf8', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', marginLeft: '6px' }}
          >
            {isExpanded ? 'Show less' : 'Read more'}
          </button>
        )}
      </p>

      {/* Floating Prompt Starter Chips (Open, Unboxed, NotebookLM Style) */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
        {sourceCount === 0 && onOpenAddSources && (
          <button
            type="button"
            onClick={onOpenAddSources}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '9999px',
              background: 'rgba(99, 102, 241, 0.12)',
              border: '1px solid rgba(99, 102, 241, 0.35)',
              color: '#c7d2fe',
              fontSize: '0.78rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              marginBottom: '4px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(99, 102, 241, 0.22)';
              e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.55)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(99, 102, 241, 0.12)';
              e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.35)';
            }}
          >
            <Plus size={13} strokeWidth={2.5} />
            <span>Add your first source</span>
          </button>
        )}

        <div style={{ fontSize: '0.72rem', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
          {sourceCount > 0 ? `${sourceCount} ${sourceCount === 1 ? 'source' : 'sources'} indexed • Suggested prompts:` : 'Suggested prompts to explore:'}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px', maxWidth: '640px' }}>
          {STARTER_CHIPS.map((chip, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onSend(chip.query)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '9999px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#e4e4e7',
                fontSize: '0.8rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                outline: 'none'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.22)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                e.currentTarget.style.color = '#e4e4e7';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
              onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.97)'; }}
              onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
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
