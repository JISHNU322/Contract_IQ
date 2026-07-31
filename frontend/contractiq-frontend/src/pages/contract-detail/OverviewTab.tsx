import { useState } from "react";
import { ChevronDown, ChevronUp, User, Calendar, FileType, HardDrive } from "lucide-react";
import type { Contract } from "../../types";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function OverviewTab({ contract }: { contract: Contract }) {
  const [expanded, setExpanded] = useState(false);
  const meta = contract.extracted_metadata;

  const facts = [
    {
      icon: HardDrive,
      label: "File size",
      value: formatBytes(contract.file_size),
    },
    {
      icon: FileType,
      label: "Pages",
      value: meta?.pages_count ?? meta?.paragraphs_count ?? "—",
    },
    {
      icon: Calendar,
      label: "Uploaded",
      value: new Date(contract.uploaded_at).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    },
    {
      icon: User,
      label: "Uploaded by",
      value: `User #${contract.uploaded_by_id}`,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {facts.map((f) => (
          <div key={f.label} className="rounded-card border border-border bg-surface p-4">
            <f.icon size={15} className="mb-2 text-ink-faint" />
            <p className="text-xs text-ink-faint">{f.label}</p>
            <p className="mt-0.5 text-sm font-medium truncate">{f.value}</p>
          </div>
        ))}
      </div>

      {contract.status === "failed" && meta?.error && (
        <div className="rounded-card border border-red-100 bg-red-50 p-4 text-sm text-red-700">
          <strong>Parsing failed:</strong> {meta.error}
        </div>
      )}

      {contract.parsed_text && (
        <div className="rounded-card border border-border bg-surface">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <h3 className="text-sm font-semibold">Extracted text</h3>
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-xs font-medium text-primary-700 hover:text-primary-800"
            >
              {expanded ? "Collapse" : "Expand"}
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
          <div
            className={`px-5 py-4 font-mono text-[13px] leading-relaxed text-ink-muted whitespace-pre-wrap overflow-y-auto ${
              expanded ? "max-h-[600px]" : "max-h-40"
            }`}
          >
            {contract.parsed_text}
          </div>
        </div>
      )}
    </div>
  );
}
