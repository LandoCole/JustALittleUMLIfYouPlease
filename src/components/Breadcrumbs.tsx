import { useDiagramStore } from '../state/diagramStore';

export const Breadcrumbs = () => {
  const navStack = useDiagramStore((state) => state.navStack);
  const currentDiagramId = useDiagramStore((state) => state.currentDiagramId);
  const diagrams = useDiagramStore((state) => state.diagrams);
  const navigateTo = useDiagramStore((state) => state.navigateTo);

  const crumbs = [...navStack, currentDiagramId];

  return (
    <div className="breadcrumbs">
      {crumbs.map((diagramId, index) => (
        <span key={`${diagramId}-${index}`}>
          {index > 0 ? '› ' : ''}
          <button onClick={() => navigateTo(diagramId)}>{diagrams[diagramId]?.file.title ?? diagramId}</button>
        </span>
      ))}
    </div>
  );
};
