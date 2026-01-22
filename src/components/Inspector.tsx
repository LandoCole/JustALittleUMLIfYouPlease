import { useMemo, useState } from 'react';
import { useDiagramStore } from '../state/diagramStore';
import { createEdgeLabel } from '../state/diagramStore';

export const Inspector = () => {
  const entry = useDiagramStore((state) => state.diagrams[state.currentDiagramId]);
  const selectedNodeId = useDiagramStore((state) => state.selectedNodeId);
  const selectedEdgeId = useDiagramStore((state) => state.selectedEdgeId);
  const updateNodeData = useDiagramStore((state) => state.updateNodeData);
  const updateEdgeData = useDiagramStore((state) => state.updateEdgeData);
  const deleteSelection = useDiagramStore((state) => state.deleteSelection);
  const openChildDiagram = useDiagramStore((state) => state.openChildDiagram);
  const createMissingDiagram = useDiagramStore((state) => state.createMissingDiagram);
  const diagramOrder = useDiagramStore((state) => state.diagramOrder);
  const [childSearch, setChildSearch] = useState('');

  const selectedNode = entry.file.nodes.find((node) => node.id === selectedNodeId);
  const selectedEdge = entry.file.edges.find((edge) => edge.id === selectedEdgeId);

  const outgoingEdges = useMemo(() => {
    if (!selectedNode) return [];
    return entry.file.edges.filter((edge) => edge.source === selectedNode.id);
  }, [selectedNode, entry.file.edges]);

  if (!selectedNode && !selectedEdge) {
    return <div>Select a node or edge to edit its properties.</div>;
  }

  if (selectedEdge) {
    return (
      <div>
        <h3>Edge</h3>
        <div className="inspector-field">
          <label>Label</label>
          <input
            value={selectedEdge.label?.toString() ?? ''}
            onChange={(event) => updateEdgeData(selectedEdge.id, { label: event.target.value })}
          />
        </div>
        <div className="inspector-field">
          <label>Arrow</label>
          <select
            value={selectedEdge.markerEnd ?? 'arrow'}
            onChange={(event) => updateEdgeData(selectedEdge.id, { markerEnd: event.target.value as never })}
          >
            <option value="arrow">Arrow</option>
            <option value="none">None</option>
          </select>
        </div>
      </div>
    );
  }

  if (!selectedNode) return null;

  return (
    <div>
      <h3>Node</h3>
      <div className="inspector-field">
        <label>Label</label>
        <div className="inspector-row">
          <input
            value={selectedNode.data.label}
            onChange={(event) =>
              updateNodeData(selectedNode.id, { label: event.target.value.slice(0, 60) })
            }
          />
          <button type="button" onClick={() => deleteSelection()}>
            Delete
          </button>
        </div>
      </div>
      <div className="inspector-field">
        <label>Note</label>
        <div className="inspector-row">
          <textarea
            rows={3}
            value={selectedNode.data.note ?? ''}
            onChange={(event) => updateNodeData(selectedNode.id, { note: event.target.value })}
          />
          <button type="button" onClick={() => deleteSelection()}>
            Delete
          </button>
        </div>
      </div>
      {selectedNode.type === 'subprocess' && (
        <div className="inspector-field">
          <label>Child diagram ID</label>
          <input
            placeholder="Search diagrams..."
            value={childSearch}
            onChange={(event) => setChildSearch(event.target.value)}
          />
          <select
            value={selectedNode.data.childDiagramId ?? ''}
            onChange={(event) => updateNodeData(selectedNode.id, { childDiagramId: event.target.value })}
          >
            <option value="">Select diagram</option>
            {diagramOrder
              .filter((diagramId) =>
                diagramId.toLowerCase().includes(childSearch.trim().toLowerCase())
              )
              .map((diagramId) => (
                <option key={diagramId} value={diagramId}>
                  {diagramId}
                </option>
              ))}
          </select>
          <button
            onClick={() => {
              if (!selectedNode.data.childDiagramId) return;
              if (!selectedNode.data.childDiagramId.trim()) return;
              const childId = selectedNode.data.childDiagramId.trim();
              createMissingDiagram(childId);
              openChildDiagram(childId);
            }}
          >
            Open child diagram
          </button>
        </div>
      )}
      {selectedNode.type === 'forkjoin' && (
        <div className="inspector-field">
          <label>Orientation</label>
          <select
            value={selectedNode.data.forkJoin?.orientation ?? 'horizontal'}
            onChange={(event) =>
              updateNodeData(selectedNode.id, {
                forkJoin: { orientation: event.target.value as 'horizontal' | 'vertical' }
              })
            }
          >
            <option value="horizontal">Horizontal</option>
            <option value="vertical">Vertical</option>
          </select>
        </div>
      )}
      {selectedNode.type === 'decision' && (
        <div className="inspector-field">
          <label>Decision options</label>
          {outgoingEdges.map((edge, index) => (
            <input
              key={edge.id}
              value={createEdgeLabel(edge, index)}
              onChange={(event) => updateEdgeData(edge.id, { label: event.target.value })}
              style={{ marginBottom: '6px' }}
            />
          ))}
        </div>
      )}
    </div>
  );
};
