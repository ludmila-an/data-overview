# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

A self-contained, browser-only interactive dashboard for visualizing the data landscape of 20 Minuten. No build step, no server, no dependencies to install — open `index.html` directly in a browser.

## File structure

| File | Purpose |
|------|---------|
| `index.html` | App shell: all HTML markup, embedded CSS, and CDN script tags (D3.js v7, Google Fonts) |
| `app.js` | All JavaScript: D3 force graph, CRUD operations, localStorage persistence, filters |
| `data.js` | Seed data as `const SEED_DATA = { nodes, edges }` — loaded once if localStorage is empty |

## Running locally

```
open index.html      # macOS
xdg-open index.html  # Linux
# or drag the file into any modern browser
```

No `file://` CORS issues — scripts load via `<script src>` tags, not `fetch()`.

## Architecture

- **State**: `graphData = { nodes[], edges[] }` in memory; persisted to `localStorage` under key `20min_data_landscape`.
- **D3 force simulation**: nodes are `<g class="node">` elements inside an SVG with zoom/pan via `d3.zoom()`. The simulation runs `forceLink`, `forceManyBody`, `forceCenter`, and `forceCollide`.
- **`renderGraph()`**: the single re-render function. Call this after any mutation to `graphData`. It uses D3's `.join()` pattern with `filteredNodes` and `filteredEdges` (respecting current filter + search query).
- **Node positions** are stored as `_x`/`_y` on each node object in `graphData` and in `localStorage` after drag-end. On next load, `d.x = d._x` restores the saved layout.
- **Detail panel** is populated by `openDetailPanel(d)` — reads from `graphData` directly, not from the D3 simulation data.
- **Modals** (add/edit node, add edge) are plain HTML `<div class="modal-overlay">` toggled with `.open` class.

## Node data model

```js
{
  id: string,          // generated via Date.now()
  label: string,
  type: 'Database' | 'Tool' | 'Project' | 'AI' | 'Pipeline' | 'Report' | 'Other',
  status: 'active' | 'planned' | 'deprecated',
  owner: string,       // responsible person
  team: string,
  description: string,
  url: string,
  tags: string[],
  _x: number,          // persisted position (optional)
  _y: number,
}
```

## Edge data model

```js
{
  id: string,
  source: string,      // node id (D3 replaces with object reference during simulation)
  target: string,
  label: string,
  type: 'data-flow' | 'dependency' | 'integration' | 'ownership',
}
```

## Extending

- **Add a new node type**: add an entry to `TYPE_CONFIG` in `app.js` and a matching `<option>` in the `#f-type` select in `index.html`.
- **Seed data**: edit `data.js` — only used when localStorage has no saved state. To reset to seed, clear `localStorage.removeItem('20min_data_landscape')` in the browser console.
- **Styling**: CSS variables are defined in `:root` in `index.html`. Colors are `--c-database`, `--c-tool`, etc. (informational only — actual colors come from `TYPE_CONFIG` in `app.js`).
