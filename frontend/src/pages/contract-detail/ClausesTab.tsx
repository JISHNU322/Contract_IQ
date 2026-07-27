import { useEffect, useState } from "react";
import { Loader2, ListTree } from "lucide-react";
import { getContractClauses } from "../../api/contracts";
import type { ClauseLabel } from "../../types";

export function ClausesTab({ contractId }: { contractId: number }) {
  const [clauses, setClauses] = useState<ClauseLabel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getContractClauses(contractId)
      .then(setClauses)
      .catch(() => setError("Couldn't load clause classifications."))
      .finally(() => setIsLoading(false));
  }, [contractId]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="animate-spin text-primary-700" size={22} />
      </div>
    );
  }

  if (error) {
    return <p className="py-10 text-center text-sm text-ink-muted">{error}</p>;
  }

  if (clauses.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-card border border-dashed border-border-strong py-14 text-center">
        <ListTree size={22} className="mb-3 text-ink-faint" />
        <p className="text-sm font-medium">No clauses classified</p>
        <p className="mt-1 max-w-sm text-xs text-ink-faint">
          Clause types are assigned when a section's classification confidence clears the
          threshold. Low-confidence sections are intentionally left unlabeled.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {clauses.map((clause) => (
        <div
          key={clause.id}
          className="rounded-card border border-border bg-surface p-4"
        >
          <div className="mb-2.5 flex items-center justify-between">
            <span className="inline-flex items-center rounded-md bg-primary-50 px-2.5 py-1 text-sm font-semibold text-primary-800">
              {clause.clause_type}
            </span>
            <ConfidenceBar score={clause.confidence_score} />
          </div>
          {clause.chunk_text && (
            <p className="font-mono text-[13px] leading-relaxed text-ink-muted line-clamp-3">
              {clause.chunk_text}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

function ConfidenceBar({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color = pct >= 60 ? "bg-emerald-500" : pct >= 45 ? "bg-amber-500" : "bg-ink-faint";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-canvas">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-medium text-ink-faint tabular-nums">{pct}%</span>
    </div>
  );
}
