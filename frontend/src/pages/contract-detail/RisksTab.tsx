import { useEffect, useState } from "react";
import { Loader2, ShieldAlert, Sparkles, ScanLine } from "lucide-react";
import { getRisks, analyzeRisks } from "../../api/contracts";
import { SeverityBadge } from "../../components/SeverityBadge";
import { extractErrorMessage } from "../../api/client";
import type { Risk } from "../../types";

export function RisksTab({ contractId }: { contractId: number }) {
  const [risks, setRisks] = useState<Risk[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  useEffect(() => {
    getRisks(contractId)
      .then(setRisks)
      .catch(() => {})
      .finally(() => {
        setIsLoading(false);
        setHasLoadedOnce(true);
      });
  }, [contractId]);

  async function handleAnalyze() {
    setIsAnalyzing(true);
    setError(null);
    try {
      const result = await analyzeRisks(contractId);
      setRisks(result);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsAnalyzing(false);
    }
  }

  const structuralGaps = risks.filter((r) => r.risk_type === "Missing Clause");
  const clauseRisks = risks.filter((r) => r.risk_type !== "Missing Clause");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between rounded-card border border-border bg-surface p-4">
        <div>
          <p className="text-sm font-medium">AI risk analysis</p>
          <p className="mt-0.5 text-xs text-ink-faint">
            Checks for missing standard clauses and evaluates existing clauses for
            unfavorable terms.
          </p>
        </div>
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className="flex shrink-0 items-center gap-2 rounded-md bg-accent-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-700 disabled:opacity-50"
        >
          {isAnalyzing ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Sparkles size={15} />
          )}
          {isAnalyzing ? "Analyzing…" : risks.length > 0 ? "Re-analyze" : "Analyze risks"}
        </button>
      </div>

      {error && (
        <div className="rounded-md border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {isLoading && !hasLoadedOnce ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-primary-700" size={22} />
        </div>
      ) : risks.length === 0 ? (
        <div className="flex flex-col items-center rounded-card border border-dashed border-border-strong py-14 text-center">
          <ShieldAlert size={22} className="mb-3 text-ink-faint" />
          <p className="text-sm font-medium">No risk analysis yet</p>
          <p className="mt-1 text-xs text-ink-faint">
            Run the analysis to check for missing clauses and unfavorable terms.
          </p>
        </div>
      ) : (
        <>
          {structuralGaps.length > 0 && (
            <div>
              <h3 className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-faint">
                <ScanLine size={13} />
                Structural gaps ({structuralGaps.length})
              </h3>
              <div className="space-y-2.5">
                {structuralGaps.map((r, i) => (
                  <RiskCard key={i} risk={r} />
                ))}
              </div>
            </div>
          )}
          {clauseRisks.length > 0 && (
            <div>
              <h3 className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-faint">
                <ShieldAlert size={13} />
                Clause-level risks ({clauseRisks.length})
              </h3>
              <div className="space-y-2.5">
                {clauseRisks.map((r, i) => (
                  <RiskCard key={i} risk={r} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function RiskCard({ risk }: { risk: Risk }) {
  return (
    <div className="rounded-card border border-border bg-surface p-4">
      <div className="mb-1.5 flex items-start justify-between gap-3">
        <p className="text-sm font-semibold">{risk.risk_type}</p>
        <SeverityBadge severity={risk.severity} />
      </div>
      <p className="text-sm leading-relaxed text-ink-muted">{risk.description}</p>
      {risk.related_chunk_id !== null && (
        <p className="mt-2 text-[11px] font-medium text-ink-faint">
          Source: chunk #{risk.related_chunk_id}
        </p>
      )}
    </div>
  );
}
