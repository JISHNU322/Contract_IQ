import type { RiskSeverity } from "../types";

const CONFIG: Record<RiskSeverity, { label: string; className: string }> = {
  low: { label: "Low", className: "bg-yellow-50 text-yellow-800 border-yellow-200" },
  medium: { label: "Medium", className: "bg-orange-50 text-orange-800 border-orange-200" },
  high: { label: "High", className: "bg-red-50 text-red-800 border-red-200" },
};

export function SeverityBadge({ severity }: { severity: RiskSeverity }) {
  const cfg = CONFIG[severity] ?? CONFIG.medium;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${cfg.className}`}
    >
      {cfg.label}
    </span>
  );
}
