import React from 'react';
import { Sparkles, HelpCircle, BookOpen, Scale, FileText, ListOrdered, Plus } from 'lucide-react';

const DEFAULT_CHIPS = [
  { icon: <Sparkles size={13} color="#818cf8" />, label: "Summarize sources", query: "Provide a comprehensive, structured summary of the core themes across all sources." },
  { icon: <HelpCircle size={13} color="#34d399" />, label: "FAQ & Core concepts", query: "Generate a 5-question FAQ explaining the most important concepts described in these sources." },
  { icon: <BookOpen size={13} color="#a78bfa" />, label: "Study guide", query: "Create a detailed study guide with key definitions and review questions based on the sources." },
  { icon: <Scale size={13} color="#fbbf24" />, label: "Compare perspectives", query: "Analyze agreements and conflicting viewpoints presented across the sources." },
  { icon: <FileText size={13} color="#f472b6" />, label: "Briefing document", query: "Generate an executive briefing document outlining critical findings and practical implications." },
  { icon: <ListOrdered size={13} color="#38bdf8" />, label: "Table of contents", query: "Create a logical table of contents structuring the knowledge covered in all uploaded sources." }
];

export default function ChatWelcomeScreen({ notebookTitle, notebookDescription, sourceCount = 0, guide = null, onSend, onOpenAddSources }) {
  const chips = guide?.suggested_questions?.length > 0
    ? guide.suggested_questions.map((q) => ({ label: q, query: q, icon: <Sparkles size={13} color="#818cf8" /> }))
    : DEFAULT_CHIPS;

  return (
    <div style={{ maxWidth: '680px', margin: '36px auto 20px', textAlign: 'center', padding: '0 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: '#18191c', border: '1px solid rgba(255, 255, 255, 0.05)', display: 'grid', placeItems: 'center', color: '#38bdf8', marginBottom: '16px' }}>
        <Sparkles size={20} />
      </div>

      <h1 style={{ fontSize: '1.65rem', fontWeight: 600, letterSpacing: '-0.025em', color: '#f4f4f5', margin: '0 0 8px 0', lineHeight: 1.2 }}>
        {notebookTitle || 'Research Workspace'}
      </h1>

      {guide?.summary ? (
        <div style={{ width: '100%', maxWidth: '580px', background: '#18191c', border: '1px solid rgba(255, 255, 255, 0.07)', borderRadius: '16px', padding: '16px 20px', textAlign: 'left', margin: '14px 0 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#a8c7fa', fontWeight: 600, marginBottom: '8px' }}>
            <Sparkles size={13} />
            <span>Executive Overview</span>
          </div>
          <p style={{ margin: 0, fontSize: '0.86rem', color: '#e3e3e3', lineHeight: 1.55 }}>{guide.summary}</p>
          {guide.topics?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '12px' }}>
              {guide.topics.map((t, idx) => (
                <span key={idx} style={{ fontSize: '0.72rem', padding: '3px 8px', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.05)', color: '#9aa0a6' }}>{t}</span>
              ))}
            </div>
          )}
        </div>
      ) : (
        <p style={{ fontSize: '0.88rem', color: '#a1a1aa', lineHeight: 1.55, margin: '0 0 24px 0', maxWidth: '540px' }}>
          {notebookDescription || 'Grounded intelligence platform. Query your sources with strict numerical citations.'}
        </p>
      )}

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        {sourceCount === 0 && onOpenAddSources && (
          <button
            type="button"
            onClick={onOpenAddSources}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '9999px', background: 'rgba(99, 102, 241, 0.12)', border: '1px solid rgba(99, 102, 241, 0.35)', color: '#c7d2fe', fontSize: '0.78rem', fontWeight: 500, cursor: 'pointer', marginBottom: '4px' }}
          >
            <Plus size={13} strokeWidth={2.5} />
            <span>Add your first source</span>
          </button>
        )}

        <div style={{ fontSize: '0.72rem', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
          {sourceCount > 0 ? `${sourceCount} ${sourceCount === 1 ? 'source' : 'sources'} indexed • Suggested prompts:` : 'Suggested prompts to explore:'}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px', maxWidth: '640px' }}>
          {chips.map((chip, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onSend(chip.query)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px',
                borderRadius: '9999px', background: '#18191c', border: '1px solid rgba(255, 255, 255, 0.05)',
                color: '#e4e4e7', fontSize: '0.82rem', cursor: 'pointer', transition: 'all 0.15s ease', outline: 'none'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)'; e.currentTarget.style.background = '#22242a'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)'; e.currentTarget.style.background = '#18191c'; }}
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
