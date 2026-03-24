// ─── Config ───────────────────────────────────────────────────────────────────

const TYPE_CONFIG = {
  Database: { color: '#2659FF', glow: '#00D5FF', icon: 'DB',  label: 'Datenbank' },
  Tool:     { color: '#0099BB', glow: '#00D5FF', icon: 'T',   label: 'Tool'      },
  AI:       { color: '#9630FF', glow: '#C929FF', icon: 'AI',  label: 'AI'        },
  Pipeline: { color: '#00D5FF', glow: '#2659FF', icon: 'PL',  label: 'Pipeline'  },
  Report:   { color: '#C929FF', glow: '#9630FF', icon: 'R',   label: 'Report'    },
  Project:  { color: '#0D2880', glow: '#2659FF', icon: 'P',   label: 'Projekt'   },
  Agent:    { color: '#FF4DA6', glow: '#C929FF', icon: 'AG',  label: 'Agent'     },
  Other:    { color: '#6B7280', glow: '#9CA3AF', icon: '?',   label: 'Sonstiges' },
};

// Teams ordered top→bottom for Y-axis layout
const TEAM_ORDER = ['Data', 'Tech', 'Product', 'Editorial', 'BI', 'CDT', 'Research', 'SEO', 'Uniq'];
const TEAM_CONFIG = {
  'Data':     { color: '#2659FF' },
  'Tech':     { color: '#9630FF' },
  'Product':  { color: '#00C896' },
  'Editorial':{ color: '#00D5FF' },
  'BI':       { color: '#0D2880' },
  'CDT':      { color: '#FF8C00' },
  'Research': { color: '#C929FF' },
  'SEO':      { color: '#4CAF50' },
  'Uniq':     { color: '#FF6B35' },
};

const STATUS_LABEL = {
  active:     'Aktiv',
  planned:    'Geplant',
  deprecated: 'Veraltet',
};

const NODE_RADIUS = 24; // fallback only
const STORAGE_KEY = '20min_data_landscape';

function getRadius(d) {
  const r = d.relevance || 3;
  return 10 + r * 5; // 1→15, 2→20, 3→25, 4→30, 5→35
}
const DATA_VERSION = '2026-03-23c'; // bump to reset localStorage on next load

// Auto-reset if data version has changed
if (localStorage.getItem(STORAGE_KEY + '_version') !== DATA_VERSION) {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.setItem(STORAGE_KEY + '_version', DATA_VERSION);
}

// ─── State ────────────────────────────────────────────────────────────────────

let graphData = { nodes: [], edges: [] };
let selectedNode = null;
let editingNodeId = null; // null = add mode, string = edit mode
let currentFilter = 'all';
let currentTeamFilter = 'all';
let simulation, svg, zoomGroup, hullLayer, linkLayer, nodeLayer, zoom;
let width, height;
let ctxEdge = null; // edge currently in context menu

// ─── Entry point ──────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  loadData();
  initGraph();
  setupEventListeners();
  renderFilterButtons();
  renderTeamFilterButtons();
  renderGraph();
  renderLegend();
});

// ─── Persistence ──────────────────────────────────────────────────────────────

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      graphData = JSON.parse(saved);
      return;
    }
  } catch (_) {}
  graphData = JSON.parse(JSON.stringify(SEED_DATA));
}

function saveData() {
  // Persist node positions
  const nodes = nodeLayer ? nodeLayer.selectAll('.node').data() : [];
  nodes.forEach(d => {
    const n = graphData.nodes.find(n => n.id === d.id);
    if (n) { n._x = d.x; n._y = d.y; }
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(graphData));
}

// ─── Graph init ───────────────────────────────────────────────────────────────

function initGraph() {
  const wrap = document.getElementById('graph-wrap');
  width  = wrap.clientWidth;
  height = wrap.clientHeight;

  svg = d3.select('#graph-wrap').append('svg')
    .attr('width', '100%').attr('height', '100%');

  // Arrow marker
  const defs = svg.append('defs');
  defs.append('marker')
    .attr('id', 'arrow')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 8).attr('refY', 0)
    .attr('orient', 'auto')
    .attr('markerWidth', 7).attr('markerHeight', 7)
    .append('path').attr('d', 'M0,-5L10,0L0,5').attr('fill', '#484f58');

  // Background click to deselect
  svg.append('rect')
    .attr('width', '100%').attr('height', '100%')
    .attr('fill', 'transparent')
    .on('click', () => { closeDetailPanel(); hideCtxMenu(); });

  zoom = d3.zoom().scaleExtent([0.15, 4])
    .on('zoom', e => zoomGroup.attr('transform', e.transform));
  svg.call(zoom);

  zoomGroup  = svg.append('g').attr('class', 'zoom-group');
  hullLayer  = zoomGroup.append('g').attr('class', 'hulls');
  linkLayer  = zoomGroup.append('g').attr('class', 'links');
  nodeLayer  = zoomGroup.append('g').attr('class', 'nodes');

  const TYPE_X  = { Pipeline: 0.10, Database: 0.28, Tool: 0.48, AI: 0.70, Report: 0.88 };
  const TEAM_Y_FRAC = {};
  TEAM_ORDER.forEach((t, i) => { TEAM_Y_FRAC[t] = 0.10 + i * (0.82 / (TEAM_ORDER.length - 1)); });

  function targetX(d) { return width  * (TYPE_X[d.type] ?? 0.5); }
  function targetY(d) {
    const ys = (d.teams || []).map(t => TEAM_Y_FRAC[t] ?? 0.5);
    return height * (ys.length ? ys.reduce((a, b) => a + b) / ys.length : 0.5);
  }

  simulation = d3.forceSimulation()
    .force('link',      d3.forceLink().id(d => d.id).distance(120).strength(0.3))
    .force('charge',    d3.forceManyBody().strength(-60).distanceMax(150))
    .force('x',         d3.forceX(targetX).strength(0.7))
    .force('y',         d3.forceY(targetY).strength(0.7))
    .force('collision', d3.forceCollide().radius(d => getRadius(d) + 20))
    .on('tick', ticked);

  window.addEventListener('resize', () => {
    width  = wrap.clientWidth;
    height = wrap.clientHeight;
    simulation.force('x', d3.forceX(targetX).strength(0.7));
    simulation.force('y', d3.forceY(targetY).strength(0.7));
  });
}

// ─── Render ───────────────────────────────────────────────────────────────────

function getFilteredNodes() {
  let nodes = graphData.nodes;
  if (currentFilter !== 'all') {
    nodes = nodes.filter(n => n.type === currentFilter);
  }
  if (currentTeamFilter !== 'all') {
    nodes = nodes.filter(n => (n.teams || []).includes(currentTeamFilter));
  }
  const q = document.getElementById('search').value.trim().toLowerCase();
  if (q) {
    nodes = nodes.filter(n =>
      n.label.toLowerCase().includes(q) ||
      (n.owner   || '').toLowerCase().includes(q) ||
      (n.tenant  || '').toLowerCase().includes(q) ||
      (n.tags    || []).some(t => t.toLowerCase().includes(q)) ||
      (n.projects|| []).some(p => p.toLowerCase().includes(q))
    );
  }
  return nodes;
}

function renderGraph() {
  const filteredNodes = getFilteredNodes();
  const filteredIds   = new Set(filteredNodes.map(n => n.id));
  const filteredEdges = graphData.edges.filter(e => {
    const src = e.source?.id ?? e.source;
    const tgt = e.target?.id ?? e.target;
    return filteredIds.has(src) && filteredIds.has(tgt);
  });

  // ── Links ──
  const linkSel = linkLayer.selectAll('.link')
    .data(filteredEdges, d => d.id)
    .join(
      enter => {
        const g = enter.append('g').attr('class', 'link');
        g.append('path').attr('class', 'link-path').attr('marker-end', 'url(#arrow)');
        g.append('path').attr('class', 'link-hit'); // transparent wide hit area
        g.on('click', (event, d) => { event.stopPropagation(); showCtxMenu(event, d); });
        g.on('mouseover', (event, d) => { if (d.label) showEdgeTooltip(event, d); });
        g.on('mousemove', (event) => moveTooltip(event));
        g.on('mouseout', hideTooltip);
        return g;
      },
      update => update,
      exit   => exit.remove()
    );

  // ── Nodes ──
  const nodeSel = nodeLayer.selectAll('.node')
    .data(filteredNodes, d => d.id)
    .join(
      enter => {
        const g = enter.append('g')
          .attr('class', 'node')
          .call(applyNodeVisuals)
          .call(applyNodeInteractions);
        // Restore saved positions and pin them so forceX/Y can't move them
        g.each(d => {
          if (d._x != null) { d.x = d._x; d.y = d._y; d.fx = d._x; d.fy = d._y; }
        });
        return g;
      },
      update => update.call(refreshNodeVisuals),
      exit   => exit.remove()
    );

  simulation.nodes(filteredNodes);
  simulation.force('link').links(filteredEdges);
  simulation.alpha(0.4).restart();

  // Empty state
  document.getElementById('empty-state').style.display =
    filteredNodes.length === 0 ? 'flex' : 'none';
}

function applyNodeVisuals(selection) {
  // Glow halo
  selection.append('circle').attr('class', 'node-glow')
    .attr('r', d => getRadius(d) + 8)
    .attr('fill', d => getType(d).color)
    .attr('opacity', 0);

  // Main circle
  selection.append('circle').attr('class', 'node-circle')
    .attr('r', d => getRadius(d))
    .attr('fill', d => getType(d).color)
    .attr('stroke', d => getType(d).glow)
    .attr('stroke-width', 2);

  // Status dot
  selection.append('circle').attr('class', 'node-status')
    .attr('r', 5)
    .attr('cx', d => getRadius(d) - 4)
    .attr('cy', d => -(getRadius(d) - 4))
    .attr('fill', d => statusColor(d.status))
    .attr('stroke', '#0a0f1e').attr('stroke-width', 1.5);

  // Icon
  selection.append('text').attr('class', 'node-icon')
    .attr('text-anchor', 'middle').attr('dominant-baseline', 'central')
    .attr('y', 0)
    .text(d => getType(d).icon);

  // Label
  selection.append('text').attr('class', 'node-label')
    .attr('text-anchor', 'middle')
    .attr('y', d => getRadius(d) + 14)
    .text(d => trunc(d.label, 20));

}

function refreshNodeVisuals(selection) {
  selection.select('.node-glow').attr('r', d => getRadius(d) + 8);
  selection.select('.node-circle')
    .attr('r', d => getRadius(d))
    .attr('fill', d => getType(d).color)
    .attr('stroke', d => getType(d).glow);
  selection.select('.node-status')
    .attr('cx', d => getRadius(d) - 4)
    .attr('cy', d => -(getRadius(d) - 4))
    .attr('fill', d => statusColor(d.status));
  selection.select('.node-icon').text(d => getType(d).icon);
  selection.select('.node-label')
    .attr('y', d => getRadius(d) + 14)
    .text(d => trunc(d.label, 20));
}

function applyNodeInteractions(selection) {
  selection
    .style('cursor', 'pointer')
    .on('mouseover', function(event, d) {
      d3.select(this).select('.node-glow').transition().duration(150).attr('opacity', 0.35);
      d3.select(this).select('.node-circle').transition().duration(150).attr('r', getRadius(d) + 3);
      showTooltip(event, d);

      if (!selectedNode) {
        const connIds = new Set([d.id]);
        graphData.edges.forEach(e => {
          const s = e.source?.id ?? e.source;
          const t = e.target?.id ?? e.target;
          if (s === d.id) connIds.add(t);
          if (t === d.id) connIds.add(s);
        });
        nodeLayer.selectAll('.node').classed('faded', n => !connIds.has(n.id));
        linkLayer.selectAll('.link').classed('faded', e => {
          const s = e.source?.id ?? e.source;
          const t = e.target?.id ?? e.target;
          return s !== d.id && t !== d.id;
        });
      }
    })
    .on('mousemove', function(event) {
      moveTooltip(event);
    })
    .on('mouseout', function(_, d) {
      d3.select(this).select('.node-glow').transition().duration(200).attr('opacity', 0);
      d3.select(this).select('.node-circle').transition().duration(200).attr('r', getRadius(d));
      hideTooltip();

      if (!selectedNode) {
        nodeLayer.selectAll('.node').classed('faded', false);
        linkLayer.selectAll('.link').classed('faded', false);
      }
    })
    .on('click', function(event, d) {
      event.stopPropagation();
      hideCtxMenu();
      selectNode(d);
    })
    .call(d3.drag()
      .on('start', (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x; d.fy = d.y;
      })
      .on('drag', (event, d) => {
        d.fx = event.x; d.fy = event.y;
        d.x  = event.x; d.y  = event.y;
        ticked();
      })
      .on('end',  (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d._x = d.fx; d._y = d.fy;
        saveData();
      })
    );
}

function ticked() {
  // Build position lookup directly from graphData so drag updates are always reflected
  const pos = new Map(graphData.nodes.map(n => [n.id, n]));

  linkLayer.selectAll('.link').each(function(d) {
    const srcId = d.source?.id ?? d.source;
    const tgtId = d.target?.id ?? d.target;
    const src = pos.get(srcId);
    const tgt = pos.get(tgtId);
    if (!src || !tgt || src.x == null || tgt.x == null) return;

    const sx = src.x, sy = src.y;
    const tx = tgt.x, ty = tgt.y;
    const dx = tx - sx, dy = ty - sy;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const ux = dx / len, uy = dy / len;
    const bufS = getRadius(src) + 4;
    const bufT = getRadius(tgt) + 4;
    const x1 = sx + ux * bufS, y1 = sy + uy * bufS;
    const x2 = tx - ux * bufT, y2 = ty - uy * bufT;

    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    const curve = Math.min(len * 0.22, 55);
    const cx = mx - uy * curve, cy = my + ux * curve;
    const pathD = `M${x1},${y1} Q${cx},${cy} ${x2},${y2}`;

    d3.select(this).select('.link-path').attr('d', pathD);
    d3.select(this).select('.link-hit').attr('d', pathD);
  });

  nodeLayer.selectAll('.node')
    .attr('transform', d => `translate(${d.x ?? 0},${d.y ?? 0})`);

}

function teamHullPath(nodes, pad = 45) {
  const valid = nodes.filter(n => n.x != null);
  if (valid.length === 0) return '';
  const pts = [];
  valid.forEach(n => {
    const r = getRadius(n) + pad;
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
      pts.push([n.x + Math.cos(a) * r, n.y + Math.sin(a) * r]);
    }
  });
  if (pts.length < 3) return '';
  const hull = d3.polygonHull(pts);
  if (!hull) return '';
  return `M${hull.map(p => p.join(',')).join('L')}Z`;
}

// ─── Selection ────────────────────────────────────────────────────────────────

function selectNode(d) {
  selectedNode = d;
  nodeLayer.selectAll('.node')
    .classed('selected', n => n.id === d.id)
    .classed('dimmed',   n => n.id !== d.id);
  openDetailPanel(d);
}

function clearSelection() {
  selectedNode = null;
  nodeLayer.selectAll('.node').classed('selected', false).classed('dimmed', false).classed('faded', false);
  linkLayer.selectAll('.link').classed('faded', false);
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────

function openDetailPanel(d) {
  const cfg  = getType(d);
  const panel = document.getElementById('detail-panel');

  document.getElementById('detail-name').textContent = d.label;

  const typeBadge = document.getElementById('detail-type-badge');
  typeBadge.textContent = cfg.label;
  typeBadge.style.background = cfg.color;

  const stBadge = document.getElementById('detail-status-badge');
  stBadge.textContent = STATUS_LABEL[d.status] || d.status;
  stBadge.className = 'badge badge-status-' + (d.status || 'active');

  document.getElementById('detail-owner').textContent  = d.owner  || '—';
  document.getElementById('detail-tenant').textContent = d.tenant || '—';
  document.getElementById('detail-teams').textContent  = (d.teams || []).join(', ') || '—';

  const urlRow = document.getElementById('detail-url-row');
  const urlEl  = document.getElementById('detail-url');
  if (d.url) {
    urlRow.style.display = 'flex';
    urlEl.href = d.url;
    urlEl.textContent = d.url;
  } else {
    urlRow.style.display = 'none';
  }

  const descEl = document.getElementById('detail-description');
  descEl.textContent = d.description || '';
  document.getElementById('desc-section').style.display = d.description ? '' : 'none';

  const tagsEl = document.getElementById('detail-tags');
  tagsEl.innerHTML = '';
  (d.tags || []).forEach(t => {
    const s = document.createElement('span');
    s.className = 'tag'; s.textContent = t;
    tagsEl.appendChild(s);
  });
  document.getElementById('tags-section').style.display = (d.tags || []).length ? '' : 'none';

  // Projects
  const projEl = document.getElementById('detail-projects');
  projEl.innerHTML = '';
  (d.projects || []).forEach(p => {
    const s = document.createElement('span');
    s.className = 'tag tag-project'; s.textContent = p;
    projEl.appendChild(s);
  });
  document.getElementById('projects-section').style.display = (d.projects || []).length ? '' : 'none';

  // Connections
  const connEl = document.getElementById('detail-connections');
  connEl.innerHTML = '';
  const related = [];
  graphData.edges.forEach(e => {
    const src = e.source?.id ?? e.source;
    const tgt = e.target?.id ?? e.target;
    if (src === d.id) {
      const other = graphData.nodes.find(n => n.id === tgt);
      if (other) related.push({ node: other, dir: 'out', label: e.label || '', eid: e.id });
    }
    if (tgt === d.id) {
      const other = graphData.nodes.find(n => n.id === src);
      if (other) related.push({ node: other, dir: 'in', label: e.label || '', eid: e.id });
    }
  });
  if (related.length === 0) {
    connEl.innerHTML = '<span style="color:var(--text-dim);font-size:13px">Keine Verbindungen</span>';
  } else {
    related.forEach(({ node, dir, label, eid }) => {
      const item = document.createElement('div');
      item.className = 'conn-item';
      item.innerHTML = `
        <span class="conn-dot" style="background:${getType(node).color}"></span>
        <div class="conn-info">
          <div class="conn-name">${dir === 'out' ? '→' : '←'} ${esc(node.label)}</div>
          <div class="conn-rel">${esc(label)}</div>
        </div>
        <button title="Verbindung löschen" onclick="deleteEdge('${eid}');event.stopPropagation()"
          style="background:none;border:none;color:var(--text-dim);cursor:pointer;padding:2px 4px;font-size:14px;line-height:1;border-radius:3px"
          onmouseover="this.style.color='var(--danger)'" onmouseout="this.style.color='var(--text-dim)'">✕</button>
      `;
      item.addEventListener('click', () => {
        const sim = nodeLayer.selectAll('.node').data().find(n => n.id === node.id);
        if (sim) selectNode(sim);
        else { const nd = graphData.nodes.find(n => n.id === node.id); if (nd) openDetailPanel(nd); }
      });
      connEl.appendChild(item);
    });
  }

  panel.classList.add('open');
}

function closeDetailPanel() {
  document.getElementById('detail-panel').classList.remove('open');
  clearSelection();
}

function editSelectedNode() {
  if (selectedNode) openNodeModal(selectedNode);
}

function deleteSelectedNode() {
  if (!selectedNode) return;
  if (!confirm(`"${selectedNode.label}" wirklich löschen?`)) return;
  deleteNode(selectedNode.id);
  closeDetailPanel();
}

// ─── Node Modal ───────────────────────────────────────────────────────────────

function openNodeModal(node) {
  editingNodeId = node ? node.id : null;
  document.getElementById('node-modal-title').textContent =
    node ? 'Element bearbeiten' : 'Element hinzufügen';

  document.getElementById('f-label').value       = node?.label        || '';
  document.getElementById('f-type').value        = node?.type         || 'Tool';
  document.getElementById('f-status').value      = node?.status       || 'active';
  document.getElementById('f-owner').value       = node?.owner        || '';
  document.getElementById('f-tenant').value      = node?.tenant       || '20 Minuten';
  document.getElementById('f-description').value = node?.description  || '';
  document.getElementById('f-url').value         = node?.url          || '';
  document.getElementById('f-projects').value    = (node?.projects || []).join(', ');
  document.getElementById('f-tags').value        = (node?.tags || []).join(', ');

  document.getElementById('node-modal-overlay').classList.add('open');
  setTimeout(() => document.getElementById('f-label').focus(), 50);
}

function closeNodeModal() {
  document.getElementById('node-modal-overlay').classList.remove('open');
  editingNodeId = null;
}

function saveNode() {
  const label = document.getElementById('f-label').value.trim();
  const owner = document.getElementById('f-owner').value.trim();
  if (!label) { shakeField('f-label'); return; }
  if (!owner) { shakeField('f-owner'); return; }

  const tags     = document.getElementById('f-tags').value.split(',').map(t => t.trim()).filter(Boolean);
  const projects = document.getElementById('f-projects').value.split(',').map(t => t.trim()).filter(Boolean);

  const data = {
    label,
    type:        document.getElementById('f-type').value,
    status:      document.getElementById('f-status').value,
    owner,
    tenant:      document.getElementById('f-tenant').value.trim(),
    description: document.getElementById('f-description').value.trim(),
    url:         document.getElementById('f-url').value.trim(),
    projects,
    tags,
  };

  if (editingNodeId) {
    const idx = graphData.nodes.findIndex(n => n.id === editingNodeId);
    if (idx !== -1) Object.assign(graphData.nodes[idx], data);
    toast(`"${label}" aktualisiert`);
    // Refresh detail panel if still open
    if (selectedNode?.id === editingNodeId) {
      const updated = graphData.nodes[idx];
      openDetailPanel(updated);
      // keep simulation data in sync
      const simNode = nodeLayer.selectAll('.node').data().find(n => n.id === editingNodeId);
      if (simNode) Object.assign(simNode, data);
    }
  } else {
    const id = 'n' + Date.now();
    graphData.nodes.push({ id, ...data });
    toast(`"${label}" hinzugefügt`);
  }

  saveData();
  closeNodeModal();
  renderGraph();
  renderFilterButtons();
}

function deleteNode(id) {
  graphData.nodes  = graphData.nodes.filter(n => n.id !== id);
  graphData.edges  = graphData.edges.filter(e => {
    const s = e.source?.id ?? e.source;
    const t = e.target?.id ?? e.target;
    return s !== id && t !== id;
  });
  saveData();
  renderGraph();
  renderFilterButtons();
  toast('Element gelöscht');
}

// ─── Edge Modal ───────────────────────────────────────────────────────────────

function openEdgeModal(preSourceId) {
  populateNodeSelects(preSourceId);
  document.getElementById('f-edge-label').value = '';
  document.getElementById('f-edge-type').value  = 'data-flow';
  document.getElementById('edge-modal-overlay').classList.add('open');
}

function openEdgeModalFromNode() {
  if (selectedNode) openEdgeModal(selectedNode.id);
  else openEdgeModal();
}

function closeEdgeModal() {
  document.getElementById('edge-modal-overlay').classList.remove('open');
}

function populateNodeSelects(preSourceId) {
  const nodes = graphData.nodes.slice().sort((a, b) => a.label.localeCompare(b.label));
  ['f-source', 'f-target'].forEach((id, idx) => {
    const sel = document.getElementById(id);
    sel.innerHTML = nodes.map(n =>
      `<option value="${n.id}">${n.label} (${getType(n).label})</option>`
    ).join('');
    if (idx === 0 && preSourceId) sel.value = preSourceId;
  });
}

function saveEdge() {
  const src   = document.getElementById('f-source').value;
  const tgt   = document.getElementById('f-target').value;
  const label = document.getElementById('f-edge-label').value.trim();
  const type  = document.getElementById('f-edge-type').value;

  if (!src || !tgt) return;
  if (src === tgt) { toast('Quelle und Ziel dürfen nicht gleich sein', true); return; }

  const exists = graphData.edges.some(e => {
    const s = e.source?.id ?? e.source;
    const t = e.target?.id ?? e.target;
    return s === src && t === tgt;
  });
  if (exists) { toast('Verbindung existiert bereits', true); return; }

  graphData.edges.push({ id: 'e' + Date.now(), source: src, target: tgt, label, type });
  saveData();
  closeEdgeModal();
  renderGraph();

  // Refresh panel if relevant
  if (selectedNode && (selectedNode.id === src || selectedNode.id === tgt)) {
    openDetailPanel(selectedNode);
  }
  toast('Verbindung erstellt');
}

function deleteEdge(id) {
  graphData.edges = graphData.edges.filter(e => e.id !== id);
  saveData();
  renderGraph();
  if (selectedNode) openDetailPanel(selectedNode);
  toast('Verbindung gelöscht');
}

// ─── Context menu (edge right-click) ─────────────────────────────────────────

function showCtxMenu(event, edge) {
  ctxEdge = edge;
  const menu = document.getElementById('ctx-menu');
  menu.style.display = 'block';
  menu.style.left = event.pageX + 'px';
  menu.style.top  = event.pageY + 'px';
}

function hideCtxMenu() {
  document.getElementById('ctx-menu').style.display = 'none';
  ctxEdge = null;
}

document.getElementById('ctx-delete').addEventListener('click', () => {
  if (ctxEdge) deleteEdge(ctxEdge.id);
  hideCtxMenu();
});
document.getElementById('ctx-info').addEventListener('click', () => {
  if (ctxEdge) {
    const src = ctxEdge.source?.id ?? ctxEdge.source;
    const nd  = graphData.nodes.find(n => n.id === src);
    if (nd) {
      const sim = nodeLayer.selectAll('.node').data().find(n => n.id === nd.id);
      if (sim) selectNode(sim); else openDetailPanel(nd);
    }
  }
  hideCtxMenu();
});

document.addEventListener('click', () => hideCtxMenu());

// ─── Filters ──────────────────────────────────────────────────────────────────

function renderFilterButtons() {
  const row = document.getElementById('filter-row');
  const used = new Set(graphData.nodes.map(n => n.type));
  const current = row.querySelector('.active')?.dataset.type || 'all';

  row.innerHTML = '<button class="filter-btn' + (currentFilter === 'all' ? ' active' : '') +
    '" data-type="all">Alle (' + graphData.nodes.length + ')</button>';

  Object.entries(TYPE_CONFIG).forEach(([type, cfg]) => {
    if (!used.has(type)) return;
    const count = graphData.nodes.filter(n => n.type === type).length;
    const btn = document.createElement('button');
    btn.className = 'filter-btn' + (currentFilter === type ? ' active' : '');
    btn.dataset.type = type;
    btn.innerHTML = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${cfg.color};margin-right:5px;vertical-align:middle"></span>${cfg.label} (${count})`;
    row.appendChild(btn);
  });

  row.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentFilter = btn.dataset.type;
      row.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderGraph();
    });
  });
}

function renderTeamFilterButtons() {
  const row = document.getElementById('team-filter-row');
  row.innerHTML = '<button class="filter-btn' + (currentTeamFilter === 'all' ? ' active' : '') +
    '" data-team="all">Alle Teams</button>';

  TEAM_ORDER.forEach(team => {
    const cfg = TEAM_CONFIG[team];
    if (!cfg) return;
    const count = graphData.nodes.filter(n => (n.teams || []).includes(team)).length;
    if (count === 0) return;
    const btn = document.createElement('button');
    btn.className = 'filter-btn' + (currentTeamFilter === team ? ' active' : '');
    btn.dataset.team = team;
    btn.innerHTML = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${cfg.color};margin-right:5px;vertical-align:middle"></span>${team} (${count})`;
    row.appendChild(btn);
  });

  row.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentTeamFilter = btn.dataset.team;
      row.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderGraph();
    });
  });
}

function renderLegend() {
  const el = document.getElementById('legend');
  el.innerHTML = Object.entries(TYPE_CONFIG).map(([_, cfg]) =>
    `<div class="legend-row">
      <span class="legend-dot" style="background:${cfg.color}"></span>
      <span>${cfg.label}</span>
    </div>`
  ).join('');
}

// ─── Search ───────────────────────────────────────────────────────────────────

document.getElementById('search').addEventListener('input', () => renderGraph());

// ─── Keyboard shortcuts ───────────────────────────────────────────────────────

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeNodeModal();
    closeEdgeModal();
    closeDetailPanel();
    hideCtxMenu();
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
    e.preventDefault();
    openNodeModal(null);
  }
});

// ─── Event listeners ─────────────────────────────────────────────────────────

function setupEventListeners() {
  document.getElementById('import-input').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const imported = JSON.parse(ev.target.result);
        if (!Array.isArray(imported.nodes) || !Array.isArray(imported.edges))
          throw new Error('Ungültiges Format');
        graphData = imported;
        saveData();
        renderGraph();
        renderFilterButtons();
        toast('Daten importiert (' + imported.nodes.length + ' Elemente)');
      } catch (err) {
        toast('Fehler beim Import: ' + err.message, true);
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  });
}

function handleOverlayClick(event, overlayId) {
  if (event.target.id === overlayId) {
    if (overlayId === 'node-modal-overlay') closeNodeModal();
    if (overlayId === 'edge-modal-overlay') closeEdgeModal();
  }
}

// ─── Export / Import ──────────────────────────────────────────────────────────

function exportData() {
  // Clean positions out for export
  const exportable = {
    nodes: graphData.nodes.map(({ _x, _y, ...rest }) => rest),
    edges: graphData.edges.map(e => ({
      id: e.id,
      source: e.source?.id ?? e.source,
      target: e.target?.id ?? e.target,
      label: e.label,
      type: e.type,
    })),
  };
  const blob = new Blob([JSON.stringify(exportable, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = '20min_data_landscape.json';
  a.click();
  URL.revokeObjectURL(url);
  toast('Exportiert');
}

function triggerImport() {
  document.getElementById('import-input').click();
}

// ─── Reset to seed data ───────────────────────────────────────────────────────

function resetToSeed() {
  if (!confirm('Alle lokalen Änderungen verwerfen und Standarddaten laden?')) return;
  localStorage.removeItem(STORAGE_KEY);
  graphData = JSON.parse(JSON.stringify(SEED_DATA));
  selectedNode = null;
  currentFilter = 'all';
  closeDetailPanel();
  renderGraph();
  renderFilterButtons();
  svg.transition().duration(600).call(zoom.transform, d3.zoomIdentity);
  toast('Standarddaten geladen');
}

// ─── Reset layout ─────────────────────────────────────────────────────────────

function resetLayout() {
  // Clear fixed positions
  graphData.nodes.forEach(n => { delete n._x; delete n._y; });
  nodeLayer.selectAll('.node').each(d => { d.fx = null; d.fy = null; delete d._x; delete d._y; });
  simulation.alpha(1).restart();
  svg.transition().duration(600).call(zoom.transform, d3.zoomIdentity);
  saveData();
}

// ─── Type preview in form ─────────────────────────────────────────────────────

function updateTypePreview() {
  // Could add color dot preview — no-op for now, select handles it
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────

function showTooltip(event, d) {
  const projects = d.projects || [];
  if (projects.length === 0) return;
  const el = document.getElementById('node-tooltip');
  el.innerHTML =
    `<div class="tt-title">${esc(d.label)}</div>` +
    projects.map(p => `<div class="tt-item">• ${esc(p)}</div>`).join('');
  el.style.display = 'block';
  moveTooltip(event);
}

function moveTooltip(event) {
  const el = document.getElementById('node-tooltip');
  if (el.style.display === 'none') return;
  const x = event.clientX + 16;
  const y = event.clientY - 10;
  el.style.left = Math.min(x, window.innerWidth - el.offsetWidth - 16) + 'px';
  el.style.top  = y + 'px';
}

function hideTooltip() {
  document.getElementById('node-tooltip').style.display = 'none';
}

function showEdgeTooltip(event, d) {
  const el = document.getElementById('node-tooltip');
  el.innerHTML = `<div class="tt-item">${esc(d.label)}</div>`;
  el.style.display = 'block';
  moveTooltip(event);
}

// ─── Toast ────────────────────────────────────────────────────────────────────

let toastTimer;
function toast(msg, isError = false) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.style.borderColor = isError ? 'var(--danger)' : 'var(--border)';
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2500);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getType(node) {
  return TYPE_CONFIG[node.type] || TYPE_CONFIG.Other;
}

function statusColor(s) {
  if (s === 'active')     return '#3fb950';
  if (s === 'planned')    return '#d29922';
  if (s === 'deprecated') return '#da3633';
  return '#484f58';
}

function trunc(str, n) {
  return str && str.length > n ? str.slice(0, n - 1) + '…' : str;
}

function esc(str) {
  return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function shakeField(id) {
  const el = document.getElementById(id);
  el.style.borderColor = 'var(--danger)';
  el.focus();
  setTimeout(() => el.style.borderColor = '', 1500);
}
