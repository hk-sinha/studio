"use client";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { DEFAULT_ABOUT, DEFAULT_HERO, byBest, fetchAboutSettings, fetchCtaMedia, fetchHeroSettings, fetchProfile, fetchProjects, fetchTestimonials, fetchToolkit, isPublic, type AboutSettings, type CtaMedia, type HeroSettings } from "@/lib/data";
import { DEFAULT_PROFILE, LEAD_TYPES, MAX_FLASHES, TOOLKIT_DEFAULT } from "@/lib/config";
import { youtubeId } from "@/lib/media";
import type { LoadState, Profile, Project, Shape, Testimonial } from "@/lib/types";

export interface Flash {
  id: string;
  shape: Shape;
}

interface SiteData {
  status: LoadState;
  /** Publicly visible video projects, best work first (see isPublic / byBest). */
  projects: Project[];
  profile: Profile;
  toolkit: string[];
  testimonials: Testimonial[];
  /** Films that flash inside the hero lens on desktop/tablet: admin picks, else the best landscape lead pieces. */
  flashes: Flash[];
  /** Same for phones (portrait screen): admin picks, else the best 9:16 lead pieces. */
  flashesMobile: Flash[];
  /** Education and certifications for the About page. */
  about: AboutSettings;
  /** Background for the final CTA, set in Admin > CTA (null = automatic film still). */
  cta: CtaMedia | null;
  hero: HeroSettings;
  retry: () => void;
}

const Ctx = createContext<SiteData | null>(null);

export function SiteDataProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<LoadState>("loading");
  const [projects, setProjects] = useState<Project[]>([]);
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [toolkit, setToolkit] = useState<string[]>(TOOLKIT_DEFAULT);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [all, setAll] = useState<Project[]>([]);
  const [hero, setHero] = useState<HeroSettings>(DEFAULT_HERO);
  const [about, setAbout] = useState<AboutSettings>(DEFAULT_ABOUT);
  const [cta, setCta] = useState<CtaMedia | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    setStatus("loading");
    // Settings are optional extras: a failure there must not take the portfolio down.
    fetchProfile().then((p) => alive && setProfile(p)).catch(() => {});
    fetchToolkit().then((t) => alive && setToolkit(t)).catch(() => {});
    fetchTestimonials().then((t) => alive && setTestimonials(t)).catch(() => {});
    fetchHeroSettings().then((h) => alive && setHero(h)).catch(() => {});
    fetchAboutSettings().then((a) => alive && setAbout(a)).catch(() => {});
    fetchCtaMedia().then((c) => alive && setCta(c)).catch(() => {});
    fetchProjects()
      .then((all) => {
        if (!alive) return;
        setAll(all);
        setProjects(all.filter(isPublic).sort(byBest));
        setStatus("ready");
      })
      .catch((err) => {
        console.error("Could not load projects", err);
        if (alive) setStatus("error");
      });
    return () => {
      alive = false;
    };
  }, [attempt]);

  const resolve = useMemo(() => {
    // Admin picks may include hidden films; look the shape up in the full list.
    const picked = (list: string[]) =>
      list
        .map((media) => ({ id: youtubeId(media) ?? "", shape: all.find((p) => p.mediaId === media || youtubeId(p.mediaId) === media)?.shape ?? ("landscape" as Shape) }))
        .filter((f) => f.id);
    const auto = (preferred: Shape) => {
      const lead = projects.filter((p) => LEAD_TYPES.includes(p.type));
      // Films that match the screen's orientation fill the frame best; fall back to the other shape.
      const ordered = [...lead.filter((p) => p.shape === preferred), ...lead.filter((p) => p.shape !== preferred)];
      return ordered.map((p) => ({ id: youtubeId(p.mediaId) ?? "", shape: p.shape })).filter((f) => f.id).slice(0, MAX_FLASHES);
    };
    return { picked, auto };
  }, [all, projects]);

  const flashes = useMemo<Flash[]>(
    () => (hero.flashes.length ? resolve.picked(hero.flashes) : resolve.auto("landscape")),
    [hero.flashes, resolve],
  );
  const flashesMobile = useMemo<Flash[]>(
    () => (hero.flashesMobile.length ? resolve.picked(hero.flashesMobile) : resolve.auto("portrait")),
    [hero.flashesMobile, resolve],
  );

  const value = useMemo(
    () => ({ status, projects, profile, toolkit, testimonials, flashes, flashesMobile, hero, about, cta, retry: () => setAttempt((n) => n + 1) }),
    [status, projects, profile, toolkit, testimonials, flashes, flashesMobile, hero, about, cta],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSiteData() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useSiteData must be used inside SiteDataProvider");
  return v;
}
