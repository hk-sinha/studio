"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { signOut, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { fetchLeads, fetchProjects } from "@/lib/data";
import type { Lead, LoadState, Project } from "@/lib/types";
import { Brand } from "@/components/site/Brand";
import { ArrowSquareOut, SignOut } from "@/components/ui/icons";
import { errorText, useToast } from "./ui";
import { Overview } from "./Overview";
import { ProjectsTab } from "./ProjectsTab";
import { LeadsTab } from "./LeadsTab";
import { TestimonialsTab } from "./TestimonialsTab";
import { ProfileTab } from "./ProfileTab";
import { ToolkitTab } from "./ToolkitTab";
import { HeroTab } from "./HeroTab";
import { EducationTab } from "./EducationTab";
import { CtaTab } from "./CtaTab";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "projects", label: "Films" },
  { id: "hero", label: "Hero" },
  { id: "cta", label: "CTA" },
  { id: "leads", label: "Leads" },
  { id: "testimonials", label: "Testimonials" },
  { id: "profile", label: "Profile" },
  { id: "education", label: "Education" },
  { id: "toolkit", label: "Toolkit" },
] as const;
type TabId = (typeof TABS)[number]["id"];

export function Dashboard({ user }: { user: User }) {
  const notify = useToast();
  const [tab, setTab] = useState<TabId>("overview");
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsState, setProjectsState] = useState<LoadState>("loading");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadsState, setLeadsState] = useState<LoadState>("loading");

  const loadProjects = useCallback(async () => {
    try {
      setProjects(await fetchProjects());
      setProjectsState("ready");
    } catch (e) {
      setProjectsState("error");
      notify(errorText(e), "error");
    }
  }, [notify]);

  const loadLeads = useCallback(async () => {
    try {
      setLeads(await fetchLeads());
      setLeadsState("ready");
    } catch (e) {
      // Leads need the new rules; keep the rest of the dashboard usable without them.
      setLeadsState("error");
      console.warn("Leads unavailable", e);
    }
  }, []);

  useEffect(() => {
    loadProjects();
    loadLeads();
  }, [loadProjects, loadLeads]);

  // Remember the open tab across reloads.
  useEffect(() => {
    try {
      const saved = localStorage.getItem("hks-admin-tab") as TabId | null;
      if (saved && TABS.some((t) => t.id === saved)) setTab(saved);
    } catch { /* storage unavailable */ }
  }, []);
  const choose = (id: TabId) => {
    setTab(id);
    try { localStorage.setItem("hks-admin-tab", id); } catch { /* storage unavailable */ }
  };

  const newLeads = leads.filter((l) => l.status === "new").length;

  return (
    <div className="min-h-[100dvh]">
      <header className="sticky top-0 z-40 border-b border-line bg-ink-950/80 backdrop-blur-xl">
        <div className="wrap flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" aria-label="View site"><Brand /></Link>
            <span className="rounded-full border border-line-strong px-2.5 py-0.5 text-[11px] uppercase tracking-[0.16em] text-muted">Admin</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-[13px] text-muted lg:inline">{user.email}</span>
            <Link href="/" target="_blank" className="hidden h-9 items-center gap-2 rounded-btn border border-line-strong px-3 text-[13px] text-muted transition-colors hover:border-fg hover:text-fg sm:inline-flex">
              View site <ArrowSquareOut weight="light" size={15} />
            </Link>
            <button onClick={() => signOut(auth)} className="inline-flex h-9 items-center gap-2 rounded-btn border border-line-strong px-3 text-[13px] text-muted transition-colors hover:border-fg hover:text-fg">
              <SignOut weight="light" size={15} /> Sign out
            </button>
          </div>
        </div>
        <nav aria-label="Admin sections" className="wrap no-scrollbar flex gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => choose(t.id)}
              aria-current={tab === t.id ? "page" : undefined}
              className={`relative shrink-0 px-3 pb-3 pt-1 text-sm transition-colors ${tab === t.id ? "text-fg" : "text-muted hover:text-fg"}`}
            >
              {t.label}
              {t.id === "leads" && newLeads > 0 && (
                <span className="ml-1.5 rounded-full bg-rec px-1.5 py-px font-mono text-[11px] text-white">{newLeads}</span>
              )}
              {tab === t.id && <motion.span layoutId="admin-tab" transition={{ type: "spring", stiffness: 400, damping: 34 }} className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-fg" />}
            </button>
          ))}
        </nav>
      </header>

      <main className="wrap py-10 md:py-14">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            {tab === "overview" && <Overview user={user} projects={projects} state={projectsState} leads={leads} leadsState={leadsState} go={choose} />}
            {tab === "projects" && <ProjectsTab projects={projects} state={projectsState} reload={loadProjects} />}
            {tab === "hero" && (projectsState === "ready" ? <HeroTab projects={projects} /> : <div className="skeleton h-64 rounded-card" />)}
            {tab === "leads" && <LeadsTab leads={leads} state={leadsState} reload={loadLeads} />}
            {tab === "testimonials" && <TestimonialsTab />}
            {tab === "profile" && <ProfileTab />}
            {tab === "education" && <EducationTab />}
            {tab === "cta" && <CtaTab />}
            {tab === "toolkit" && <ToolkitTab />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
