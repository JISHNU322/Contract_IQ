import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, AlertCircle } from "lucide-react";
import { Logo } from "../components/Logo";
import { useAuth } from "../context/AuthContext";
import { registerUser } from "../api/auth";
import { extractErrorMessage } from "../api/client";

export function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      if (mode === "register") {
        await registerUser({ email, password, full_name: fullName });
      }
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-[380px]">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-card bg-primary-700">
            <Logo size={22} />
          </div>
          <h1 className="text-lg font-semibold tracking-tight">ContractIQ AI</h1>
          <p className="mt-1 text-sm text-ink-muted">Contract intelligence, grounded in evidence</p>
        </div>

        <div className="rounded-card border border-border bg-surface p-6 shadow-card">
          <div className="mb-5 flex rounded-md bg-canvas p-1">
            <button
              onClick={() => setMode("login")}
              className={`flex-1 rounded-[6px] py-1.5 text-sm font-medium transition-colors ${
                mode === "login" ? "bg-surface shadow-sm text-ink" : "text-ink-muted"
              }`}
            >
              Sign in
            </button>
            <button
              onClick={() => setMode("register")}
              className={`flex-1 rounded-[6px] py-1.5 text-sm font-medium transition-colors ${
                mode === "register" ? "bg-surface shadow-sm text-ink" : "text-ink-muted"
              }`}
            >
              Create account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink">
                  Full name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Jishnu Chakraborty"
                  className="w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-primary-600"
                />
              </div>
            )}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-primary-600"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-primary-600"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-md bg-red-50 border border-red-100 px-3 py-2 text-sm text-red-700">
                <AlertCircle size={15} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-primary-700 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-800 disabled:opacity-60"
            >
              {isSubmitting && <Loader2 size={15} className="animate-spin" />}
              {mode === "login" ? "Sign in" : "Create account"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-ink-faint">
          New accounts start with viewer access to their own uploaded contracts.
        </p>
      </div>
    </div>
  );
}
