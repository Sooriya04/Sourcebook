import React, { useState } from 'react';
import { HelpCircle, CheckCircle, XCircle } from 'lucide-react';

const MOCK_QUESTIONS = [
  {
    id: 1,
    question: "What is the primary philosophy of SourceBook's architecture?",
    options: [
      "Heavy reliance on cloud databases",
      "Local-First, lightweight execution with SQLite & Ollama",
      "Python-only script orchestration",
      "Multi-tenant hosting"
    ],
    answerIndex: 1
  },
  {
    id: 2,
    question: "Which model is used by default for generating local vector embeddings?",
    options: [
      "openai-text-embedding-3",
      "all-MiniLM-L6-v2",
      "nomic-embed-text",
      "bert-base-uncased"
    ],
    answerIndex: 2
  },
  {
    id: 3,
    question: "How are inline citations represented in generated RAG responses?",
    options: [
      "Hyperlinks only",
      "Strict numerical citations like [1], [2]",
      "Parentheses with author names",
      "Footnotes at the end of the page"
    ],
    answerIndex: 1
  }
];

export default function QuizView() {
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [score, setScore] = useState(0);

  const handleSelect = (qId, optionIdx, correctIdx) => {
    if (selectedAnswers[qId] !== undefined) return; // Answered already
    setSelectedAnswers(prev => ({ ...prev, [qId]: optionIdx }));
    if (optionIdx === correctIdx) {
      setScore(prev => prev + 1);
    }
  };

  return (
    <div className="quiz-view">
      <div className="study-header">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <HelpCircle size={20} /> 
          <span>Interactive Quiz</span>
          <span style={{ fontSize: '0.62rem', background: '#374151', color: '#9ca3af', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 'bold', border: '1px solid rgba(255,255,255,0.08)' }}>Mockup Preview</span>
        </h2>
        <p>Test your understanding of the workspace materials. Select the best answer for each question.</p>
      </div>

      <div className="quiz-list" style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
        {MOCK_QUESTIONS.map((q) => {
          const selected = selectedAnswers[q.id];
          const isAnswered = selected !== undefined;

          return (
            <div
              key={q.id}
              className="quiz-card"
              style={{
                background: '#22242a',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: '16px',
                padding: '20px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
            >
              <h4 style={{ margin: '0 0 14px 0', fontSize: '0.86rem', color: '#e3e4e8' }}>
                {q.id}. {q.question}
              </h4>
              <div className="quiz-options" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {q.options.map((opt, idx) => {
                  const isCorrect = idx === q.answerIndex;
                  const isUserSelected = idx === selected;
                  
                  let bg = '#1b1d22';
                  let border = '1px solid rgba(255, 255, 255, 0.04)';
                  let color = '#c4c6cd';

                  if (isAnswered) {
                    if (isCorrect) {
                      bg = 'rgba(16, 185, 129, 0.15)';
                      border = '1px solid #10b981';
                      color = '#10b981';
                    } else if (isUserSelected) {
                      bg = 'rgba(239, 68, 68, 0.15)';
                      border = '1px solid #ef4444';
                      color = '#ef4444';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelect(q.id, idx, q.answerIndex)}
                      className={`quiz-option-btn ${!isAnswered ? 'interactive-opt' : ''}`}
                      style={{
                        background: bg,
                        border: border,
                        color: color,
                        padding: '12px 16px',
                        borderRadius: '10px',
                        cursor: isAnswered ? 'default' : 'pointer',
                        fontSize: '0.8rem',
                        textAlign: 'left',
                        transition: 'all 120ms ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                      disabled={isAnswered}
                    >
                      <span>{opt}</span>
                      {isAnswered && isCorrect && <CheckCircle size={14} />}
                      {isAnswered && isUserSelected && !isCorrect && <XCircle size={14} />}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div
        className="quiz-score-banner"
        style={{
          background: 'linear-gradient(90deg, #1e3a8a, #3b82f6)',
          borderRadius: '12px',
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '24px'
        }}
      >
        <span style={{ fontSize: '0.84rem', fontWeight: '600', color: '#ffffff' }}>Your Progress</span>
        <span style={{ fontSize: '0.94rem', fontWeight: '700', color: '#ffffff' }}>
          {Object.keys(selectedAnswers).length} / {MOCK_QUESTIONS.length} Answered
        </span>
      </div>
    </div>
  );
}
