import React, { useState } from 'react';
import { FileText, Download, Award, BookOpen, Clock, ShieldCheck, Copy, Check } from 'lucide-react';

export default function ReportsView({ sources = [] }) {
  const [copied, setCopied] = useState(false);
  const sourceCount = sources.length;
  const webSources = sources.filter(s => s.type === 'web' || s.SourceType === 'Web');
  const youtubeSources = sources.filter(s => s.type === 'youtube' || s.SourceType === 'YouTube');
  const localSources = sources.filter(s => s.type !== 'web' && s.type !== 'youtube' && s.SourceType !== 'Web' && s.SourceType !== 'YouTube');

  const totalChars = sources.reduce((acc, s) => acc + (s.content?.length || s.text?.length || 0), 0);
  const totalWords = Math.round(totalChars / 5);
  const estimatedReadTime = Math.max(1, Math.round(totalWords / 200));

  const handlePrint = () => {
    window.print();
  };

  const handleCopyMarkdown = () => {
    let md = `# Workspace Research Report\n\n`;
    md += `- **Total Sources:** ${sourceCount}\n`;
    md += `- **Local Documents:** ${localSources.length}\n`;
    md += `- **Web Ingestions:** ${webSources.length}\n`;
    md += `- **YouTube Transcripts:** ${youtubeSources.length}\n`;
    md += `- **Estimated Words:** ${totalWords.toLocaleString()} (~${estimatedReadTime} min read)\n\n`;
    md += `## Ingested Sources Index\n\n`;
    sources.forEach((s, idx) => {
      md += `${idx + 1}. **${s.title || 'Untitled Source'}** (${s.type || 'document'})\n`;
      if (s.url) md += `   - Link: ${s.url}\n`;
    });
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="reports-view" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="study-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>
            <FileText size={20} style={{ color: 'var(--accent-primary)' }} />
            <span>Workspace Research Dossier</span>
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Real-time coverage analytics and material inventory across all notebook sources.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleCopyMarkdown}
            style={{
              background: 'var(--canvas-2)',
              color: 'var(--text-main)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '7px 12px',
              fontSize: '0.78rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {copied ? <Check size={14} style={{ color: '#10b981' }} /> : <Copy size={14} />}
            <span>{copied ? 'Copied MD' : 'Copy Markdown'}</span>
          </button>
          <button
            onClick={handlePrint}
            style={{
              background: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '7px 12px',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Download size={14} />
            <span>Print / Export PDF</span>
          </button>
        </div>
      </div>

      <div
        className="report-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '16px'
        }}
      >
        <div style={{ background: 'var(--canvas-2)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border-color)', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', borderRadius: '8px', padding: '8px' }}>
            <BookOpen size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Sources</div>
            <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-main)' }}>{sourceCount}</div>
          </div>
        </div>

        <div style={{ background: 'var(--canvas-2)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border-color)', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '8px', padding: '8px' }}>
            <ShieldCheck size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Corpus Size</div>
            <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#10b981' }}>{totalWords.toLocaleString()} words</div>
          </div>
        </div>

        <div style={{ background: 'var(--canvas-2)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border-color)', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', borderRadius: '8px', padding: '8px' }}>
            <Clock size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Estimated Reading</div>
            <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-main)' }}>~{estimatedReadTime} min</div>
          </div>
        </div>
      </div>

      <div
        className="glass-card"
        style={{
          background: 'var(--panel)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '24px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#a78bfa' }}>
          <Award size={18} />
          <span style={{ fontSize: '0.74rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Source Inventory Breakdown
          </span>
        </div>

        <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: '1.7', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{ margin: 0 }}>
            This workspace currently synthesizes <strong>{sourceCount} active source(s)</strong>:
            comprising <strong>{localSources.length} document file(s)</strong> (PDFs, Markdown, raw notes),
            <strong>{webSources.length} live web ingestion(s)</strong> via Searqon/SearXNG, and
            <strong>{youtubeSources.length} video transcript(s)</strong>.
          </p>
          {sources.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
              <div style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-main)', textTransform: 'uppercase' }}>Indexed Sources</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '8px' }}>
                {sources.map((s, i) => (
                  <div key={s.id || i} style={{ padding: '8px 12px', background: 'var(--canvas-2)', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.76rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {s.title || 'Untitled'}
                    </span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
                      {s.type?.toUpperCase() || 'DOC'} • {((s.content?.length || 0) / 5).toFixed(0)} words
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
