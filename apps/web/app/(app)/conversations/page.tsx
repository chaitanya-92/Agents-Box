"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { listConversations, deleteConversation, type Conversation } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { Modal } from "@/components/ui/modal";

function Skeleton({ className }: { className?: string }) {
  return <div className={`skeleton ${className ?? ""}`} />;
}

const AGENT_NAMES: Record<string, string> = {
  "code-helper": "Code Helper",
  "data-analyst": "Data Analyst",
  "content-writer": "Content Writer",
  "customer-support": "Customer Support",
  "research-assistant": "Research Assistant",
  "image-describer": "Image Describer",
  "seo-optimizer": "SEO Optimizer",
  "email-drafter": "Email Drafter",
};

function agentName(id: string) {
  return AGENT_NAMES[id] ?? id;
}

export default function ConversationsPage() {
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Conversation | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    listConversations()
      .then((r) => setConversations(r.data))
      .catch(() => toast("Could not load conversations", "error"))
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteConversation(deleteTarget.id);
      setConversations((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      toast("Conversation deleted", "success");
      setDeleteTarget(null);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to delete", "error");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-10">

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete conversation"
        description={`"${deleteTarget?.title}" will be permanently deleted.`}
        confirmLabel="Delete"
        confirmVariant="danger"
        onConfirm={handleDelete}
        loading={deleting}
      />

      <div className="mb-8">
        <p className="section-label">History</p>
        <h1 className="mt-2 font-[var(--font-pixel)] text-2xl sm:text-3xl text-white">Conversations</h1>
        <p className="mt-2 text-sm text-white/55">All your past agent interactions, saved automatically.</p>
      </div>

      <div className="pixel-panel divide-y divide-white/[0.07]">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-4 gap-4">
              <div className="space-y-2">
                <Skeleton className="h-3 w-40" />
                <Skeleton className="h-2 w-24" />
              </div>
              <Skeleton className="h-6 w-14" />
            </div>
          ))
        ) : conversations.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <p className="text-sm text-white/40">No conversations yet.</p>
            <p className="mt-1 text-xs text-white/25">Start chatting with an agent to save your history here.</p>
            <Link
              href="/agents"
              className="mt-4 inline-block border border-sky-200/30 px-4 py-2 text-xs text-sky-200 hover:bg-sky-200/[0.06] transition"
            >
              Browse agents →
            </Link>
          </div>
        ) : (
          conversations.map((conv) => (
            <div key={conv.id} className="flex items-center justify-between px-5 py-4 gap-4 group">
              <Link href={`/agents/${conv.agentId}`} className="flex-1 min-w-0">
                <p className="text-sm text-white truncate group-hover:text-sky-100 transition">{conv.title}</p>
                <p className="mt-0.5 text-xs text-white/40">
                  {agentName(conv.agentId)} · {new Date(conv.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </Link>
              <button
                onClick={() => setDeleteTarget(conv)}
                className="shrink-0 opacity-0 group-hover:opacity-100 border border-rose-400/25 px-2 py-1 text-xs text-rose-400 hover:bg-rose-400/10 transition"
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
