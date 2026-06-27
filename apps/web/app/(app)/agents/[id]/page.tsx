"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { agentCatalog } from "@agentverse/config";
import { type Subscription, getMySubscription, invokeAgent } from "@/lib/api";

type Message = { role: "user" | "agent"; content: string; ts: number };

export default function AgentPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const agent = agentCatalog.find((a) => a.id === id);

  const [sub, setSub] = useState<Subscription | null | undefined>(undefined);
  const [messages, setMessages] = useState<Message[]>([]);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getMySubscription().then((r) => setSub(r.data)).catch(() => setSub(null));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!agent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-white/60">Agent not found.</p>
        <Link href="/agents" className="text-sky-200 text-sm">← Back to agents</Link>
      </div>
    );
  }

  async function send() {
    if (!prompt.trim() || loading) return;
    const userMsg = prompt.trim();
    setPrompt("");
    setError(null);
    setMessages((prev) => [...prev, { role: "user", content: userMsg, ts: Date.now() }]);
    setLoading(true);
    try {
      const res = await invokeAgent(agent!.id, userMsg);
      setMessages((prev) => [...prev, { role: "agent", content: res.data.reply, ts: Date.now() }]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Invocation failed";
      setError(msg);
      if (msg.toLowerCase().includes("subscription")) {
        setSub(null);
      }
    } finally {
      setLoading(false);
    }
  }

  const noSub = sub === null;
  const loadingSub = sub === undefined;

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-white/10 px-6 py-4">
        <button onClick={() => router.back()} className="text-white/40 hover:text-white text-sm">←</button>
        <div>
          <p className="font-[var(--font-pixel)] text-sm text-white">{agent.name}</p>
          <p className="text-xs text-white/40 uppercase tracking-widest">{agent.category}</p>
        </div>
        <div className="ml-auto flex flex-wrap gap-1.5">
          {agent.capabilities.map((c) => (
            <span key={c} className="border border-white/10 px-2 py-0.5 text-[10px] text-white/40">{c}</span>
          ))}
        </div>
      </div>

      {/* No subscription banner */}
      {noSub && (
        <div className="mx-6 mt-4 border border-amber-400/25 bg-amber-400/[0.04] px-4 py-3 text-sm text-amber-200">
          You need an active subscription to use agents.{" "}
          <Link href="/plans" className="underline hover:text-amber-100">View plans →</Link>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        {messages.length === 0 && !loadingSub && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3">
            <p className="font-[var(--font-pixel)] text-2xl text-sky-200">{agent.name}</p>
            <p className="text-sm text-white/55 max-w-sm">{agent.description}</p>
            {!noSub && <p className="text-xs text-white/30 mt-4">Type a message below to get started.</p>}
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.ts} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] px-4 py-3 text-sm leading-6 ${
              msg.role === "user"
                ? "border border-sky-200/20 bg-sky-200/[0.07] text-white"
                : "border border-white/10 bg-white/[0.03] text-white/80"
            }`}>
              {msg.role === "agent" && (
                <p className="text-[10px] uppercase tracking-widest text-sky-200/60 mb-2">{agent.name}</p>
              )}
              <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/40">
              {agent.name} is thinking…
            </div>
          </div>
        )}

        {error && !error.toLowerCase().includes("subscription") && (
          <p className="text-xs text-rose-300 text-center">{error}</p>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-white/10 px-6 py-4">
        <div className="flex gap-3">
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); } }}
            placeholder={noSub ? "Subscribe to use this agent" : `Ask ${agent.name} anything…`}
            disabled={noSub || loadingSub}
            className="flex-1 border border-white/15 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-sky-200/30 focus:outline-none disabled:opacity-40"
          />
          <button
            onClick={() => void send()}
            disabled={!prompt.trim() || loading || noSub || loadingSub}
            className="border border-sky-200/30 px-5 py-2.5 text-xs text-sky-200 transition hover:bg-sky-200/[0.07] disabled:opacity-30"
          >
            {loading ? "…" : "Send"}
          </button>
        </div>
        <p className="mt-2 text-[10px] text-white/25">Press Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
}
