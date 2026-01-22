import type { Edge, Node } from 'reactflow';

export type NodeType =
  | 'start'
  | 'end'
  | 'action'
  | 'subprocess'
  | 'decision'
  | 'merge'
  | 'forkjoin'
  | 'datastore'
  | 'object';

export interface DiagramNodeData {
  label: string;
  note?: string | null;
  childDiagramId?: string | null;
  forkJoin?: { orientation: 'horizontal' | 'vertical' };
  meta?: Record<string, unknown>;
}

export type DiagramNode = Node<DiagramNodeData> & { type: NodeType };

export interface DiagramEdge extends Edge {
  markerEnd?: 'arrow' | 'none';
}

export interface DiagramFile {
  diagramId: string;
  title: string;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  meta: { updatedAt: string; version: number };
}

export const createEmptyDiagram = (diagramId: string, title?: string): DiagramFile => ({
  diagramId,
  title: title ?? diagramId,
  nodes: [],
  edges: [],
  meta: { updatedAt: new Date().toISOString(), version: 1 }
});
