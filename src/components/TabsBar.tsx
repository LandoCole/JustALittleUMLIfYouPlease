import { useDiagramStore } from '../state/diagramStore';

export const TabsBar = () => {
  const openTabs = useDiagramStore((state) => state.openTabs);
  const diagrams = useDiagramStore((state) => state.diagrams);
  const currentDiagramId = useDiagramStore((state) => state.currentDiagramId);
  const setCurrentDiagram = useDiagramStore((state) => state.setCurrentDiagram);

  return (
    <div className="tab-bar">
      {openTabs.map((diagramId) => (
        <button
          key={diagramId}
          className={`tab-button ${diagramId === currentDiagramId ? 'active' : ''}`}
          onClick={() => setCurrentDiagram(diagramId)}
        >
          {diagrams[diagramId]?.file.title ?? diagramId}
        </button>
      ))}
    </div>
  );
};
