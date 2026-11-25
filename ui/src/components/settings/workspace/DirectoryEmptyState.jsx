import React from 'react';
import { HelpCircle, ExternalLink } from 'lucide-react';

export default function DirectoryEmptyState({ query = '', onClear }) {
  const issueTitle = query ? `[Integration Request]: ${query}` : '[Integration Request]: ';
  const issueBody = `### Integration Request\n\n**Provider or Service Name:** ${query}\n\n**Category:** AI & Models / Search / Extraction / Embeddings\n\n**Documentation & API Specification:**\n\n**Why this integration would be useful:**\n`;
  const githubIssueUrl = `https://github.com/Sooriya04/Sourcebook/issues/new?title=${encodeURIComponent(issueTitle)}&body=${encodeURIComponent(issueBody)}`;

  return (
    <div className="directory-empty-state">
      <div className="directory-empty-icon">
        <HelpCircle size={24} />
      </div>
      <h4 className="directory-empty-title">No matching provider found</h4>
      <p className="directory-empty-desc">
        Don't see what you need? No worry — notify the developer by opening an issue on GitHub to request this integration.
      </p>
      <div className="directory-empty-actions">
        <a
          href={githubIssueUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary compact directory-empty-github-btn"
        >
          <ExternalLink size={13} />
          <span>{query ? `Request "${query}" on GitHub` : 'Open Integration Issue'}</span>
        </a>
        {query && (
          <button
            type="button"
            className="directory-empty-clear-btn"
            onClick={onClear}
          >
            Clear Search
          </button>
        )}
      </div>
    </div>
  );
}
