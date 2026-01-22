import { useDiagramStore } from '../state/diagramStore';

const paletteItems = [
  { type: 'start', label: 'Start' },
  { type: 'end', label: 'End' },
  { type: 'action', label: 'Action' },
  { type: 'subprocess', label: 'Subprocess' },
  { type: 'decision', label: 'Decision' },
  { type: 'merge', label: 'Merge' },
  { type: 'forkjoin', label: 'Fork / Join' },
  { type: 'datastore', label: 'Datastore' },
  { type: 'object', label: 'Object' }
];

export const NodePalette = () => {
  const diagramOrder = useDiagramStore((state) => state.diagramOrder);
  const diagrams = useDiagramStore((state) => state.diagrams);
  const setCurrentDiagram = useDiagramStore((state) => state.setCurrentDiagram);
  const currentDiagramId = useDiagramStore((state) => state.currentDiagramId);

  return (
    <div>
      <div className="section">
        <h3>Palette</h3>
        {paletteItems.map((item) => (
          <div
            key={item.type}
            className="palette-item"
            draggable
            onDragStart={(event) => {
              event.dataTransfer.setData('application/node-type', item.type);
              event.dataTransfer.effectAllowed = 'move';
            }}
          >
            {item.label}
          </div>
        ))}
      </div>
      <div className="section">
        <h3>Diagrams</h3>
        {diagramOrder.map((diagramId) => (
          <div
            key={diagramId}
            className="list-item"
            style={{
              borderColor: diagramId === currentDiagramId ? '#38bdf8' : undefined,
              fontWeight: diagramId === currentDiagramId ? 600 : undefined
            }}
            onClick={() => setCurrentDiagram(diagramId)}
          >
            {diagrams[diagramId]?.file.title ?? diagramId}
          </div>
        ))}
      </div>
    </div>
  );
};
