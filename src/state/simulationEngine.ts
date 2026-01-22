import { useEffect, useRef } from 'react';
import { useDiagramStore } from './diagramStore';

export const useSimulationEngine = () => {
  const stepTokens = useDiagramStore((state) => state.stepTokens);
  const decisionQueue = useDiagramStore((state) => state.decisionQueue);
  const autoMode = useDiagramStore((state) => state.autoMode);
  const resolveDecision = useDiagramStore((state) => state.resolveDecision);

  const lastTime = useRef<number | null>(null);

  useEffect(() => {
    let raf: number;

    const tick = (time: number) => {
      if (lastTime.current === null) {
        lastTime.current = time;
      }
      const delta = time - lastTime.current;
      lastTime.current = time;
      stepTokens(delta);
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [stepTokens]);

  useEffect(() => {
    if (!autoMode || decisionQueue.length === 0) return;
    const timeout = window.setTimeout(() => {
      const nextDecision = decisionQueue[0];
      const choice = nextDecision.options[Math.floor(Math.random() * nextDecision.options.length)];
      if (choice) {
        resolveDecision(nextDecision.tokenId, choice.edgeId);
      }
    }, 600);
    return () => window.clearTimeout(timeout);
  }, [autoMode, decisionQueue, resolveDecision]);
};
