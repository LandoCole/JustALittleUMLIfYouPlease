import { useEffect, useRef } from 'react';
import { FlowCanvas } from './components/FlowCanvas';
import { NodePalette } from './components/NodePalette';
import { Inspector } from './components/Inspector';
import { TabsBar } from './components/TabsBar';
import { Breadcrumbs } from './components/Breadcrumbs';
import { DecisionModal } from './components/DecisionModal';
import { Toasts } from './components/Toasts';
import { useDiagramStore } from './state/diagramStore';
import { useSimulationEngine } from './state/simulationEngine';

const supportsFileAccess = 'showDirectoryPicker' in window;

const App = () => {
  useSimulationEngine();

  const mode = useDiagramStore((state) => state.mode);
  const setMode = useDiagramStore((state) => state.setMode);
  const openFolder = useDiagramStore((state) => state.openFolder);
  const saveCurrent = useDiagramStore((state) => state.saveCurrent);
  const saveAs = useDiagramStore((state) => state.saveAs);
  const saveCopy = useDiagramStore((state) => state.saveCopy);
  const popNav = useDiagramStore((state) => state.popNav);
  const navStack = useDiagramStore((state) => state.navStack);
  const autoMode = useDiagramStore((state) => state.autoMode);
  const setAutoMode = useDiagramStore((state) => state.setAutoMode);
  const stopSimulation = useDiagramStore((state) => state.stopSimulation);
  const resetSimulation = useDiagramStore((state) => state.resetSimulation);
  const importFiles = useDiagramStore((state) => state.importFiles);
  const diagramOrder = useDiagramStore((state) => state.diagramOrder);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const requestedFolder = useRef(false);

  useEffect(() => {
    if (!supportsFileAccess || requestedFolder.current) return;
    requestedFolder.current = true;
    if (diagramOrder.length === 1) {
      void openFolder();
    }
  }, [diagramOrder.length, openFolder]);

  return (
    <div className="app-shell">
      <div className="top-bar">
        <button onClick={() => setMode(mode === 'edit' ? 'view' : 'edit')}>
          Mode: {mode === 'edit' ? 'Edit' : 'View'}
        </button>
        <button onClick={() => openFolder()} disabled={!supportsFileAccess}>
          Open Folder
        </button>
        <button className="secondary" onClick={() => fileInputRef.current?.click()}>
          Import
        </button>
        <button onClick={() => saveCurrent()}>Save</button>
        <button onClick={() => saveAs()}>Save As</button>
        <button className="secondary" onClick={() => saveCopy()}>
          Save Copy
        </button>
        <button onClick={() => popNav()} disabled={navStack.length === 0}>
          Back
        </button>
        <Breadcrumbs />
        <TabsBar />
        <button onClick={() => setAutoMode(!autoMode)}>Auto-mode: {autoMode ? 'On' : 'Off'}</button>
        <button onClick={() => stopSimulation()}>Stop</button>
        <button onClick={() => resetSimulation()}>Reset</button>
        {!supportsFileAccess && <span>Folder access unavailable; using import/export.</span>}
      </div>
      <aside className="sidebar">
        <NodePalette />
      </aside>
      <main>
        <FlowCanvas />
      </main>
      <aside className="rightbar">
        <Inspector />
      </aside>
      <DecisionModal />
      <Toasts />
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        multiple
        style={{ display: 'none' }}
        onChange={(event) => {
          if (!event.target.files) return;
          void importFiles(event.target.files);
          event.target.value = '';
        }}
      />
    </div>
  );
};

export default App;
