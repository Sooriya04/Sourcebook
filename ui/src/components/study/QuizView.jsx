import React, { useState } from 'react';
import { HelpCircle, CheckCircle, XCircle, RefreshCw, Sparkles } from 'lucide-react';
import { generateQuiz } from '../../services/sourcebookApi';

export default function QuizView({ notebookId }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [score, setScore] = useState(0);

  const handleGenerate = async () => {
    if (!notebookId || loading) return;
    setLoading(true);
    setError(null);
    setSelectedAnswers({});
    setScore(0);
    try {
      const resp = await generateQuiz(notebookId);
      if (resp.questions && resp.questions.length > 0) {
        setQuestions(resp.questions);
      } else {
        setError('No quiz questions could be generated from the workspace sources.');
      }
    } catch (err) {
      setError(err.message || 'Failed to generate quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (qId, optionIdx, correctIdx) => {
    if (selectedAnswers[qId] !== undefined) return;
    setSelectedAnswers(prev => ({ ...prev, [qId]: optionIdx }));
    if (optionIdx === correctIdx) setScore(prev => prev + 1);
  };

  return (
    <div className="quiz-view">
      <div className="study-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HelpCircle size={20} />
            <span>Interactive Quiz Arena</span>
          </h2>
          <p>Test your understanding with conceptual questions grounded in your workspace materials.</p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 14px', fontSize: '0.82rem', fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
        >
          {loading ? <RefreshCw size={14} className="spin-icon" /> : <Sparkles size={14} />}
          <span>{questions.length > 0 ? 'Regenerate Quiz' : 'Generate Quiz'}</span>
        </button>
      </div>

      {error && <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '8px', fontSize: '0.82rem' }}>{error}</div>}

      {questions.length === 0 && !loading && !error && (
        <div style={{ textAlign: 'center', padding: '48px 16px', color: '#9ca3af' }}>
          <HelpCircle size={40} style={{ opacity: 0.4, marginBottom: '12px' }} />
          <p style={{ fontSize: '0.9rem', marginBottom: '16px' }}>No quiz generated yet for this workspace.</p>
          <button onClick={handleGenerate} style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 18px', fontSize: '0.84rem', fontWeight: 500, cursor: 'pointer' }}>
            Generate Quiz from Sources
          </button>
        </div>
      )}

      {questions.length > 0 && (
        <>
          <div className="quiz-list" style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
            {questions.map((q, idx) => {
              const qId = q.id || idx + 1;
              const selected = selectedAnswers[qId];
              const isAnswered = selected !== undefined;

              return (
                <div key={qId} className="quiz-card" style={{ background: '#22242a', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                  <h4 style={{ margin: '0 0 14px 0', fontSize: '0.86rem', color: '#e3e4e8' }}>{idx + 1}. {q.question}</h4>
                  <div className="quiz-options" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {q.options.map((opt, optIdx) => {
                      const isCorrect = optIdx === q.answerIndex;
                      const isUserSelected = optIdx === selected;
                      let bg = '#1b1d22', border = '1px solid rgba(255, 255, 255, 0.04)', color = '#c4c6cd';

                      if (isAnswered) {
                        if (isCorrect) { bg = 'rgba(16, 185, 129, 0.15)'; border = '1px solid #10b981'; color = '#10b981'; }
                        else if (isUserSelected) { bg = 'rgba(239, 68, 68, 0.15)'; border = '1px solid #ef4444'; color = '#ef4444'; }
                      }

                      return (
                        <button
                          key={optIdx}
                          onClick={() => handleSelect(qId, optIdx, q.answerIndex)}
                          className={`quiz-option-btn ${!isAnswered ? 'interactive-opt' : ''}`}
                          style={{ background: bg, border, color, padding: '12px 16px', borderRadius: '10px', cursor: isAnswered ? 'default' : 'pointer', fontSize: '0.8rem', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between', outline: 'none' }}
                          disabled={isAnswered}
                        >
                          <span>{opt}</span>
                          {isAnswered && isCorrect && <CheckCircle size={14} />}
                          {isAnswered && isUserSelected && !isCorrect && <XCircle size={14} />}
                        </button>
                      );
                    })}
                  </div>
                  {isAnswered && q.explanation && (
                    <div style={{ marginTop: '12px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.03)', fontSize: '0.78rem', color: '#9ca3af' }}>
                      <strong style={{ color: '#e5e7eb' }}>Explanation: </strong>{q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="quiz-score-banner" style={{ background: 'linear-gradient(90deg, #1e3a8a, #3b82f6)', borderRadius: '12px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px' }}>
            <span style={{ fontSize: '0.84rem', fontWeight: '600', color: '#ffffff' }}>Score: {score} / {questions.length}</span>
            <span style={{ fontSize: '0.88rem', fontWeight: '700', color: '#ffffff' }}>{Object.keys(selectedAnswers).length} / {questions.length} Answered</span>
          </div>
        </>
      )}
    </div>
  );
}
