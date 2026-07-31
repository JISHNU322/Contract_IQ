import { type ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutGrid, Upload, Share2, LogOut, Menu, MessageSquare } from "lucide-react";
import { Logo } from "./Logo";
import { useAuth } from "../context/AuthContext";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Contracts", icon: LayoutGrid },
  { to: "/upload", label: "Upload", icon: Upload },
  { to: "/chat", label: "Ask Across Contracts", icon: MessageSquare },
  { to: "/graph", label: "Knowledge Graph", icon: Share2 },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-canvas">
      {/* Sidebar - desktop */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-border bg-surface">
        <SidebarContent currentPath={location.pathname} onNavigate={() => {}} />
      </aside>

      {/* Sidebar - mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-ink/30"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-64 bg-surface border-r border-border">
            <SidebarContent
              currentPath={location.pathname}
              onNavigate={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}

      <div className="flex flex-1 flex-col min-w-0">
        {/* Top bar */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface px-4 md:px-6">
          <button
            className="md:hidden text-ink-muted"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
          >
            <Menu size={20} />
          </button>
          <div className="md:hidden flex items-center gap-2">
            <Logo size={18} />
            <span className="font-semibold text-sm">ContractIQ AI</span>
          </div>
          <div className="ml-auto flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium leading-tight">{user?.email}</p>
              <p className="text-xs text-ink-faint leading-tight capitalize">
                {user?.role?.replace("_", " ")}
              </p>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm text-ink-muted hover:bg-canvas hover:text-ink transition-colors"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

function SidebarContent({
  currentPath,
  onNavigate,
}: {
  currentPath: string;
  onNavigate: () => void;
}) {
  return (
    <>
      <div className="flex h-14 items-center gap-2 border-b border-border px-5">
        <Logo size={20} />
        <span className="font-semibold text-[15px] tracking-tight">ContractIQ AI</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = currentPath.startsWith(item.to);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-primary-50 text-primary-800"
                  : "text-ink-muted hover:bg-canvas hover:text-ink"
              }`}
            >
              <Icon size={17} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-5 py-4 border-t border-border">
        <p className="text-xs text-ink-faint leading-relaxed">
          Every answer traces back to its source clause.
        </p>
      </div>
    </>
  );
}
