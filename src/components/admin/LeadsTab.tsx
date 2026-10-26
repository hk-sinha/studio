"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { deleteLead, setLeadStatus } from "@/lib/data";
import type { Lead, LoadState } from "@/lib/types";
import { btn } from "@/components/ui/button";
import { EnvelopeSimple, Trash, Tray } from "@/components/ui/icons";
import { ConfirmButton, EmptyState, Segmented, errorText, iconBtn, useToast } from "./ui";

type Filter = "new" | "contacted" | "archived" | "all";

export function LeadsTab({ leads, state, reload }: { leads: Lead[]; state: LoadState; reload: () => Promise<void> }) {
  const notify = useToast();
  const [filter, setFilter] = useState<Filter>("new");
  const list = filter === "all" ? leads : leads.filter((l) => l.status === filter);
  const count = (s: Filter) => (s === "all" ? leads.length : leads.filter((l) => l.status === s).length);

  async function act(fn: () => Promise<void>, msg: string) {
    try {
      await fn();
      await reload();
      notify(msg);
    } catch (e) {
      notify(errorText(e), "error");
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="display text-[clamp(36px,4.6vw,56px)]">Leads</h1>
        <p className="mt-3 text-muted">Briefs sent from the Start a project form.</p>
      </div>

      {state === "error" ? (
        <EmptyState icon={<Tray weight="light" size={32} />} title="Leads are not reachable">
          Deploy the <code className="font-mono text-fg">firestore.rules</code> file from this project (see README). Until then the contact form cannot save briefs, and visitors are pointed to WhatsApp.
          <div><button onClick={reload} className={btn("ghost", "sm", "mt-4")}>Check again</button></div>
        </EmptyState>
      ) : (
        <>
          <div className="max-w-xl">
            <Segmented<Filter>
              id="leads"
              value={filter}
              onChange={setFilter}
              options={(["new", "contacted", "archived", "all"] as Filter[]).map((f) => ({ value: f, label: `${f[0].toUpperCase()}${f.slice(1)} (${count(f)})` }))}
            />
          </div>

          {state === "loading" && <div className="skeleton h-40 rounded-card" />}
          {state === "ready" && list.length === 0 && (
            <EmptyState icon={<Tray weight="light" size={32} />} title={filter === "new" ? "Inbox zero" : "Nothing here"}>
              {filter === "new" ? "New briefs from the contact form land here. You will also see a count on the Leads tab." : "No leads with this status."}
            </EmptyState>
          )}

          <ul className="flex flex-col gap-3">
            <AnimatePresence initial={false}>
              {list.map((l) => (
                <motion.li
                  key={l.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ type: "spring", stiffness: 100, damping: 20 }}
                  className="rounded-card border border-line bg-ink-900 p-5 md:p-6"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="flex items-center gap-2 text-[17px] font-medium">
                        {l.status === "new" && <span className="size-2 rounded-full bg-rec" aria-label="New" />}
                        {l.name}
                        {l.company && <span className="font-normal text-muted">at {l.company}</span>}
                      </p>
                      <a href={`mailto:${l.email}`} className="text-sm text-muted hover:text-fg">{l.email}</a>
                    </div>
                    <span className="font-mono text-xs text-subtle">
                      {l.createdAt ? new Date(l.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-[13px]">
                    {l.type && <span className="rounded-full border border-line-strong px-3 py-1 text-muted">{l.type}</span>}
                    {l.timeline && <span className="rounded-full border border-line-strong px-3 py-1 text-muted">{l.timeline}</span>}
                  </div>
                  <p className="mt-4 max-w-[75ch] whitespace-pre-line text-[15px] leading-relaxed">{l.message}</p>
                  <div className="mt-5 flex flex-wrap items-center gap-2">
                    <a
                      href={`mailto:${l.email}?subject=${encodeURIComponent(`Re: your ${l.type || "video"} project`)}&body=${encodeURIComponent(`Hi ${l.name.split(" ")[0]},\n\n`)}`}
                      onClick={() => l.status === "new" && act(() => setLeadStatus(l.id, "contacted"), "Marked as contacted.")}
                      className={btn("primary", "sm")}
                    >
                      <EnvelopeSimple weight="light" size={16} /> Reply
                    </a>
                    {l.status !== "contacted" && <button onClick={() => act(() => setLeadStatus(l.id, "contacted"), "Marked as contacted.")} className={btn("ghost", "sm")}>Mark contacted</button>}
                    {l.status !== "archived" && <button onClick={() => act(() => setLeadStatus(l.id, "archived"), "Archived.")} className={btn("ghost", "sm")}>Archive</button>}
                    {l.status === "archived" && <button onClick={() => act(() => setLeadStatus(l.id, "new"), "Moved back to New.")} className={btn("ghost", "sm")}>Restore</button>}
                    <ConfirmButton onConfirm={() => act(() => deleteLead(l.id), "Lead deleted.")} ariaLabel="Delete lead" armedLabel="Delete?" className={`${iconBtn} ml-auto`}>
                      <Trash weight="light" size={16} />
                    </ConfirmButton>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </>
      )}
    </div>
  );
}
