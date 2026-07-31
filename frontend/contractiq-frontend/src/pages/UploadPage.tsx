import { useCallback, useState, type DragEvent } from "react";
import { useNavigate } from "react-router-dom";
import { UploadCloud, FileText, Loader2, AlertCircle } from "lucide-react";
import { AppShell } from "../components/AppShell";
import { uploadContract } from "../api/contracts";
import { extractErrorMessage } from "../api/client";

const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const MAX_SIZE_BYTES = 20 * 1024 * 1024;

export function UploadPage() {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  function validateAndSetFile(f: File) {
    setError(null);
    if (!ALLOWED_TYPES.includes(f.type)) {
      setError("Only PDF and Word (.docx) files are supported.");
      return;
    }
    if (f.size > MAX_SIZE_BYTES) {
      setError("File exceeds the 20MB size limit.");
      return;
    }
    setFile(f);
  }

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) validateAndSetFile(dropped);
  }, []);

  async function handleUpload() {
    if (!file) return;
    setProgress(0);
    setError(null);
    try {
      const contract = await uploadContract(file, setProgress);
      navigate(`/contracts/${contract.id}`);
    } catch (err) {
      setError(extractErrorMessage(err));
      setProgress(null);
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="text-xl font-semibold tracking-tight">Upload a contract</h1>
        <p className="mt-1 text-sm text-ink-muted">
          PDF or Word documents, up to 20MB. Text is extracted, chunked, and embedded
          automatically once uploaded.
        </p>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={`mt-6 flex flex-col items-center justify-center rounded-card border-2 border-dashed px-6 py-14 text-center transition-colors ${
            dragActive
              ? "border-primary-600 bg-primary-50"
              : "border-border-strong bg-surface"
          }`}
        >
          {file ? (
            <>
              <FileText size={28} className="mb-3 text-primary-700" />
              <p className="font-medium text-sm">{file.name}</p>
              <p className="mt-0.5 text-xs text-ink-faint">
                {(file.size / 1024).toFixed(0)} KB
              </p>
              {!progress && progress !== 0 && (
                <button
                  onClick={() => setFile(null)}
                  className="mt-3 text-xs font-medium text-ink-muted hover:text-ink underline underline-offset-2"
                >
                  Choose a different file
                </button>
              )}
            </>
          ) : (
            <>
              <UploadCloud size={28} className="mb-3 text-ink-faint" />
              <p className="text-sm font-medium">
                Drag and drop your contract here
              </p>
              <p className="mt-1 text-xs text-ink-faint">or</p>
              <label className="mt-3 cursor-pointer rounded-md border border-border px-4 py-2 text-sm font-medium text-ink hover:bg-canvas">
                Browse files
                <input
                  type="file"
                  accept=".pdf,.docx"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) validateAndSetFile(f);
                  }}
                />
              </label>
            </>
          )}
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-md border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertCircle size={15} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {progress !== null && (
          <div className="mt-4">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-canvas">
              <div
                className="h-full rounded-full bg-primary-700 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-1.5 text-xs text-ink-muted">
              {progress < 100 ? `Uploading… ${progress}%` : "Saved. Starting analysis…"}
            </p>
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={!file || progress !== null}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-md bg-primary-700 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-800 disabled:opacity-40"
        >
          {progress !== null && <Loader2 size={15} className="animate-spin" />}
          Upload and analyze
        </button>
      </div>
    </AppShell>
  );
}
