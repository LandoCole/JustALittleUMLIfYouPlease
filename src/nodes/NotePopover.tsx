import { useState } from 'react';

interface NotePopoverProps {
  note?: string | null;
  children: React.ReactNode;
}

export const NotePopover = ({ note, children }: NotePopoverProps) => {
  const [open, setOpen] = useState(false);

  return (
    <div
      onClick={() => {
        setOpen((value) => !value);
      }}
      style={{ position: 'relative' }}
    >
      {children}
      {note ? <span className="note-badge">Note</span> : null}
      {open && note ? <div className="note-popover">{note}</div> : null}
    </div>
  );
};
