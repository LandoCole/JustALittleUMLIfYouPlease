import { useCallback, useEffect, useMemo, useRef, type DragEvent } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MarkerType,
  Position,
  getSmoothStepPath,
  type Connection,
  type Edge,
  type NodeTypes,
  type OnSelectionChangeParams,
  useStore as useReactFlowStore
} from 'reactflow';
import { useDiagramStore } from '../state/diagramStore';
import { ActionNode } from '../nodes/ActionNode';
import { StartNode } from '../nodes/StartNode';
import { EndNode } from '../nodes/EndNode';
import { SubprocessNode } from '../nodes/SubprocessNode';
import { DecisionNode } from '../nodes/DecisionNode';
import { MergeNode } from '../nodes/MergeNode';
import { ForkJoinNode } from '../nodes/ForkJoinNode';
import { DatastoreNode } from '../nodes/DatastoreNode';
import { ObjectNode } from '../nodes/ObjectNode';

const nodeTypes: NodeTypes = {
  action: ActionNode,
  start: StartNode,
  end: EndNode,
  subprocess: SubprocessNode,
  decision: DecisionNode,
  merge: MergeNode,
  forkjoin: ForkJoinNode,
  datastore: DatastoreNode,
  object: ObjectNode
};

const defaultSizes: Record<string, { width: number; height: number }> = {
  start: { width: 24, height: 24 },
  end: { width: 28, height: 28 },
  action: { width: 140, height: 60 },
  subprocess: { width: 140, height: 70 },
  decision: { width: 60, height: 60 },
  merge: { width: 60, height: 60 },
  forkjoin: { width: 80, height: 12 },
  datastore: { width: 120, height: 60 },
  object: { width: 90, height: 60 }
};

const getCenter = (node: { position: { x: number; y: number }; width?: number; height?: number; type?: string }) => {
  const size = defaultSizes[node.type ?? 'action'] ?? defaultSizes.action;
  const width = node.width ?? size.width;
  const height = node.height ?? size.height;
  return {
    x: node.position.x + width / 2,
    y: node.position.y + height / 2
  };
};

const handlePositionFromId = (handleId?: string) => {
  if (!handleId) return Position.Right;
  if (handleId.startsWith('t')) return Position.Top;
  if (handleId.startsWith('b')) return Position.Bottom;
  if (handleId.startsWith('l')) return Position.Left;
  if (handleId.startsWith('r')) return Position.Right;
  return Position.Right;
};

const pointFromHandle = (
  node: { positionAbsolute?: { x: number; y: number }; width?: number; height?: number; type?: string },
  handleId?: string
) => {
  const size = defaultSizes[node.type ?? 'action'] ?? defaultSizes.action;
  const width = node.width ?? size.width;
  const height = node.height ?? size.height;
  const origin = node.positionAbsolute ?? { x: 0, y: 0 };
  const positions: Record<string, { x: number; y: number }> = {
    t: { x: origin.x + width / 2, y: origin.y },
    r: { x: origin.x + width, y: origin.y + height / 2 },
    b: { x: origin.x + width / 2, y: origin.y + height },
    l: { x: origin.x, y: origin.y + height / 2 }
  };
  if (!handleId) return { x: origin.x + width, y: origin.y + height / 2 };
  const key = handleId.slice(0, 1);
  return positions[key] ?? { x: origin.x + width, y: origin.y + height / 2 };
};

export const FlowCanvas = () => {
  const entry = useDiagramStore((state) => state.diagrams[state.currentDiagramId]);
  const currentDiagramId = useDiagramStore((state) => state.currentDiagramId);
  const mode = useDiagramStore((state) => state.mode);
  const updateNodes = useDiagramStore((state) => state.updateNodes);
  const updateEdges = useDiagramStore((state) => state.updateEdges);
  const addEdge = useDiagramStore((state) => state.addEdge);
  const addNode = useDiagramStore((state) => state.addNode);
  const setSelection = useDiagramStore((state) => state.setSelection);
  const deleteSelection = useDiagramStore((state) => state.deleteSelection);
  const setViewport = useDiagramStore((state) => state.setViewport);
  const activeEdgeIds = useDiagramStore((state) => state.activeEdgeIds);
  const tokens = useDiagramStore((state) => state.tokens);
  const openChildDiagram = useDiagramStore((state) => state.openChildDiagram);
  const createMissingDiagram = useDiagramStore((state) => state.createMissingDiagram);

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const transform = useReactFlowStore((state) => state.transform);
  const nodeInternals = useReactFlowStore((state) => state.nodeInternals);

  const nodes = entry.file.nodes;
  const edges: Edge[] = useMemo(() => {
    return entry.file.edges.map((edge) => ({
      ...edge,
      type: edge.type ?? 'smoothstep',
      markerEnd: edge.markerEnd === 'arrow' ? { type: MarkerType.ArrowClosed } : undefined,
      className: activeEdgeIds.includes(edge.id) ? 'edge-active' : undefined
    }));
  }, [entry.file.edges, activeEdgeIds]);

  const handleConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;
      addEdge({
        id: `e-${connection.source}-${connection.target}-${Date.now()}`,
        source: connection.source,
        target: connection.target,
        sourceHandle: connection.sourceHandle,
        targetHandle: connection.targetHandle,
        type: 'smoothstep',
        label: '',
        markerEnd: 'arrow'
      });
    },
    [addEdge]
  );

  const onSelectionChange = useCallback(
    (params: OnSelectionChangeParams) => {
      const nodeId = params.nodes[0]?.id;
      const edgeId = params.edges[0]?.id;
      setSelection(nodeId, edgeId);
    },
    [setSelection]
  );

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/node-type');
      if (!type) return;
      const bounds = wrapperRef.current?.getBoundingClientRect();
      if (!bounds) return;
      const position = {
        x: (event.clientX - bounds.left - transform[0]) / transform[2],
        y: (event.clientY - bounds.top - transform[1]) / transform[2]
      };
      addNode(type as never, position);
    },
    [addNode, transform]
  );

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable) {
        return;
      }
      if (mode !== 'edit') return;
      if (event.key === 'Delete' || event.key === 'Backspace') {
        deleteSelection();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [deleteSelection, mode]);

  const tokenPositions = useMemo(() => {
    const nodeMap = Object.fromEntries(nodes.map((node) => [node.id, node]));
    const edgeMap = Object.fromEntries(entry.file.edges.map((edge) => [edge.id, edge]));
    const edgePathMap = new Map(
      entry.file.edges.map((edge) => {
        const sourceNode = nodeInternals.get(edge.source);
        const targetNode = nodeInternals.get(edge.target);
        if (!sourceNode || !targetNode) return [edge.id, null];
        const sourcePoint = pointFromHandle(sourceNode, edge.sourceHandle);
        const targetPoint = pointFromHandle(targetNode, edge.targetHandle);
        const [edgePath] = getSmoothStepPath({
          sourceX: sourcePoint.x,
          sourceY: sourcePoint.y,
          targetX: targetPoint.x,
          targetY: targetPoint.y,
          sourcePosition: handlePositionFromId(edge.sourceHandle),
          targetPosition: handlePositionFromId(edge.targetHandle)
        });
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', edgePath);
        const length = path.getTotalLength();
        return [edge.id, { path, length }];
      })
    );
    return tokens
      .filter((token) => token.status !== 'done')
      .map((token) => {
        if (token.currentEdgeId) {
          const edge = edgeMap[token.currentEdgeId];
          const edgePath = edgePathMap.get(token.currentEdgeId);
          if (edge && edgePath) {
            const point = edgePath.path.getPointAtLength(edgePath.length * token.progress);
            return { id: token.id, x: point.x, y: point.y };
          }
        }
        const node = nodeMap[token.currentNodeId];
        if (!node) return null;
        const center = getCenter(node);
        return { id: token.id, x: center.x, y: center.y };
      })
      .filter(Boolean) as { id: string; x: number; y: number }[];
  }, [tokens, nodes, entry.file.edges, nodeInternals]);

  return (
    <div className="flow-wrapper" ref={wrapperRef}>
      <ReactFlow
        key={currentDiagramId}
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        defaultViewport={entry.viewport}
        onNodesChange={updateNodes}
        onEdgesChange={updateEdges}
        onConnect={handleConnect}
        onSelectionChange={onSelectionChange}
        onNodeDoubleClick={(_, node) => {
          if (node.type === 'subprocess') {
            const childId = node.data.childDiagramId?.toString().trim();
            if (childId) {
              createMissingDiagram(childId);
              openChildDiagram(childId);
            }
          }
        }}
        onMoveEnd={(_, viewport) => setViewport(viewport)}
        onDrop={onDrop}
        onDragOver={onDragOver}
        fitView
        nodesDraggable={mode === 'edit'}
        nodesConnectable={mode === 'edit'}
        elementsSelectable={mode === 'edit'}
      >
        <Background gap={16} color="#d4d4d4" />
        <Controls />
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            transform: `translate(${transform[0]}px, ${transform[1]}px) scale(${transform[2]})`,
            transformOrigin: 'top left',
            width: '100%',
            height: '100%'
          }}
        >
          {tokenPositions.map((token) => (
            <div key={`${currentDiagramId}-${token.id}`} className="token" style={{ left: token.x, top: token.y }} />
          ))}
        </div>
      </ReactFlow>
    </div>
  );
};
