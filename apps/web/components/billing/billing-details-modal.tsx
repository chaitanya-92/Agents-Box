"use client";

import { useState } from "react";
import { saveBillingProfile, type BillingProfile } from "@/lib/api";

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat",
  "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh",
  "Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab",
  "Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand",
  "West Bengal","Andaman & Nicobar Islands","Chandigarh","Dadra & Nagar Haveli",
  "Daman & Diu","Delhi","Jammu & Kashmir","Ladakh","Lakshadweep","Puducherry",
];

type Props = {
  initial: BillingProfile | null;
  userName: string;
  userEmail: string;
  onConfirm: (profile: BillingProfile) => void;
  onClose: () => void;
};

function Field({
  label, value, onChange, placeholder, required, type = "text", hint,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; required?: boolean; type?: string; hint?: string;
}) {
  return (
    <div>
      <label className="block text-xs text-white/50 mb-1">
        {label}{required && <span className="text-rose-400 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full border border-white/15 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-white/25 focus:border-sky-400/60 focus:outline-none"
      />
      {hint && <p className="mt-0.5 text-[10px] text-white/30">{hint}</p>}
    </div>
  );
}

export function BillingDetailsModal({ initial, userName, userEmail, onConfirm, onClose }: Props) {
  const [companyName,  setCompanyName]  = useState(initial?.companyName  ?? "");
  const [gstin,        setGstin]        = useState(initial?.gstin        ?? "");
  const [pan,          setPan]          = useState(initial?.pan          ?? "");
  const [phone,        setPhone]        = useState(initial?.phone        ?? "");
  const [addressLine1, setAddressLine1] = useState(initial?.addressLine1 ?? "");
  const [addressLine2, setAddressLine2] = useState(initial?.addressLine2 ?? "");
  const [city,         setCity]         = useState(initial?.city         ?? "");
  const [state,        setState]        = useState(initial?.state        ?? "");
  const [pinCode,      setPinCode]      = useState(initial?.pinCode      ?? "");
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Basic validation
    if (!phone || !addressLine1 || !city || !state || !pinCode) {
      setError("Please fill in all required fields.");
      return;
    }
    if (!/^[1-9][0-9]{5}$/.test(pinCode)) {
      setError("Enter a valid 6-digit PIN code.");
      return;
    }
    if (gstin && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstin)) {
      setError("Invalid GSTIN format (e.g. 27AAPFU0939F1ZV).");
      return;
    }
    if (pan && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan)) {
      setError("Invalid PAN format (e.g. ABCDE1234F).");
      return;
    }

    const profile: BillingProfile = {
      companyName:  companyName  || undefined,
      gstin:        gstin        || undefined,
      pan:          pan          || undefined,
      phone, addressLine1,
      addressLine2: addressLine2 || undefined,
      city, state, pinCode,
    };

    setSaving(true);
    try {
      await saveBillingProfile(profile);
      onConfirm(profile);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm px-4 py-8 overflow-y-auto">
      <div className="w-full max-w-lg border border-white/10 bg-[#0a0f1a] animate-fade-up my-auto">
        {/* Header */}
        <div className="border-b border-white/[0.07] px-6 py-5 flex items-start justify-between">
          <div>
            <h2 className="font-[var(--font-pixel)] text-base text-white">Billing Details</h2>
            <p className="mt-1 text-xs text-white/40">Required for your GST invoice. Saved for future purchases.</p>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white/70 transition text-lg leading-none mt-0.5">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Pre-filled read-only fields */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-white/50 mb-1">Name</label>
              <div className="border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-white/50">{userName}</div>
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">Email</label>
              <div className="border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-white/50 truncate">{userEmail}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Company / Organisation" value={companyName} onChange={setCompanyName} placeholder="Acme Pvt. Ltd." />
            <Field label="Phone" value={phone} onChange={setPhone} placeholder="+91 98765 43210" required type="tel" />
          </div>

          <Field label="GSTIN" value={gstin} onChange={v => setGstin(v.toUpperCase())} placeholder="27AAPFU0939F1ZV" hint="Optional — for businesses claiming GST input credit" />

          <Field label="PAN" value={pan} onChange={v => setPan(v.toUpperCase())} placeholder="ABCDE1234F" hint="Optional — required for payments above ₹50,000" />

          <div className="border-t border-white/[0.06] pt-4">
            <p className="text-[10px] uppercase tracking-widest text-white/30 mb-3">Billing Address</p>
            <div className="space-y-3">
              <Field label="Address Line 1" value={addressLine1} onChange={setAddressLine1} placeholder="House / Flat / Block No., Street" required />
              <Field label="Address Line 2" value={addressLine2} onChange={setAddressLine2} placeholder="Area, Landmark (optional)" />
              <div className="grid grid-cols-3 gap-3">
                <Field label="City" value={city} onChange={setCity} placeholder="Mumbai" required />
                <div>
                  <label className="block text-xs text-white/50 mb-1">State<span className="text-rose-400 ml-0.5">*</span></label>
                  <select
                    value={state}
                    onChange={e => setState(e.target.value)}
                    required
                    className="w-full border border-white/15 bg-[#0d1525] px-3 py-2 text-sm text-white focus:border-sky-400/60 focus:outline-none"
                  >
                    <option value="">Select</option>
                    {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <Field label="PIN Code" value={pinCode} onChange={setPinCode} placeholder="400001" required />
              </div>
            </div>
          </div>

          {error && (
            <div className="border border-rose-400/20 bg-rose-400/[0.07] px-4 py-3 text-sm text-rose-300">{error}</div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 border border-sky-200/40 bg-sky-200/10 py-2.5 text-sm text-sky-200 hover:bg-sky-200/20 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving
                ? <><span className="h-3 w-3 border border-sky-200/30 border-t-sky-200 rounded-full animate-spin inline-block" /> Saving…</>
                : "Save & Continue to Payment →"}
            </button>
            <button type="button" onClick={onClose} className="border border-white/15 px-5 py-2.5 text-sm text-white/50 hover:text-white/80 transition">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
