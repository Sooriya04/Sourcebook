import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

export default function FaqView() {
  const [openIndex, setOpenIndex] = useState(null);

  const faqItems = [
    {
      q: "What is the primary goal of retrieval-augmented generation (RAG)?",
      a: "RAG aims to improve the accuracy and reliability of LLM responses by fetching relevant documents from external sources and using them to ground the LLM's answers, minimizing hallucinations."
    },
    {
      q: "How does the background Sentinel scraper maintain workspace integrity?",
      a: "The Sentinel works opportunistically in the background during searches to scan for sources with empty content. If found, it fetches them via Searqon or specialized arXiv/YouTube extraction logic and populates SQLite."
    },
    {
      q: "Why are Vision-Language-Action (VLA) models unique?",
      a: "VLAs directly integrate visual perception, language instruction processing, and motor control output (robotic actions) into a single unified network, rather than chaining separate vision, reasoning, and control models."
    },
    {
      q: "What file formats does the arXiv extraction engine support?",
      a: "The arXiv extractor utilizes a multi-tier approach: first trying to extract raw HTML from the arxiv.org/html/ version, falling back to full-text PDF parsing, and finally using metadata abstract fallback if full text is inaccessible."
    }
  ];

  return (
    <div className="faq-view">
      <div className="faq-header">
        <HelpCircle size={22} className="faq-header-icon" />
        <div>
          <h3>Grounded Workspace FAQ</h3>
          <p>Key learning questions automatically generated from your sources.</p>
        </div>
      </div>

      <div className="faq-accordion-list">
        {faqItems.map((item, idx) => {
          const isOpen = openIndex === idx;
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
                  <p>{item.a}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
