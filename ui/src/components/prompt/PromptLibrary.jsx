import React, { useState, useMemo } from 'react';
import { Search, Copy, Trash2, ArrowUpRight, Bookmark } from 'lucide-react';
import { BUILTIN_PROMPT_TEMPLATES, PROMPT_CATEGORIES } from './promptTemplates';

export default function PromptLibrary({
  savedPrompts = [],
  onSelectPrompt,
  onDuplicatePrompt,
  onDeletePrompt
}) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  const allItems = useMemo(() => {
    return [...savedPrompts, ...BUILTIN_PROMPT_TEMPLATES];
  }, [savedPrompts]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allItems.filter((item) => {
      if (category === 'Saved' && item.isBuiltin) return false;
      if (category !== 'All' && category !== 'Saved' && item.category !== category) return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        (item.description || '').toLowerCase().includes(q) ||
        (item.instructions || '').toLowerCase().includes(q) ||
        (item.tags || []).some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [allItems, category, search]);

  return (
    <div className="prompt-library">
      <div className="prompt-library-controls">
        <div className="prompt-search-box">
          <Search size={14} className="prompt-search-icon" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates & saved prompts..."
            className="prompt-search-input"
          />
        </div>

        <div className="prompt-category-row">
          {PROMPT_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`prompt-category-pill ${category === cat ? 'active' : ''}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="prompt-library-list">
        {filtered.length === 0 ? (
          <div className="prompt-empty-list">
            No prompts match your filter.
          </div>
        ) : (
          filtered.map((item) => (
            <div key={item.id} className="prompt-library-item">
              <div className="prompt-library-main" onClick={() => onSelectPrompt(item)}>
                <div className="prompt-library-title-row">
                  <span className="prompt-library-title">{item.name}</span>
                  <span className={`prompt-library-tag ${item.isBuiltin ? 'builtin' : 'saved'}`}>
                    {item.isBuiltin ? item.category : <><Bookmark size={10} /> Saved</>}
                  </span>
                </div>
                {item.description && (
                  <p className="prompt-library-desc">{item.description}</p>
                )}
              </div>

              <div className="prompt-library-actions">
                <button
                  type="button"
                  title="Use in editor"
                  onClick={() => onSelectPrompt(item)}
                  className="prompt-icon-action"
                >
                  <ArrowUpRight size={13} />
                </button>
                <button
                  type="button"
                  title="Duplicate to saved prompts"
                  onClick={() => onDuplicatePrompt(item)}
                  className="prompt-icon-action"
                >
                  <Copy size={13} />
                </button>
                {!item.isBuiltin && (
                  <button
                    type="button"
                    title="Delete saved prompt"
                    onClick={() => onDeletePrompt(item.id)}
                    className="prompt-icon-action danger"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
