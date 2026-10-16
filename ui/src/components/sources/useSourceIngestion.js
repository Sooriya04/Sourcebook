import { useState } from 'react';
import { parseFileClientSide, parseYouTubeURL } from '../../services/fileIngestor';
import { fetchYouTubeTranscript } from '../../services/sourcebookApi';

export function useSourceIngestion(onAddSource, onClose) {
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState(null);

  const showError = (msg) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(null), 3000);
  };

  const simulateProgress = async (file, parserFunc) => {
    setLoading(true);
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(p => (p >= 95 ? (clearInterval(interval), 95) : p + 15));
    }, 100);

    try {
      const parsedData = await parserFunc(file);
      clearInterval(interval);
      setUploadProgress(100);
      setTimeout(() => {
        onAddSource(parsedData);
        setLoading(false);
        setUploadProgress(0);
        onClose();
      }, 250);
    } catch (err) {
      clearInterval(interval);
      setLoading(false);
      setUploadProgress(0);
      showError(`Error reading file: ${err.message}`);
    }
  };

  const handleDropFiles = async (files) => {
    if (!files || !files[0]) return;
    const file = files[0];
    const ext = file.name.split('.').pop().toLowerCase();
    if (['pdf', 'txt', 'md', 'json', 'csv'].includes(ext)) {
      await simulateProgress(file, parseFileClientSide);
    } else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
      await simulateProgress(file, (f) => Promise.resolve({
        title: f.name,
        content: '[Image content placeholder]',
        type: 'image',
        url: URL.createObjectURL(f)
      }));
    } else {
      showError('Unsupported file format.');
    }
  };

  const submitCustomInput = async (type, value) => {
    if (!value.trim() || loading) return;
    if (type === 'Website') {
      const hostname = value.replace(/^https?:\/\//, '').split('/')[0];
      onAddSource({ title: hostname || 'Web Article', url: value, type: 'web' });
      onClose();
    } else if (type === 'YouTube') {
      setLoading(true);
      try {
        const transcriptData = await fetchYouTubeTranscript(value);
        onAddSource({
          title: transcriptData.title || `YouTube (${value.slice(-11)})`,
          url: value,
          content: transcriptData.content,
          type: 'youtube'
        });
        onClose();
      } catch (err) {
        showError(`Transcript error: ${err.message}. Adding URL link instead.`);
        const fallbackObj = parseYouTubeURL(value);
        onAddSource(fallbackObj);
        setTimeout(onClose, 1000);
      } finally {
        setLoading(false);
      }
    } else if (type === 'Copied text') {
      onAddSource({ title: 'Pasted Text Snippet', content: value, type: 'text' });
      onClose();
    }
  };

  return {
    loading,
    uploadProgress,
    errorMessage,
    showError,
    simulateProgress,
    handleDropFiles,
    submitCustomInput
  };
}
