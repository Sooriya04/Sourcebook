import React, { useState } from 'react';
import { generateFlashcards } from '../../services/sourcebookApi';
import { RefreshCw, ChevronLeft, ChevronRight, BrainCircuit, Headphones, FileText, HelpCircle, Layers, Network, MessageSquare } from 'lucide-react';
import BriefingView from './BriefingView';
import AudioOverviewView from './AudioOverviewView';
import FaqView from './FaqView';
import QuizView from './QuizView';
import MindMapView from './MindMapView';
import ReportsView from './ReportsView';
import './StudyStudio.css';

export default function StudyStudio({ notebookId, sources, activeTab, setActiveTab, setActiveMode }) {
  const [flashcards, setFlashcards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
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
    }, 150); // wait for flip animation before changing content
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
    }, 150);
  };

  return (
    <div className="study-studio">
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
                <span style={{ fontSize: '0.62rem', background: '#374151', color: '#9ca3af', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 'bold', border: '1px solid rgba(255,255,255,0.08)' }}>Mockup Preview</span>
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
                <BrainCircuit size={48} color="#94a3b8" />
                <p>Click "Generate Flashcards" to begin studying this notebook.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
