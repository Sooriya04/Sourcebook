import React, { useState } from 'react';
import { FileText, Mic, Image as ImageIcon, Globe, Video, Copy, HardDrive, Send } from 'lucide-react';
import Modal from '../ui/Modal';
import { parseFileClientSide, parseYouTubeURL } from '../../services/fileIngestor';

export default function AddSourceModal({ isOpen, onClose, onAddSource, onSearchDiscovery }) {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeInputType, setActiveInputType] = useState(null);
  const [inputValue, setInputValue] = useState('');

  // Hidden inputs for file uploads
  const fileInputRef = React.useRef(null);
  const imageInputRef = React.useRef(null);

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
    setLoading(true);
    try {
      const parsedData = await parseFileClientSide(selectedFile);
      onAddSource(parsedData);
      onClose();
    } catch (err) {
      alert(`Error reading file: ${err.message}`);
    } finally {
      setLoading(false);
      e.target.value = null; // Reset
    }
  };

  const handleImageSubmit = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    // For now we mock the image addition or parse it
    // If you had OCR or image extraction, it would go here.
    onAddSource({
      title: selectedFile.name,
      content: "[Image content placeholder]",
      type: 'image',
      url: URL.createObjectURL(selectedFile)
    });
    e.target.value = null;
    onClose();
  };

  const handleInputSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    if (activeInputType === 'Website') {
      onAddSource({ title: inputValue.replace(/^https?:\/\//, '').split('/')[0], url: inputValue, type: 'web' });
    } else if (activeInputType === 'YouTube') {
      onAddSource(parseYouTubeURL(inputValue));
    } else if (activeInputType === 'Copied text') {
      onAddSource({ title: 'Pasted Text Snippet', content: inputValue, type: 'text' });
    }
    
    setActiveInputType(null);
    setInputValue('');
    onClose();
  };

  const handlePlaceholderClick = (name) => {
    if (['Website', 'YouTube', 'Copied text'].includes(name)) {
      setActiveInputType(name);
      setInputValue('');
    } else {
      alert(`${name} ingestion coming soon!`);
    }
  };

  // Reset state when modal closes
  const handleClose = () => {
    setActiveInputType(null);
    setInputValue('');
    setTopic('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add sources">
      <div className="add-source-modal-content">
        
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
                placeholder={`Enter ${activeInputType} URL...`}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                autoFocus
              />
            )}
            <div className="inline-input-actions">
              <button type="button" className="cancel-btn" onClick={() => setActiveInputType(null)}>Back</button>
              <button type="submit" className="submit-btn" disabled={!inputValue.trim()}>Add</button>
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
