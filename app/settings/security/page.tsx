"use client";
import { useState } from "react";
import { Eye, EyeOff, KeyRound, Save, Shield, Smartphone } from "lucide-react";
import toast from "react-hot-toast";

const NAVY = "#0A1F44";
const N05 = "rgba(10,31,68,.05)";
const CARD: React.CSSProperties = { boxShadow: "0 2px 8px rgba(0,0,0,0.06)" };

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200"
      style={{ backgroundColor: on ? NAVY : "#D1D5DB" }}
    >
      <span
        className="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200"
        style={{ transform: on ? "translateX(20px)" : "translateX(0)" }}
      />
    </button>
  );
}

export default function SecurityPage() {
  const [current,  setCurrent]  = useState("");
  const [newPw,    setNewPw]    = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [showCurr, setShowCurr] = useState(false);
  const [showNew,  setShowNew]  = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [mfa,      setMfa]      = useState(false);

  function strength(pw: string): { label: string; color: string; width: string } {
    if (!pw) return { label: "", color: "bg-muted", width: "0%" };
    if (pw.length < 6) return { label: "Weak", color: "bg-red-500", width: "25%" };
    if (pw.length < 10 || !/[0-9]/.test(pw)) return { label: "Fair", color: "bg-amber-500", width: "55%" };
    if (!/[^a-zA-Z0-9]/.test(pw)) return { label: "Good", color: "bg-emerald-400", width: "75%" };
    return { label: "Strong", color: "bg-emerald-500", width: "100%" };
  }

  function handleSave() {
    if (!current) { toast.error("Enter your current password."); return; }
    if (newPw.length < 8) { toast.error("New password must be at least 8 characters."); return; }
    if (newPw !== confirm) { toast.error("Passwords do not match."); return; }
    setCurrent(""); setNewPw(""); setConfirm("");
    toast.success("Password updated successfully.");
  }

  const pw = strength(newPw);

  const SESSIONS_DATA = [
    { id: "1", device: "Chrome on macOS",   location: "Lyon, France",  last: "Now",         current: true  },
    { id: "2", device: "Safari on iPhone",  location: "Lyon, France",  last: "2 hours ago", current: false },
    { id: "3", device: "Chrome on Windows", location: "Paris, France", last: "3 days ago",  current: false },
  ];

  function pwInput(
    label: string,
    value: string,
    onChange: (v: string) => void,
    show: boolean,
    toggle: () => void,
    extra?: React.ReactNode
  ) {
    return (
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">{label}</label>
        <div className="relative">
          <input
            type={show ? "text" : "password"}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-10 w-full rounded-md border border-[#E5E7EB] bg-background px-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A1F44]/30"
          />
          <button
            type="button"
            onClick={toggle}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {extra}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="border-b border-[#E5E7EB] bg-white px-6 pt-6 pb-5">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: NAVY }}>Security</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">Manage your password, two-factor authentication, and active sessions</p>
      </div>

      <main className="flex-1 bg-[#F9FAFB] px-6 py-6">
        <div className="max-w-2xl space-y-6">

          {/* Change password */}
          <section className="rounded-xl border border-[#E5E7EB] bg-white p-6" style={CARD}>
            <div className="flex items-center gap-2">
              <KeyRound className="h-4 w-4" style={{ color: NAVY }} />
              <h2 className="text-base font-bold" style={{ color: NAVY }}>Change Password</h2>
            </div>
            <p className="mt-0.5 text-[13px] text-muted-foreground">Update your account password regularly to keep it secure</p>
            <hr className="my-4 border-[#E5E7EB]" />
            <div className="space-y-4">
              {pwInput("Current password", current, setCurrent, showCurr, () => setShowCurr((v) => !v))}
              {pwInput(
                "New password",
                newPw,
                setNewPw,
                showNew,
                () => setShowNew((v) => !v),
                newPw && (
                  <div className="mt-1.5">
                    <div className="h-1 w-full rounded-full bg-muted">
                      <div className={`h-full rounded-full transition-all duration-300 ${pw.color}`} style={{ width: pw.width }} />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{pw.label}</p>
                  </div>
                )
              )}
              {pwInput("Confirm new password", confirm, setConfirm, showConf, () => setShowConf((v) => !v))}
            </div>
            <div className="mt-5 flex justify-end">
              <button type="button" onClick={handleSave}
                className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: NAVY }}>
                <Save className="h-4 w-4" />
                Update password
              </button>
            </div>
          </section>

          {/* Two-factor auth */}
          <section className="rounded-xl border border-[#E5E7EB] bg-white p-6" style={CARD}>
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" style={{ color: NAVY }} />
              <h2 className="text-base font-bold" style={{ color: NAVY }}>Two-Factor Authentication</h2>
            </div>
            <p className="mt-0.5 text-[13px] text-muted-foreground">Add an extra layer of protection to your account</p>
            <hr className="my-4 border-[#E5E7EB]" />
            <div className="flex items-start justify-between gap-4 rounded-lg p-4" style={{ backgroundColor: N05 }}>
              <div>
                <p className="text-sm font-medium text-foreground">Authenticator app</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Use an app like Google Authenticator or 1Password to generate one-time codes.</p>
                {mfa && <p className="mt-1.5 text-xs font-medium text-emerald-600">Enabled — last verified 3 days ago</p>}
              </div>
              <Toggle on={mfa} onChange={(v) => { setMfa(v); toast.success(v ? "2FA enabled." : "2FA disabled."); }} />
            </div>
          </section>

          {/* Active sessions */}
          <section className="rounded-xl border border-[#E5E7EB] bg-white p-6" style={CARD}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" style={{ color: NAVY }} />
                <h2 className="text-base font-bold" style={{ color: NAVY }}>Active Sessions</h2>
              </div>
              <button type="button"
                onClick={() => { toast("All other sessions signed out."); }}
                className="text-xs font-medium text-red-600 hover:underline">
                Sign out all others
              </button>
            </div>
            <p className="mt-0.5 text-[13px] text-muted-foreground">Devices currently signed in to your account</p>
            <hr className="my-4 border-[#E5E7EB]" />
            <div className="divide-y divide-[#F3F4F6]">
              {SESSIONS_DATA.map((s) => (
                <div key={s.id} className="flex items-center justify-between py-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">{s.device}</p>
                      {s.current && (
                        <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">Current</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{s.location} · {s.last}</p>
                  </div>
                  {!s.current && (
                    <button type="button"
                      onClick={() => toast("Session signed out.")}
                      className="text-xs font-medium text-red-600 hover:underline">
                      Sign out
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}
