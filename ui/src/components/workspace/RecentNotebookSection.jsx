import React from 'react';
import { BookOpen, Layers, ArrowRight, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatRelativeTime } from '../../utils/formatters';

export default function RecentNotebookSection({ notebooks = [], onSelectNotebook }) {
  const navigate = useNavigate();

  if (!notebooks || notebooks.length === 0) return null;

  return (
    <section className="recent-notebooks-section" aria-label="Recently active research">
      <div className="recent-section-header">
        <div className="recent-header-left">
          <Clock size={14} className="text-accent" />
          <h2 className="recent-section-title">Jump Back In</h2>
        </div>
        <span className="recent-section-hint">Recently updated research</span>
      </div>

      <div className="recent-notebooks-grid">
        {notebooks.map((nb) => {
          const sourceCount = (nb.sources || []).length;
          const timeString = formatRelativeTime(nb.updatedAt || nb.createdAt || nb.updated_at || nb.created_at);

          return (
            <div
              key={nb.id}
              role="button"
              tabIndex={0}
              className="recent-notebook-card"
              onClick={() => onSelectNotebook ? onSelectNotebook(nb) : navigate(`/notebook/${nb.id}`)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectNotebook ? onSelectNotebook(nb) : navigate(`/notebook/${nb.id}`);
                }
              }}
            >
              <div className="recent-card-top">
                <div className="recent-card-icon-box">
                  <BookOpen size={15} />
                </div>
                <ArrowRight size={13} className="recent-card-arrow" />
              </div>

              <div className="recent-card-main">
                <h3 className="recent-card-title" title={nb.title}>
                  {nb.title || 'Untitled Notebook'}
                </h3>
                {nb.description && (
                  <p className="recent-card-desc">
                    {nb.description}
                  </p>
                )}
              </div>

              <div className="recent-card-footer">
                <span className="recent-card-sources">
                  <Layers size={11} />
                  <span>{sourceCount} {sourceCount === 1 ? 'source' : 'sources'}</span>
                </span>
                <span className="recent-card-time">{timeString}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
