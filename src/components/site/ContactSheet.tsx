"use client";
import { useEffect, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useScrollApi } from "@/components/providers/SmoothScroll";
import { useSiteData } from "@/components/providers/SiteDataProvider";
import { useDialog } from "@/components/ui/useDialog";
import { useMediaQuery } from "@/components/ui/useMediaQuery";
import { btn, nudge } from "@/components/ui/button";
import { ArrowRight, ArrowUpRight, CheckCircle, CircleNotch, WarningCircle, WhatsappLogo, X } from "@/components/ui/icons";
import { SERVICES } from "@/lib/config";
import { submitLead } from "@/lib/data";
import { whatsappLink } from "@/lib/media";

type FieldKey = "name" | "email" | "type" | "message";
const EMPTY = { name: "", email: "", company: "", type: "", timeline: "Flexible", message: "", website: "" };

const RULES: Record<FieldKey, (v: string) => string> = {
  name: (v) => (v.trim() ? "" : "Please add your name."),
  email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? "" : "Please enter a valid email, like name@brand.com."),
  type: (v) => (v ? "" : "Pick the closest project type."),
  message: (v) => (v.trim().length >= 10 ? "" : "A sentence or two about the project helps me quote accurately."),
};

export function ContactSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { profile } = useSiteData();
  const { lock, unlock } = useScrollApi();
  const ref = useDialog(open, onClose);
  const mobile = useMediaQuery("(max-width: 599px)");

  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [state, setState] = useState<"idle" | "sending" | "sent" | "failed">("idle");

  useEffect(() => {
    if (!open) return;
    lock();
    if (state === "sent") {
      setForm(EMPTY);
      setState("idle");
    }
    return unlock;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const set = (k: keyof typeof EMPTY, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k as FieldKey]) setErrors((e) => ({ ...e, [k]: RULES[k as FieldKey](v) }));
  };
  const blur = (k: FieldKey) => form[k] && setErrors((e) => ({ ...e, [k]: RULES[k](form[k]) }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (form.website) return; // honeypot
    const next = Object.fromEntries((Object.keys(RULES) as FieldKey[]).map((k) => [k, RULES[k](form[k])]));
    setErrors(next);
    const firstBad = (Object.keys(next) as FieldKey[]).find((k) => next[k]);
    if (firstBad) return document.getElementById(`f-${firstBad}`)?.focus();
    setState("sending");
    try {
      await submitLead({
        name: form.name.trim(),
        email: form.email.trim(),
        company: form.company.trim(),
        type: form.type,
        timeline: form.timeline,
        message: form.message.trim(),
      });
      setState("sent");
    } catch (err) {
      console.error("Lead submit failed", err);
      setState("failed");
    }
  }

  const wa = whatsappLink(profile.phone, "Hi Himanshu, I'd like to discuss a video project.");
  const field = (k: FieldKey) => ({
    id: `f-${k}`,
    "aria-invalid": errors[k] ? true : undefined,
    "aria-describedby": errors[k] ? `f-${k}-err` : undefined,
  });

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60]">
          <motion.div
            className="absolute inset-0 bg-ink-950/70 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            ref={ref}
            role="dialog"
            aria-modal="true"
            aria-labelledby="sheet-title"
            className={`absolute flex flex-col overflow-y-auto overscroll-contain bg-ink-900 ${
              mobile
                ? "inset-x-0 bottom-0 max-h-[92dvh] rounded-t-[20px] border-t border-line"
                : "inset-y-0 right-0 w-[min(500px,100%)] border-l border-line"
            }`}
            data-lenis-prevent
            initial={mobile ? { y: "100%" } : { x: "100%" }}
            animate={mobile ? { y: 0 } : { x: 0 }}
            exit={mobile ? { y: "100%" } : { x: "100%" }}
            transition={{ type: "spring", stiffness: 260, damping: 32 }}
          >
            <header className="sticky top-0 z-[1] flex items-center justify-between border-b border-line bg-ink-900 px-6 py-5 md:px-7">
              <h2 id="sheet-title" className="display text-[28px]">Start a project</h2>
              <button onClick={onClose} aria-label="Close" className="grid size-11 place-items-center rounded-full border border-line-strong transition-colors hover:border-fg">
                <X weight="light" size={20} />
              </button>
            </header>

            {state === "sent" ? (
              <div className="flex flex-col items-start gap-4 px-6 py-16 md:px-7">
                <CheckCircle weight="light" size={48} className="text-ok" />
                <h3 className="display text-[44px]">Got it.</h3>
                <p className="text-muted">Thanks, {form.name.split(" ")[0]}. I&apos;ll reply to {form.email} within 24 hours with an approach and a quote.</p>
                <button onClick={onClose} className={btn("ghost", "md", "mt-4")} data-autofocus>Close</button>
              </div>
            ) : (
              <div className="px-6 py-7 md:px-7">
                <a href={wa} target="_blank" rel="noopener" className="flex items-center gap-4 rounded-card border border-line-strong bg-ink-850 px-5 py-4 transition-colors hover:border-fg hover:bg-ink-800">
                  <WhatsappLogo weight="fill" size={30} />
                  <span className="flex flex-1 flex-col">
                    <strong className="font-medium">Chat on WhatsApp</strong>
                    <small className="text-[13px] text-muted">Fastest reply</small>
                  </span>
                  <ArrowUpRight weight="light" size={18} />
                </a>

                <p className="my-7 flex items-center gap-4 text-[13px] text-muted before:h-px before:flex-1 before:bg-line after:h-px after:flex-1 after:bg-line">or send a brief</p>

                <form onSubmit={submit} noValidate className="flex flex-col gap-5">
                  <Field label="Name" err={errors.name} id="f-name">
                    <input {...field("name")} className="field-input" autoComplete="name" value={form.name} onChange={(e) => set("name", e.target.value)} onBlur={() => blur("name")} />
                  </Field>
                  <Field label="Email" err={errors.email} id="f-email">
                    <input {...field("email")} type="email" className="field-input" autoComplete="email" value={form.email} onChange={(e) => set("email", e.target.value)} onBlur={() => blur("email")} />
                  </Field>
                  <Field label="Company" optional id="f-company">
                    <input id="f-company" className="field-input" autoComplete="organization" value={form.company} onChange={(e) => set("company", e.target.value)} />
                  </Field>
                  <div className="grid gap-5 sm:grid-cols-2 sm:gap-4">
                    <Field label="Project type" err={errors.type} id="f-type">
                      <select {...field("type")} className="field-input" value={form.type} onChange={(e) => set("type", e.target.value)}>
                        <option value="">Choose one</option>
                        {SERVICES.map((s) => <option key={s.category}>{s.title}</option>)}
                        <option>Not sure yet</option>
                      </select>
                    </Field>
                    <Field label="Timeline" id="f-timeline">
                      <select id="f-timeline" className="field-input" value={form.timeline} onChange={(e) => set("timeline", e.target.value)}>
                        <option>Flexible</option>
                        <option>This week</option>
                        <option>2 to 4 weeks</option>
                        <option>1 to 2 months</option>
                      </select>
                    </Field>
                  </div>
                  <Field label="About the project" err={errors.message} id="f-message" help="Brand, goal, where it will run and any references.">
                    <textarea {...field("message")} rows={4} className="field-input min-h-[110px] resize-y" value={form.message} onChange={(e) => set("message", e.target.value)} onBlur={() => blur("message")} />
                  </Field>
                  <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-px w-px opacity-0" value={form.website} onChange={(e) => set("website", e.target.value)} />

                  {state === "failed" && (
                    <p role="alert" className="flex items-start gap-2 rounded-btn border border-rec/40 bg-rec/10 px-4 py-3 text-sm text-[#FF8A8E]">
                      <WarningCircle weight="light" size={20} className="mt-0.5 shrink-0" />
                      <span>That did not send. Please try again, or message me on <a href={wa} target="_blank" rel="noopener" className="underline">WhatsApp</a>.</span>
                    </p>
                  )}

                  <button type="submit" disabled={state === "sending"} className={btn("primary", "md", "w-full")}>
                    {state === "sending" ? (
                      <>Sending <CircleNotch weight="light" size={18} className="animate-spin" /></>
                    ) : (
                      <>Send brief <ArrowRight weight="light" size={18} className={nudge} /></>
                    )}
                  </button>
                </form>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function Field({ label, id, err, help, optional, children }: { label: string; id: string; err?: string; help?: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium">
        {label} {optional && <span className="font-normal text-muted">(optional)</span>}
      </label>
      {children}
      {help && <p className="text-[13px] text-muted">{help}</p>}
      {err && <p id={`${id}-err`} className="text-[13px] text-[#FF8A8E]">{err}</p>}
    </div>
  );
}
