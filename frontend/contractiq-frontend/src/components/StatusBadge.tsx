import type { ContractStatus } from "../types";
import { Clock, Loader2, CheckCircle2, XCircle } from "lucide-react";

const CONFIG: Record<
  ContractStatus,
  { label: string; className: string; icon: typeof Clock }
> = {
  uploaded: {
    label: "Uploaded",
    className: "bg-zinc-100 text-zinc-600 border-zinc-200",
    icon: Clock,
  },
  processing: {
    label: "Processing",
    className: "bg-amber-50 text-amber-700 border-amber-200",
    icon: Loader2,
  },
  parsed: {
    label: "Parsed",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: CheckCircle2,
  },
  failed: {
    label: "Failed",
    className: "bg-red-50 text-red-700 border-red-200",
    icon: XCircle,
  },
};

export function StatusBadge({ status }: { status: ContractStatus }) {
  const cfg = CONFIG[status];
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${cfg.className}`}
    >
      <Icon size={12} className={status === "processing" ? "animate-spin" : ""} />
      {cfg.label}
    </span>
  );
}
