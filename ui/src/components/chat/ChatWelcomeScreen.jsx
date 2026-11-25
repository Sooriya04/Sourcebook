import React from 'react';
import { Sparkles, HelpCircle, BookOpen, Scale, FileText, ListOrdered, Plus } from 'lucide-react';

const DEFAULT_CHIPS = [
  { icon: <Sparkles size={13} />, label: 'Summarize sources', query: 'Provide a comprehensive, structured summary of the core themes across all sources.' },
  { icon: <HelpCircle size={13} />, label: 'FAQ & Core concepts', query: 'Generate a 5-question FAQ explaining the most important concepts described in these sources.' },
  { icon: <BookOpen size={13} />, label: 'Study guide', query: 'Create a detailed study guide with key definitions and review questions based on the sources.' },
  { icon: <Scale size={13} />, label: 'Compare perspectives', query: 'Analyze agreements and conflicting viewpoints presented across the sources.' },
  { icon: <FileText size={13} />, label: 'Briefing document', query: 'Generate an executive briefing document outlining critical findings and practical implications.' },
  { icon: <ListOrdered size={13} />, label: 'Table of contents', query: 'Create a logical table of contents structuring the knowledge covered in all uploaded sources.' }
];

export default function ChatWelcomeScreen({
  notebookTitle,
  notebookDescription,
  sourceCount = 0,
  guide = null,
  onSend,
  onOpenAddSources
}) {
  const chips = guide?.suggested_questions?.length > 0
    ? guide.suggested_questions.map((q) => ({ label: q, query: q, icon: <Sparkles size={13} /> }))
    : DEFAULT_CHIPS;

  return (
    <div className="chat-welcome-container">
      <div className="chat-welcome-icon">
        <Sparkles size={18} />
      </div>

      <h2 className="chat-welcome-title">
        {notebookTitle || 'Research Workspace'}
      </h2>

      {guide?.summary ? (
        <div className="chat-welcome-overview">
          <div className="chat-welcome-overview-label">
            <Sparkles size={12} />
            <span>Executive Overview</span>
          </div>
          <p className="chat-welcome-overview-text">{guide.summary}</p>
          {guide.topics?.length > 0 && (
            <div className="chat-welcome-topics">
              {guide.topics.map((t, idx) => (
                <span key={idx} className="chat-welcome-topic-tag">{t}</span>
              ))}
            </div>
          )}
        </div>
      ) : (
        <p className="chat-welcome-desc">
          {notebookDescription || 'Ask questions, synthesize findings, and explore your sources with inline citations.'}
        </p>
      )}

      <div className="chat-welcome-prompts-section">
        {sourceCount === 0 && onOpenAddSources && (
          <button
            type="button"
            onClick={onOpenAddSources}
            className="chat-welcome-add-source-btn"
          >
            <Plus size={13} strokeWidth={2.4} />
            <span>Add your first source</span>
          </button>
        )}

        <div className="chat-welcome-context-label">
          {sourceCount > 0
            ? `${sourceCount} ${sourceCount === 1 ? 'source' : 'sources'} indexed · Suggested prompts`
            : 'Suggested prompts to explore'}
        </div>

        <div className="chat-welcome-suggestions">
          {chips.map((chip, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onSend(chip.query)}
              className="chat-welcome-suggestion-btn"
            >
              <span className="chat-welcome-suggestion-icon">{chip.icon}</span>
              <span>{chip.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
