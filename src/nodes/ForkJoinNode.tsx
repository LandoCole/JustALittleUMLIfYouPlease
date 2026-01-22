import { Handle, Position, type NodeProps } from 'reactflow';
import { NotePopover } from './NotePopover';

export const ForkJoinNode = ({ data }: NodeProps) => {
  const orientation = data.forkJoin?.orientation ?? 'horizontal';
  return (
    <NotePopover note={data.note}>
      <div className={`node-fork ${orientation === 'vertical' ? 'vertical' : ''}`}>
        <Handle type="target" position={Position.Left} />
        <Handle type="source" position={Position.Right} />
        <Handle type="target" position={Position.Top} />
        <Handle type="source" position={Position.Bottom} />
      </div>
    </NotePopover>
  );
};
