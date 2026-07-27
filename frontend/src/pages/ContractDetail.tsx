import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  Trash2,
  Loader2,
  LayoutList,
  MessageSquare,
  Tags,
  ListTree,
  ShieldAlert,
  Share2,
} from "lucide-react";
import { AppShell } from "../components/AppShell";
import { StatusBadge } from "../components/StatusBadge";
import { getContract, deleteContract, getDownloadUrl } from "../api/contracts";
import type { Contract } from "../types";
import { OverviewTab } from "./contract-detail/OverviewTab";
import { ChatTab } from "./contract-detail/ChatTab";
import { EntitiesTab } from "./contract-detail/EntitiesTab";
import { ClausesTab } from "./contract-detail/ClausesTab";
import { RisksTab } from "./contract-detail/RisksTab";
import { GraphTab } from "./contract-detail/GraphTab";

type TabKey = "overview" | "chat" | "entities" | "clauses" | "risks" | "graph";

const TABS: { key: TabKey; label: string; icon: typeof LayoutList }[] = [
  { key: "overview", label: "Overview", icon: LayoutList },
  { key: "chat", label: "AI Chat", icon: MessageSquare },
  { key: "entities", label: "Entities", icon: Tags },
  { key: "clauses", label: "Clauses", icon: ListTree },
  { key: "risks", label: "Risks", icon: ShieldAlert },
  { key: "graph", label: "Graph", icon: Share2 },
];

export function ContractDetail() {
  const { id } = useParams<{ id: string }>();
  const contractId = Number(id);
  const navigate = useNavigate();

  const [contract, setContract] = useState<Contract | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [isDeleting, setIsDeleting] = useState(false);

  async function load() {
    const data = await getContract(contractId);
    setContract(data);
    setIsLoading(false);
  }

  useEffect(() => {
    load();
    const interval = setInterval(() => {
      setContract((prev) => {
        if (prev && (prev.status === "uploaded" || prev.status === "processing")) {
          load();
        }
        return prev;
      });
    }, 4000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contractId]);

  async function handleDelete() {
    if (!confirm("Delete this contract? This cannot be undone.")) return;
    setIsDeleting(true);
    try {
      await deleteContract(contractId);
      navigate("/dashboard");
    } finally {
      setIsDeleting(false);
    }
  }

  if (isLoading || !contract) {
    return (
      <AppShell>
        <div className="flex h-full items-center justify-center py-24">
          <Loader2 className="animate-spin text-primary-700" size={24} />
        </div>
      </AppShell>
    );
  }

  const isReady = contract.status === "parsed";

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-6 py-8">
        <Link
          to="/dashboard"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
        >
          <ArrowLeft size={14} />
          Back to contracts
        </Link>

        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold tracking-tight">
              {contract.filename}
            </h1>
            <div className="mt-1.5 flex items-center gap-2">
              <StatusBadge status={contract.status} />
              <span className="text-xs text-ink-faint">
                Uploaded {new Date(contract.uploaded_at).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <a
              href={getDownloadUrl(contract.id)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm text-ink-muted hover:bg-canvas"
            >
              <Download size={14} />
              Download
            </a>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center gap-1.5 rounded-md border border-red-100 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              Delete
            </button>
          </div>
        </div>

        {!isReady ? (
          <ProcessingNotice status={contract.status} />
        ) : (
          <>
            <div className="mb-6 flex gap-1 overflow-x-auto border-b border-border">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex shrink-0 items-center gap-1.5 border-b-2 px-3.5 py-2.5 text-sm font-medium transition-colors ${
                      active
                        ? "border-primary-700 text-primary-800"
                        : "border-transparent text-ink-muted hover:text-ink"
                    }`}
                  >
                    <Icon size={15} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {activeTab === "overview" && <OverviewTab contract={contract} />}
            {activeTab === "chat" && <ChatTab contractId={contract.id} />}
            {activeTab === "entities" && <EntitiesTab contractId={contract.id} />}
            {activeTab === "clauses" && <ClausesTab contractId={contract.id} />}
            {activeTab === "risks" && <RisksTab contractId={contract.id} />}
            {activeTab === "graph" && <GraphTab contractId={contract.id} />}
          </>
        )}
      </div>
    </AppShell>
  );
}

function ProcessingNotice({ status }: { status: Contract["status"] }) {
  if (status === "failed") {
    return (
      <div className="rounded-card border border-red-100 bg-red-50 p-5 text-sm text-red-700">
        Parsing failed for this contract. Check the Overview tab details, or try
        re-uploading the file.
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3 rounded-card border border-amber-100 bg-amber-50 p-5">
      <Loader2 className="animate-spin text-amber-600" size={18} />
      <div>
        <p className="text-sm font-medium text-amber-900">
          Extracting text, generating embeddings, and analyzing this contract…
        </p>
        <p className="mt-0.5 text-xs text-amber-700">
          This page refreshes automatically — usually done within a few seconds.
        </p>
      </div>
    </div>
  );
}
