import React, { useState } from 'react';
import { FileText, Mic, Image as ImageIcon, Globe, Video, Copy, HardDrive, Send } from 'lucide-react';
import Modal from '../ui/Modal';
import { parseFileClientSide, parseYouTubeURL } from '../../services/fileIngestor';
import { fetchYouTubeTranscript } from '../../services/sourcebookApi';

export default function AddSourceModal({ isOpen, onClose, onAddSource, onSearchDiscovery }) {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeInputType, setActiveInputType] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [errorMessage, setErrorMessage] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Hidden inputs for file uploads
  const fileInputRef = React.useRef(null);
  const imageInputRef = React.useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const simulateProgress = async (file, parserFunc) => {
    setLoading(true);
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(p => {
        if (p >= 95) {
          clearInterval(interval);
          return 95;
        }
        return p + 15;
      });
    }, 120);

    try {
      const parsedData = await parserFunc(file);
      clearInterval(interval);
      setUploadProgress(100);
      setTimeout(() => {
        onAddSource(parsedData);
        setLoading(false);
        setUploadProgress(0);
        onClose();
      }, 300);
    } catch (err) {
      clearInterval(interval);
      setLoading(false);
      setUploadProgress(0);
      setErrorMessage(`Error reading file: ${err.message}`);
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      const ext = droppedFile.name.split('.').pop().toLowerCase();
      if (['pdf', 'txt', 'md', 'json', 'csv'].includes(ext)) {
        await simulateProgress(droppedFile, parseFileClientSide);
      } else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
        await simulateProgress(droppedFile, (file) => Promise.resolve({
          title: file.name,
          content: "[Image content placeholder]",
          type: 'image',
          url: URL.createObjectURL(file)
        }));
      } else {
        setErrorMessage("Unsupported file type dropped.");
        setTimeout(() => setErrorMessage(null), 3000);
      }
    }
  };

  const handleTopicSubmit = (e) => {
    e.preventDefault();
    if (!topic.trim()) return;
    onSearchDiscovery(topic);
    setTopic('');
    onClose();
  };

  const handleFileSubmit = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    await simulateProgress(selectedFile, parseFileClientSide);
    e.target.value = null; // Reset
  };

  const handleImageSubmit = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    await simulateProgress(selectedFile, (file) => Promise.resolve({
      title: file.name,
      content: "[Image content placeholder]",
      type: 'image',
      url: URL.createObjectURL(file)
    }));
    e.target.value = null;
  };

  const handleInputSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || loading) return;
    setErrorMessage(null);

    if (activeInputType === 'Website') {
      onAddSource({ title: inputValue.replace(/^https?:\/\//, '').split('/')[0], url: inputValue, type: 'web' });
      setActiveInputType(null);
      setInputValue('');
      onClose();
    } else if (activeInputType === 'YouTube') {
      setLoading(true);
      try {
        const transcriptData = await fetchYouTubeTranscript(inputValue);
        onAddSource({
          title: transcriptData.title || `YouTube (${inputValue.slice(-11)})`,
          url: inputValue,
          content: transcriptData.content,
          type: 'youtube'
        });
        setActiveInputType(null);
        setInputValue('');
        onClose();
      } catch (err) {
        console.warn("YouTube microservice transcript error, falling back to URL ingestion:", err.message);
        setErrorMessage(`Transcript error: ${err.message}. Adding URL link instead.`);
        const fallbackObj = parseYouTubeURL(inputValue);
        onAddSource(fallbackObj);
        setTimeout(() => {
          setActiveInputType(null);
          setInputValue('');
          setErrorMessage(null);
          onClose();
        }, 1200);
      } finally {
        setLoading(false);
      }
    } else if (activeInputType === 'Copied text') {
      onAddSource({ title: 'Pasted Text Snippet', content: inputValue, type: 'text' });
      setActiveInputType(null);
      setInputValue('');
      onClose();
    }
  };

  const handlePlaceholderClick = (name) => {
    if (['Website', 'YouTube', 'Copied text'].includes(name)) {
      setActiveInputType(name);
      setInputValue('');
    } else {
      setErrorMessage(`${name} ingestion coming soon!`);
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  // Reset state when modal closes
  const handleClose = () => {
    setActiveInputType(null);
    setInputValue('');
    setTopic('');
    setDragActive(false);
    setUploadProgress(0);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add sources">
      <div className="add-source-modal-content">
        {errorMessage && !activeInputType && (
          <div style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '12px', padding: '8px 12px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '6px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            {errorMessage}
          </div>
        )}
        
        {activeInputType ? (
          <form onSubmit={handleInputSubmit} className="inline-input-form">
            <h3 className="inline-input-title">Add {activeInputType}</h3>
            {activeInputType === 'Copied text' ? (
              <textarea 
                className="inline-textarea"
                placeholder="Paste your text here..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                autoFocus
                rows={6}
              />
            ) : (
              <input 
                type="text" 
                className="inline-input"
                placeholder={`Enter {activeInputType} URL...`}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                autoFocus
              />
            )}
            {errorMessage && (
              <div style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '10px' }}>
                {errorMessage}
              </div>
            )}
            <div className="inline-input-actions">
              <button type="button" className="cancel-btn" onClick={() => setActiveInputType(null)}>Back</button>
              <button type="submit" className="submit-btn" disabled={!inputValue.trim() || loading}>
                {loading ? 'Fetching...' : 'Add'}
              </button>
            </div>
          </form>
        ) : (
          <>
            {/* Search Topic / Discovery */}
            <form onSubmit={handleTopicSubmit} className="discovery-search-form">
              <label className="discovery-search-label">Find sources from the web</label>
              <div className="discovery-input-wrapper">
                <input 
                  type="text" 
                  className="discovery-input"
                  placeholder="e.g. agentic rag"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
                <button type="submit" className="discovery-submit-btn" disabled={!topic.trim()}>
                  <Send size={16} />
                </button>
              </div>
            </form>

            <div className="or-divider">Or upload your files</div>

            {/* Drag and Drop Container */}
            <div 
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: dragActive ? '2px dashed var(--accent-primary)' : '2px dashed var(--border-color)',
                backgroundColor: dragActive ? 'var(--bg-hover)' : 'var(--canvas-2)',
                borderRadius: '12px',
                padding: '30px 20px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                marginBottom: '20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                color: 'var(--text-muted)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-primary)';
                e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
              }}
              onMouseLeave={(e) => {
                if (!dragActive) {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.backgroundColor = 'var(--canvas-2)';
                }
              }}
            >
              {loading ? (
                <div style={{ width: '100%', padding: '10px' }}>
                  <div style={{ fontSize: '0.86rem', color: 'var(--text-main)', marginBottom: '8px', fontWeight: 600 }}>
                    Ingesting file... {uploadProgress}%
                  </div>
                  <div style={{ height: '4px', width: '100%', backgroundColor: 'var(--border-color)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${uploadProgress}%`, backgroundColor: 'var(--accent-primary)', transition: 'width 0.1s ease-out' }}></div>
                  </div>
                </div>
              ) : (
                <>
                  <FileText size={32} style={{ color: 'var(--text-dim)', marginBottom: '4px' }} />
                  <span style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    Drag & drop files here
                  </span>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                    Supports PDF, TXT, MD, JSON, CSV or Image
                  </span>
                </>
              )}
            </div>

            {/* Stacked Source Options */}
            <div className="stacked-source-options">
              
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileSubmit} 
                style={{ display: 'none' }} 
                accept=".pdf,.txt,.md,.json,.csv"
              />
              <input 
                type="file" 
                ref={imageInputRef} 
                onChange={handleImageSubmit} 
                style={{ display: 'none' }} 
                accept="image/*"
              />

              <button className="stacked-source-btn" onClick={() => fileInputRef.current?.click()} disabled={loading}>
                <FileText size={18} /> PDF / Text
              </button>
              
              <button className="stacked-source-btn" onClick={() => handlePlaceholderClick('Audio')}>
                <Mic size={18} /> Audio
              </button>

              <button className="stacked-source-btn" onClick={() => imageInputRef.current?.click()}>
                <ImageIcon size={18} /> Image
              </button>

              <button className="stacked-source-btn" onClick={() => handlePlaceholderClick('Website')}>
                <Globe size={18} /> Website
              </button>

              <button className="stacked-source-btn" onClick={() => handlePlaceholderClick('YouTube')}>
                <Video size={18} /> YouTube
              </button>

              <button className="stacked-source-btn" onClick={() => handlePlaceholderClick('Copied text')}>
                <Copy size={18} /> Copied text
              </button>

              <button className="stacked-source-btn" onClick={() => handlePlaceholderClick('Drive')}>
                <HardDrive size={18} /> Drive
              </button>

            </div>
            <div className="drive-hint">Drive files are auto-synced after import.</div>
          </>
        )}
      </div>
    </Modal>
  );
}
