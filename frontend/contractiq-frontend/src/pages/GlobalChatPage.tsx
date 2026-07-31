import { useEffect, useRef, useState, type FormEvent } from "react";
import { Send, Loader2, FileSearch, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { AppShell } from "../components/AppShell";
import { askAcrossContracts } from "../api/chat";
import { extractErrorMessage } from "../api/client";
import type { ChatMessage } from "../types";

const SUGGESTED_QUESTIONS = [
  "List every termination clause across my contracts",
  "What payment terms appear across my contracts?",
  "Which contracts have unlimited liability?",
  "Summarize governing law across all my contracts",
];

export function GlobalChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function sendQuestion(question: string) {
    if (!question.trim() || isSending) return;
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content: question };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsSending(true);

    try {
      const res = await askAcrossContracts(question);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: res.answer,
          citations: res.citations,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `I couldn't process that: ${extractErrorMessage(err)}`,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    sendQuestion(input);
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-6 py-8">
        <h1 className="text-xl font-semibold tracking-tight">Ask across contracts</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Searches every contract you can access and grounds each answer in the most
          relevant clauses found — sources note which contract they came from.
        </p>
        <p className="mt-1 text-xs text-ink-faint">
          Note: this finds the most semantically relevant matches, not an exhaustive list —
          for an exact count of every clause of a given type, use a contract's Clauses tab.
        </p>

        <div className="mt-5 flex h-[calc(100vh-280px)] min-h-[420px] flex-col rounded-card border border-border bg-surface">
          <div ref={scrollRef} className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
            {messages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-accent-50">
                  <Sparkles size={18} className="text-accent-600" />
                </div>
                <p className="text-sm font-medium">Ask a question across all your contracts</p>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  {SUGGESTED_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => sendQuestion(q)}
                      className="rounded-full border border-border px-3 py-1.5 text-xs text-ink-muted hover:border-primary-300 hover:text-primary-700"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <ChatBubble key={msg.id} message={msg} />
            ))}

            {isSending && (
              <div className="flex items-center gap-2 text-sm text-ink-faint">
                <Loader2 size={14} className="animate-spin" />
                Searching across your contracts…
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="flex gap-2 border-t border-border p-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question across all your contracts…"
              className="flex-1 rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-primary-600"
            />
            <button
              type="submit"
              disabled={!input.trim() || isSending}
              className="flex items-center justify-center rounded-md bg-primary-700 px-3.5 text-white transition-colors hover:bg-primary-800 disabled:opacity-40"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>
    </AppShell>
  );
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const [showSources, setShowSources] = useState(false);
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[85%] ${isUser ? "items-end" : "items-start"} flex flex-col`}>
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
            isUser
              ? "bg-primary-700 text-white rounded-br-sm"
              : "bg-canvas text-ink rounded-bl-sm"
          }`}
        >
          {message.content}
        </div>

        {!isUser && message.citations && message.citations.length > 0 && (
          <div className="mt-1.5 w-full">
            <button
              onClick={() => setShowSources(!showSources)}
              className="flex items-center gap-1 text-xs font-medium text-accent-600 hover:text-accent-700"
            >
              <FileSearch size={12} />
              {message.citations.length} source
              {message.citations.length > 1 ? "s" : ""}
              {showSources ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
            {showSources && (
              <div className="mt-2 space-y-2">
                {message.citations.map((c) => (
                  <div
                    key={c.chunk_id}
                    className="rounded-md border-l-2 border-accent-500 bg-canvas px-3 py-2"
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-[11px] font-medium text-primary-700">
                        Contract #{c.contract_id}
                      </span>
                      <span className="text-[11px] text-ink-faint">
                        {Math.round(c.similarity * 100)}% match
                      </span>
                    </div>
                    <p className="font-mono text-[12px] leading-relaxed text-ink-muted line-clamp-3">
                      {c.chunk_text}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
