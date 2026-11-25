import React, { useState, useEffect } from 'react';
import { Sparkles, ChevronRight, Bookmark, Check } from 'lucide-react';
import Modal from '../ui/Modal';
import PromptEditor from './PromptEditor';
import ExecutionModeSelector from './ExecutionModeSelector';
import PromptSourceSelector from './PromptSourceSelector';
import PromptLibrary from './PromptLibrary';
import PromptHistory from './PromptHistory';
import {
  loadSavedPrompts,
  savePromptItem,
  deleteSavedPrompt,
  duplicateSavedPrompt,
  loadPromptHistory
} from '../../services/promptStudioApi';
import './PromptStudio.css';

export default function PromptStudioModal({
  isOpen,
  onClose,
  notebookId,
  sources = [],
  scopedSourceIds,
  initialDraft = null,
  onRunPrompt
}) {
  const [activeTab, setActiveTab] = useState('editor');
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [executionMode, setExecutionMode] = useState('standard');
  const [sourceMode, setSourceMode] = useState('all');
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const [savedPrompts, setSavedPrompts] = useState([]);
  const [history, setHistory] = useState([]);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    loadSavedPrompts().then((list) => { if (active) setSavedPrompts(list); });
    loadPromptHistory().then((list) => { if (active) setHistory(list); });
    if (initialDraft) {
      setActiveTab('editor');
      setEditingId(initialDraft.id && !initialDraft.isBuiltin ? initialDraft.id : null);
      setName(initialDraft.name || initialDraft.promptName || '');
      setDescription(initialDraft.description || '');
      setInstructions(initialDraft.instructions || '');
      setExecutionMode(initialDraft.executionMode || 'standard');
      if (initialDraft.sourceMode) setSourceMode(initialDraft.sourceMode);
      if (initialDraft.description || initialDraft.executionMode === 'custom_priority') {
        setAdvancedOpen(true);
      }
    }
    return () => { active = false; };
  }, [isOpen, notebookId, initialDraft]);

  const totalSources = sources.length;
  const selectedSourcesCount = scopedSourceIds ? scopedSourceIds.size : totalSources;

  const isSourceValid =
    sourceMode === 'none' ||
    (sourceMode === 'all' && totalSources > 0) ||
    (sourceMode === 'selected' && selectedSourcesCount > 0);

  const canRun = instructions.trim().length > 0 && isSourceValid;

  const handleSaveToLibrary = async () => {
    if (!instructions.trim()) return;
    const { item, list } = await savePromptItem({
      id: editingId,
      name: name.trim() || 'Custom Prompt',
      description,
      instructions,
      executionMode
    });
    setEditingId(item.id);
    setSavedPrompts(list);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 1800);
  };

  const handleSelectPrompt = (item) => {
    setEditingId(item.isBuiltin ? null : item.id);
    setName(item.name || item.promptName || '');
    setDescription(item.description || '');
    setInstructions(item.instructions || '');
    setExecutionMode(item.executionMode || 'standard');
    if (item.sourceMode) setSourceMode(item.sourceMode);
    setActiveTab('editor');
  };

  const handleDuplicate = async (item) => {
    const { list } = await duplicateSavedPrompt(item);
    setSavedPrompts(list);
  };

  const handleDelete = async (promptId) => {
    const next = await deleteSavedPrompt(promptId);
    setSavedPrompts(next);
    if (editingId === promptId) setEditingId(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canRun) return;
    onRunPrompt?.({
      promptName: name.trim() || 'Custom Prompt',
      description: description.trim(),
      instructions: instructions.trim(),
      executionMode,
      sourceMode,
      sourceCount:
        sourceMode === 'all' ? totalSources : sourceMode === 'selected' ? selectedSourcesCount : 0
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Prompt Studio"
      description="Create custom instructions for your notebook and generate grounded responses from your research."
      maxWidth="620px"
    >
      <div className="prompt-studio-shell">
        <div className="prompt-studio-tabs" role="tablist" aria-label="Prompt Studio sections">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'editor'}
            onClick={() => setActiveTab('editor')}
            className={`prompt-studio-tab ${activeTab === 'editor' ? 'active' : ''}`}
          >
            Editor
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'library'}
            onClick={() => setActiveTab('library')}
            className={`prompt-studio-tab ${activeTab === 'library' ? 'active' : ''}`}
          >
            <span>Library</span>
            <span className="prompt-tab-count">{savedPrompts.length + 9}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'history'}
            onClick={() => setActiveTab('history')}
            className={`prompt-studio-tab ${activeTab === 'history' ? 'active' : ''}`}
          >
            <span>History</span>
            {history.length > 0 && <span className="prompt-tab-count">{history.length}</span>}
          </button>
        </div>

        {activeTab === 'editor' && (
          <form onSubmit={handleSubmit} className="prompt-studio-form">
            <PromptEditor
              name={name}
              onNameChange={setName}
              description={description}
              onDescriptionChange={setDescription}
              instructions={instructions}
              onInstructionsChange={setInstructions}
              showDescription={advancedOpen}
            />

            <PromptSourceSelector
              sourceMode={sourceMode}
              onSourceModeChange={setSourceMode}
              totalSources={totalSources}
              selectedSourcesCount={selectedSourcesCount}
            />

            <div className="prompt-advanced-section">
              <button
                type="button"
                className="prompt-advanced-toggle"
                onClick={() => setAdvancedOpen((prev) => !prev)}
                aria-expanded={advancedOpen}
              >
                <ChevronRight
                  size={14}
                  className={`prompt-advanced-chevron ${advancedOpen ? 'open' : ''}`}
                />
                <span>Execution Mode &amp; Details</span>
                {executionMode === 'custom_priority' && (
                  <span className="prompt-mode-pill-inline">Custom Priority</span>
                )}
              </button>

              {advancedOpen && (
                <div className="prompt-advanced-body">
                  <ExecutionModeSelector value={executionMode} onChange={setExecutionMode} />
                </div>
              )}
            </div>

            <div className="prompt-studio-footer">
              <button
                type="button"
                onClick={handleSaveToLibrary}
                disabled={!instructions.trim()}
                className="prompt-save-btn"
              >
                {justSaved ? <Check size={13} /> : <Bookmark size={13} />}
                <span>{justSaved ? 'Saved' : 'Save Prompt'}</span>
              </button>

              <div className="prompt-footer-right">
                <button type="button" onClick={onClose} className="btn-secondary compact">
                  Cancel
                </button>
                <button type="submit" disabled={!canRun} className="prompt-run-btn">
                  <Sparkles size={14} />
                  <span>Run Prompt</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {activeTab === 'library' && (
          <PromptLibrary
            savedPrompts={savedPrompts}
            onSelectPrompt={handleSelectPrompt}
            onDuplicatePrompt={handleDuplicate}
            onDeletePrompt={handleDelete}
          />
        )}

        {activeTab === 'history' && (
          <PromptHistory
            history={history}
            currentNotebookId={notebookId}
            onLoadPrompt={handleSelectPrompt}
            onViewChat={() => onClose?.()}
          />
        )}
      </div>
    </Modal>
  );
}
