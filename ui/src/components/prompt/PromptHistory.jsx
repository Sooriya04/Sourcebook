import React from 'react';
import { Clock, RotateCcw, CheckCircle2, AlertCircle, Loader2, ExternalLink } from 'lucide-react';

function formatRelativeDate(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return '';
  }
}

export default function PromptHistory({
  history = [],
  currentNotebookId = '',
  onLoadPrompt,
  onViewChat
}) {
  if (history.length === 0) {
    return (
      <div className="prompt-empty-list">
        <Clock size={18} style={{ opacity: 0.5, marginBottom: '6px' }} />
        <div>No prompts executed yet. Run a prompt to see execution history here.</div>
      </div>
    );
  }

  return (
    <div className="prompt-history-list">
      {history.map((entry) => {
        const isCurrentNotebook = entry.notebookId === currentNotebookId;
        const statusIcon =
          entry.status === 'running' ? (
            <Loader2 size={12} className="spin-icon" />
          ) : entry.status === 'error' ? (
            <AlertCircle size={12} />
          ) : (
            <CheckCircle2 size={12} />
          );

        return (
          <div key={entry.id} className="prompt-history-item">
            <div className="prompt-history-main">
              <div className="prompt-history-top">
                <span className="prompt-history-title">{entry.promptName}</span>
                <span className={`prompt-history-status ${entry.status || 'completed'}`}>
                  {statusIcon}
                  <span>{entry.status || 'completed'}</span>
                </span>
              </div>
              <div className="prompt-history-meta">
                <span>{formatRelativeDate(entry.executedAt)}</span>
                <span>·</span>
                <span>{entry.notebookTitle || 'Notebook'}</span>
                <span>·</span>
                <span>
                  {entry.sourceMode === 'none'
                    ? 'No grounding'
                    : `${entry.sourceCount} source${entry.sourceCount === 1 ? '' : 's'}`}
                </span>
              </div>
            </div>

            <div className="prompt-library-actions">
              {isCurrentNotebook && onViewChat && (
                <button
                  type="button"
                  title="View conversation"
                  onClick={() => onViewChat(entry)}
                  className="prompt-icon-action"
                >
                  <ExternalLink size={13} />
                </button>
              )}
              <button
                type="button"
                title="Load into editor to edit or rerun"
                onClick={() => onLoadPrompt(entry)}
                className="prompt-icon-action"
              >
                <RotateCcw size={13} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
