import { nanoid } from 'nanoid';
import { create } from 'zustand';
import { applyEdgeChanges, applyNodeChanges, type EdgeChange, type NodeChange, type Viewport } from 'reactflow';
import {
  createEmptyDiagram,
  type DiagramEdge,
  type DiagramFile,
  type DiagramNode,
  type NodeType
} from '../schemas/diagramSchema';
import {
  createPlaceholderDiagram,
  downloadDiagram,
  importDiagramFiles,
  openDirectory,
  saveDiagramAs,
  saveDiagramToHandle,
  type FileHandleEntry
} from './fileAdapter';

export interface DiagramEntry {
  file: DiagramFile;
  viewport: Viewport;
}

export interface Token {
  id: string;
  currentNodeId: string;
  currentEdgeId?: string;
  progress: number;
  status: 'moving' | 'paused' | 'done' | 'stopped';
  groupId?: string;
}

export interface DecisionRequest {
  tokenId: string;
  nodeId: string;
  options: { edgeId: string; label: string }[];
}

interface DiagramStore {
  diagrams: Record<string, DiagramEntry>;
  diagramOrder: string[];
  fileHandles: Record<string, FileSystemFileHandle>;
  currentDiagramId: string;
  openTabs: string[];
  navStack: string[];
  mode: 'edit' | 'view';
  selectedNodeId?: string;
  selectedEdgeId?: string;
  tokens: Token[];
  decisionQueue: DecisionRequest[];
  autoMode: boolean;
  activeEdgeIds: string[];
  toasts: { id: string; message: string }[];
  joinState: Record<string, Record<string, string[]>>;
  setMode: (mode: 'edit' | 'view') => void;
  addToast: (message: string) => void;
  removeToast: (id: string) => void;
  setSelection: (nodeId?: string, edgeId?: string) => void;
  addDiagram: (diagram: DiagramFile) => void;
  setCurrentDiagram: (diagramId: string) => void;
  updateNodes: (changes: NodeChange[]) => void;
  updateEdges: (changes: EdgeChange[]) => void;
  addNode: (type: NodeType, position: { x: number; y: number }) => void;
  addEdge: (edge: DiagramEdge) => void;
  updateNodeData: (nodeId: string, data: Partial<DiagramNode['data']>) => void;
  updateEdgeData: (edgeId: string, data: Partial<DiagramEdge>) => void;
  deleteSelection: () => void;
  setViewport: (viewport: Viewport) => void;
  pushNav: (diagramId: string) => void;
  popNav: () => void;
  navigateTo: (diagramId: string) => void;
  openChildDiagram: (diagramId: string) => void;
  createMissingDiagram: (diagramId: string) => void;
  openFolder: () => Promise<void>;
  importFiles: (files: FileList) => Promise<void>;
  saveCurrent: () => Promise<void>;
  saveAs: () => Promise<void>;
  saveCopy: () => Promise<void>;
  addTokenAtNode: (nodeId: string) => void;
  stepTokens: (delta: number) => void;
  resolveDecision: (tokenId: string, edgeId: string) => void;
  stopSimulation: () => void;
  resetSimulation: () => void;
  setAutoMode: (value: boolean) => void;
}

const initialDiagram = createEmptyDiagram('root', 'Root Diagram');

export const useDiagramStore = create<DiagramStore>((set, get) => ({
  diagrams: {
    [initialDiagram.diagramId]: {
      file: initialDiagram,
      viewport: { x: 0, y: 0, zoom: 1 }
    }
  },
  diagramOrder: [initialDiagram.diagramId],
  fileHandles: {},
  currentDiagramId: initialDiagram.diagramId,
  openTabs: [initialDiagram.diagramId],
  navStack: [],
  mode: 'edit',
  tokens: [],
  decisionQueue: [],
  autoMode: false,
  activeEdgeIds: [],
  toasts: [],
  joinState: {},
  setMode: (mode) => set({ mode }),
  addToast: (message) =>
    set((state) => ({
      toasts: [...state.toasts, { id: nanoid(), message }]
    })),
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id)
    })),
  setSelection: (nodeId, edgeId) => set({ selectedNodeId: nodeId, selectedEdgeId: edgeId }),
  addDiagram: (diagram) =>
    set((state) => {
      const exists = state.diagrams[diagram.diagramId];
      const entry: DiagramEntry = {
        file: diagram,
        viewport: exists?.viewport ?? { x: 0, y: 0, zoom: 1 }
      };
      return {
        diagrams: { ...state.diagrams, [diagram.diagramId]: entry },
        diagramOrder: exists
          ? state.diagramOrder
          : [...state.diagramOrder, diagram.diagramId]
      };
    }),
  setCurrentDiagram: (diagramId) =>
    set((state) => ({
      currentDiagramId: diagramId,
      openTabs: state.openTabs.includes(diagramId) ? state.openTabs : [...state.openTabs, diagramId],
      selectedNodeId: undefined,
      selectedEdgeId: undefined
    })),
  updateNodes: (changes) =>
    set((state) => {
      const entry = state.diagrams[state.currentDiagramId];
      return {
        diagrams: {
          ...state.diagrams,
          [state.currentDiagramId]: {
            ...entry,
            file: {
              ...entry.file,
              nodes: applyNodeChanges(changes, entry.file.nodes)
            }
          }
        }
      };
    }),
  updateEdges: (changes) =>
    set((state) => {
      const entry = state.diagrams[state.currentDiagramId];
      return {
        diagrams: {
          ...state.diagrams,
          [state.currentDiagramId]: {
            ...entry,
            file: {
              ...entry.file,
              edges: applyEdgeChanges(changes, entry.file.edges)
            }
          }
        }
      };
    }),
  addNode: (type, position) =>
    set((state) => {
      const entry = state.diagrams[state.currentDiagramId];
      const node: DiagramNode = {
        id: nanoid(),
        type,
        position,
        data: {
          label: type === 'start' ? 'Start' : type === 'end' ? 'End' : 'New Node',
          note: '',
          childDiagramId: null,
          forkJoin: { orientation: 'horizontal' }
        }
      };
      return {
        diagrams: {
          ...state.diagrams,
          [state.currentDiagramId]: {
            ...entry,
            file: {
              ...entry.file,
              nodes: [...entry.file.nodes, node]
            }
          }
        }
      };
    }),
  addEdge: (edge) =>
    set((state) => {
      const entry = state.diagrams[state.currentDiagramId];
      return {
        diagrams: {
          ...state.diagrams,
          [state.currentDiagramId]: {
            ...entry,
            file: {
              ...entry.file,
              edges: [...entry.file.edges, edge]
            }
          }
        }
      };
    }),
  updateNodeData: (nodeId, data) =>
    set((state) => {
      const entry = state.diagrams[state.currentDiagramId];
      return {
        diagrams: {
          ...state.diagrams,
          [state.currentDiagramId]: {
            ...entry,
            file: {
              ...entry.file,
              nodes: entry.file.nodes.map((node) =>
                node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
              )
            }
          }
        }
      };
    }),
  updateEdgeData: (edgeId, data) =>
    set((state) => {
      const entry = state.diagrams[state.currentDiagramId];
      return {
        diagrams: {
          ...state.diagrams,
          [state.currentDiagramId]: {
            ...entry,
            file: {
              ...entry.file,
              edges: entry.file.edges.map((edge) =>
                edge.id === edgeId ? { ...edge, ...data } : edge
              )
            }
          }
        }
      };
    }),
  deleteSelection: () =>
    set((state) => {
      const entry = state.diagrams[state.currentDiagramId];
      if (state.selectedNodeId) {
        return {
          diagrams: {
            ...state.diagrams,
            [state.currentDiagramId]: {
              ...entry,
              file: {
                ...entry.file,
                nodes: entry.file.nodes.filter((node) => node.id !== state.selectedNodeId),
                edges: entry.file.edges.filter(
                  (edge) => edge.source !== state.selectedNodeId && edge.target !== state.selectedNodeId
                )
              }
            }
          },
          selectedNodeId: undefined
        };
      }
      if (state.selectedEdgeId) {
        return {
          diagrams: {
            ...state.diagrams,
            [state.currentDiagramId]: {
              ...entry,
              file: {
                ...entry.file,
                edges: entry.file.edges.filter((edge) => edge.id !== state.selectedEdgeId)
              }
            }
          },
          selectedEdgeId: undefined
        };
      }
      return state;
    }),
  setViewport: (viewport) =>
    set((state) => ({
      diagrams: {
        ...state.diagrams,
        [state.currentDiagramId]: {
          ...state.diagrams[state.currentDiagramId],
          viewport
        }
      }
    })),
  pushNav: (diagramId) =>
    set((state) => ({
      navStack: [...state.navStack, diagramId]
    })),
  popNav: () =>
    set((state) => {
      const nextStack = [...state.navStack];
      const target = nextStack.pop();
      if (!target) return state;
      return {
        navStack: nextStack,
        currentDiagramId: target
      };
    }),
  navigateTo: (diagramId) =>
    set((state) => {
      const index = state.navStack.indexOf(diagramId);
      const nextTabs = state.openTabs.includes(diagramId)
        ? state.openTabs
        : [...state.openTabs, diagramId];
      if (index === -1) {
        return { currentDiagramId: diagramId, openTabs: nextTabs };
      }
      return {
        navStack: state.navStack.slice(0, index),
        currentDiagramId: diagramId,
        openTabs: nextTabs
      };
    }),
  openChildDiagram: (diagramId) => {
    const state = get();
    if (!state.diagrams[diagramId]) {
      state.addToast('Missing child diagram.');
      return;
    }
    set({
      navStack: [...state.navStack, state.currentDiagramId],
      currentDiagramId: diagramId,
      openTabs: state.openTabs.includes(diagramId) ? state.openTabs : [...state.openTabs, diagramId]
    });
  },
  createMissingDiagram: (diagramId) =>
    set((state) => {
      const diagram = createPlaceholderDiagram(diagramId);
      return {
        diagrams: {
          ...state.diagrams,
          [diagramId]: { file: diagram, viewport: { x: 0, y: 0, zoom: 1 } }
        },
        diagramOrder: state.diagramOrder.includes(diagramId)
          ? state.diagramOrder
          : [...state.diagramOrder, diagramId]
      };
    }),
  openFolder: async () => {
    try {
      const { diagrams, handles } = await openDirectory();
      set((state) => {
        const nextHandles = { ...state.fileHandles };
        handles.forEach((entry) => {
          nextHandles[entry.diagramId] = entry.handle;
        });
        const nextDiagrams = { ...state.diagrams };
        diagrams.forEach((diagram) => {
          nextDiagrams[diagram.diagramId] = {
            file: diagram,
            viewport: state.diagrams[diagram.diagramId]?.viewport ?? { x: 0, y: 0, zoom: 1 }
          };
        });
        return {
          diagrams: nextDiagrams,
          fileHandles: nextHandles,
          diagramOrder: Array.from(new Set([...state.diagramOrder, ...diagrams.map((d) => d.diagramId)]))
        };
      });
      get().addToast('Folder loaded.');
    } catch (error) {
      get().addToast('Folder access unavailable.');
    }
  },
  importFiles: async (files) => {
    const diagrams = await importDiagramFiles(files);
    set((state) => {
      const next = { ...state.diagrams };
      diagrams.forEach((diagram) => {
        next[diagram.diagramId] = {
          file: diagram,
          viewport: state.diagrams[diagram.diagramId]?.viewport ?? { x: 0, y: 0, zoom: 1 }
        };
      });
      return {
        diagrams: next,
        diagramOrder: Array.from(new Set([...state.diagramOrder, ...diagrams.map((d) => d.diagramId)]))
      };
    });
    get().addToast('Imported diagrams.');
  },
  saveCurrent: async () => {
    const state = get();
    const entry = state.diagrams[state.currentDiagramId];
    const handle = state.fileHandles[state.currentDiagramId];
    const payload: DiagramFile = {
      ...entry.file,
      meta: { ...entry.file.meta, updatedAt: new Date().toISOString() }
    };
    try {
      if (handle) {
        await saveDiagramToHandle(payload, handle);
        get().addToast('Diagram saved.');
        return;
      }
      downloadDiagram(payload, `${payload.diagramId}.json`);
      get().addToast('Downloaded diagram JSON.');
    } catch (error) {
      get().addToast('Save failed.');
    }
  },
  saveAs: async () => {
    const state = get();
    const entry = state.diagrams[state.currentDiagramId];
    const payload: DiagramFile = {
      ...entry.file,
      meta: { ...entry.file.meta, updatedAt: new Date().toISOString() }
    };
    try {
      const handle = await saveDiagramAs(payload);
      set((current) => ({
        fileHandles: { ...current.fileHandles, [payload.diagramId]: handle }
      }));
      get().addToast('Saved to new file.');
    } catch (error) {
      downloadDiagram(payload, `${payload.diagramId}.json`);
      get().addToast('Downloaded diagram JSON.');
    }
  },
  saveCopy: async () => {
    const state = get();
    const entry = state.diagrams[state.currentDiagramId];
    const payload: DiagramFile = {
      ...entry.file,
      meta: { ...entry.file.meta, updatedAt: new Date().toISOString() }
    };
    try {
      await saveDiagramAs(payload);
      get().addToast('Saved copy.');
    } catch (error) {
      downloadDiagram(payload, `${payload.diagramId}-copy.json`);
      get().addToast('Downloaded diagram copy.');
    }
  },
  addTokenAtNode: (nodeId) =>
    set((state) => ({
      tokens: [
        ...state.tokens,
        {
          id: nanoid(),
          currentNodeId: nodeId,
          progress: 0,
          status: 'moving'
        }
      ]
    })),
  stepTokens: (delta) =>
    set((state) => {
      const entry = state.diagrams[state.currentDiagramId];
      const { nodes, edges } = entry.file;
      const nodeMap = Object.fromEntries(nodes.map((node) => [node.id, node]));
      const edgeMap = Object.fromEntries(edges.map((edge) => [edge.id, edge]));
      let decisionQueue = [...state.decisionQueue];
      let activeEdgeIds = new Set(state.activeEdgeIds);
      let joinState = { ...state.joinState };
      const completedGroups = new Set<string>();

      const nextTokens: Token[] = [];
      state.tokens.forEach((token) => {
        if (token.status === 'stopped' || token.status === 'done') {
          nextTokens.push(token);
          return;
        }

        if (token.status === 'paused') {
          nextTokens.push(token);
          return;
        }

        if (!token.currentEdgeId) {
          const node = nodeMap[token.currentNodeId];
          if (!node) {
            nextTokens.push({ ...token, status: 'done' });
            return;
          }
          if (node.type === 'end') {
            nextTokens.push({ ...token, status: 'done' });
            return;
          }
          const outgoing = edges.filter((edge) => edge.source === node.id);
          if (outgoing.length === 0) {
            nextTokens.push({ ...token, status: 'done' });
            return;
          }
          if (node.type === 'decision') {
            const options = outgoing.map((edge, index) => ({
              edgeId: edge.id,
              label: edge.label?.toString() || `Option ${index + 1}`
            }));
            decisionQueue = [
              ...decisionQueue,
              {
                tokenId: token.id,
                nodeId: node.id,
                options
              }
            ];
            nextTokens.push({ ...token, status: 'paused' });
            return;
          }
          if (node.type === 'forkjoin' || (node.type === 'action' && outgoing.length > 1)) {
            const groupId = nanoid();
            outgoing.forEach((edge) => {
              nextTokens.push({
                ...token,
                id: nanoid(),
                currentEdgeId: edge.id,
                progress: 0,
                status: 'moving',
                groupId
              });
              activeEdgeIds.add(edge.id);
            });
            return;
          }
          const firstEdge = outgoing[0];
          nextTokens.push({
            ...token,
            currentEdgeId: firstEdge.id,
            progress: 0,
            status: 'moving'
          });
          activeEdgeIds.add(firstEdge.id);
          return;
        }

        const edge = edgeMap[token.currentEdgeId];
        if (!edge) {
          nextTokens.push({ ...token, status: 'done' });
          return;
        }
        const nextProgress = token.progress + delta * 0.0003;
        if (nextProgress < 1) {
          nextTokens.push({ ...token, progress: nextProgress });
          activeEdgeIds.add(edge.id);
          return;
        }
        const targetNode = nodeMap[edge.target];
        if (!targetNode) {
          nextTokens.push({ ...token, status: 'done' });
          return;
        }
        if (targetNode.type === 'end') {
          nextTokens.push({ ...token, currentNodeId: targetNode.id, currentEdgeId: undefined, status: 'done' });
          return;
        }
        if (targetNode.type === 'forkjoin') {
          const groupId = token.groupId ?? nanoid();
          const requiredCount = edges.filter((e) => e.target === targetNode.id).length;
          if (!joinState[targetNode.id]) joinState[targetNode.id] = {};
          if (!joinState[targetNode.id][groupId]) joinState[targetNode.id][groupId] = [];
          const arrivals = new Set(joinState[targetNode.id][groupId]);
          arrivals.add(edge.id);
          joinState[targetNode.id][groupId] = Array.from(arrivals);
          if (arrivals.size >= requiredCount && requiredCount > 0) {
            completedGroups.add(`${targetNode.id}:${groupId}`);
            const outgoing = edges.filter((e) => e.source === targetNode.id);
            const nextEdge = outgoing[0];
            if (nextEdge) {
              nextTokens.push({
                ...token,
                currentNodeId: targetNode.id,
                currentEdgeId: nextEdge.id,
                progress: 0,
                status: 'moving',
                groupId
              });
              activeEdgeIds.add(nextEdge.id);
            } else {
            nextTokens.push({ ...token, currentNodeId: targetNode.id, currentEdgeId: undefined, status: 'done' });
          }
          } else {
            nextTokens.push({ ...token, currentNodeId: targetNode.id, currentEdgeId: undefined, status: 'paused', groupId });
          }
          return;
        }
        nextTokens.push({
          ...token,
          currentNodeId: targetNode.id,
          currentEdgeId: undefined,
          progress: 0,
          status: 'moving'
        });
      });

      const filteredTokens = nextTokens.filter((token) => {
        if (!token.groupId || token.status !== 'paused') return true;
        return !completedGroups.has(`${token.currentNodeId}:${token.groupId}`);
      });

      return {
        tokens: filteredTokens,
        decisionQueue,
        activeEdgeIds: Array.from(activeEdgeIds),
        joinState
      };
    }),
  resolveDecision: (tokenId, edgeId) =>
    set((state) => ({
      decisionQueue: state.decisionQueue.filter((decision) => decision.tokenId !== tokenId),
      tokens: state.tokens.map((token) =>
        token.id === tokenId
          ? { ...token, currentEdgeId: edgeId, status: 'moving', progress: 0 }
          : token
      )
    })),
  stopSimulation: () =>
    set((state) => ({
      tokens: state.tokens.map((token) => ({ ...token, status: token.status === 'done' ? 'done' : 'stopped' }))
    })),
  resetSimulation: () => set({ tokens: [], activeEdgeIds: [], decisionQueue: [], joinState: {} }),
  setAutoMode: (value) => set({ autoMode: value })
}));

export const createEdgeLabel = (edge: DiagramEdge, index: number) => {
  return edge.label?.toString() || `Option ${index + 1}`;
};
