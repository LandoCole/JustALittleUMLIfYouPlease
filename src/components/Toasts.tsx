import { useEffect } from 'react';
import { useDiagramStore } from '../state/diagramStore';

export const Toasts = () => {
  const toasts = useDiagramStore((state) => state.toasts);
  const removeToast = useDiagramStore((state) => state.removeToast);

  useEffect(() => {
    const timers = toasts.map((toast) =>
      window.setTimeout(() => removeToast(toast.id), 3000)
    );
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [toasts, removeToast]);

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className="toast">
          {toast.message}
        </div>
      ))}
    </div>
  );
};
