import React from 'react';
import { FileText, Download, Award, BookOpen, Clock, ShieldCheck } from 'lucide-react';

export default function ReportsView({ sources = [] }) {
  const sourceCount = sources.length;
  const webCount = sources.filter(s => s.type === 'web' || s.SourceType === 'Web').length;
  const youtubeCount = sources.filter(s => s.type === 'youtube' || s.SourceType === 'YouTube').length;
  const notebookCount = sourceCount - webCount - youtubeCount;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="reports-view">
      <div className="study-header">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={20} /> 
          <span>Notebook Report</span>
          <span style={{ fontSize: '0.62rem', background: '#374151', color: '#9ca3af', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 'bold', border: '1px solid rgba(255,255,255,0.08)' }}>Mockup Preview</span>
        </h2>
        <p>A comprehensive research brief summarizing the loaded materials and coverage metrics of this workspace.</p>
      </div>

      <div 
        className="report-grid" 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: '16px', 
          margin: '24px 0' 
        }}
      >
        <div style={{ background: '#22242a', borderRadius: '12px', padding: '16px', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', borderRadius: '8px', padding: '8px' }}>
            <BookOpen size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.68rem', color: '#8b8d97', textTransform: 'uppercase' }}>Total Sources</div>
            <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#e3e4e8' }}>{sourceCount}</div>
          </div>
        </div>

        <div style={{ background: '#22242a', borderRadius: '12px', padding: '16px', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '8px', padding: '8px' }}>
            <ShieldCheck size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.68rem', color: '#8b8d97', textTransform: 'uppercase' }}>Ingestion Health</div>
            <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#10b981' }}>100%</div>
          </div>
        </div>

        <div style={{ background: '#22242a', borderRadius: '12px', padding: '16px', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', borderRadius: '8px', padding: '8px' }}>
            <Clock size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.68rem', color: '#8b8d97', textTransform: 'uppercase' }}>Read Time</div>
            <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#e3e4e8' }}>~{Math.max(1, sourceCount * 3)}m</div>
          </div>
        </div>
      </div>

      <div 
        className="report-paper-card"
        style={{
          background: '#22242a',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#a78bfa' }}>
            <Award size={18} />
            <span style={{ fontSize: '0.74rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Executive Research Summary
            </span>
          </div>

          <button 
            onClick={handlePrint}
            style={{
              background: '#1b1d22',
              color: '#c4c6cd',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '0.72rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 120ms ease'
            }}
          >
            <Download size={12} />
            <span>Download PDF</span>
          </button>
        </div>

        <div style={{ fontSize: '0.8rem', color: '#c4c6cd', lineHeight: '1.7', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p>
            This workspace includes <strong>{sourceCount} materials</strong> across <strong>{notebookCount} local document(s)</strong>, 
            <strong>{webCount} web source(s)</strong>, and <strong>{youtubeCount} video transcript(s)</strong>.
          </p>
          <p>
            Key topics extracted from the documents center around agentic query planning, vector index retrieval, and RAG ground truth. 
            All citations are fully mapped dynamically using numerical markers, assuring 100% grounded response accuracy and leaving zero room for hallucinated context.
          </p>
        </div>
      </div>
    </div>
  );
}
