import { Handle, Position, type NodeProps } from 'reactflow';
import { NotePopover } from './NotePopover';

export const MergeNode = ({ data }: NodeProps) => {
  return (
    <NotePopover note={data.note}>
      <div className="node-diamond">
        <span>{data.label}</span>
        <Handle type="target" position={Position.Left} />
        <Handle type="target" position={Position.Top} />
        <Handle type="source" position={Position.Right} />
      </div>
    </NotePopover>
  );
};
