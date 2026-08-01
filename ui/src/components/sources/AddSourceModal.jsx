import React, { useState } from 'react';
import { Globe, FileUp, Video, Plus } from 'lucide-react';
import Modal from '../ui/Modal';
import { parseFileClientSide, parseYouTubeURL } from '../../services/fileIngestor';

export default function AddSourceModal({ isOpen, onClose, onAddSource }) {
  const [activeTab, setActiveTab] = useState('web');
  const [webUrl, setWebUrl] = useState('');
  const [ytUrl, setYtUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleWebSubmit = (e) => {
    e.preventDefault();
    if (!webUrl.trim()) return;
    onAddSource({
      title: webUrl.replace(/^https?:\/\//, '').split('/')[0],
      url: webUrl,
      type: 'web'
    });
    setWebUrl('');
    onClose();
  };

  const handleFileSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;
    setLoading(true);
    try {
      const parsedData = await parseFileClientSide(selectedFile);
      onAddSource(parsedData);
      setSelectedFile(null);
      onClose();
    } catch (err) {
      alert(`Error reading file: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleYtSubmit = (e) => {
    e.preventDefault();
    if (!ytUrl.trim()) return;
    const ytData = parseYouTubeURL(ytUrl);
    onAddSource(ytData);
    setYtUrl('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Sources to Notebook">
      <div className="add-source-tabs">
        <button
          className={`tab-btn ${activeTab === 'web' ? 'active' : ''}`}
          onClick={() => setActiveTab('web')}
        >
          <Globe size={14} /> Web URL
        </button>
        <button
          className={`tab-btn ${activeTab === 'file' ? 'active' : ''}`}
          onClick={() => setActiveTab('file')}
        >
          <FileUp size={14} /> Upload File (PDF/MD)
        </button>
        <button
          className={`tab-btn ${activeTab === 'yt' ? 'active' : ''}`}
          onClick={() => setActiveTab('yt')}
        >
          <Video size={14} /> YouTube Link
        </button>
      </div>

      {activeTab === 'web' && (
        <form onSubmit={handleWebSubmit} className="tab-form">
          <label className="form-label">Enter Web Page URL:</label>
          <input
            type="url"
            className="form-input"
            placeholder="https://example.com/article"
            value={webUrl}
            onChange={(e) => setWebUrl(e.target.value)}
            required
          />
          <button type="submit" className="submit-btn">
            <Plus size={16} /> Add Web Source
          </button>
        </form>
      )}

      {activeTab === 'file' && (
        <form onSubmit={handleFileSubmit} className="tab-form">
          <label className="form-label">Select Document (PDF, Markdown, TXT):</label>
          <input
            type="file"
            accept=".pdf,.md,.txt,.json,.csv"
            className="file-input"
            onChange={(e) => setSelectedFile(e.target.files[0])}
            required
          />
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Reading File...' : 'Upload & Add Source'}
          </button>
        </form>
      )}

      {activeTab === 'yt' && (
        <form onSubmit={handleYtSubmit} className="tab-form">
          <label className="form-label">YouTube Video URL:</label>
          <input
            type="url"
            className="form-input"
            placeholder="https://www.youtube.com/watch?v=..."
            value={ytUrl}
            onChange={(e) => setYtUrl(e.target.value)}
            required
          />
          <button type="submit" className="submit-btn">
            <Plus size={16} /> Ingest YouTube Video
          </button>
        </form>
      )}
    </Modal>
  );
}
