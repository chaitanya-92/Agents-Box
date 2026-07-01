"use client";

import { useEffect, useState } from "react";
import { listApiKeys, createApiKey, deleteApiKey, type ApiKeyItem } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { Modal } from "@/components/ui/modal";

function Skeleton({ className }: { className?: string }) {
  return <div className={`skeleton ${className ?? ""}`} />;
}

export default function ApiKeysPage() {
  const { toast } = useToast();
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null); // shown once after creation
  const [deleteTarget, setDeleteTarget] = useState<ApiKeyItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    listApiKeys()
      .then((r) => setKeys(r.data))
      .catch(() => toast("Could not load API keys", "error"))
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await createApiKey(newName.trim());
      setKeys((prev) => [res.data, ...prev]);
      setNewKey(res.data.key ?? null);
      setNewName("");
      setShowCreate(false);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to create key", "error");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteApiKey(deleteTarget.id);
      setKeys((prev) => prev.filter((k) => k.id !== deleteTarget.id));
      toast("API key revoked", "success");
      setDeleteTarget(null);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to revoke key", "error");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-10">

      {/* Create modal */}
      <Modal
        open={showCreate}
        onClose={() => { setShowCreate(false); setNewName(""); }}
        title="Create API key"
        description="Give your key a descriptive name (e.g. Production, Development)."
        confirmLabel="Create key"
        onConfirm={handleCreate}
        loading={creating}
      >
        <input
          autoFocus
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
          placeholder="Key name"
          className="w-full border border-white/15 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-sky-200/30 focus:outline-none"
          maxLength={50}
        />
      </Modal>

      {/* Delete confirm */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Revoke API key"
        description={`Revoking "${deleteTarget?.name}" is permanent. Any app using this key will stop working immediately.`}
        confirmLabel="Revoke key"
        confirmVariant="danger"
        onConfirm={handleDelete}
        loading={deleting}
      />

      {/* Header */}
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="section-label">Developer</p>
          <h1 className="mt-2 font-[var(--font-pixel)] text-2xl sm:text-3xl text-white">API Keys</h1>
          <p className="mt-2 text-sm text-white/55">Keys are shown only once at creation. Store them securely.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="shrink-0 border border-sky-200/40 bg-sky-200/10 px-4 py-2.5 text-xs text-sky-200 hover:bg-sky-200/20 transition"
        >
          + New key
        </button>
      </div>

      {/* Newly created key banner */}
      {newKey && (
        <div className="mb-6 rounded border border-amber-400/30 bg-amber-400/[0.07] p-4">
          <p className="text-xs text-amber-300 font-medium mb-2">⚠ Copy your API key — it won't be shown again</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 break-all rounded bg-white/[0.04] border border-white/10 px-3 py-2 text-xs text-white font-mono">
              {newKey}
            </code>
            <button
              onClick={() => { navigator.clipboard.writeText(newKey); toast("Copied!", "success"); }}
              className="shrink-0 border border-white/20 px-3 py-2 text-xs text-white/60 hover:text-white transition"
            >
              Copy
            </button>
          </div>
          <button onClick={() => setNewKey(null)} className="mt-2 text-xs text-white/30 hover:text-white/60 transition">
            Dismiss
          </button>
        </div>
      )}

      {/* Keys list */}
      <div className="pixel-panel divide-y divide-white/[0.07]">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-4 gap-4">
              <div className="space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-2 w-32" />
              </div>
              <Skeleton className="h-6 w-14" />
            </div>
          ))
        ) : keys.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm text-white/40">No API keys yet.</p>
            <button
              onClick={() => setShowCreate(true)}
              className="mt-4 border border-sky-200/30 px-4 py-2 text-xs text-sky-200 hover:bg-sky-200/[0.06] transition"
            >
              Create your first key →
            </button>
          </div>
        ) : (
          keys.map((key) => (
            <div key={key.id} className="flex items-center justify-between px-5 py-4 gap-4">
              <div>
                <p className="text-sm text-white">{key.name}</p>
                <p className="mt-0.5 font-mono text-xs text-white/40">{key.prefix}••••••••</p>
                <p className="mt-0.5 text-xs text-white/30">
                  Created {new Date(key.createdAt).toLocaleDateString("en-IN")}
                  {key.lastUsed ? ` · Last used ${new Date(key.lastUsed).toLocaleDateString("en-IN")}` : " · Never used"}
                </p>
              </div>
              <button
                onClick={() => setDeleteTarget(key)}
                className="shrink-0 border border-rose-400/30 px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-400/10 transition"
              >
                Revoke
              </button>
            </div>
          ))
        )}
      </div>

      <div className="mt-6 pixel-panel p-5">
        <p className="text-xs text-white/45 uppercase tracking-widest mb-3">Usage</p>
        <p className="text-sm text-white/55 leading-6">
          Pass your API key as a Bearer token: <code className="text-sky-200 font-mono text-xs">Authorization: Bearer av_live_...</code>
        </p>
        <p className="mt-2 text-xs text-white/35">Base URL: <code className="font-mono">{process.env.NEXT_PUBLIC_API_URL ?? "https://your-api.render.com"}/api</code></p>
      </div>
    </div>
  );
}
