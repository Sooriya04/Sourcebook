import { useEffect } from 'react';

export function useKeyboard({ onFocusPrompt, onToggleSources, onToggleStudio, onOpenShortcuts, onCloseModals }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;

      // Cmd/Ctrl + K: Focus prompt input
      if (isCmdOrCtrl && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onFocusPrompt?.();
      }

      // Cmd/Ctrl + /: Toggle sources panel
      if (isCmdOrCtrl && e.key === '/') {
        e.preventDefault();
        onToggleSources?.();
      }

      // Cmd/Ctrl + Shift + S: Toggle studio panel
      if (isCmdOrCtrl && e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        onToggleStudio?.();
      }

      // Cmd/Ctrl + Shift + / or Cmd/Ctrl + ?: Shortcuts modal
      if (isCmdOrCtrl && e.shiftKey && (e.key === '?' || e.key === '/')) {
        e.preventDefault();
        onOpenShortcuts?.();
      }

      // Escape key: Close popovers / modals
      if (e.key === 'Escape') {
        onCloseModals?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onFocusPrompt, onToggleSources, onToggleStudio, onOpenShortcuts, onCloseModals]);
}
