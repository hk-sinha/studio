"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { GoogleAuthProvider, sendPasswordResetEmail, signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { asset } from "@/lib/media";
import { Brand } from "@/components/site/Brand";
import { btn } from "@/components/ui/button";
import { ArrowRight, CircleNotch, Eye, EyeSlash, GoogleLogo, LockSimple, WarningCircle } from "@/components/ui/icons";

function friendly(code: string) {
  if (/invalid-credential|wrong-password|user-not-found|invalid-email/.test(code)) return "That email and password do not match.";
  if (code.includes("too-many-requests")) return "Too many attempts. Wait a minute and try again.";
  if (code.includes("network-request-failed")) return "No internet connection. Check it and try again.";
  if (code.includes("popup-blocked")) return "The browser blocked the Google window. Allow pop-ups for this site and try again.";
  if (code.includes("unauthorized-domain")) return "This domain is not allowed to sign in yet. Add it under Firebase Console > Authentication > Settings > Authorized domains.";
  return "Sign-in failed. Please try again.";
}

export function Login({ denied }: { denied: string | null }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState<"" | "email" | "google" | "reset">("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!email || !password) return setError("Enter your email and password.");
    setBusy("email"); setError(""); setInfo("");
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err) {
      setError(friendly((err as { code?: string }).code ?? ""));
      setBusy("");
    }
  }

  async function google() {
    setBusy("google"); setError(""); setInfo("");
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (err) {
      const code = (err as { code?: string }).code ?? "";
      if (!code.includes("popup-closed") && !code.includes("cancelled-popup")) setError(friendly(code));
      setBusy("");
    }
  }

  async function reset() {
    if (!email) return setError("Type your email first, then choose Forgot password.");
    setBusy("reset"); setError("");
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setInfo(`If ${email.trim()} has an account, a reset link is on its way.`);
    } catch (err) {
      setError(friendly((err as { code?: string }).code ?? ""));
    }
    setBusy("");
  }

  const message = error || (denied ? `${denied} is not allowed into this admin panel. Sign in with the owner account.` : "");

  return (
    <main className="grid min-h-[100dvh] md:grid-cols-[5fr_6fr]">
      <div className="flex flex-col justify-between gap-12 px-5 py-8 sm:px-10 md:px-[clamp(32px,5vw,80px)] md:py-12">
        <Link href="/" aria-label="Back to the site"><Brand /></Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
          className="w-full max-w-[420px]"
        >
          <p className="mb-4 inline-flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-muted">
            <LockSimple weight="light" size={14} /> Admin
          </p>
          <h1 className="display text-[clamp(40px,5vw,64px)]">Welcome<br />back.</h1>
          <p className="mt-4 text-muted">Manage films, leads and profile details.</p>

          <form onSubmit={submit} noValidate className="mt-10 flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label htmlFor="a-email" className="text-sm font-medium">Email</label>
              <input id="a-email" type="email" autoComplete="username" className="field-input" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label htmlFor="a-pass" className="text-sm font-medium">Password</label>
                <button type="button" onClick={reset} disabled={!!busy} className="text-[13px] text-muted underline-offset-4 hover:text-fg hover:underline">
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input id="a-pass" type={show ? "text" : "password"} autoComplete="current-password" className="field-input pr-12" value={password} onChange={(e) => setPassword(e.target.value)} />
                <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"} className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-md text-muted hover:text-fg">
                  {show ? <EyeSlash weight="light" size={18} /> : <Eye weight="light" size={18} />}
                </button>
              </div>
            </div>

            {message && (
              <p role="alert" className="flex items-start gap-2 rounded-btn border border-rec/40 bg-rec/10 px-4 py-3 text-sm text-[#FFB3B5]">
                <WarningCircle weight="light" size={18} className="mt-px shrink-0" /> {message}
              </p>
            )}
            {info && <p role="status" className="rounded-btn border border-line-strong px-4 py-3 text-sm text-muted">{info}</p>}

            <button type="submit" disabled={!!busy} className={btn("primary", "md", "w-full")}>
              {busy === "email" ? <>Signing in <CircleNotch weight="light" size={18} className="animate-spin" /></> : <>Sign in <ArrowRight weight="light" size={18} /></>}
            </button>
          </form>

          <p className="my-6 flex items-center gap-4 text-[13px] text-muted before:h-px before:flex-1 before:bg-line after:h-px after:flex-1 after:bg-line">or</p>

          <button type="button" onClick={google} disabled={!!busy} className={btn("ghost", "md", "w-full")}>
            {busy === "google" ? <CircleNotch weight="light" size={18} className="animate-spin" /> : <GoogleLogo weight="light" size={18} />}
            Continue with Google
          </button>
        </motion.div>

        <p className="text-[13px] text-subtle">Only the site owner can sign in here.</p>
      </div>

      <div className="relative hidden overflow-hidden bg-ink-850 md:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset("/admin/login.webp")} alt="" fetchPriority="high" className="absolute inset-0 size-full object-cover object-[50%_35%]" />
        <span className="absolute inset-0 bg-gradient-to-r from-ink-950 via-ink-950/25 to-transparent" />
      </div>
    </main>
  );
}
