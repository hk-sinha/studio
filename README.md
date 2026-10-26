# Himanshu Kumar Sinha - Portfolio

Portfolio for an AI Video Director & Motion Designer: realistic AI ads and motion graphics first, UGC-style marketing content as a secondary offer. React 19 + Next.js 16 (static export), Tailwind CSS v4, GSAP + Lenis for scroll scenes, Motion for UI animation, Firebase (Firestore + Auth) for content and the admin panel.

## Pages

| Route | What it is |
|---|---|
| `/` | Home: lens scroll hero (end frame with glass category pills), Featured work rows that slide in opposite directions on scroll, clients, about, What I make (sticky stacking glass cards), UGC row, process, testimonials (once added), contact CTA |
| `/work/` | Filters: All, AI Ads, Motion Ads, AI Cinema, Showreels, UGC, Edits. All = sections in that order, UGC limited to 3, Edits = featured only. Share a filter with `/work/?c=motion_ads` |
| `/about/` | Bio, toolkit, education, certifications, CV |
| `/admin/` | Admin panel (owner account only) |

Categories (Firestore `type`): `ai_ads`, `motion_ads`, `ai_cinema`, `showreels`, `ugc`, `edits`. Older values are mapped when read, never rewritten in bulk: `ai_creations` and `ad_reels` show as AI Ads, `motion_graphics` as Motion Ads, `reel` as UGC, `creative_edits` as Edits. Two films are mapped by ID (`MEDIA_CATEGORY` in `src/lib/config.ts`), and 11 unclear ones are listed in `NEEDS_REVIEW` for you to assign in **Admin > Films > Categories**.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. Production build: `npm run build` (writes the static site to `out/`), preview it with `npm start`.

## Deploy (GitHub Pages)

1. Push this folder to the `main` branch of the repo (for example `hk-sinha/portfolio`).
2. In the repo: **Settings > Pages > Source: GitHub Actions**.
3. Every push to `main` runs `.github/workflows/deploy.yml`, which builds with the right base path (`/portfolio`) and publishes.

For a custom domain or a user site, the workflow sets the base path to empty automatically. To build by hand for `/portfolio`, run `NEXT_PUBLIC_BASE_PATH=/portfolio npm run build`.

## Firebase setup (do this once)

### 1. Deploy the security rules (important)

The current Firestore rules let anyone read every collection. `firestore.rules` in this folder locks writes to the owner and lets the contact form create leads. Deploy it from the Firebase Console (**Firestore Database > Rules**, paste, Publish) or with the CLI:

```bash
npx firebase-tools login
npx firebase-tools deploy --only firestore:rules --project my-portfolio-5cd4d
```

Admin access requires `raj818799@gmail.com` with a verified email. Google sign-in is always verified. For email/password sign-in, verify the address once, or just use **Continue with Google**.

### 2. Authorized domains

Firebase Console > **Authentication > Settings > Authorized domains** must include the domain the site runs on (`hk-sinha.github.io`, and `localhost` for development).

To give someone else admin access, add their email to `ADMIN_EMAILS` in `src/lib/config.ts` and to `isAdmin()` in `firestore.rules`.

## Admin panel

Sign in at `/admin/` with email/password or Google. Any other account is signed straight back out.

- **Overview**: totals, visible/hidden, films per format, recently added, new leads.
- **Films**: add or edit with a YouTube link (Shorts links switch to portrait automatically), title, description, client, format, tags, priority. Optional preview clip URL for the hover preview. Hide/show, feature (best work: shown first in its category; featured AI Ads + Motion fill the home Featured strip), delete (click twice), search and filter, grid/list view, and **Reorder** to drag films into order.
- **Categories** (panel in Films): every film with its suggested category; the unclear ones are flagged first. Pick or confirm, then **Apply** writes the category for those films only.
- **Selected Edits** (panel in Films): tick the edits to keep. It shows every pending change, flags titles/descriptions that imply a shoot, and writes nothing until **Apply**. Unticked edits get `isHidden: true` (never deleted); **Undo** restores only the ones it hid.
- **Hero**: choose up to 6 films that flash inside the lens, with **separate lists for desktop and phones** (phones are a portrait screen, so 9:16 films fill them). Pick from your films or any YouTube link, drag to order, and edit the line on the end frame. An empty list = automatic picks.
- **CTA**: upload an image (resized and compressed in the browser, saved straight into Firestore, so it works on the free Spark plan) or attach a YouTube/direct image or .mp4 link as the background of "Got a launch coming up?".
- **Education**: add, edit, reorder and remove education and certification entries for the About page. An empty list hides on the site.
- **Leads**: briefs from the Start a project form. Reply by email, mark contacted, archive, delete.
- **Testimonials**: real quotes only. The home page shows them next to the stats once at least one exists.
- **Profile**: email, phone/WhatsApp, address, map link, bio, resume link, copyright, showreel, portrait photo URL.
- **Toolkit**: the tool chips on the home and About pages (replaces the old skill percentage sliders).

## Data model (Firestore)

- `projects/{id}`: `title`, `description`, `category` ("video"), `type`, `shape` ("landscape" | "portrait"), `mediaId` (YouTube ID), `isHidden`, `sortPriority` (higher first), `timestamp`, plus new optional `client`, `featured`, `tags`, `previewUrl` (muted hover clip) and `hiddenBy` (set by the Selected Edits picker).
- `settings/profile`: `about`, `address`, `locationLink`, `email`, `phone`, `resumeLink`, `copyright`, new `showreelId`, `portraitUrl`.
- `settings/toolkit`: `tools` (string array).
- `settings/hero`: `flashes` (desktop, YouTube IDs in order), `flashesMobile` (phones) and `endLine`.
- `settings/cta`: `url` (link, YouTube id, or WebP data URL for uploads), `kind` (`image` | `video` | `youtube`).
- `settings/about`: `education` (`period`, `title`, `place`) and `certifications` (`year`, `title`, `issuer`).
- `testimonials/{id}`: `quote`, `name`, `role`, `company`, `photoUrl`, `order`.
- `leads/{id}`: `name`, `email`, `company`, `type`, `timeline`, `message`, `status`, `createdAt`.

Existing documents keep working as they are; the new fields are optional.

The default showreel is the top motion graphics piece. Set your real showreel in **Admin > Profile**.

## Swapping in real hero footage

The hero lens is drawn in code. Once the 5-second "through the lens" footage exists (see `DESIGN.md`), extract frames into `public/hero/d/001.webp ...` and pass `{ path: "/hero/d/", count: 150 }` as the `sequence` argument to `createLensRenderer` in `src/components/home/Hero.tsx`. Frames load coarse to fine and the drawn lens stays as the fallback.

The `REF/` folder holds design reference videos and is git-ignored.

## Images

- `public/about/portrait.webp`: the About page portrait (from `asset/Main.png`, background already transparent). To replace it, drop a new transparent PNG in `asset/` and export it to that path. A Portrait URL set in **Admin > Profile** takes priority.
- `public/admin/login.webp`: the admin sign-in photo (from `asset/Admin login.png`).

## Liquid Glass

The glass surfaces (`liquid`, `liquid-dark` and their `-lite` variants in `globals.css`) approximate Apple's Liquid Glass, which Apple only ships for its own platforms. In Chromium browsers the backdrop also refracts at the edges through the SVG filters in `src/components/ui/LiquidFilters.tsx` and the map `public/liquid/displacement.png`. Safari and Firefox get the same rim and highlights without the bending. `-lite` variants never refract and are used where many elements move at once (video cards, the stacking cards, the nav).
