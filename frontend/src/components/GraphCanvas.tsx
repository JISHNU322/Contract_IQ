import { useEffect, useMemo, useRef, useState } from "react";
import type { GraphData, GraphNode } from "../types";

interface PositionedNode extends GraphNode {
  x: number;
  y: number;
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

// Naive force-directed layout: repel all nodes from each other, attract
// connected nodes together, and pull everything gently toward the center.
// O(n^2) per tick, fine for the small graphs this app produces.
function computeLayout(data: GraphData, width: number, height: number): PositionedNode[] {
  const cx = width / 2;
  const cy = height / 2;

  const positions = new Map<string, { x: number; y: number; vx: number; vy: number }>();
  data.nodes.forEach((n, i) => {
    const angle = (i / Math.max(data.nodes.length, 1)) * Math.PI * 2;
    positions.set(n.id, {
      x: cx + Math.cos(angle) * 120,
      y: cy + Math.sin(angle) * 120,
      vx: 0,
      vy: 0,
    });
  });

  const ITERATIONS = 220;
  for (let iter = 0; iter < ITERATIONS; iter++) {
    // repulsion
    for (let i = 0; i < data.nodes.length; i++) {
      const a = positions.get(data.nodes[i].id)!;
      for (let j = i + 1; j < data.nodes.length; j++) {
        const b = positions.get(data.nodes[j].id)!;
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const distSq = Math.max(dx * dx + dy * dy, 1);
        const force = 2200 / distSq;
        const dist = Math.sqrt(distSq);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        a.vx += fx;
        a.vy += fy;
        b.vx -= fx;
        b.vy -= fy;
      }
    }
    // attraction along edges
    data.edges.forEach((e) => {
      const a = positions.get(e.source);
      const b = positions.get(e.target);
      if (!a || !b) return;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const targetDist = 90;
      const force = (dist - targetDist) * 0.02;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      a.vx += fx;
      a.vy += fy;
      b.vx -= fx;
      b.vy -= fy;
    });
    // centering + damping + integrate
    positions.forEach((p) => {
      p.vx += (cx - p.x) * 0.002;
      p.vy += (cy - p.y) * 0.002;
      p.vx *= 0.85;
      p.vy *= 0.85;
      p.x += p.vx;
      p.y += p.vy;
      p.x = Math.max(30, Math.min(width - 30, p.x));
      p.y = Math.max(30, Math.min(height - 30, p.y));
    });
  }

  return data.nodes.map((n) => ({ ...n, x: positions.get(n.id)!.x, y: positions.get(n.id)!.y }));
}

export function GraphCanvas({ data }: { data: GraphData }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ width: 800, height: 520 });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setDims({ width: entry.contentRect.width, height: 520 });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const nodes = useMemo(
    () => computeLayout(data, dims.width, dims.height),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, dims.width, dims.height]
  );

  const nodeById = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const connectedIds = useMemo(() => {
    if (!hoveredNode) return null;
    const set = new Set<string>([hoveredNode]);
    data.edges.forEach((e) => {
      if (e.source === hoveredNode) set.add(e.target);
      if (e.target === hoveredNode) set.add(e.source);
    });
    return set;
  }, [hoveredNode, data.edges]);

  return (
    <div ref={containerRef} className="w-full">
      <svg width={dims.width} height={dims.height} className="rounded-card">
        <g>
          {data.edges.map((e, i) => {
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
                strokeWidth={dimmed ? 1 : 1.4}
                opacity={dimmed ? 0.15 : 0.6}
              />
            );
          })}
        </g>
        <g>
          {nodes.map((n) => {
            const dimmed = connectedIds && !connectedIds.has(n.id);
            const r = NODE_RADIUS[n.type] ?? 8;
            const color = NODE_COLORS[n.type] ?? "#5B5F6B";
            return (
              <g
                key={n.id}
                transform={`translate(${n.x}, ${n.y})`}
                onMouseEnter={() => setHoveredNode(n.id)}
                onMouseLeave={() => setHoveredNode(null)}
                opacity={dimmed ? 0.25 : 1}
                style={{ cursor: "pointer" }}
              >
                <circle r={r} fill={color} stroke="#fff" strokeWidth={2} />
                <text
                  y={r + 13}
                  textAnchor="middle"
                  className="fill-ink font-sans"
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
