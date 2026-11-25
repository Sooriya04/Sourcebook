import React from 'react';
import { PanelLeftOpen, PanelRightOpen } from 'lucide-react';

export default function ChatHeader({
  isSourcesCollapsed,
  onToggleSources,
  isStudioCollapsed,
  onToggleStudio
}) {
  if (!isSourcesCollapsed && !isStudioCollapsed) {
    return null;
  }

  return (
    <div className="chat-panel-toggles">
      <div>
        {isSourcesCollapsed && (
          <button
            type="button"
            onClick={onToggleSources}
            title="Expand Sources Panel (⌘/)"
            aria-label="Expand Sources Panel"
            className="chat-collapse-restore-btn"
          >
            <PanelLeftOpen size={14} />
            <span>Sources</span>
          </button>
        )}
      </div>

      <div>
        {isStudioCollapsed && (
          <button
            type="button"
            onClick={onToggleStudio}
            title="Expand Studio Panel"
            aria-label="Expand Studio Panel"
            className="chat-collapse-restore-btn"
          >
            <span>Studio</span>
            <PanelRightOpen size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
