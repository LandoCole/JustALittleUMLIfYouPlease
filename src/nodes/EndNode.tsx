import { Handle, Position, type NodeProps } from 'reactflow';
import { NotePopover } from './NotePopover';
import { ResizableNodeWrapper } from '../components/ResizableNodeWrapper';

export const EndNode = ({ data, selected }: NodeProps) => {
  return (
    <NotePopover note={data.note}>
      <ResizableNodeWrapper selected={selected}>
        <div className="node-end">
          <Handle type="source" id="t-source" position={Position.Top} />
          <Handle type="target" id="t-target" position={Position.Top} />
          <Handle type="source" id="r-source" position={Position.Right} />
          <Handle type="target" id="r-target" position={Position.Right} />
          <Handle type="source" id="b-source" position={Position.Bottom} />
          <Handle type="target" id="b-target" position={Position.Bottom} />
          <Handle type="source" id="l-source" position={Position.Left} />
          <Handle type="target" id="l-target" position={Position.Left} />
        </div>
      </ResizableNodeWrapper>
    </NotePopover>
  );
};
