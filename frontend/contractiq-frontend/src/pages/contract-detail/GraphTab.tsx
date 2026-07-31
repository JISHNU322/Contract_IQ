import { useEffect, useState } from "react";
import { Loader2, Share2 } from "lucide-react";
import { getContractGraph } from "../../api/chat";
import { GraphCanvas } from "../../components/GraphCanvas";
import type { GraphData } from "../../types";

export function GraphTab({ contractId }: { contractId: number }) {
  const [data, setData] = useState<GraphData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getContractGraph(contractId)
      .then(setData)
      .finally(() => setIsLoading(false));
  }, [contractId]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="animate-spin text-primary-700" size={22} />
      </div>
    );
  }

  if (!data || data.nodes.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-card border border-dashed border-border-strong py-14 text-center">
        <Share2 size={22} className="mb-3 text-ink-faint" />
        <p className="text-sm font-medium">No graph data yet</p>
        <p className="mt-1 text-xs text-ink-faint">
          The graph builds automatically from extracted entities and clauses.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-card border border-border bg-surface p-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-ink-muted">
          {data.nodes.length} nodes · {data.edges.length} connections
        </p>
        <p className="text-xs text-ink-faint">
          Drag nodes · scroll to zoom · click a node for details
        </p>
      </div>
      <GraphCanvas data={data} />
    </div>
  );
}
