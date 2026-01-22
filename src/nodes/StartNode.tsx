import { Handle, Position, type NodeProps } from 'reactflow';
import { useDiagramStore } from '../state/diagramStore';
import { NotePopover } from './NotePopover';

export const StartNode = ({ id, data }: NodeProps) => {
  const addTokenAtNode = useDiagramStore((state) => state.addTokenAtNode);

  return (
    <NotePopover note={data.note}>
      <div
        className="node-start"
        onClick={() => addTokenAtNode(id)}
        title="Click to inject a token"
      >
        <Handle type="source" position={Position.Right} />
      </div>
    </NotePopover>
  );
};
