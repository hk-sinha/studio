import type { Profile, VideoType } from "./types";

// Only these accounts can use the admin panel. Keep in sync with firestore.rules.
export const ADMIN_EMAILS = ["raj818799@gmail.com"];

export const firebaseConfig = {
  // Firebase web config is public by design; access is controlled by firestore.rules.
  apiKey: "AIzaSyATIwjN1-E5jRLG182kaxl93t9zAWaKe0Q",
  authDomain: "my-portfolio-5cd4d.firebaseapp.com",
  projectId: "my-portfolio-5cd4d",
  storageBucket: "my-portfolio-5cd4d.firebasestorage.app",
  messagingSenderId: "330296559133",
  appId: "1:330296559133:web:5662d69b2042765e3168f4",
  measurementId: "G-1NF6V11KZ4",
};

export interface Category {
  id: VideoType;
  label: string;
  singular: string;
  /** "featured" = taller rows on the Work page; "standard" for the secondary offers. */
  size: "featured" | "standard";
}

// Order = filter order = section order in "All" (category priority).
export const CATEGORIES: Category[] = [
  { id: "ai_ads", label: "AI Ads", singular: "AI ad", size: "featured" },
  { id: "motion_ads", label: "Motion Ads", singular: "Motion ad", size: "featured" },
  { id: "ai_cinema", label: "AI Cinema", singular: "AI cinema", size: "featured" },
  { id: "showreels", label: "Showreels", singular: "Showreel", size: "featured" },
  { id: "ugc", label: "UGC", singular: "UGC", size: "standard" },
  { id: "edits", label: "Edits", singular: "Edit", size: "standard" },
];

export const categoryById = (id: string) => CATEGORIES.find((c) => c.id === id);

/** The lead offer: these fill the home Featured rows, the lens flashes and the CTA background. */
export const LEAD_TYPES: VideoType[] = ["ai_ads", "motion_ads", "ai_cinema", "showreels"];

/**
 * Old Firestore values, mapped on read (never rewritten in bulk). Includes the ids used by
 * the previous version of this site. The admin "Categories" panel writes explicit new ids.
 */
export const LEGACY_TYPES: Record<string, VideoType> = {
  ai_creations: "ai_ads",
  ad_reels: "ai_ads",
  motion_graphics: "motion_ads",
  reel: "ugc",
  creative_edits: "edits",
  selected_edits: "edits",
};

/** Films whose legacy type alone is not enough; mapped by their YouTube ID. */
export const MEDIA_CATEGORY: Record<string, VideoType> = {
  OokMN2HlOtQ: "ai_cinema", // AI Micro Drama EP-1: AI-generated series
  "9mDsUyh1UuA": "motion_ads", // GO Charge EV Setup Ad Reel: "motion graphics ad reel"
};

/** Films that don't fit one category clearly. Shown first, flagged, in the admin Categories panel. */
export const NEEDS_REVIEW: Record<string, string> = {
  "sa4Na-6tmow": "Untitled AI creation: AI Ads or AI Cinema?",
  gzEl3rwytV8: "Untitled AI creation: AI Ads or AI Cinema?",
  VUiCaPce93k: "Untitled AI creation: AI Ads or AI Cinema?",
  "57gS9JTjdr0": "Untitled AI creation: AI Ads or AI Cinema?",
  "Z87-geDNfgM": "Untitled AI creation: AI Ads or AI Cinema?",
  HELDMr3ud7g: "Untitled AI creation: AI Ads or AI Cinema?",
  jpbXuFV76Ts: "Ad reel: AI-generated or motion graphics?",
  K539fEwkW38: "Commercial: AI-generated, motion graphics, or a live shoot (then Edits)?",
  gbORfcCMQV8: "Untitled ad reel: AI Ads or Motion Ads?",
  OgVYzNKtMQs: "Untitled ad reel: AI Ads or Motion Ads?",
  pB1j3JDTSaM: "Untitled ad reel: AI Ads or Motion Ads?",
};

export function normalizeType(raw: unknown, mediaId = ""): VideoType {
  const t = String(raw ?? "");
  if (CATEGORIES.some((c) => c.id === t)) return t as VideoType; // explicit new id wins
  return MEDIA_CATEGORY[mediaId] ?? LEGACY_TYPES[t] ?? "edits";
}

/** UGC is secondary: the "All" view shows only this many pieces. */
export const UGC_IN_ALL = 3;

export interface Service {
  category: VideoType;
  title: string;
  pitch: string;
}

// Home services, in positioning order. Also the contact form's project types.
export const SERVICES: Service[] = [
  { category: "ai_ads", title: "Realistic AI Ads", pitch: "Ad-ready films generated with Seedance, Kling and Veo 3, directed frame by frame." },
  { category: "motion_ads", title: "Motion Ads", pitch: "Kinetic type, product animation and launch spots that carry the message." },
  { category: "ai_cinema", title: "AI Cinema", pitch: "AI short films and episodic series with consistent characters, voice and score." },
  { category: "ugc", title: "UGC-Style Marketing", pitch: "Creator-style reels with motion-driven edits, built for Instagram and Shorts." },
];

/** Lens flashes when none are picked in the admin (Hero tab). */
export const MAX_FLASHES = 6;

export const CLIENTS: { mark: string; name: string }[] = [
  { mark: "AH", name: "AIMHIGH AI" },
  { mark: "GC", name: "GO Charge" },
  { mark: "TH", name: "Total Health Solution" },
  { mark: "CP", name: "Career Point University" },
  { mark: "LB", name: "Lookback Magazine" },
  { mark: "PS", name: "Dr. Pratik Shah Kidney Care" },
];

// Used until Firestore answers, and for any field left empty in the admin panel.
export const DEFAULT_PROFILE: Profile = {
  about:
    "I'm Himanshu Kumar Sinha, an AI video director and motion designer. I make realistic AI ads and motion graphics for brands: scripted, storyboarded and directed frame by frame, with no shoot needed.\n\nAlongside that, I create UGC-style marketing content with motion-driven edits for Instagram and YouTube Shorts. From concept to final cut, the goal is the same: videos that make people stop, watch and act.",
  address: "Vadodara, Gujarat, India",
  locationLink: "",
  email: "raj818799@gmail.com",
  phone: "+91 91422 98969",
  resumeLink: "https://drive.google.com/file/d/1XiHfmKTn4wf87vfh5ey1Gn5I7I2xPHwA/view",
  copyright: "",
  // Top motion graphics piece until a dedicated showreel is set in the admin Profile tab.
  showreelId: "RUWW1vd8qEE",
  portraitUrl: "",
};

export const TOOLKIT_DEFAULT = ["Seedance", "Kling AI", "Veo 3", "Higgsfield", "ElevenLabs", "Premiere Pro", "After Effects", "Photoshop"];

export const SOCIALS = {
  instagram: "https://www.instagram.com/himanshu_9142",
  linkedin: "https://www.linkedin.com/in/hksinha/",
  behance: "https://www.behance.net/himanshusinha8",
  github: "https://github.com/Himanshukumarsinha0207",
};

export const EDUCATION = [
  { period: "2022 - present", title: "Bachelor of Computer Applications", place: "Career Point University" },
  { period: "2020 - 2022", title: "Senior Secondary, Commerce with IP", place: "Kendriya Vidyalaya" },
];

export const CERTIFICATIONS = [
  { year: "2024", title: "Website UI/UX Designing Using ChatGPT", issuer: "Simplilearn" },
  { year: "2024", title: "Introduction to Generative AI Studio", issuer: "Simplilearn" },
  { year: "2024", title: "Introduction to IoT", issuer: "Simplilearn" },
];
