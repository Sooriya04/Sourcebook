import React, { useState } from 'react';
import { FileText, Award, BookOpen, Layers, RefreshCw, Sparkles, BookmarkPlus } from 'lucide-react';
import { generateBriefing } from '../../services/sourcebookApi';

export default function BriefingView({ notebookId, sources, onAddNote }) {
  const [briefing, setBriefing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  const handleGenerate = async () => {
    if (!notebookId || loading) return;
    setLoading(true);
    setError(null);
    try {
      const resp = await generateBriefing(notebookId);
      if (resp && (resp.summary || (resp.concepts && resp.concepts.length > 0))) {
        setBriefing(resp);
      } else {
        setError('No briefing could be compiled from the current sources.');
      }
    } catch (err) {
      setError(err.message || 'Failed to generate briefing document');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToNotes = () => {
    if (!briefing || !onAddNote) return;
    let md = `## Executive Study Briefing\n\n${briefing.summary || ''}\n\n### Core Concepts\n`;
    (briefing.concepts || []).forEach(c => {
      md += `- **${c.term}:** ${c.definition}\n`;
    });
    if (briefing.questions && briefing.questions.length > 0) {
      md += `\n### Key Research Questions\n`;
      briefing.questions.forEach(q => {
        md += `- ${q}\n`;
      });
    }
    onAddNote(md);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="briefing-view">
      <div className="briefing-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <FileText size={24} className="briefing-header-icon" />
          <div>
            <h3>Study Briefing Document</h3>
            <p>Structured study summary compiled from {sources?.length || 0} active workspace sources.</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {briefing && onAddNote && (
            <button
              onClick={handleSaveToNotes}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(255, 255, 255, 0.08)',
                color: saved ? '#10b981' : '#e5e7eb',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '0.82rem',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              <BookmarkPlus size={14} />
              <span>{saved ? 'Saved!' : 'Save Briefing to Notes'}</span>
            </button>
          )}
          <button
            onClick={handleGenerate}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 14px',
              fontSize: '0.82rem',
              fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? <RefreshCw size={14} className="spin-icon" /> : <Sparkles size={14} />}
            <span>{briefing ? 'Regenerate Briefing' : 'Generate Briefing'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '8px', fontSize: '0.82rem' }}>
          {error}
        </div>
      )}

      {!briefing && !loading && !error && (
        <div style={{ textAlign: 'center', padding: '48px 16px', color: '#9ca3af' }}>
          <FileText size={40} style={{ opacity: 0.4, marginBottom: '12px' }} />
          <p style={{ fontSize: '0.9rem', marginBottom: '16px' }}>No briefing document compiled yet for this workspace.</p>
          <button
            onClick={handleGenerate}
            style={{
              background: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 18px',
              fontSize: '0.84rem',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            Compile Executive Briefing
          </button>
        </div>
      )}

      {briefing && (
        <div className="briefing-grid" style={{ marginTop: '20px' }}>
          {briefing.summary && (
            <div className="briefing-card">
              <div className="briefing-card-title">
                <Award size={16} />
                <span>Executive Summary</span>
              </div>
              <p style={{ whiteSpace: 'pre-line', lineHeight: 1.6 }}>{briefing.summary}</p>
            </div>
          )}

          {briefing.concepts && briefing.concepts.length > 0 && (
            <div className="briefing-card">
              <div className="briefing-card-title">
                <BookOpen size={16} />
                <span>Core Definitions & Concepts</span>
              </div>
              <ul className="briefing-list">
                {briefing.concepts.map((c, idx) => (
                  <li key={idx}>
                    <strong>{c.term}:</strong> {c.definition}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {briefing.questions && briefing.questions.length > 0 && (
            <div className="briefing-card">
              <div className="briefing-card-title">
                <Layers size={16} />
                <span>Key Research Questions</span>
              </div>
              <ul className="briefing-list">
                {briefing.questions.map((q, idx) => (
                  <li key={idx}>{q}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
