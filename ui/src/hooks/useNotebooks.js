import { useState, useEffect } from 'react';
import { 
  fetchNotebooks, 
  createNotebookOnServer, 
  deleteNotebookOnServer 
} from '../services/sourcebookApi';

export function useNotebooks() {
  const [notebooks, setNotebooks] = useState([]);

  useEffect(() => {
    let isMounted = true;
    fetchNotebooks()
      .then(data => {
        if (isMounted) setNotebooks(data);
      })
      .catch(err => console.error("Failed to fetch notebooks:", err));
    
    return () => { isMounted = false; };
  }, []);

  const createNotebook = async (title, description = '') => {
    try {
      const newNotebook = await createNotebookOnServer(title, description);
      setNotebooks(prev => [newNotebook, ...prev]);
      return newNotebook;
    } catch (err) {
      console.error("Failed to create notebook:", err);
      throw err;
    }
  };

  const deleteNotebook = async (id) => {
    try {
      await deleteNotebookOnServer(id);
      setNotebooks(prev => prev.filter(nb => nb.id !== id));
    } catch (err) {
      console.error("Failed to delete notebook:", err);
      throw err;
    }
  };

  const getNotebook = (id) => {
    return notebooks.find(nb => nb.id === id);
  };

  // Deprecated: Notebooks are now synced dynamically in NotebookPage.
  const updateNotebook = (id, updates) => {
    setNotebooks(prev => prev.map(nb => nb.id === id ? { ...nb, ...updates } : nb));
  };

  return { notebooks, createNotebook, deleteNotebook, getNotebook, updateNotebook };
}
