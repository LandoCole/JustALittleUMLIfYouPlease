import { Handle, Position, type NodeProps } from 'reactflow';
import { NotePopover } from './NotePopover';

export const DecisionNode = ({ data }: NodeProps) => {
  return (
    <NotePopover note={data.note}>
      <div className="node-diamond">
        <span>{data.label}</span>
        <Handle type="target" position={Position.Left} />
        <Handle type="source" position={Position.Right} />
        <Handle type="source" position={Position.Bottom} />
      </div>
    </NotePopover>
  );
};
