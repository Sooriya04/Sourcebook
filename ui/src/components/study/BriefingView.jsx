import React from 'react';
import { FileText, Award, BookOpen, Layers } from 'lucide-react';

export default function BriefingView({ sources }) {
  return (
    <div className="briefing-view">
      <div className="briefing-header">
        <FileText size={24} className="briefing-header-icon" />
        <div>
          <h3>Study Briefing Document</h3>
          <p>Structured study summary compiled from {sources?.length || 0} active workspace sources.</p>
        </div>
      </div>

      <div className="briefing-grid">
        <div className="briefing-card">
          <div className="briefing-card-title">
            <Award size={16} />
            <span>Executive Summary</span>
          </div>
          <p>
            This document provides a consolidated learning overview of the materials uploaded to this notebook workspace.
            It is designed to highlight critical takeaways, core definitions, and cross-source research insights.
          </p>
        </div>

        <div className="briefing-card">
          <div className="briefing-card-title">
            <BookOpen size={16} />
            <span>Core Definitions & Concepts</span>
          </div>
          <ul className="briefing-list">
            <li>
              <strong>Primary Domain Scope:</strong> Grounded multi-modal AI systems, vision-language-action (VLA) models, and local search scraping optimization.
            </li>
            <li>
              <strong>Grounded Retrieval:</strong> Ensuring responses contain strict numerical references back to specific document segments.
            </li>
            <li>
              <strong>Sentinel Automation:</strong> Automated scraping and cleaning of ingested source materials.
            </li>
          </ul>
        </div>

        <div className="briefing-card">
          <div className="briefing-card-title">
            <Layers size={16} />
            <span>Key Research Questions</span>
          </div>
          <p>
            Use this study workspace to understand how agentic pipelines can be monitored, optimized, and utilized for local retrieval augmented generation (RAG).
          </p>
        </div>
      </div>
    </div>
  );
}
