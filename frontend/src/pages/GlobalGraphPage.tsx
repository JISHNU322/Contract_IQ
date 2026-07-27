import { useEffect, useState } from "react";
import { Loader2, Share2 } from "lucide-react";
import { AppShell } from "../components/AppShell";
import { GraphCanvas, GraphLegend } from "../components/GraphCanvas";
import { getGlobalGraph } from "../api/chat";
import type { GraphData } from "../types";

export function GlobalGraphPage() {
  const [data, setData] = useState<GraphData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getGlobalGraph()
      .then(setData)
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-6 py-8">
        <h1 className="text-xl font-semibold tracking-tight">Knowledge graph</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Every contract you can access, connected through shared vendors, parties, and
          clause types.
        </p>

        <div className="mt-6 rounded-card border border-border bg-surface p-5">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="animate-spin text-primary-700" size={22} />
            </div>
          ) : !data || data.nodes.length === 0 ? (
            <div className="flex flex-col items-center py-14 text-center">
              <Share2 size={22} className="mb-3 text-ink-faint" />
              <p className="text-sm font-medium">No graph data yet</p>
              <p className="mt-1 text-xs text-ink-faint">
                Upload and analyze a contract to see it appear here.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-ink-muted">
                  {data.nodes.length} nodes · {data.edges.length} connections
                </p>
                <GraphLegend />
              </div>
              <GraphCanvas data={data} />
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
