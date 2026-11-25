import React from 'react';

const INSTRUCTIONS_PLACEHOLDER =
  'Describe how you want SourceBook to analyze, explain, compare, or generate content from your research sources...';

export default function PromptEditor({
  name,
  onNameChange,
  description,
  onDescriptionChange,
  instructions,
  onInstructionsChange,
  showDescription = false
}) {
  return (
    <div className="prompt-editor">
      <div className="prompt-field">
        <div className="prompt-field-header">
          <label htmlFor="prompt-name-input" className="prompt-field-label">
            Prompt name
          </label>
          <span className="prompt-field-hint">Optional</span>
        </div>
        <input
          id="prompt-name-input"
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="e.g., Research Paper Analysis"
          className="prompt-text-input"
          maxLength={120}
        />
      </div>

      {showDescription && (
        <div className="prompt-field">
          <div className="prompt-field-header">
            <label htmlFor="prompt-desc-input" className="prompt-field-label">
              Description
            </label>
            <span className="prompt-field-hint">Optional</span>
          </div>
          <input
            id="prompt-desc-input"
            type="text"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Brief note on what this prompt produces"
            className="prompt-text-input"
            maxLength={220}
          />
        </div>
      )}

      <div className="prompt-field">
        <div className="prompt-field-header">
          <label htmlFor="prompt-instructions-input" className="prompt-field-label">
            Your Instructions
          </label>
          <span className="prompt-field-hint">
            {instructions.length > 0 ? `${instructions.length} chars` : 'Markdown supported'}
          </span>
        </div>
        <textarea
          id="prompt-instructions-input"
          value={instructions}
          onChange={(e) => onInstructionsChange(e.target.value)}
          placeholder={INSTRUCTIONS_PLACEHOLDER}
          rows={7}
          className="prompt-textarea"
        />
      </div>
    </div>
  );
}
