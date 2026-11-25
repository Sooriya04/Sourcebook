import React, { useState, useEffect } from 'react';
import { Search, BookOpen, Video, Settings, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CommandPaletteModal from '../notebook/CommandPaletteModal';

export default function GlobalSearch({ notebooks = [], onNewNotebook, onOpenYouTube }) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  // Listen for Cmd+K / Ctrl+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Build searchable commands list from existing notebooks and actions
  const commands = [
    {
      id: 'action-new-notebook',
      label: 'Create New Notebook',
      type: 'Action',
      icon: <Plus size={15} />,
      action: () => {
        onNewNotebook?.();
      }
    },
    {
      id: 'action-yt-chat',
      label: 'Chat with YouTube Video',
      type: 'Action',
      icon: <Video size={15} />,
      action: () => {
        onOpenYouTube?.();
      }
    },
    {
      id: 'action-settings',
      label: 'Open Workspace Settings',
      type: 'Navigation',
      icon: <Settings size={15} />,
      action: () => {
        navigate('/settings');
      }
    },
    ...notebooks.map((nb) => ({
      id: `nb-${nb.id}`,
      label: nb.title || 'Untitled Notebook',
      type: 'Notebook',
      icon: <BookOpen size={15} />,
      action: () => {
        navigate(`/notebook/${nb.id}`);
      }
    }))
  ];

  return (
    <>
      <button
        type="button"
        className="global-search-trigger"
        onClick={() => setIsOpen(true)}
        title="Search notebooks and commands (⌘K)"
        aria-label="Search notebooks and commands"
      >
        <Search size={13} className="global-search-trigger-icon" />
        <span className="global-search-trigger-text">Search research, notebooks...</span>
        <kbd className="global-search-kbd">⌘K</kbd>
      </button>

      {isOpen && (
        <CommandPaletteModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          commands={commands}
        />
      )}
    </>
  );
}
