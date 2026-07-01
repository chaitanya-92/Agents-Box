"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { pricingPlans } from "@agentverse/config";
import { getProfile, updateProfile, getMySubscription, type UserProfile, type Subscription } from "@/lib/api";
import { storeAuthSession, getCurrentUser } from "@/lib/auth";
import { useToast } from "@/components/ui/toast";
import { Modal } from "@/components/ui/modal";

function Skeleton({ className }: { className?: string }) {
  return <div className={`skeleton ${className ?? ""}`} />;
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  disabled,
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  disabled?: boolean;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-xs text-white/45 uppercase tracking-widest mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className="w-full border border-white/15 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-sky-200/30 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
      />
      {hint && <p className="mt-1.5 text-xs text-white/35">{hint}</p>}
    </div>
  );
}

export default function ProfilePage() {
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [sub, setSub] = useState<Subscription | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);

  // Edit state
  const [name, setName]   = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");

  useEffect(() => {
    Promise.all([
      getProfile(),
      getMySubscription().catch(() => ({ data: null })),
    ]).then(([profileRes, subRes]) => {
      const p = profileRes.data;
      setProfile(p);
      setName(p.name);
      setPhone(p.phone ?? "");
      setEmail(p.email);
      setSub(subRes.data);
    }).catch(() => {
      toast("Could not load profile", "error");
    }).finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    try {
      const res = await updateProfile({ name: name.trim(), phone: phone.trim() });
      setProfile(res.data);
      // Update local session cache so the sidebar shows the new name
      const current = getCurrentUser();
      if (current) {
        const tok = typeof window !== "undefined" ? localStorage.getItem("agentverse.accessToken") ?? "" : "";
        const ref = typeof window !== "undefined" ? localStorage.getItem("agentverse.refreshToken") ?? "" : "";
        storeAuthSession({ accessToken: tok, refreshToken: ref, user: { ...current, name: res.data.name, email: res.data.email } });
      }
      toast("Profile updated successfully", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Update failed", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleEmailChange() {
    if (!newEmail.trim() || saving) return;
    setSaving(true);
    try {
      const res = await updateProfile({ email: newEmail.trim() });
      setProfile(res.data);
      setEmail(res.data.email);
      setNewEmail("");
      setShowEmailModal(false);
      toast("Email updated successfully", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Email update failed", "error");
    } finally {
      setSaving(false);
    }
  }

  const plan = pricingPlans.find((p) => p.id === sub?.planId);
  const isDirty = profile && (name !== profile.name || phone !== (profile.phone ?? ""));

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8 sm:py-10">

      {/* Email change modal */}
      <Modal
        open={showEmailModal}
        onClose={() => { setShowEmailModal(false); setNewEmail(""); }}
        title="Change email address"
        description="Enter your new email address. You may need to log in again after changing it."
        confirmLabel="Update email"
        onConfirm={handleEmailChange}
        loading={saving}
      >
        <input
          type="email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          placeholder="new@email.com"
          className="w-full border border-white/15 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-sky-200/30 focus:outline-none"
          onKeyDown={(e) => { if (e.key === "Enter") handleEmailChange(); }}
          autoFocus
        />
      </Modal>

      {/* Header */}
      <div className="mb-8">
        <p className="section-label">Account</p>
        <h1 className="mt-2 font-[var(--font-pixel)] text-2xl sm:text-3xl text-white">Profile</h1>
        <p className="mt-2 text-sm text-white/55">Manage your personal information and subscription.</p>
      </div>

      {/* Current plan card */}
      <div className="pixel-panel p-5 mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs text-white/40 uppercase tracking-widest mb-1">Current plan</p>
          {sub === undefined ? (
            <Skeleton className="h-5 w-20" />
          ) : sub ? (
            <div className="flex items-center gap-3">
              <p className="font-[var(--font-pixel)] text-base text-sky-200">{plan?.name ?? sub.planId}</p>
              <span className="border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[10px] text-emerald-300">Active</span>
            </div>
          ) : (
            <p className="text-sm text-amber-300">No active plan</p>
          )}
          {sub?.currentPeriodEnd && (
            <p className="mt-1 text-xs text-white/35">
              Renews {new Date(sub.currentPeriodEnd).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          )}
        </div>
        <Link
          href="/plans"
          className="shrink-0 border border-sky-200/30 px-4 py-2 text-xs text-sky-200 hover:bg-sky-200/[0.06] transition"
        >
          {sub ? "Manage plan" : "Choose plan"} →
        </Link>
      </div>

      {/* Profile form */}
      <div className="pixel-panel p-5 sm:p-6">
        <p className="section-label mb-5">Personal information</p>

        {loading ? (
          <div className="space-y-5">
            {[...Array(3)].map((_, i) => (
              <div key={i}>
                <Skeleton className="h-3 w-16 mb-2" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-5 animate-fade-up">
            <Field
              label="Full name"
              value={name}
              onChange={setName}
              placeholder="Your name"
            />

            <div>
              <label className="block text-xs text-white/45 uppercase tracking-widest mb-1.5">Email address</label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  readOnly
                  className="flex-1 border border-white/15 bg-white/[0.03] px-4 py-2.5 text-sm text-white/60 cursor-not-allowed"
                />
                <button
                  onClick={() => setShowEmailModal(true)}
                  className="shrink-0 border border-white/15 px-4 py-2.5 text-xs text-white/60 hover:border-sky-200/30 hover:text-sky-200 transition"
                >
                  Change
                </button>
              </div>
            </div>

            <Field
              label="Phone number"
              value={phone}
              onChange={setPhone}
              type="tel"
              placeholder="+91 XXXXX XXXXX"
              hint="Optional. Used for account recovery."
            />

            <div className="pt-2 flex gap-3">
              <button
                onClick={handleSave}
                disabled={!isDirty || saving}
                className="border border-sky-200/40 bg-sky-200/10 px-6 py-2.5 text-sm text-sky-200 hover:bg-sky-200/20 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
              {isDirty && (
                <button
                  onClick={() => { setName(profile!.name); setPhone(profile!.phone ?? ""); }}
                  className="border border-white/15 px-6 py-2.5 text-sm text-white/55 hover:border-white/30 hover:text-white transition"
                >
                  Discard
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Account info */}
      {profile && (
        <div className="pixel-panel p-5 sm:p-6 mt-5">
          <p className="section-label mb-4">Account details</p>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-white/45">User ID</span>
              <span className="font-mono text-xs text-white/55">{profile.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/45">Role</span>
              <span className="text-white/70">{profile.role}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/45">Member since</span>
              <span className="text-white/70">{new Date(profile.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
