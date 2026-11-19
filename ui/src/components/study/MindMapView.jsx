import React, { useState } from 'react';
import { Network, Info, Plus, Minus, ZoomIn, ZoomOut, RotateCcw, Sparkles, RefreshCw, BookmarkPlus, Check } from 'lucide-react';
import { generateMindMap } from '../../services/sourcebookApi';

export default function MindMapView({ notebookId, onAddNote }) {
  const [treeData, setTreeData] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [expandedNodes, setExpandedNodes] = useState({ root: true });
  const [zoom, setZoom] = useState(100);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [savedNote, setSavedNote] = useState(false);

  const handleGenerate = async () => {
    if (!notebookId || loading) return;
    setLoading(true);
    setError(null);
    try {
      const resp = await generateMindMap(notebookId);
      if (resp?.root?.label) {
        setTreeData(resp.root);
        setSelectedNode(resp.root);
        const autoExpanded = { root: true };
        (resp.root.children || []).forEach(c => { autoExpanded[c.id] = true; });
        setExpandedNodes(autoExpanded);
      } else {
        setError('No concept graph could be generated from current sources.');
      }
    } catch (err) {
      setError(err.message || 'Failed to generate concept map');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (nodeId, e) => {
    e.stopPropagation();
    setExpandedNodes(prev => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  const handleSaveToNotes = () => {
    if (!selectedNode || !onAddNote) return;
    onAddNote(`### Concept: ${selectedNode.label}\n\n${selectedNode.desc}`);
    setSavedNote(true);
    setTimeout(() => setSavedNote(false), 2000);
  };

  return (
    <div className="mindmap-view" style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="study-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)' }}>
            <Network size={20} style={{ color: 'var(--accent-primary)' }} />
            <span>Interactive Concept Map</span>
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Explore the hierarchical concept graph synthesized from your sources.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {treeData && (
            <div style={{ display: 'flex', gap: '2px', background: 'var(--canvas-2)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '2px' }}>
              <button onClick={() => setZoom(z => Math.min(150, z + 10))} title="Zoom In" style={{ background: 'transparent', border: 'none', padding: '6px', color: 'var(--text-muted)', cursor: 'pointer' }}><ZoomIn size={14} /></button>
              <button onClick={() => setZoom(z => Math.max(70, z - 10))} title="Zoom Out" style={{ background: 'transparent', border: 'none', padding: '6px', color: 'var(--text-muted)', cursor: 'pointer' }}><ZoomOut size={14} /></button>
              <button onClick={() => setZoom(100)} title="Reset Zoom" style={{ background: 'transparent', border: 'none', padding: '6px', color: 'var(--text-muted)', cursor: 'pointer' }}><RotateCcw size={14} /></button>
              <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', padding: '6px 8px', color: 'var(--text-dim)' }}>{zoom}%</span>
            </div>
          )}
          <button onClick={handleGenerate} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', padding: '7px 12px', fontSize: '0.78rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
            {loading ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
            <span>{treeData ? 'Regenerate Map' : 'Generate Concept Map'}</span>
          </button>
        </div>
      </div>

      {error && <div style={{ padding: '10px 14px', background: '#451a1a', border: '1px solid #7f1d1d', borderRadius: '8px', color: '#fca5a5', fontSize: '0.8rem' }}>{error}</div>}

      {!treeData && !loading && (
        <div style={{ padding: '60px 20px', textAlign: 'center', border: '1px dashed var(--border-color)', borderRadius: '16px', background: 'var(--canvas-2)' }}>
          <Network size={36} style={{ margin: '0 auto 12px', color: 'var(--text-dim)', opacity: 0.5 }} />
          <h4 style={{ margin: '0 0 6px', fontSize: '1rem', color: 'var(--text-main)' }}>No Concept Map Generated</h4>
          <p style={{ margin: '0 0 16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Generate a structured mind map clustering core topics and sub-concepts from your notebook.</p>
          <button onClick={handleGenerate} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>
            <Sparkles size={14} /> Generate Concept Map
          </button>
        </div>
      )}

      {loading && (
        <div style={{ padding: '60px 20px', textAlign: 'center', border: '1px solid var(--border-color)', borderRadius: '16px', background: 'var(--canvas-2)' }}>
          <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 12px', color: '#3b82f6' }} />
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Analyzing sources and building concept graph...</p>
        </div>
      )}

      {treeData && !loading && (
        <div className="glass-card" style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '20px', background: 'var(--panel)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '24px', minHeight: '440px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', borderRight: '1px solid var(--border-color)', paddingRight: '20px', transform: `scale(${zoom / 100})`, transformOrigin: 'top left', overflowX: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button onClick={() => setSelectedNode(treeData)} style={{ background: selectedNode?.id === treeData.id ? '#2563eb' : 'var(--canvas-2)', color: selectedNode?.id === treeData.id ? '#fff' : 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '10px 16px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}>
                {treeData.label}
              </button>
              <button onClick={(e) => toggleExpand('root', e)} style={{ background: 'var(--canvas-2)', border: '1px solid var(--border-color)', borderRadius: '50%', width: '22px', height: '22px', display: 'grid', placeItems: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}>
                {expandedNodes.root ? <Minus size={11} /> : <Plus size={11} />}
              </button>
            </div>

            {expandedNodes.root && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingLeft: '16px', borderLeft: '2px solid var(--border-color)' }}>
                {(treeData.children || []).map(child => (
                  <div key={child.id} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button onClick={() => setSelectedNode(child)} style={{ background: selectedNode?.id === child.id ? '#2563eb' : 'var(--canvas-2)', color: selectedNode?.id === child.id ? '#fff' : 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '7px 12px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>
                        {child.label}
                      </button>
                      {child.children?.length > 0 && (
                        <button onClick={(e) => toggleExpand(child.id, e)} style={{ background: 'var(--canvas-2)', border: '1px solid var(--border-color)', borderRadius: '50%', width: '18px', height: '18px', display: 'grid', placeItems: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}>
                          {expandedNodes[child.id] ? <Minus size={9} /> : <Plus size={9} />}
                        </button>
                      )}
                    </div>

                    {expandedNodes[child.id] && child.children && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', paddingLeft: '14px', borderLeft: '2px dashed var(--border-color)' }}>
                        {child.children.map(sub => (
                          <button key={sub.id} onClick={() => setSelectedNode(sub)} style={{ background: selectedNode?.id === sub.id ? '#2563eb' : 'var(--canvas-2)', color: selectedNode?.id === sub.id ? '#fff' : 'var(--text-muted)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '5px 10px', fontSize: '0.72rem', cursor: 'pointer' }}>
                            {sub.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ background: 'var(--canvas-2)', borderRadius: '12px', padding: '20px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#3b82f6' }}>
                  <Info size={16} />
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Node Inspector</span>
                </div>
                {onAddNote && selectedNode && (
                  <button onClick={handleSaveToNotes} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: savedNote ? '#16a34a' : 'transparent', color: savedNote ? '#fff' : 'var(--text-muted)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '4px 8px', fontSize: '0.72rem', cursor: 'pointer' }}>
                    {savedNote ? <Check size={12} /> : <BookmarkPlus size={12} />}
                    <span>{savedNote ? 'Saved!' : 'Save to Notes'}</span>
                  </button>
                )}
              </div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '0.95rem', color: 'var(--text-main)', fontWeight: 600 }}>{selectedNode?.label || 'Select a node'}</h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>{selectedNode?.desc || 'Click any node on the left to inspect its synthesized definition and insights.'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
