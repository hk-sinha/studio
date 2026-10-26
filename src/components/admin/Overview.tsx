"use client";
import type { User } from "firebase/auth";
import { motion } from "motion/react";
import { CATEGORIES, categoryById, firebaseConfig } from "@/lib/config";
import { isPublic } from "@/lib/data";
import { displayTitle } from "@/lib/media";
import type { Lead, LoadState, Project } from "@/lib/types";
import { Thumb } from "@/components/ui/Thumb";
import { ArrowRight } from "@/components/ui/icons";

type Go = (tab: "projects" | "leads") => void;

export function Overview({ user, projects, state, leads, leadsState, go }: { user: User; projects: Project[]; state: LoadState; leads: Lead[]; leadsState: LoadState; go: Go }) {
  const visible = projects.filter(isPublic);
  const stats = [
    { label: "Films", value: projects.length },
    { label: "Visible on site", value: visible.length },
    { label: "Hidden", value: projects.length - visible.length },
    { label: "New leads", value: leadsState === "ready" ? leads.filter((l) => l.status === "new").length : null },
  ];
  const recent = [...projects].sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);
  const loading = state === "loading";
  const maxCat = Math.max(1, ...CATEGORIES.map((c) => projects.filter((p) => p.type === c.id).length));

  return (
    <div className="flex flex-col gap-14">
      <div>
        <h1 className="display text-[clamp(36px,4.6vw,56px)]">Overview</h1>
        <p className="mt-3 text-muted">Signed in as {user.email}</p>
      </div>

      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-card border border-line bg-line md:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 20, delay: i * 0.05 }}
            className="flex flex-col-reverse gap-2 bg-ink-950 p-6"
          >
            <dt className="text-sm text-muted">{s.label}</dt>
            <dd className="font-display text-5xl font-light leading-none">
              {loading || s.value === null ? <span className="skeleton inline-block h-10 w-14 rounded" /> : s.value}
            </dd>
          </motion.div>
        ))}
      </dl>

      <div className="grid gap-12 lg:grid-cols-[1fr_1fr]">
        <section>
          <h2 className="mb-5 text-sm font-medium text-muted">Films by format</h2>
          <ul className="flex flex-col divide-y divide-line border-y border-line">
            {CATEGORIES.map((c) => {
              const all = projects.filter((p) => p.type === c.id);
              const shown = all.filter(isPublic).length;
              return (
                <li key={c.id} className="flex items-center gap-4 py-3.5">
                  <span className="w-36 shrink-0 text-[15px]">{c.label}</span>
                  <span className="relative h-1 flex-1 overflow-hidden rounded-full">
                    <motion.span
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: all.length / maxCat }}
                      transition={{ type: "spring", stiffness: 100, damping: 20 }}
                      className="absolute inset-0 origin-left rounded-full bg-fg/70"
                    />
                  </span>
                  <span className="w-20 text-right font-mono text-sm text-muted">{shown}/{all.length}</span>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-[13px] text-subtle">Visible / total in each format.</p>
        </section>

        <section>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-sm font-medium text-muted">Recently added</h2>
            <button onClick={() => go("projects")} className="group inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-fg">
              Manage films <ArrowRight weight="light" size={14} className="transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
          <ul className="flex flex-col divide-y divide-line border-y border-line">
            {loading && Array.from({ length: 5 }, (_, i) => (
              <li key={i} className="flex items-center gap-4 py-3"><span className="skeleton h-12 w-20 rounded-md" /><span className="skeleton h-4 flex-1 rounded" /></li>
            ))}
            {!loading && recent.map((p) => (
              <li key={p.id} className="flex items-center gap-4 py-3">
                <span className="media-box h-12 w-20 shrink-0 rounded-md bg-ink-850"><Thumb media={p.mediaId} shape={p.shape} /></span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px]">{displayTitle(p)}</span>
                  <span className="text-[13px] text-muted">{categoryById(p.type)?.label}{p.isHidden ? " · Hidden" : ""}</span>
                </span>
                <span className="font-mono text-xs text-subtle">{p.timestamp ? new Date(p.timestamp).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : ""}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="rounded-card border border-line p-6 md:p-8">
        <h2 className="mb-4 text-sm font-medium text-muted">Account & limits</h2>
        <dl className="grid gap-x-10 gap-y-4 text-[15px] sm:grid-cols-2 lg:grid-cols-4">
          <div><dt className="text-[13px] text-muted">Signed in as</dt><dd className="break-all">{user.email}</dd></div>
          <div><dt className="text-[13px] text-muted">Firebase project</dt><dd className="font-mono text-sm">{firebaseConfig.projectId}</dd></div>
          <div><dt className="text-[13px] text-muted">Free reads per day</dt><dd>50,000 (Spark plan)</dd></div>
          <div><dt className="text-[13px] text-muted">Leads inbox</dt><dd>{leadsState === "error" ? "Deploy firestore.rules to enable" : "Active"}</dd></div>
        </dl>
      </section>
    </div>
  );
}
