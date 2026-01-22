import { Handle, Position, type NodeProps } from 'reactflow';
import { NotePopover } from './NotePopover';

export const DatastoreNode = ({ data }: NodeProps) => {
  return (
    <NotePopover note={data.note}>
      <div className="node-datastore">
        <Handle type="target" position={Position.Left} />
        <div style={{ position: 'relative', top: '16px', textAlign: 'center' }}>{data.label}</div>
        <Handle type="source" position={Position.Right} />
      </div>
    </NotePopover>
  );
};
