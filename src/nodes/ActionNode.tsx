import { Handle, Position, type NodeProps } from 'reactflow';
import { NotePopover } from './NotePopover';

export const ActionNode = ({ data }: NodeProps) => {
  return (
    <NotePopover note={data.note}>
      <div className="node-base node-action">
        <Handle type="target" position={Position.Left} />
        <div>{data.label}</div>
        <Handle type="source" position={Position.Right} />
      </div>
    </NotePopover>
  );
};
