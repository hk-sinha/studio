import Link from "next/link";
import { btn } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="wrap flex min-h-[100dvh] flex-col items-start justify-center gap-6">
      <p className="font-mono text-sm text-muted">404</p>
      <h1 className="display text-[clamp(44px,7vw,96px)]">Cut from<br />the final edit.</h1>
      <p className="max-w-[40ch] text-muted">This page does not exist. The films are still where you left them.</p>
      <div className="flex flex-wrap gap-3">
        <Link href="/" className={btn("primary")}>Back home</Link>
        <Link href="/work/" className={btn("ghost")}>See the work</Link>
      </div>
    </main>
  );
}
