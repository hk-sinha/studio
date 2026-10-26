"use client";
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { ContactSheet } from "@/components/site/ContactSheet";
import { VideoModal, type VideoTarget } from "@/components/site/VideoModal";

interface UIState {
  openContact: () => void;
  openVideo: (target: VideoTarget) => void;
  /** Home hero sets this while the light opening frame is on screen. */
  heroLight: boolean;
  setHeroLight: (v: boolean) => void;
  /** Scroll position where the home hero releases its pin (nav turns solid after it). */
  heroEnd: React.MutableRefObject<number>;
}

const Ctx = createContext<UIState | null>(null);

export function UIProvider({ children }: { children: ReactNode }) {
  const [contactOpen, setContactOpen] = useState(false);
  const [video, setVideo] = useState<VideoTarget | null>(null);
  // Start light on the home page so the nav does not fade in from dark on first paint.
  const [heroLight, setHeroLight] = useState(usePathname() === "/");
  const heroEnd = useRef(0);

  const openContact = useCallback(() => setContactOpen(true), []);
  const openVideo = useCallback((t: VideoTarget) => setVideo(t), []);

  const value = useMemo(
    () => ({ openContact, openVideo, heroLight, setHeroLight, heroEnd }),
    [openContact, openVideo, heroLight],
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      <ContactSheet open={contactOpen} onClose={() => setContactOpen(false)} />
      <VideoModal target={video} onClose={() => setVideo(null)} />
    </Ctx.Provider>
  );
}

export function useUI() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useUI must be used inside UIProvider");
  return v;
}
