import React, { useState } from 'react';
import { generateFlashcards } from '../../services/sourcebookApi';
import { RefreshCw, ChevronLeft, ChevronRight, BrainCircuit, Headphones, FileText, HelpCircle, Layers, Network, MessageSquare, Download, Check } from 'lucide-react';
import BriefingView from './BriefingView';
import AudioOverviewView from './AudioOverviewView';
import FaqView from './FaqView';
import QuizView from './QuizView';
import MindMapView from './MindMapView';
import ReportsView from './ReportsView';
import './StudyStudio.css';

const MINDMAP_DATA = {
  id: 'root',
  label: 'Workspace Intelligence',
  desc: 'Central knowledge hub combining local documents and dynamic online scraping.',
  children: [
    {
      id: 'rag',
      label: 'Grounded RAG Engine',
      desc: 'Retrieves relevant document chunks and synthesizes answers using Ollama/OpenAI.',
      children: [
        { id: 'eval', label: 'Self-Evaluation', desc: 'Checks retrieved context quality and confidence score.' },
        { id: 'react', label: 'ReAct Agent Loop', desc: 'Multi-step reasoning loops to call search tools dynamically.' }
      ]
    },
    {
      id: 'crawler',
      label: 'Scraping & Discovery',
      desc: 'Crawls and sanitizes web pages, PDFs, and YouTube transcripts.',
      children: [
        { id: 'searxng', label: 'SearXNG Provider', desc: 'Concurrent query routing to private search engines.' },
        { id: 'searqon', label: 'Searqon Scraper', desc: 'Converts target HTML pages into cleaned Markdown text.' }
      ]
    },
    {
      id: 'db',
      label: 'Local Storage',
      desc: 'Handles local indexing, episodic memory, and document vectors.',
      children: [
        { id: 'sqlite', label: 'SQLite DB', desc: 'Stores persistent notes, source metadata, and chat history.' },
        { id: 'vector', label: 'Vector Embeddings', desc: 'Indexes source paragraphs via Nomic embeddings.' }
      ]
    }
  ]
};

export default function StudyStudio({ notebookId, sources, activeTab, setActiveTab, setActiveMode }) {
  const [flashcards, setFlashcards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setFlashcards([]);
    setCurrentIndex(0);
    setIsFlipped(false);
    
    try {
      const resp = await generateFlashcards(notebookId);
      if (resp.flashcards && resp.flashcards.length > 0) {
        setFlashcards(resp.flashcards);
      } else {
        setError("No flashcards could be generated from the current sources.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to generate flashcards. Please check the backend connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % flashcards.length);
    }, 150);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
    }, 150);
  };

  // Export functions
  const handleExportBriefing = () => {
    const content = sources.map((s, idx) => `## [${idx + 1}] ${s.title}\n\n${s.content || ''}`).join('\n\n');
    const blob = new Blob([`# Study Briefing Document\n\n${content}`], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Briefing_Document.md`;
    a.click();
    setIsExportOpen(false);
  };

  const handleExportAudio = () => {
    const text = `Host 1 (Austin): Welcome back! Today we are doing a deep dive into the workspace documents...\nHost 2 (Taylor): Right? Especially the paper on Vision-Language-Action models...\nHost 1 (Austin): Exactly! It makes you think about how crucial high-fidelity web scraping is...`;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Audio_Overview_Transcript.txt`;
    a.click();
    setIsExportOpen(false);
  };

  const handleExportMindmap = () => {
    const blob = new Blob([JSON.stringify(MINDMAP_DATA, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Mindmap_Hierarchy.json`;
    a.click();
    setIsExportOpen(false);
  };

  let displayTitle = 'Study Studio';
  if (activeTab === 'briefing') displayTitle = 'Briefing Document';
  if (activeTab === 'audio') displayTitle = 'Audio Overview';
  if (activeTab === 'faq') displayTitle = 'FAQ Explorer';
  if (activeTab === 'quiz') displayTitle = 'Quiz Arena';
  if (activeTab === 'mindmap') displayTitle = 'Mind Map';
  if (activeTab === 'reports') displayTitle = 'Research Reports';
  if (activeTab === 'flashcards') displayTitle = 'Flashcards';

  return (
    <div className="study-studio" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Visual Header & Export Hub */}
      <div 
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '16px',
          position: 'relative'
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-sans)', color: 'var(--text-main)', margin: 0 }}>
            {displayTitle}
          </h1>
        </div>

        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setIsExportOpen(!isExportOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              background: 'var(--panel)',
              fontSize: '0.78rem',
              color: 'var(--text-main)',
              cursor: 'pointer',
              boxShadow: 'var(--shadow)',
              transition: 'transform 0.1s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--panel)'; }}
            onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.95)'; }}
            onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <Download size={13} />
            <span>Export Hub</span>
          </button>

          {isExportOpen && (
            <div 
              className="glass-card"
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '200px',
                background: 'var(--panel)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '6px',
                boxShadow: 'var(--shadow)',
                zIndex: 90,
                display: 'flex',
                flexDirection: 'column',
                gap: '2px'
              }}
            >
              <button 
                onClick={handleExportBriefing}
                style={{ background: 'transparent', border: 'none', borderRadius: '4px', padding: '8px 10px', fontSize: '0.74rem', textAlign: 'left', cursor: 'pointer', color: 'var(--text-main)' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                Briefing Document (.md)
              </button>
              <button 
                onClick={handleExportAudio}
                style={{ background: 'transparent', border: 'none', borderRadius: '4px', padding: '8px 10px', fontSize: '0.74rem', textAlign: 'left', cursor: 'pointer', color: 'var(--text-main)' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                Audio Script (.txt)
              </button>
              <button 
                onClick={handleExportMindmap}
                style={{ background: 'transparent', border: 'none', borderRadius: '4px', padding: '8px 10px', fontSize: '0.74rem', textAlign: 'left', cursor: 'pointer', color: 'var(--text-main)' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                Mind Map JSON (.json)
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="studio-tab-content">
        {activeTab === 'briefing' && <BriefingView sources={sources} />}
        
        {activeTab === 'audio' && <AudioOverviewView />}
        
        {activeTab === 'faq' && <FaqView />}

        {activeTab === 'quiz' && <QuizView />}

        {activeTab === 'mindmap' && <MindMapView />}

        {activeTab === 'reports' && <ReportsView sources={sources} />}

        {activeTab === 'flashcards' && (
          <div className="flashcards-section">
            <div className="study-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BrainCircuit size={20} /> 
                <span>Study Studio</span>
              </h2>
              <p>Auto-generate flashcards from your notebook sources to test your knowledge.</p>
              <button 
                className="generate-cards-btn" 
                onClick={handleGenerate} 
                disabled={loading}
              >
                {loading ? (
                  <><RefreshCw size={16} className="spin-icon" /> Generating...</>
                ) : (
                  <><RefreshCw size={16} /> Generate Flashcards</>
                )}
              </button>
            </div>

            {error && <div className="study-error">{error}</div>}

            {flashcards.length > 0 && !loading && (
              <div className="flashcard-container">
                <div className="flashcard-nav-count">
                  Card {currentIndex + 1} of {flashcards.length}
                </div>
                
                <div 
                  className={`flashcard ${isFlipped ? 'flipped' : ''}`} 
                  onClick={() => setIsFlipped(!isFlipped)}
                >
                  <div className="flashcard-inner">
                    <div className="flashcard-front">
                      <span className="card-label">Question</span>
                      <h3>{flashcards[currentIndex].q}</h3>
                      <div className="flip-hint">Click to flip</div>
                    </div>
                    <div className="flashcard-back">
                      <span className="card-label">Answer</span>
                      <p>{flashcards[currentIndex].a}</p>
                      <div className="flip-hint">Click to flip back</div>
                    </div>
                  </div>
                </div>

                <div className="flashcard-controls">
                  <button className="nav-btn" onClick={handlePrev}><ChevronLeft size={20} /> Prev</button>
                  <button className="nav-btn" onClick={handleNext}>Next <ChevronRight size={20} /></button>
                </div>
              </div>
            )}

            {flashcards.length === 0 && !loading && !error && (
              <div className="study-empty-state">
                <BrainCircuit size={48} color="var(--text-muted)" />
                <p>Click "Generate Flashcards" to begin studying this notebook.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
