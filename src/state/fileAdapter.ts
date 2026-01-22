import { createEmptyDiagram, type DiagramFile } from '../schemas/diagramSchema';

export interface FileHandleEntry {
  handle: FileSystemFileHandle;
  diagramId: string;
}

const isDiagramFile = (file: DiagramFile): file is DiagramFile => {
  return Boolean(file.diagramId && Array.isArray(file.nodes) && Array.isArray(file.edges));
};

export const readDiagramFromFile = async (file: File): Promise<DiagramFile> => {
  const text = await file.text();
  const parsed = JSON.parse(text) as DiagramFile;
  if (!isDiagramFile(parsed)) {
    throw new Error('Invalid diagram file');
  }
  return parsed;
};

export const openDirectory = async (): Promise<{ diagrams: DiagramFile[]; handles: FileHandleEntry[] }> => {
  const picker = await (window as Window & { showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle> })
    .showDirectoryPicker?.();
  if (!picker) {
    throw new Error('File System Access API not available');
  }
  const diagrams: DiagramFile[] = [];
  const handles: FileHandleEntry[] = [];
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  for await (const [name, handle] of picker.entries()) {
    if (handle.kind === 'file' && name.endsWith('.json')) {
      const file = await handle.getFile();
      try {
        const diagram = await readDiagramFromFile(file);
        const fileId = name.replace(/\\.json$/i, '');
        diagram.diagramId = fileId;
        diagram.title = fileId;
        diagrams.push(diagram);
        handles.push({ handle, diagramId: diagram.diagramId });
      } catch (error) {
        console.warn('Failed to load diagram', error);
      }
    }
  }
  return { diagrams, handles };
};

export const importDiagramFiles = async (files: FileList): Promise<DiagramFile[]> => {
  const results: DiagramFile[] = [];
  for (const file of Array.from(files)) {
    if (!file.name.endsWith('.json')) continue;
    try {
      const diagram = await readDiagramFromFile(file);
      const fileId = file.name.replace(/\\.json$/i, '');
      diagram.diagramId = fileId;
      diagram.title = fileId;
      results.push(diagram);
    } catch (error) {
      console.warn('Invalid diagram file', error);
    }
  }
  return results;
};

export const saveDiagramToHandle = async (diagram: DiagramFile, handle: FileSystemFileHandle) => {
  const writable = await handle.createWritable();
  await writable.write(JSON.stringify(diagram, null, 2));
  await writable.close();
};

export const saveDiagramAs = async (diagram: DiagramFile) => {
  const picker = await (window as Window & { showSaveFilePicker?: (options: SaveFilePickerOptions) => Promise<FileSystemFileHandle> })
    .showSaveFilePicker?.({
      suggestedName: `${diagram.diagramId}.json`,
      types: [
        {
          description: 'Diagram JSON',
          accept: { 'application/json': ['.json'] }
        }
      ]
    });
  if (!picker) {
    throw new Error('File System Access API not available');
  }
  await saveDiagramToHandle(diagram, picker);
  return picker;
};

export const downloadDiagram = (diagram: DiagramFile, filename: string) => {
  const blob = new Blob([JSON.stringify(diagram, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
};

export const createPlaceholderDiagram = (diagramId: string) => {
  return createEmptyDiagram(diagramId, diagramId);
};
