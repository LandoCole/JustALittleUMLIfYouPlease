import { memo } from 'react';
import { NodeResizer, type NodeProps } from 'reactflow';

export const ResizableNodeWrapper = memo(
  ({ selected, children }: { selected: NodeProps['selected']; children: React.ReactNode }) => {
    return (
      <div style={{ width: '100%', height: '100%' }}>
        <NodeResizer color="#181818" isVisible={Boolean(selected)} minWidth={60} minHeight={40} />
        {children}
      </div>
    );
  }
);

ResizableNodeWrapper.displayName = 'ResizableNodeWrapper';
