"use client";

import { FormEvent, useEffect, useState } from "react";

type TeamRole = "OWNER" | "ADMIN" | "EDITOR" | "VIEWER";

interface InstitutionItem {
  id: string;
  name: string;
  tcoaUsd: number;
  sourceUrl: string;
  lastVerifiedAt: string;
}

interface TeamMemberItem {
  id: string;
  role: TeamRole;
  user: { email: string | null };
}

const blankForm = {
  name: "",
  aliases: "",
  campusCity: "",
  campusCountry: "",
  website: "",
  tuitionUsd: 0,
  housingUsd: 0,
  miscUsd: 0,
  feeSummary: "",
  deadlineSummary: "",
  applicationDeadline: "",
  scholarshipDeadline: "",
  sourceLabel: "",
  sourceUrl: "",
  lastVerifiedAt: new Date().toISOString(),
};

export function AdminDashboard() {
  const [institutions, setInstitutions] = useState<InstitutionItem[]>([]);
  const [members, setMembers] = useState<TeamMemberItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(blankForm);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"ADMIN" | "EDITOR" | "VIEWER">("EDITOR");

  const refresh = async () => {
    const [institutionRes, memberRes] = await Promise.all([
      fetch("/api/admin/institutions"),
      fetch("/api/admin/team/members"),
    ]);

    const institutionJson = (await institutionRes.json()) as { institutions: InstitutionItem[] };
    const memberJson = (await memberRes.json()) as { members: TeamMemberItem[] };

    setInstitutions(institutionJson.institutions ?? []);
    setMembers(memberJson.members ?? []);
  };

  useEffect(() => {
    const handle = window.setTimeout(() => {
      void refresh();
    }, 0);

    return () => window.clearTimeout(handle);
  }, []);

  const submitInstitution = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);

    await fetch("/api/admin/institutions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        campusCity: form.campusCity || null,
        campusCountry: form.campusCountry || null,
        website: form.website || null,
        applicationDeadline: form.applicationDeadline || null,
        scholarshipDeadline: form.scholarshipDeadline || null,
        aliases: form.aliases
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      }),
    });

    setForm(blankForm);
    await refresh();
    setSaving(false);
  };

  const inviteMember = async () => {
    if (!inviteEmail) {
      return;
    }

    await fetch("/api/admin/team/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
    });

    setInviteEmail("");
    await refresh();
  };

  return (
    <div className="space-y-6">
      <header className="glass-zen rounded-3xl p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-[#69887d]">Veda Admin</p>
        <h1 className="mt-2 font-heading text-4xl text-[#21352d]">Institution Verification Console</h1>
      </header>

      <section className="glass-zen rounded-3xl p-6">
        <h2 className="font-heading text-2xl text-[#21352d]">Add Institution</h2>
        <form onSubmit={submitInstitution} className="mt-4 grid gap-3 sm:grid-cols-2">
          <input className="admin-input" placeholder="Institution name" value={form.name} onChange={(e) => setForm((v) => ({ ...v, name: e.target.value }))} />
          <input className="admin-input" placeholder="Aliases comma separated" value={form.aliases} onChange={(e) => setForm((v) => ({ ...v, aliases: e.target.value }))} />
          <input className="admin-input" placeholder="Campus city" value={form.campusCity} onChange={(e) => setForm((v) => ({ ...v, campusCity: e.target.value }))} />
          <input className="admin-input" placeholder="Campus country" value={form.campusCountry} onChange={(e) => setForm((v) => ({ ...v, campusCountry: e.target.value }))} />
          <input className="admin-input" placeholder="Website" value={form.website} onChange={(e) => setForm((v) => ({ ...v, website: e.target.value }))} />
          <input className="admin-input" type="number" placeholder="Tuition USD" value={form.tuitionUsd} onChange={(e) => setForm((v) => ({ ...v, tuitionUsd: Number(e.target.value) }))} />
          <input className="admin-input" type="number" placeholder="Housing USD" value={form.housingUsd} onChange={(e) => setForm((v) => ({ ...v, housingUsd: Number(e.target.value) }))} />
          <input className="admin-input" type="number" placeholder="Misc USD" value={form.miscUsd} onChange={(e) => setForm((v) => ({ ...v, miscUsd: Number(e.target.value) }))} />
          <input className="admin-input" placeholder="Source label" value={form.sourceLabel} onChange={(e) => setForm((v) => ({ ...v, sourceLabel: e.target.value }))} />
          <input className="admin-input" placeholder="Source URL" value={form.sourceUrl} onChange={(e) => setForm((v) => ({ ...v, sourceUrl: e.target.value }))} />
          <input className="admin-input" type="datetime-local" value={form.lastVerifiedAt.slice(0, 16)} onChange={(e) => setForm((v) => ({ ...v, lastVerifiedAt: e.target.value ? new Date(e.target.value).toISOString() : new Date().toISOString() }))} />
          <input className="admin-input" type="datetime-local" value={form.applicationDeadline ? form.applicationDeadline.slice(0, 16) : ""} onChange={(e) => setForm((v) => ({ ...v, applicationDeadline: e.target.value ? new Date(e.target.value).toISOString() : "" }))} />
          <textarea className="admin-input sm:col-span-2" placeholder="Fee summary" value={form.feeSummary} onChange={(e) => setForm((v) => ({ ...v, feeSummary: e.target.value }))} />
          <textarea className="admin-input sm:col-span-2" placeholder="Deadline summary" value={form.deadlineSummary} onChange={(e) => setForm((v) => ({ ...v, deadlineSummary: e.target.value }))} />
          <button disabled={saving} className="min-h-11 rounded-full bg-[#2d5f4e] px-5 text-white sm:col-span-2" type="submit">
            {saving ? "Saving..." : "Save Institution"}
          </button>
        </form>
      </section>

      <section className="glass-zen rounded-3xl p-6">
        <h2 className="font-heading text-2xl text-[#21352d]">Team Access</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          <input className="admin-input min-w-64 flex-1" placeholder="teammate@domain.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
          <select className="admin-input min-h-11" value={inviteRole} onChange={(e) => setInviteRole(e.target.value as "ADMIN" | "EDITOR" | "VIEWER")}> 
            <option value="ADMIN">ADMIN</option>
            <option value="EDITOR">EDITOR</option>
            <option value="VIEWER">VIEWER</option>
          </select>
          <button className="min-h-11 rounded-full bg-[#234f40] px-5 text-white" type="button" onClick={inviteMember}>
            Add Teammate
          </button>
        </div>

        <ul className="mt-4 space-y-2 text-sm text-[#2f4a40]">
          {members.map((member) => (
            <li key={member.id} className="rounded-xl border border-white/35 bg-white/35 px-3 py-2">
              {member.user.email} - {member.role}
            </li>
          ))}
        </ul>
      </section>

      <section className="glass-zen rounded-3xl p-6">
        <h2 className="font-heading text-2xl text-[#21352d]">Verified Institutions</h2>
        <ul className="mt-4 space-y-2 text-sm">
          {institutions.map((institution) => (
            <li key={institution.id} className="rounded-xl border border-white/35 bg-white/35 px-3 py-2 text-[#2e4b41]">
              {institution.name} - ${institution.tcoaUsd.toLocaleString()} - verified {new Date(institution.lastVerifiedAt).toLocaleString()} - {institution.sourceUrl}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
