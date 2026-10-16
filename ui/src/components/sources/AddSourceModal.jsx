import React, { useState, useRef } from 'react';
import { Search } from 'lucide-react';
import Modal from '../ui/Modal';
import AddSourceDropzone from './AddSourceDropzone';
import AddSourceInputForm from './AddSourceInputForm';
import AddSourceModalOptions from './AddSourceModalOptions';
import { parseFileClientSide } from '../../services/fileIngestor';
import { useSourceIngestion } from './useSourceIngestion';

export default function AddSourceModal({ isOpen, onClose, onAddSource, onSearchDiscovery }) {
  const [topic, setTopic] = useState('');
  const [activeInputType, setActiveInputType] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  const handleClose = () => {
    setActiveInputType(null);
    setInputValue('');
    setTopic('');
    setDragActive(false);
    onClose();
  };

  const {
    loading,
    uploadProgress,
    errorMessage,
    showError,
    simulateProgress,
    handleDropFiles,
    submitCustomInput
  } = useSourceIngestion(onAddSource, handleClose);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    await handleDropFiles(e.dataTransfer.files);
  };

  const handleTopicSubmit = (e) => {
    e.preventDefault();
    if (!topic.trim()) return;
    onSearchDiscovery(topic.trim());
    setTopic('');
    handleClose();
  };

  const handleSelectOption = (type) => {
    if (type === 'pdf') fileInputRef.current?.click();
    else if (type === 'image') imageInputRef.current?.click();
    else if (type === 'web') setActiveInputType('Website');
    else if (type === 'youtube') setActiveInputType('YouTube');
    else if (type === 'text') setActiveInputType('Copied text');
    else showError(`${type} integration coming soon!`);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add sources" maxWidth="520px">
      <div className="add-source-modal-inner">
        <input type="file" ref={fileInputRef} onChange={(e) => e.target.files[0] && simulateProgress(e.target.files[0], parseFileClientSide)} style={{ display: 'none' }} accept=".pdf,.txt,.md,.json,.csv" />
        <input type="file" ref={imageInputRef} onChange={(e) => e.target.files[0] && simulateProgress(e.target.files[0], (f) => Promise.resolve({ title: f.name, content: '[Image]', type: 'image', url: URL.createObjectURL(f) }))} style={{ display: 'none' }} accept="image/*" />

        {errorMessage && !activeInputType && (
          <div className="add-source-error-banner">{errorMessage}</div>
        )}

        {activeInputType ? (
          <AddSourceInputForm
            activeType={activeInputType}
            value={inputValue}
            onChange={setInputValue}
            onSubmit={(e) => { e.preventDefault(); submitCustomInput(activeInputType, inputValue); }}
            onBack={() => setActiveInputType(null)}
            loading={loading}
            errorMessage={errorMessage}
          />
        ) : (
          <>
            <form onSubmit={handleTopicSubmit} className="add-source-search-form">
              <label className="add-source-search-label">Find sources on the web</label>
              <div className="add-source-search-bar">
                <Search size={14} className="text-zinc-500 shrink-0" />
                <input
                  type="text"
                  className="add-source-search-input"
                  placeholder="e.g. quantum computing benchmarks"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
                <button type="submit" disabled={!topic.trim()} className="add-source-search-btn">
                  Search
                </button>
              </div>
            </form>

            <div className="add-source-divider">
              <span>Or import directly</span>
            </div>

            <AddSourceDropzone
              dragActive={dragActive}
              loading={loading}
              uploadProgress={uploadProgress}
              onDrag={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            />

            <AddSourceModalOptions onSelectOption={handleSelectOption} disabled={loading} />

            <p className="add-source-drive-caption">
              Ingested sources are parsed and grounded in the local SQLite index.
            </p>
          </>
        )}
      </div>
    </Modal>
  );
}
