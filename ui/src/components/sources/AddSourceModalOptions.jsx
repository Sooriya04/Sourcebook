import React from 'react';
import { FileText, Mic, Image as ImageIcon, Globe, Video, Copy, HardDrive } from 'lucide-react';

export default function AddSourceModalOptions({ onSelectOption, disabled }) {
  const options = [
    { type: 'pdf', label: 'PDF / Text', icon: <FileText size={15} /> },
    { type: 'audio', label: 'Audio', icon: <Mic size={15} /> },
    { type: 'image', label: 'Image', icon: <ImageIcon size={15} /> },
    { type: 'web', label: 'Website', icon: <Globe size={15} /> },
    { type: 'youtube', label: 'YouTube', icon: <Video size={15} /> },
    { type: 'text', label: 'Copied text', icon: <Copy size={15} /> },
    { type: 'drive', label: 'Drive', icon: <HardDrive size={15} /> }
  ];

  return (
    <div className="add-source-grid-options">
      {options.map((opt) => (
        <button
          key={opt.type}
          type="button"
          className="add-source-option-tile"
          onClick={() => onSelectOption(opt.type)}
          disabled={disabled}
        >
          <span className="text-zinc-400">{opt.icon}</span>
          <span>{opt.label}</span>
        </button>
      ))}
    </div>
  );
}
