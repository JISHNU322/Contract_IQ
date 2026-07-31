import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent, WheelEvent as ReactWheelEvent } from "react";
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import type { GraphData, GraphNode } from "../types";

interface SimNode extends GraphNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  fx: number | null; // pinned position while dragging
  fy: number | null;
}

const NODE_COLORS: Record<string, string> = {
  Contract: "#2E3A8C",
  Clause: "#0F766E",
  ORG: "#4338CA",
  PERSON: "#7C3AED",
  DATE: "#2563EB",
  MONEY: "#059669",
  GPE: "#E11D48",
};

const NODE_RADIUS: Record<string, number> = {
  Contract: 22,
  Clause: 10,
  ORG: 9,
  PERSON: 9,
  DATE: 8,
  MONEY: 9,
  GPE: 8,
};

const TYPE_FILTERS = [
  { type: "Contract", label: "Contract" },
  { type: "ORG", label: "Organization" },
  { type: "PERSON", label: "Person" },
  { type: "DATE", label: "Date" },
  { type: "MONEY", label: "Money" },
  { type: "GPE", label: "Location" },
  { type: "Clause", label: "Clause" },
];

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

export function GraphCanvas({ data }: { data: GraphData }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dims, setDims] = useState({ width: 800, height: 560 });

  const [hiddenTypes, setHiddenTypes] = useState<Set<string>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
  const panState = useRef<{ active: boolean; startX: number; startY: number; startTx: number; startTy: number }>({
    active: false,
    startX: 0,
    startY: 0,
    startTx: 0,
    startTy: 0,
  });

  const filteredData = useMemo(() => {
    if (hiddenTypes.size === 0) return data;
    const visibleIds = new Set(
      data.nodes.filter((n) => !hiddenTypes.has(n.type)).map((n) => n.id)
    );
    return {
      nodes: data.nodes.filter((n) => visibleIds.has(n.id)),
      edges: data.edges.filter((e) => visibleIds.has(e.source) && visibleIds.has(e.target)),
    };
  }, [data, hiddenTypes]);

  // Simulation state lives in a ref so the physics loop doesn't fight React's
  // render cycle - we only push to React state once per animation frame.
  const nodesRef = useRef<SimNode[]>([]);
  const [renderNodes, setRenderNodes] = useState<SimNode[]>([]);
  const draggingId = useRef<string | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setDims({ width: entry.contentRect.width, height: 560 });
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // (Re)initialize node positions whenever the visible node set changes
  useEffect(() => {
    const cx = dims.width / 2;
    const cy = dims.height / 2;
    const prevById = new Map(nodesRef.current.map((n) => [n.id, n]));

    nodesRef.current = filteredData.nodes.map((n, i) => {
      const existing = prevById.get(n.id);
      if (existing) return { ...existing, label: n.label, type: n.type };
      const angle = (i / Math.max(filteredData.nodes.length, 1)) * Math.PI * 2;
      return {
        ...n,
        x: cx + Math.cos(angle) * 140,
        y: cy + Math.sin(angle) * 140,
        vx: 0,
        vy: 0,
        fx: null,
        fy: null,
      };
    });
    setRenderNodes([...nodesRef.current]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredData, dims.width, dims.height]);

  // Continuous physics loop
  useEffect(() => {
    const cx = dims.width / 2;
    const cy = dims.height / 2;

    function tick() {
      const nodes = nodesRef.current;

      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        if (a.fx !== null) continue;
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const distSq = Math.max(dx * dx + dy * dy, 4);
          const force = 2600 / distSq;
          const dist = Math.sqrt(distSq);
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          a.vx += fx;
          a.vy += fy;
          if (b.fx === null) {
            b.vx -= fx;
            b.vy -= fy;
          }
        }
      }

      filteredData.edges.forEach((e) => {
        const a = nodes.find((n) => n.id === e.source);
        const b = nodes.find((n) => n.id === e.target);
        if (!a || !b) return;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = (dist - 95) * 0.02;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        if (a.fx === null) {
          a.vx += fx;
          a.vy += fy;
        }
        if (b.fx === null) {
          b.vx -= fx;
          b.vy -= fy;
        }
      });

      nodes.forEach((n) => {
        if (n.fx !== null && n.fy !== null) {
          n.x = n.fx;
          n.y = n.fy;
          n.vx = 0;
          n.vy = 0;
          return;
        }
        n.vx += (cx - n.x) * 0.0015;
        n.vy += (cy - n.y) * 0.0015;
        n.vx *= 0.82;
        n.vy *= 0.82;
        n.x += n.vx;
        n.y += n.vy;
        n.x = clamp(n.x, 20, dims.width - 20);
        n.y = clamp(n.y, 20, dims.height - 20);
      });

      setRenderNodes([...nodes]);
      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredData, dims.width, dims.height]);

  const screenToGraph = useCallback(
    (clientX: number, clientY: number) => {
      const rect = svgRef.current!.getBoundingClientRect();
      const sx = clientX - rect.left;
      const sy = clientY - rect.top;
      return { x: (sx - transform.x) / transform.k, y: (sy - transform.y) / transform.k };
    },
    [transform]
  );

  function handleNodePointerDown(e: ReactPointerEvent, nodeId: string) {
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);
    draggingId.current = nodeId;
    const node = nodesRef.current.find((n) => n.id === nodeId);
    if (node) {
      const { x, y } = screenToGraph(e.clientX, e.clientY);
      node.fx = x;
      node.fy = y;
    }
  }

  function handlePointerMove(e: ReactPointerEvent) {
    if (draggingId.current) {
      const node = nodesRef.current.find((n) => n.id === draggingId.current);
      if (node) {
        const { x, y } = screenToGraph(e.clientX, e.clientY);
        node.fx = x;
        node.fy = y;
      }
      return;
    }
    if (panState.current.active) {
      const dx = e.clientX - panState.current.startX;
      const dy = e.clientY - panState.current.startY;
      setTransform((t) => ({ ...t, x: panState.current.startTx + dx, y: panState.current.startTy + dy }));
    }
  }

  function handlePointerUp(e: ReactPointerEvent) {
    if (draggingId.current) {
      const node = nodesRef.current.find((n) => n.id === draggingId.current);
      if (node) {
        node.fx = null;
        node.fy = null;
      }
      draggingId.current = null;
    }
    panState.current.active = false;
    try {
      (e.target as Element).releasePointerCapture(e.pointerId);
    } catch {
      /* no-op */
    }
  }

  function handleBackgroundPointerDown(e: ReactPointerEvent) {
    panState.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      startTx: transform.x,
      startTy: transform.y,
    };
    setSelectedId(null);
  }

  function handleWheel(e: ReactWheelEvent) {
    e.preventDefault();
    const rect = svgRef.current!.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setTransform((t) => {
      const newK = clamp(t.k * delta, 0.35, 2.5);
      const gx = (mx - t.x) / t.k;
      const gy = (my - t.y) / t.k;
      return { k: newK, x: mx - gx * newK, y: my - gy * newK };
    });
  }

  function zoomBy(factor: number) {
    setTransform((t) => {
      const newK = clamp(t.k * factor, 0.35, 2.5);
      const cx = dims.width / 2;
      const cy = dims.height / 2;
      const gx = (cx - t.x) / t.k;
      const gy = (cy - t.y) / t.k;
      return { k: newK, x: cx - gx * newK, y: cy - gy * newK };
    });
  }

  function resetView() {
    setTransform({ x: 0, y: 0, k: 1 });
    setSelectedId(null);
  }

  function toggleType(type: string) {
    setHiddenTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }

  const nodeById = useMemo(() => new Map(renderNodes.map((n) => [n.id, n])), [renderNodes]);
  const focusId = selectedId ?? hoveredId;
  const connectedIds = useMemo(() => {
    if (!focusId) return null;
    const set = new Set<string>([focusId]);
    filteredData.edges.forEach((e) => {
      if (e.source === focusId) set.add(e.target);
      if (e.target === focusId) set.add(e.source);
    });
    return set;
  }, [focusId, filteredData.edges]);

  const selectedNode = selectedId ? nodeById.get(selectedId) : null;
  const selectedConnections = useMemo(() => {
    if (!selectedId) return [];
    return filteredData.edges
      .filter((e) => e.source === selectedId || e.target === selectedId)
      .map((e) => {
        const otherId = e.source === selectedId ? e.target : e.source;
        const other = nodeById.get(otherId);
        if (!other) return null;
        return { node: other, relation: e.relation };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  }, [selectedId, filteredData.edges, nodeById]);

  return (
    <div>
      {/* Type filter chips */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {TYPE_FILTERS.map((f) => {
          const active = !hiddenTypes.has(f.type);
          return (
            <button
              key={f.type}
              onClick={() => toggleType(f.type)}
              className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                active
                  ? "border-border-strong bg-surface text-ink"
                  : "border-border bg-canvas text-ink-faint opacity-60"
              }`}
            >
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ background: NODE_COLORS[f.type] }}
              />
              {f.label}
            </button>
          );
        })}
      </div>

      <div ref={containerRef} className="relative w-full">
        <svg
          ref={svgRef}
          width={dims.width}
          height={dims.height}
          className="rounded-card bg-canvas/40 touch-none"
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerDown={handleBackgroundPointerDown}
          onWheel={handleWheel}
        >
          <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.k})`}>
            {filteredData.edges.map((e, i) => {
              const source = nodeById.get(e.source);
              const target = nodeById.get(e.target);
              if (!source || !target) return null;
              const dimmed = connectedIds && (!connectedIds.has(e.source) || !connectedIds.has(e.target));
              return (
                <line
                  key={i}
                  x1={source.x}
                  y1={source.y}
                  x2={target.x}
                  y2={target.y}
                  stroke={e.relation === "HAS_CLAUSE" ? "#0F9488" : "#D1D1D6"}
                  strokeWidth={dimmed ? 1 : 1.6}
                  opacity={dimmed ? 0.12 : 0.65}
                />
              );
            })}
            {renderNodes.map((n) => {
              const dimmed = connectedIds && !connectedIds.has(n.id);
              const isSelected = n.id === selectedId;
              const r = NODE_RADIUS[n.type] ?? 8;
              const color = NODE_COLORS[n.type] ?? "#5B5F6B";
              return (
                <g
                  key={n.id}
                  transform={`translate(${n.x}, ${n.y})`}
                  opacity={dimmed ? 0.25 : 1}
                  style={{ cursor: "grab" }}
                  onPointerDown={(e) => handleNodePointerDown(e, n.id)}
                  onPointerEnter={() => setHoveredId(n.id)}
                  onPointerLeave={() => setHoveredId(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedId(n.id === selectedId ? null : n.id);
                  }}
                >
                  <circle
                    r={r}
                    fill={color}
                    stroke={isSelected ? "#14151A" : "#fff"}
                    strokeWidth={isSelected ? 3 : 2}
                  />
                  <text
                    y={r + 13}
                    textAnchor="middle"
                    className="fill-ink font-sans select-none"
                    fontSize={n.type === "Contract" ? 11 : 9.5}
                    fontWeight={n.type === "Contract" ? 600 : 500}
                  >
                    {n.label.length > 22 ? `${n.label.slice(0, 22)}…` : n.label}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {/* Zoom controls */}
        <div className="absolute bottom-3 right-3 flex flex-col gap-1 rounded-md border border-border bg-surface p-1 shadow-card">
          <button
            onClick={() => zoomBy(1.2)}
            className="flex h-7 w-7 items-center justify-center rounded text-ink-muted hover:bg-canvas"
            aria-label="Zoom in"
          >
            <ZoomIn size={15} />
          </button>
          <button
            onClick={() => zoomBy(0.8)}
            className="flex h-7 w-7 items-center justify-center rounded text-ink-muted hover:bg-canvas"
            aria-label="Zoom out"
          >
            <ZoomOut size={15} />
          </button>
          <button
            onClick={resetView}
            className="flex h-7 w-7 items-center justify-center rounded text-ink-muted hover:bg-canvas"
            aria-label="Reset view"
          >
            <Maximize2 size={13} />
          </button>
        </div>

        {/* Selected node inspector panel */}
        {selectedNode && (
          <div className="absolute right-3 top-3 w-64 rounded-card border border-border bg-surface p-3.5 shadow-panel">
            <div className="mb-2 flex items-center gap-2">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ background: NODE_COLORS[selectedNode.type] }}
              />
              <span className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">
                {selectedNode.type}
              </span>
            </div>
            <p className="text-sm font-semibold leading-snug">{selectedNode.label}</p>
            {selectedConnections.length > 0 && (
              <div className="mt-3 border-t border-border pt-2.5">
                <p className="mb-1.5 text-[11px] font-medium text-ink-faint">
                  {selectedConnections.length} connection
                  {selectedConnections.length > 1 ? "s" : ""}
                </p>
                <div className="max-h-40 space-y-1.5 overflow-y-auto">
                  {selectedConnections.map((c, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs">
                      <span
                        className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ background: NODE_COLORS[c.node.type] }}
                      />
                      <span className="truncate text-ink-muted">{c.node.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function GraphLegend() {
  const items = [
    { label: "Contract", type: "Contract" },
    { label: "Organization", type: "ORG" },
    { label: "Person", type: "PERSON" },
    { label: "Date", type: "DATE" },
    { label: "Money", type: "MONEY" },
    { label: "Location", type: "GPE" },
    { label: "Clause", type: "Clause" },
  ];
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2">
      {items.map((item) => (
        <div key={item.type} className="flex items-center gap-1.5 text-xs text-ink-muted">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ background: NODE_COLORS[item.type] }}
          />
          {item.label}
        </div>
      ))}
      <div className="flex items-center gap-1.5 text-xs text-ink-muted">
        <span className="inline-block h-[2px] w-4 bg-border-strong" />
        Mentions
      </div>
      <div className="flex items-center gap-1.5 text-xs text-ink-muted">
        <span className="inline-block h-[2px] w-4 bg-accent-500" />
        Has clause
      </div>
    </div>
  );
}
