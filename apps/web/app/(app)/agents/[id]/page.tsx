"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { agentCatalog } from "@agentverse/config";
import { type Subscription, getMySubscription, invokeAgent } from "@/lib/api";
import { useToast } from "@/components/ui/toast";

type Message = { role: "user" | "agent"; content: string; ts: number };

export default function AgentPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const agent = agentCatalog.find((a) => a.id === id);

  const [sub, setSub] = useState<Subscription | null | undefined>(undefined);
  const [messages, setMessages] = useState<Message[]>([]);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    getMySubscription().then((r) => setSub(r.data)).catch(() => setSub(null));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!agent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-6">
        <p className="text-white/60">Agent not found.</p>
        <Link href="/agents" className="text-sky-200 text-sm hover:text-sky-100">← Back to agents</Link>
      </div>
    );
  }

  async function send() {
    if (!prompt.trim() || loading) return;
    const userMsg = prompt.trim();
    setPrompt("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg, ts: Date.now() }]);
    setLoading(true);
    try {
      const res = await invokeAgent(agent!.id, userMsg);
      setMessages((prev) => [...prev, { role: "agent", content: res.data.reply, ts: Date.now() }]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Invocation failed";
      if (msg.toLowerCase().includes("subscription")) {
        setSub(null);
        toast("Active subscription required to use agents", "error");
      } else {
        toast(msg, "error");
      }
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  }

  const noSub = sub === null;
  const loadingSub = sub === undefined;

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 0px)" }}>

      {/* Header */}
      <div className="flex items-center gap-3 border-b border-white/10 px-4 sm:px-6 py-3 sm:py-4 shrink-0 bg-black/40 backdrop-blur-sm">
        <button
          onClick={() => router.back()}
          className="text-white/40 hover:text-white text-sm transition p-1 -ml-1"
          aria-label="Back"
        >
          ←
        </button>
        <div className="min-w-0 flex-1">
          <p className="font-[var(--font-pixel)] text-xs sm:text-sm text-white truncate">{agent.name}</p>
          <p className="text-[10px] text-white/40 uppercase tracking-widest">{agent.category}</p>
        </div>
        <div className="hidden sm:flex flex-wrap gap-1.5 shrink-0">
          {agent.capabilities.slice(0, 3).map((c) => (
            <span key={c} className="border border-white/10 px-2 py-0.5 text-[10px] text-white/40">{c}</span>
          ))}
        </div>
      </div>

      {/* No subscription banner */}
      {noSub && (
        <div className="mx-4 sm:mx-6 mt-4 border border-amber-400/25 bg-amber-400/[0.04] px-4 py-3 text-sm text-amber-200 flex items-center justify-between gap-3 shrink-0">
          <span>Active subscription required.</span>
          <Link href="/plans" className="text-xs border border-amber-400/30 px-3 py-1 hover:bg-amber-400/10 transition whitespace-nowrap">
            View plans →
          </Link>
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-4 min-h-0">
        {messages.length === 0 && !loadingSub && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3 px-4">
            <div className="border border-sky-200/20 bg-sky-200/[0.03] px-6 py-4 mb-2">
              <p className="font-[var(--font-pixel)] text-base sm:text-xl text-sky-200">{agent.name}</p>
            </div>
            <p className="text-sm text-white/55 max-w-sm leading-6">{agent.description}</p>
            <div className="flex flex-wrap justify-center gap-1.5 mt-2">
              {agent.capabilities.map((c) => (
                <span key={c} className="border border-white/10 px-2 py-0.5 text-[10px] text-white/40">{c}</span>
              ))}
            </div>
            {!noSub && !loadingSub && (
              <p className="text-xs text-white/25 mt-4">Type a message below to get started</p>
            )}
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.ts} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fade-up`}>
            <div className={`max-w-[85%] sm:max-w-[75%] px-4 py-3 text-sm leading-6 ${
              msg.role === "user"
                ? "border border-sky-200/20 bg-sky-200/[0.07] text-white"
                : "border border-white/10 bg-white/[0.03] text-white/80"
            }`}>
              {msg.role === "agent" && (
                <p className="text-[10px] uppercase tracking-widest text-sky-200/60 mb-2">{agent.name}</p>
              )}
              <pre className="whitespace-pre-wrap font-sans text-sm leading-6">{msg.content}</pre>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start animate-fade-up">
            <div className="border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/40 flex items-center gap-2">
              <span className="inline-flex gap-1">
                <span className="w-1 h-1 bg-sky-200/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1 h-1 bg-sky-200/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1 h-1 bg-sky-200/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </span>
              <span className="text-xs">{agent.name} is thinking…</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-white/10 px-4 sm:px-6 py-3 sm:py-4 shrink-0 bg-black/40 backdrop-blur-sm">
        <div className="flex gap-2 sm:gap-3 items-end">
          <textarea
            ref={inputRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={noSub ? "Subscribe to use this agent" : `Ask ${agent.name} anything…`}
            disabled={noSub || loadingSub}
            rows={1}
            className="flex-1 border border-white/15 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-sky-200/30 focus:outline-none disabled:opacity-40 resize-none overflow-hidden"
            style={{ minHeight: "42px", maxHeight: "120px" }}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = "auto";
              el.style.height = Math.min(el.scrollHeight, 120) + "px";
            }}
          />
          <button
            onClick={() => void send()}
            disabled={!prompt.trim() || loading || noSub || loadingSub}
            className="shrink-0 border border-sky-200/30 px-4 sm:px-5 py-2.5 text-xs text-sky-200 transition hover:bg-sky-200/[0.07] disabled:opacity-30 h-[42px]"
          >
            {loading ? (
              <span className="inline-flex gap-0.5">
                <span className="w-1 h-1 bg-sky-200 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1 h-1 bg-sky-200 rounded-full animate-bounce" style={{ animationDelay: "100ms" }} />
                <span className="w-1 h-1 bg-sky-200 rounded-full animate-bounce" style={{ animationDelay: "200ms" }} />
              </span>
            ) : "Send"}
          </button>
        </div>
        <p className="mt-2 text-[10px] text-white/20 hidden sm:block">Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
}
