"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle, WarningCircle } from "@/components/ui/icons";

/* ---------- Toasts ---------- */
type Toast = { id: number; text: string; kind: "ok" | "error" };
const ToastCtx = createContext<(text: string, kind?: Toast["kind"]) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const notify = useCallback((text: string, kind: Toast["kind"] = "ok") => {
    const id = Date.now() + Math.random();
    setItems((t) => [...t, { id, text, kind }]);
    setTimeout(() => setItems((t) => t.filter((x) => x.id !== id)), kind === "error" ? 6000 : 3200);
  }, []);
  return (
    <ToastCtx.Provider value={notify}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed bottom-5 left-1/2 z-[70] flex w-[min(440px,calc(100%-32px))] -translate-x-1/2 flex-col gap-2">
        <AnimatePresence>
          {items.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              className={`flex items-start gap-2.5 rounded-btn border px-4 py-3 text-sm shadow-[0_20px_40px_-15px_rgb(0_0_0/0.6)] backdrop-blur-xl ${
                t.kind === "ok" ? "border-line-strong bg-ink-800/95 text-fg" : "border-rec/40 bg-[#2a1314]/95 text-[#FFB3B5]"
              }`}
            >
              {t.kind === "ok" ? <CheckCircle weight="light" size={18} className="mt-px shrink-0 text-ok" /> : <WarningCircle weight="light" size={18} className="mt-px shrink-0" />}
              <span>{t.text}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}
export const useToast = () => useContext(ToastCtx);

/** Firestore permission errors usually mean the rules are not deployed or the account is wrong. */
export function errorText(e: unknown) {
  const code = (e as { code?: string })?.code ?? "";
  if (code.includes("permission-denied")) return "Firestore refused the change. Check that firestore.rules is deployed and you are signed in as the admin.";
  if (code.includes("unavailable")) return "No connection to Firestore. Check your internet and try again.";
  return (e as Error)?.message || "Something went wrong.";
}

/* ---------- Form pieces ---------- */
export function Field({ label, htmlFor, help, error, children, className = "" }: { label: string; htmlFor?: string; help?: ReactNode; error?: string; children: ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label htmlFor={htmlFor} className="text-sm font-medium">{label}</label>
      {children}
      {help && <p className="text-[13px] text-muted">{help}</p>}
      {error && <p className="text-[13px] text-[#FF8A8E]">{error}</p>}
    </div>
  );
}

export function Toggle({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between gap-4 rounded-btn border border-line-strong bg-ink-950 px-4 py-3 text-left transition-colors hover:border-fg/40"
    >
      <span>
        <span className="block text-sm font-medium">{label}</span>
        {description && <span className="block text-[13px] text-muted">{description}</span>}
      </span>
      <span className={`relative h-6 w-10 shrink-0 rounded-full transition-colors duration-300 ${checked ? "bg-fg" : "bg-ink-800"}`}>
        <motion.span
          layout
          transition={{ type: "spring", stiffness: 500, damping: 32 }}
          className={`absolute top-1 size-4 rounded-full ${checked ? "right-1 bg-ink-950" : "left-1 bg-muted"}`}
        />
      </span>
    </button>
  );
}

export function Segmented<T extends string>({ value, options, onChange, id }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; id: string }) {
  return (
    <div role="radiogroup" className="flex rounded-btn border border-line-strong bg-ink-950 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`relative flex-1 rounded-[7px] px-3 py-2 text-sm transition-colors ${value === o.value ? "text-ink-950" : "text-muted hover:text-fg"}`}
        >
          {value === o.value && <motion.span layoutId={`seg-${id}`} transition={{ type: "spring", stiffness: 400, damping: 34 }} className="absolute inset-0 rounded-[7px] bg-fg" />}
          <span className="relative">{o.label}</span>
        </button>
      ))}
    </div>
  );
}

/** First click arms the button, second click within 3s confirms. No browser confirm() popups. */
export function ConfirmButton({ onConfirm, children, armedLabel = "Click again to delete", className = "", ariaLabel }: { onConfirm: () => void; children: ReactNode; armedLabel?: string; className?: string; ariaLabel?: string }) {
  const [armed, setArmed] = useState(false);
  const t = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(t.current), []);
  return (
    <button
      type="button"
      aria-label={armed ? armedLabel : ariaLabel}
      onClick={() => {
        if (armed) {
          clearTimeout(t.current);
          setArmed(false);
          onConfirm();
        } else {
          setArmed(true);
          t.current = setTimeout(() => setArmed(false), 3000);
        }
      }}
      className={`${className} ${armed ? "!border-rec !bg-rec/15 !text-[#FFB3B5]" : ""}`}
    >
      {armed ? <span className="whitespace-nowrap px-1 text-xs">{armedLabel}</span> : children}
    </button>
  );
}

export const iconBtn =
  "grid size-9 place-items-center rounded-btn border border-line-strong text-muted transition-colors hover:border-fg hover:text-fg disabled:opacity-40";

export function EmptyState({ icon, title, children }: { icon: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-card border border-dashed border-line-strong p-8 md:p-10">
      <span className="text-muted">{icon}</span>
      <p className="font-display text-2xl uppercase">{title}</p>
      {children && <div className="max-w-[52ch] text-[15px] text-muted">{children}</div>}
    </div>
  );
}
