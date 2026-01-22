import { useDiagramStore } from '../state/diagramStore';

export const DecisionModal = () => {
  const decisionQueue = useDiagramStore((state) => state.decisionQueue);
  const autoMode = useDiagramStore((state) => state.autoMode);
  const resolveDecision = useDiagramStore((state) => state.resolveDecision);

  if (decisionQueue.length === 0 || autoMode) return null;

  const decision = decisionQueue[0];

  return (
    <div className="decision-modal">
      <div className="decision-card">
        <h3>Decision needed</h3>
        <p>Select the next path for this token.</p>
        {decision.options.map((option) => (
          <button
            key={option.edgeId}
            style={{
              width: '100%',
              marginTop: '8px',
              padding: '8px',
              borderRadius: '8px',
              border: '1px solid #cfcfcf',
              background: '#f5f5f5',
              color: '#181818'
            }}
            onClick={() => resolveDecision(decision.tokenId, option.edgeId)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
};
