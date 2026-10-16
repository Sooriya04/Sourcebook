import React, { useState } from 'react';
import { Sparkles, FileText, Headphones, TrendingUp, ArrowUpRight } from 'lucide-react';

const TEMPLATES = [
  {
    id: 'ai-research',
    title: 'AI Research Assistant',
    badge: 'Web & Citations',
    icon: Sparkles,
    description: 'Synthesize multi-source internet research with SearXNG discovery and strict inline citations.'
  },
  {
    id: 'doc-synth',
    title: 'Document Synthesizer',
    badge: 'PDFs & Markdown',
    icon: FileText,
    description: 'Deep-dive ingestion for complex whitepapers, technical documentation, and structured meeting notes.'
  },
  {
    id: 'podcast-brief',
    title: 'Podcast & Video Briefings',
    badge: 'Audio Studio',
    icon: Headphones,
    description: 'Transform ingested documents into two-host audio dialogue overviews, study guides, and FAQs.'
  },
  {
    id: 'market-intel',
    title: 'Market Intelligence',
    badge: 'Competitive Analysis',
    icon: TrendingUp,
    description: 'Track competitor developments, industry breakthroughs, and product launch intelligence.'
  }
];

export default function FeaturedTemplates({ onSelectTemplate }) {
  const [hoveredId, setHoveredId] = useState(null);

  return (
    <section className="featured-templates-section" style={{ marginBottom: '32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <span style={{ fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#a1a1aa' }}>
          Example Notebooks
        </span>
        <span style={{ fontSize: '0.67rem', color: '#818cf8', backgroundColor: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.25)', padding: '1px 6px', borderRadius: '9999px', fontWeight: 500 }}>
          Featured
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '12px' }}>
        {TEMPLATES.map((tmpl) => {
          const Icon = tmpl.icon;
          const isHovered = hoveredId === tmpl.id;

          return (
            <div
              key={tmpl.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelectTemplate(tmpl)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectTemplate(tmpl);
                }
              }}
              onMouseEnter={() => setHoveredId(tmpl.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '16px',
                minHeight: '140px',
                backgroundColor: isHovered ? '#1c1c20' : '#141417',
                border: isHovered ? '1px solid rgba(99, 102, 241, 0.38)' : '1px solid rgba(255, 255, 255, 0.07)',
                borderRadius: '12px',
                cursor: 'pointer',
                transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
                boxShadow: isHovered ? '0 6px 20px -4px rgba(0, 0, 0, 0.45)' : 'none',
                transition: 'all 0.16s cubic-bezier(0.16, 1, 0.3, 1)',
                outline: 'none'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      backgroundColor: '#202024',
                      border: '1px solid #2e2e33',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isHovered ? '#818cf8' : '#a5b4fc'
                    }}
                  >
                    <Icon size={16} />
                  </div>
                  <span style={{ fontSize: '0.67rem', fontWeight: 500, color: '#a1a1aa', backgroundColor: '#1d1d21', border: '1px solid rgba(255, 255, 255, 0.05)', padding: '2px 7px', borderRadius: '5px' }}>
                    {tmpl.badge}
                  </span>
                </div>

                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f4f4f5', letterSpacing: '-0.01em', marginBottom: '4px' }}>
                  {tmpl.title}
                </div>

                <p style={{ fontSize: '0.78rem', color: '#a1a1aa', lineHeight: 1.45, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {tmpl.description}
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', paddingTop: '10px', marginTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.04)', fontSize: '0.72rem', fontWeight: 500, color: isHovered ? '#818cf8' : '#71717a' }}>
                <span>Use template</span>
                <ArrowUpRight size={13} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
