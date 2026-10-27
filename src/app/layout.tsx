import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Outfit } from "next/font/google";
import { SERVICES, SOCIALS } from "@/lib/config";
import "./globals.css";

// Live site only: blocks right-click, F12 and the DevTools / view-source / save shortcuts.
// A deterrent, not real protection: the browser menu can still open DevTools.
const NO_INSPECT = `(function(){
  if (/^(localhost|127\\.0\\.0\\.1)$/.test(location.hostname)) return;
  var stop = function(e){ e.preventDefault(); e.stopPropagation(); return false; };
  document.addEventListener("contextmenu", stop, true);
  document.addEventListener("dragstart", function(e){ if (e.target && e.target.tagName === "IMG") stop(e); }, true);
  document.addEventListener("keydown", function(e){
    var k = (e.key || "").toLowerCase(), mod = e.ctrlKey || e.metaKey;
    if (k === "f12"
      || (mod && e.shiftKey && (k === "i" || k === "j" || k === "c" || k === "k"))
      || (e.metaKey && e.altKey && (k === "i" || k === "j" || k === "c" || k === "u"))
      || (mod && (k === "u" || k === "s"))) return stop(e);
  }, true);
})();`;

const outfit = Outfit({ subsets: ["latin"], weight: ["300", "400", "500"], variable: "--font-outfit", display: "swap" });
const geist = Geist({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-geist", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-geist-mono", display: "swap" });

export const metadata: Metadata = {
  title: {
    default: "Himanshu Kumar Sinha | AI Video Director & Motion Designer",
    template: "%s | Himanshu Kumar Sinha",
  },
  description: "Realistic AI ads, motion ads and AI cinema for brands, plus UGC-style marketing content.",
  openGraph: {
    title: "Himanshu Kumar Sinha | AI Video Director & Motion Designer",
    description: "Realistic AI ads, motion ads and AI cinema for brands, plus UGC-style marketing content.",
    type: "website",
  },
};

// Structured data: who this is and what is offered (no shoot services).
const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": "#person",
      name: "Himanshu Kumar Sinha",
      jobTitle: "AI Video Director & Motion Designer",
      knowsAbout: ["AI video generation", "AI advertising", "Motion design", "AI filmmaking", "UGC marketing content", "Video editing"],
      sameAs: [SOCIALS.instagram, SOCIALS.linkedin, SOCIALS.behance, SOCIALS.github],
    },
    {
      "@type": "ProfessionalService",
      name: "Himanshu Kumar Sinha, AI Video Director & Motion Designer",
      founder: { "@id": "#person" },
      description: "Realistic AI ads, motion ads and AI cinema for brands, plus UGC-style marketing content with motion-driven edits.",
      areaServed: "Worldwide",
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Services",
        itemListElement: SERVICES.map((s) => ({ "@type": "Offer", itemOffered: { "@type": "Service", name: s.title, description: s.pitch } })),
      },
    },
  ],
};

export const viewport: Viewport = { themeColor: "#0B0B0C" };

// Hero intro start states only apply when motion is allowed. If scripts never run,
// the failsafe reveals the hero copy after 3s.
// lg-refract: only Chromium renders SVG filters inside backdrop-filter (Liquid Glass refraction).
const BOOT = `(function(){var d=document.documentElement;if(!matchMedia('(prefers-reduced-motion: reduce)').matches)d.classList.add('js-anim');var u=navigator.userAgentData;if(u&&u.brands&&u.brands.some(function(b){return /Chromium/.test(b.brand)}))d.classList.add('lg-refract');setTimeout(function(){d.classList.add('intro-done')},3000)})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${outfit.variable} ${geist.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: BOOT }} />
        {process.env.NODE_ENV === "production" && <script dangerouslySetInnerHTML={{ __html: NO_INSPECT }} />}
        <link rel="preconnect" href="https://i.ytimg.com" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
      </head>
      <body>
        {children}
        <div className="grain" aria-hidden="true" />
      </body>
    </html>
  );
}
