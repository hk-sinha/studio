"use client";
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { ADMIN_EMAILS } from "@/lib/config";
import { ToastProvider } from "./ui";
import { Login } from "./Login";
import { Dashboard } from "./Dashboard";

const isAdmin = (u: User) => !!u.email && ADMIN_EMAILS.includes(u.email.toLowerCase());

export function AdminApp() {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [denied, setDenied] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.classList.add("intro-done");
    return onAuthStateChanged(auth, async (u) => {
      if (u && !isAdmin(u)) {
        // Signed in, but not the owner: sign straight back out.
        setDenied(u.email ?? "This account");
        setUser(null);
        await signOut(auth);
      } else {
        setUser(u);
        if (u) setDenied(null);
      }
      setChecking(false);
    });
  }, []);

  return (
    <ToastProvider>
      {checking ? (
        <div className="grid min-h-[100dvh] place-items-center" aria-busy="true">
          <span className="font-display text-sm uppercase tracking-[0.22em] text-muted animate-pulse">Checking session</span>
        </div>
      ) : user ? (
        <Dashboard user={user} />
      ) : (
        <Login denied={denied} />
      )}
    </ToastProvider>
  );
}
