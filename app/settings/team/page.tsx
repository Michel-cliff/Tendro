"use client";
import { useState } from "react";
import { Crown, Mail, MoreHorizontal, UserPlus, X } from "lucide-react";
import toast from "react-hot-toast";

const NAVY = "#0A1F44";
const N05 = "rgba(10,31,68,.05)";
const CARD: React.CSSProperties = { boxShadow: "0 2px 8px rgba(0,0,0,0.06)" };

type Member = {
  id: string;
  name: string;
  email: string;
  role: "Owner" | "Admin" | "Member";
  status: "Active" | "Pending";
  avatar: string;
};

const INITIAL_MEMBERS: Member[] = [
  { id: "1", name: "Nathalie Cordier", email: "nathalie@altea-ingenierie.fr", role: "Owner",  status: "Active",  avatar: "NC" },
  { id: "2", name: "Thomas Grégoire",  email: "thomas@altea-ingenierie.fr",   role: "Admin",  status: "Active",  avatar: "TG" },
  { id: "3", name: "Léa Martineau",    email: "lea@altea-ingenierie.fr",      role: "Member", status: "Active",  avatar: "LM" },
  { id: "4", name: "Invited User",     email: "invite@partner.fr",            role: "Member", status: "Pending", avatar: "IU" },
];

const ROLE_COLORS: Record<Member["role"], string> = {
  Owner:  "bg-[#0A1F44]/10 text-[#0A1F44]",
  Admin:  "bg-violet-100 text-violet-700",
  Member: "bg-muted text-muted-foreground",
};

export default function TeamPage() {
  const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"Admin" | "Member">("Member");
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  function handleInvite() {
    if (!inviteEmail.trim()) return;
    const initials = inviteEmail.slice(0, 2).toUpperCase();
    setMembers((p) => [
      ...p,
      { id: Date.now().toString(), name: inviteEmail, email: inviteEmail, role: inviteRole, status: "Pending", avatar: initials },
    ]);
    setInviteEmail("");
    toast.success("Invitation sent.");
  }

  function handleRemove(id: string) {
    setMembers((p) => p.filter((m) => m.id !== id));
    setOpenMenu(null);
    toast("Member removed.");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="border-b border-[#E5E7EB] bg-white px-6 pt-6 pb-5">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: NAVY }}>Team Members</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">Manage who has access to your Tendro workspace</p>
      </div>

      <main className="flex-1 bg-[#F9FAFB] px-6 py-6">
        <div className="max-w-2xl space-y-6">

          {/* Pro gate banner */}
          <div className="flex items-start gap-3 rounded-xl border border-[#0A1F44]/20 p-4" style={{ backgroundColor: N05 }}>
            <Crown className="mt-0.5 h-5 w-5 shrink-0" style={{ color: NAVY }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: NAVY }}>Pro Plan — up to 5 seats included</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Need more? Contact us to add extra seats to your plan.</p>
            </div>
            <span className="ml-auto shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold text-white" style={{ backgroundColor: NAVY }}>3 / 5 used</span>
          </div>

          {/* Members list */}
          <section className="rounded-xl border border-[#E5E7EB] bg-white p-6" style={CARD}>
            <h2 className="text-base font-bold" style={{ color: NAVY }}>Current Members</h2>
            <p className="mt-0.5 text-[13px] text-muted-foreground">People with access to this workspace</p>
            <hr className="my-4 border-[#E5E7EB]" />
            <div className="divide-y divide-[#F3F4F6]">
              {members.map((m) => (
                <div key={m.id} className="flex items-center gap-3 py-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: NAVY }}>
                    {m.avatar}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{m.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{m.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {m.status === "Pending" && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">Pending</span>
                    )}
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${ROLE_COLORS[m.role]}`}>{m.role}</span>
                    {m.role !== "Owner" && (
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setOpenMenu(openMenu === m.id ? null : m.id)}
                          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                        {openMenu === m.id && (
                          <div className="absolute right-0 top-full z-10 mt-1 w-36 rounded-lg border border-[#E5E7EB] bg-white shadow-md">
                            <button
                              type="button"
                              onClick={() => handleRemove(m.id)}
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-muted transition-colors"
                            >
                              <X className="h-3.5 w-3.5" />
                              Remove
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Invite */}
          <section className="rounded-xl border border-[#E5E7EB] bg-white p-6" style={CARD}>
            <h2 className="text-base font-bold" style={{ color: NAVY }}>Invite a Member</h2>
            <p className="mt-0.5 text-[13px] text-muted-foreground">They will receive an email invitation to join your workspace</p>
            <hr className="my-4 border-[#E5E7EB]" />
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  placeholder="colleague@company.fr"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                  className="h-10 w-full rounded-md border border-[#E5E7EB] bg-background pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A1F44]/30"
                />
              </div>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as "Admin" | "Member")}
                className="h-10 rounded-md border border-[#E5E7EB] bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A1F44]/30"
              >
                <option value="Member">Member</option>
                <option value="Admin">Admin</option>
              </select>
              <button
                type="button"
                onClick={handleInvite}
                className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: NAVY }}
              >
                <UserPlus className="h-4 w-4" />
                Invite
              </button>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}
