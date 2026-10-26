"use client";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUI } from "@/components/providers/UIProvider";
import { useScrollApi } from "@/components/providers/SmoothScroll";
import { btn } from "@/components/ui/button";
import { Brand } from "@/components/site/Brand";
import { List, X } from "@/components/ui/icons";
import { ScrollTrigger } from "@/lib/scroll";

const LINKS = [
  { href: "/work/", label: "Work" },
  { href: "/#services", label: "Services" },
  { href: "/about/", label: "About" },
];

export function Nav() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const { openContact, heroLight, heroEnd } = useUI();
  const { scrollTo, lock, unlock } = useScrollApi();
  const [solid, setSolid] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [menu, setMenu] = useState(false);
  const menuRef = useRef(false);
  menuRef.current = menu;

  // Scroll state via ScrollTrigger (works with and without Lenis), state only changes on threshold crossings.
  useEffect(() => {
    const st = ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: (self) => {
        const y = self.scroll();
        const threshold = isHome ? Math.max(heroEnd.current, 40) : 40;
        const s = y > threshold;
        setSolid((p) => (p === s ? p : s));
        const h = s && self.direction === 1 && y > threshold + 160 && !menuRef.current;
        setHidden((p) => (p === h ? p : h));
      },
    });
    return () => st.kill();
  }, [isHome, heroEnd]);

  useEffect(() => setMenu(false), [pathname]);
  useEffect(() => {
    if (!menu) return;
    lock();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenu(false);
    document.addEventListener("keydown", onKey);
    return () => {
      unlock();
      document.removeEventListener("keydown", onKey);
    };
  }, [menu, lock, unlock]);

  // Same-page anchors scroll smoothly instead of jumping.
  const onLink = (e: MouseEvent, href: string) => {
    setMenu(false);
    if (href.startsWith("/#") && isHome) {
      e.preventDefault();
      setTimeout(() => scrollTo(href.slice(1)), menu ? 50 : 0);
    }
  };

  const light = isHome && heroLight && !solid && !menu;

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-40 h-[68px] border-b transition-[transform,background-color,border-color,color] duration-500 ease-expo ${
          light ? "text-paper-ink" : "text-fg"
        } ${menu ? "bg-ink-950" : ""} border-transparent ${hidden ? "-translate-y-full" : ""}`}
      >
        <div className="wrap flex h-full items-center justify-between gap-6">
          <Link href="/" aria-label="Himanshu Sinha, home" onClick={() => setMenu(false)}>
            <Brand />
          </Link>
          <nav aria-label="Primary" className="hidden gap-10 text-sm min-[900px]:flex">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={(e) => onLink(e, l.href)}
                className={`transition-opacity hover:opacity-100 ${pathname === l.href ? "opacity-100" : "opacity-70"}`}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <button onClick={() => { setMenu(false); openContact(); }} className={btn(light ? "paper" : "primary", "sm")}>
              Start a project
            </button>
            <button
              onClick={() => setMenu((m) => !m)}
              aria-expanded={menu}
              aria-controls="mobile-menu"
              aria-label={menu ? "Close menu" : "Open menu"}
              className="grid size-10 place-items-center rounded-btn min-[900px]:hidden"
            >
              {menu ? <X weight="light" size={22} /> : <List weight="light" size={22} />}
            </button>
          </div>
        </div>
      </header>

      <div
        id="mobile-menu"
        className={`fixed inset-0 z-[39] bg-ink-950 pt-[100px] transition-opacity duration-300 min-[900px]:hidden ${menu ? "opacity-100" : "pointer-events-none invisible opacity-0"}`}
      >
        <nav aria-label="Mobile" className="wrap flex flex-col gap-1">
          {[{ href: "/", label: "Home" }, ...LINKS].map((l, i) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={(e) => onLink(e, l.href)}
              className={`display py-1.5 text-[44px] transition-[transform,opacity] duration-700 ease-expo ${menu ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}
              style={{ transitionDelay: menu ? `${80 + i * 50}ms` : "0ms" }}
              tabIndex={menu ? 0 : -1}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}
