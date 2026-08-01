import React, { useState } from 'react';
import { Search, FileText, Mic, Image as ImageIcon, Globe, Video, Copy, HardDrive, Send } from 'lucide-react';
import Modal from '../ui/Modal';
import { parseFileClientSide, parseYouTubeURL } from '../../services/fileIngestor';

export default function AddSourceModal({ isOpen, onClose, onAddSource, onSearchDiscovery }) {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);

  // Hidden inputs for file uploads
  const fileInputRef = React.useRef(null);

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

  const handlePlaceholderClick = (name) => {
    // For things we haven't built yet but need visual parity
    if (name === 'Website') {
      const url = prompt("Enter Website URL:");
      if (url) {
        onAddSource({ title: url.replace(/^https?:\/\//, '').split('/')[0], url: url, type: 'web' });
        onClose();
      }
    } else if (name === 'YouTube') {
      const url = prompt("Enter YouTube URL:");
      if (url) {
        onAddSource(parseYouTubeURL(url));
        onClose();
      }
    } else {
      alert(`${name} ingestion coming soon!`);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add sources">
      <div className="add-source-modal-content">
        
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

          <button className="stacked-source-btn" onClick={() => fileInputRef.current?.click()} disabled={loading}>
            <FileText size={18} /> PDF / Text
          </button>
          
          <button className="stacked-source-btn" onClick={() => handlePlaceholderClick('Audio')}>
            <Mic size={18} /> Audio
          </button>

          <button className="stacked-source-btn" onClick={() => handlePlaceholderClick('Image')}>
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
      </div>
    </Modal>
  );
}
