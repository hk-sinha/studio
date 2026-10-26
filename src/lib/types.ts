/** Site categories. Legacy Firestore values are normalized on read (see LEGACY_TYPES in config). */
export type VideoType = "ai_ads" | "motion_ads" | "ai_cinema" | "showreels" | "ugc" | "edits";
export type Shape = "landscape" | "portrait";

export interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  /** Effective site category (legacy values mapped). */
  type: VideoType;
  /** The value actually stored in Firestore, legacy or new. */
  rawType: string;
  shape: Shape;
  mediaId: string;
  isHidden: boolean;
  sortPriority: number;
  timestamp: number;
  client: string;
  /** Best work: shown first in its category, fills the home Featured strip, gates Selected Edits. */
  featured: boolean;
  tags: string[];
  /** Optional muted MP4/WebM used for the hover preview instead of a YouTube embed. */
  previewUrl: string;
  /** Set when the Selected Edits picker hid this film, so Undo can find it. */
  hiddenBy: string;
}

export interface Profile {
  about: string;
  address: string;
  locationLink: string;
  email: string;
  phone: string;
  resumeLink: string;
  copyright: string;
  showreelId: string;
  portraitUrl: string;
}

export interface Testimonial {
  id: string;
  quote: string;
  name: string;
  role: string;
  company: string;
  photoUrl: string;
  order: number;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  company: string;
  type: string;
  timeline: string;
  message: string;
  status: "new" | "contacted" | "archived";
  createdAt: number;
}

export type LoadState = "loading" | "ready" | "error";
