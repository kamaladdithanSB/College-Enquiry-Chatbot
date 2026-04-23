"use client";

import { useState } from "react";
import type { InstitutionRow } from "@/lib/knowledge-base";

interface ShortlistPanelProps {
  institutions: InstitutionRow[];
}

function currency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatVerifiedDate(isoDate: string) {
  return isoDate.slice(0, 10);
}

export function ShortlistPanel({ institutions }: ShortlistPanelProps) {
  const [selected, setSelected] = useState<string[]>(
    institutions.slice(0, 3).map((item) => item.institution),
  );

  const options = institutions.map((item) => item.institution);

  const cards = selected
    .map((name) => institutions.find((item) => item.institution === name))
    .filter((item): item is InstitutionRow => Boolean(item));

  const handleSelect = (slot: number, value: string) => {
    setSelected((previous) => {
      const next = [...previous];
      next[slot] = value;
      return next;
    });
  };

  return (
    <section className="glass-zen relative rounded-[2rem] p-5 sm:p-6" aria-label="Fee comparison">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-heading text-2xl text-[#1d2d26]">Fee Comparison</h2>
        <p className="text-xs uppercase tracking-[0.18em] text-[#5f7a70]">Shortlist (3)</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((slot) => (
          <label key={slot} className="flex flex-col gap-2 text-sm text-[#2f4b40]">
            Institution {slot + 1}
            <select
              className="h-11 rounded-xl border border-white/35 bg-white/45 px-3 text-sm outline-none ring-0 focus:border-[#83b4a4]"
              value={selected[slot] ?? options[slot]}
              onChange={(event) => handleSelect(slot, event.target.value)}
            >
              {options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {cards.map((item) => (
          <article
            key={item.institution}
            className="rounded-2xl border border-white/35 bg-white/26 p-4 shadow-[0_10px_34px_rgba(45,69,60,0.14)]"
          >
            <p className="text-xs uppercase tracking-[0.16em] text-[#678b80]">Total Cost of Attendance</p>
            <h3 className="mt-2 text-lg font-semibold text-[#1f2f28]">{item.institution}</h3>
            <p className="mt-2 font-heading text-3xl leading-none text-[#1d2923]">{currency(item.tcoaUSD)}</p>
            <p className="mt-3 text-xs text-[#476257]">Verified: {formatVerifiedDate(item.lastVerified)}</p>
            {item.isStale ? (
              <p className="mt-1 text-xs font-medium text-[#9a4f3f]">Verification Warning: data older than 7 days</p>
            ) : null}
            <a
              className="mt-3 inline-flex min-h-11 items-center text-sm font-medium text-[#295f4c] underline-offset-4 hover:underline"
              href={item.sourceUrl}
              target="_blank"
              rel="noreferrer"
            >
              Source
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}
