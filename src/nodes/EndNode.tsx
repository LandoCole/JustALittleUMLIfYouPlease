import { Handle, Position, type NodeProps } from 'reactflow';
import { NotePopover } from './NotePopover';

export const EndNode = ({ data }: NodeProps) => {
  return (
    <NotePopover note={data.note}>
      <div className="node-end">
        <Handle type="target" position={Position.Left} />
      </div>
    </NotePopover>
  );
};
