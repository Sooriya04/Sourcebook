import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, RefreshCw, Sparkles, BookmarkPlus } from 'lucide-react';
import { generateFAQ } from '../../services/sourcebookApi';

export default function FaqView({ notebookId, onAddNote }) {
  const [openIndex, setOpenIndex] = useState(null);
  const [faqItems, setFaqItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [savedNotes, setSavedNotes] = useState({});

  const handleGenerate = async () => {
    if (!notebookId || loading) return;
    setLoading(true);
    setError(null);
    setOpenIndex(null);
    try {
      const resp = await generateFAQ(notebookId);
      if (resp.faq && resp.faq.length > 0) {
        setFaqItems(resp.faq);
      } else {
        setError('No FAQ items could be generated from the current sources.');
      }
    } catch (err) {
      setError(err.message || 'Failed to generate FAQ');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToNotes = (item, idx) => {
    if (onAddNote) {
      onAddNote(`### Q: ${item.q}\n\n${item.a}`);
      setSavedNotes(prev => ({ ...prev, [idx]: true }));
      setTimeout(() => {
        setSavedNotes(prev => ({ ...prev, [idx]: false }));
      }, 2000);
    }
  };

  return (
    <div className="faq-view">
      <div className="faq-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <HelpCircle size={22} className="faq-header-icon" />
          <div>
            <h3>Grounded Workspace FAQ</h3>
            <p>Key learning questions automatically generated from your sources.</p>
          </div>
        </div>
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
          <span>{faqItems.length > 0 ? 'Regenerate FAQ' : 'Generate FAQ'}</span>
        </button>
      </div>

      {error && (
        <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '8px', fontSize: '0.82rem' }}>
          {error}
        </div>
      )}

      {faqItems.length === 0 && !loading && !error && (
        <div style={{ textAlign: 'center', padding: '48px 16px', color: '#9ca3af' }}>
          <HelpCircle size={40} style={{ opacity: 0.4, marginBottom: '12px' }} />
          <p style={{ fontSize: '0.9rem', marginBottom: '16px' }}>No FAQ generated yet for this workspace.</p>
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
            Generate FAQ from Sources
          </button>
        </div>
      )}

      {faqItems.length > 0 && (
        <div className="faq-accordion-list" style={{ marginTop: '20px' }}>
          {faqItems.map((item, idx) => {
            const isOpen = openIndex === idx;
            const isSaved = savedNotes[idx];
            return (
              <div key={idx} className={`faq-accordion-item ${isOpen ? 'open' : ''}`}>
                <button
                  className="faq-accordion-question"
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                >
                  <span>{item.q}</span>
                  {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {isOpen && (
                  <div className="faq-accordion-answer">
                    <p style={{ margin: '0 0 12px 0' }}>{item.a}</p>
                    {onAddNote && (
                      <button
                        onClick={() => handleSaveToNotes(item, idx)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: 'rgba(255, 255, 255, 0.06)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          color: isSaved ? '#10b981' : '#c4c6cd',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '0.74rem',
                          cursor: 'pointer'
                        }}
                      >
                        <BookmarkPlus size={12} />
                        <span>{isSaved ? 'Saved to Notes!' : 'Save to Notes'}</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
