import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FileText, Upload, Loader2, ChevronRight, Inbox } from "lucide-react";
import { AppShell } from "../components/AppShell";
import { StatusBadge } from "../components/StatusBadge";
import { listContracts } from "../api/contracts";
import type { Contract } from "../types";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function Dashboard() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  async function load() {
    setIsLoading(true);
    try {
      const data = await listContracts();
      setContracts(data.sort((a, b) => b.id - a.id));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
    // Poll every 5s while anything is still processing, so status badges
    // update automatically without a manual refresh.
    const interval = setInterval(() => {
      setContracts((prev) => {
        if (prev.some((c) => c.status === "uploaded" || c.status === "processing")) {
          load();
        }
        return prev;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Contracts</h1>
            <p className="mt-1 text-sm text-ink-muted">
              {contracts.length > 0
                ? `${contracts.length} contract${contracts.length === 1 ? "" : "s"} on file`
                : "Upload your first contract to get started"}
            </p>
          </div>
          <Link
            to="/upload"
            className="flex items-center gap-2 rounded-md bg-primary-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-800"
          >
            <Upload size={15} />
            Upload contract
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-primary-700" size={24} />
          </div>
        ) : contracts.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="overflow-hidden rounded-card border border-border bg-surface shadow-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-canvas/60 text-left text-xs uppercase tracking-wide text-ink-faint">
                  <th className="px-5 py-3 font-medium">Filename</th>
                  <th className="px-5 py-3 font-medium">Uploaded</th>
                  <th className="px-5 py-3 font-medium">Size</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {contracts.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-border last:border-0 hover:bg-canvas/40 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <FileText size={16} className="text-ink-faint shrink-0" />
                        <span className="font-medium text-ink truncate max-w-xs">
                          {c.filename}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-ink-muted">{formatDate(c.uploaded_at)}</td>
                    <td className="px-5 py-3.5 text-ink-muted">{formatBytes(c.file_size)}</td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        to={`/contracts/${c.id}`}
                        className="inline-flex items-center gap-1 text-sm font-medium text-primary-700 hover:text-primary-800"
                      >
                        View
                        <ChevronRight size={14} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center rounded-card border border-dashed border-border-strong bg-surface py-16 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-50">
        <Inbox size={22} className="text-primary-700" />
      </div>
      <h3 className="text-base font-semibold">No contracts yet</h3>
      <p className="mt-1 max-w-sm text-sm text-ink-muted">
        Upload a PDF or Word contract to extract clauses, entities, and start asking
        questions grounded in its actual text.
      </p>
      <Link
        to="/upload"
        className="mt-5 flex items-center gap-2 rounded-md bg-primary-700 px-4 py-2 text-sm font-medium text-white hover:bg-primary-800"
      >
        <Upload size={15} />
        Upload contract
      </Link>
    </div>
  );
}
