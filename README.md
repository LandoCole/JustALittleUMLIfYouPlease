# Just a Little UML If You Please

A lightweight, local-first UML Activity Diagram editor and viewer with nested drill-down and multi-token flow simulation.

## Features

- Drag-and-drop UML Activity Diagram nodes (start, end, action, decision, merge, fork/join, datastore, object, subprocess).
- Connect nodes with labeled smoothstep edges and toggle arrowheads.
- Notes on nodes with a click-to-toggle popover and badge indicator.
- Drill down into subprocess diagrams in the same tab, with back navigation and breadcrumbs.
- Tabbed diagram switching and diagram list.
- File System Access API folder persistence with import/export fallback.
- Multi-token simulation with fan-out, decision prompts, join gating, and auto-mode.

## Setup

```bash
npm install
```

## Development

```bash
npm run dev
```

## Build

```bash
npm run build
```

The production build outputs static files to `dist/`. You can open `dist/index.html` directly in a browser (offline capable).

## File access

- **Primary**: Use the **Open Folder** button to load diagrams from a directory using the File System Access API.
- **Fallback**: Use **Import** to load JSON files and **Save/Save As** to download JSON files when folder access is unavailable.

## Diagram JSON schema

Each diagram is stored in its own JSON file named `<diagramId>.json`:

```json
{
  "diagramId": "root",
  "title": "Root Diagram",
  "nodes": [
    {
      "id": "n1",
      "type": "start|end|action|subprocess|decision|merge|forkjoin|datastore|object",
      "position": { "x": 0, "y": 0 },
      "data": {
        "label": "string",
        "note": "string|null",
        "childDiagramId": "string|null",
        "forkJoin": { "orientation": "horizontal|vertical" },
        "meta": { "any": "extra" }
      }
    }
  ],
  "edges": [
    {
      "id": "e1",
      "source": "n1",
      "target": "n2",
      "type": "smoothstep",
      "label": "optional string",
      "animated": false,
      "markerEnd": "arrow|none"
    }
  ],
  "meta": { "updatedAt": "ISO string", "version": 1 }
}
```

Decision node options are derived from outgoing edge labels.
