import { thumbUrl } from "./media";

/*
  "Through the lens" hero renderer (DESIGN.md section 5).
  Procedural for now: a lens on paper, dollying in until its aperture fills the
  frame, flashes of real films, then black. Pass `sequence` once real frames exist.
*/

export interface FrameSequence {
  path: string; // e.g. "/hero/d/"
  count: number;
  ext?: string;
  pad?: number;
}

const PAPER = [237, 237, 235];
const INK = [11, 11, 12];
const TAU = Math.PI * 2;
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const seg = (p: number, a: number, b: number) => clamp((p - a) / (b - a));
const smooth = (t: number) => t * t * (3 - 2 * t);
const mixRGB = (a: number[], b: number[], t: number) => `rgb(${a.map((v, i) => Math.round(lerp(v, b[i], t))).join(",")})`;

export function createLensRenderer(canvas: HTMLCanvasElement, sequence?: FrameSequence) {
  const ctx = canvas.getContext("2d")!;
  let W = 0, H = 0, mobile = false, last = 0;
  let flashes: { img: HTMLImageElement; shape: "landscape" | "portrait" }[] = [];
  // Tiny downscaled copy of a still: drawn back up it reads as a soft blur (cheap, works in Safari).
  let backdrop: HTMLCanvasElement | null = null;

  /* ---------- optional real frame sequence ---------- */
  const frames: (ImageBitmap | undefined)[] = sequence ? new Array(sequence.count) : [];
  let seqReady = false;
  let disposed = false;
  if (sequence) {
    const url = (i: number) => `${sequence.path}${String(i + 1).padStart(sequence.pad ?? 3, "0")}.${sequence.ext ?? "webp"}`;
    const load = async (i: number) => {
      if (frames[i] || disposed) return;
      try {
        const res = await fetch(url(i));
        if (!res.ok) return;
        frames[i] = await createImageBitmap(await res.blob());
        seqReady = true;
        if (Math.abs(i - last * (sequence.count - 1)) < 8) render(last);
      } catch { /* nearest loaded frame is used */ }
    };
    // Coarse to fine so scrubbing works before everything has loaded.
    (async () => { for (const step of [8, 4, 2, 1]) for (let i = 0; i < sequence.count; i += step) await load(i); })();
  }

  function setFlashes(list: { id: string; shape: "landscape" | "portrait" }[]) {
    backdrop = null;
    flashes = list.slice(0, 6).map(({ id, shape }, i) => {
      // No crossOrigin: the canvas is only drawn to, never read back, so tainting is fine.
      const img = new Image();
      // 9:16 films use hqdefault, whose pillarbox geometry is known (see srcRect).
      img.src = thumbUrl(id, shape === "landscape" ? "maxresdefault" : "hqdefault");
      img.onload = () => {
        if (img.naturalWidth <= 120 && !img.dataset.fb) {
          img.dataset.fb = "1";
          img.src = thumbUrl(id);
          return;
        }
        makeBackdrop();
      };
      return { img, shape };
    });
  }

  /** The real picture inside a YouTube thumbnail (without its letterbox / pillarbox bars). */
  function srcRect(img: HTMLImageElement, shape: "landscape" | "portrait") {
    const iw = img.naturalWidth, ih = img.naturalHeight;
    const is43 = Math.abs(ih / iw - 0.75) < 0.01;
    if (shape === "portrait") {
      const cw = ih * (9 / 16);
      return { sx: (iw - cw) / 2, sy: 0, sw: cw, sh: ih };
    }
    const ch = is43 ? iw * 0.5625 : ih;
    return { sx: 0, sy: (ih - ch) / 2, sw: iw, sh: ch };
  }

  /**
   * Blend up to four loaded flash films side by side into a tiny canvas. Scaled back up it
   * becomes a soft colour field, so one film with a big logo can't dominate as a blob.
   */
  function makeBackdrop() {
    const ready = flashes.filter((f) => f.img.complete && f.img.naturalWidth > 120).slice(0, 4);
    if (!ready.length) return;
    const c = document.createElement("canvas");
    c.width = 48;
    c.height = 27;
    const g = c.getContext("2d")!;
    const tw = c.width / ready.length;
    ready.forEach(({ img, shape }, k) => {
      const r = srcRect(img, shape);
      // Cover-crop each film into its column.
      const want = tw / c.height, have = r.sw / r.sh;
      const sw = have > want ? r.sh * want : r.sw, sh = have > want ? r.sh : r.sw / want;
      g.drawImage(img, r.sx + (r.sw - sw) / 2, r.sy + (r.sh - sh) / 2, sw, sh, k * tw, 0, tw, c.height);
    });
    // Blur once into a cached canvas; each frame then only draws this image.
    const soft = document.createElement("canvas");
    soft.width = 256;
    soft.height = 144;
    const s = soft.getContext("2d")!;
    s.imageSmoothingEnabled = true;
    s.imageSmoothingQuality = "high";
    // Plain boolean check: "filter" in s would narrow s to never in the fallback branch.
    const canFilter = "filter" in (s as object);
    if (canFilter) {
      s.filter = "blur(18px)";
      s.drawImage(c, -40, -24, soft.width + 80, soft.height + 48); // overdraw so edges stay filled
    } else {
      // No canvas filter (older Safari): go through an even smaller canvas instead.
      const t = document.createElement("canvas");
      t.width = 12;
      t.height = 7;
      t.getContext("2d")!.drawImage(c, 0, 0, t.width, t.height);
      s.drawImage(t, 0, 0, soft.width, soft.height);
    }
    backdrop = soft;
    render(last);
  }

  /** End frame: a slow, blurred, dimmed film behind the closing line, so it never reads as empty. */
  function drawBackdrop(p: number) {
    if (!backdrop || p < 0.78) return;
    const k = seg(p, 0.78, 1);
    const s = Math.max(W / backdrop.width, H / backdrop.height) * (1.12 - 0.08 * k);
    const dw = backdrop.width * s, dh = backdrop.height * s;
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.globalAlpha = 0.42 * smooth(seg(p, 0.78, 0.86));
    ctx.drawImage(backdrop, (W - dw) / 2, (H - dh) / 2, dw, dh);
    ctx.globalAlpha = 1;
    // Even dim plus top/bottom falloff: reads as a frosted full-frame film, not a spotlight.
    ctx.fillStyle = "rgba(11,11,12,.35)";
    ctx.fillRect(0, 0, W, H);
    const v = ctx.createLinearGradient(0, 0, 0, H);
    v.addColorStop(0, "rgba(11,11,12,.9)");
    v.addColorStop(0.3, "rgba(11,11,12,0)");
    v.addColorStop(0.7, "rgba(11,11,12,0)");
    v.addColorStop(1, "rgba(11,11,12,1)");
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    mobile = W < 900;
    render(last);
  }

  const circle = (x: number, y: number, r: number) => { ctx.beginPath(); ctx.arc(x, y, Math.max(r, 0), 0, TAU); };

  function ringText(str: string, cx: number, cy: number, r: number, size: number, start: number) {
    ctx.save();
    ctx.font = `500 ${size}px "Geist Mono", ui-monospace, monospace`;
    ctx.fillStyle = "rgba(255,255,255,.4)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    let a = start;
    for (const ch of str) {
      const da = (ctx.measureText(ch).width + size * 0.14) / r;
      a += da / 2;
      ctx.save();
      ctx.translate(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      ctx.rotate(a + Math.PI / 2);
      ctx.fillText(ch, 0, 0);
      ctx.restore();
      a += da / 2;
    }
    ctx.restore();
  }

  function drawGuide(alpha: number) {
    if (alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = "#DEDEDB";
    ctx.lineWidth = 14;
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(-10, H * 0.84);
    ctx.lineTo(W * 0.41, H * 0.84);
    ctx.lineTo(W * 0.46, H * 0.74);
    ctx.lineTo(W + 10, H * 0.74);
    ctx.stroke();
    ctx.restore();
  }

  function drawLens(p: number, light: number) {
    const m = Math.min(W, H);
    // Phones: smaller and lower, so it sits under the CTAs and dips behind the band.
    const R0 = mobile ? Math.min(W * 0.36, H * 0.2) : m * 0.27;
    const Rend = Math.hypot(W, H) * 1.5;
    const z = Math.pow(seg(p, 0.05, 0.62), 1.7);
    const R = R0 * Math.pow(Rend / R0, z) * (1 + 0.025 * smooth(seg(p, 0, 0.06)));
    const t = smooth(seg(p, 0.04, 0.5));
    // 0.77: keeps the two-line headline clear of the lens from 1024px wide upward.
    const cx = lerp(mobile ? W * 0.5 : W * 0.77, W / 2, t);
    const cy = lerp(mobile ? H * 0.82 : H * 0.5, H / 2, t);
    const open = smooth(seg(p, 0.2, 0.6));
    const rot = p * 1.6;

    if (light > 0.01) {
      ctx.save();
      ctx.globalAlpha = light * 0.5;
      const sx = cx + R * 0.1, sy = cy + R * 0.14;
      const g = ctx.createRadialGradient(sx, sy, R * 0.7, sx, sy, R * 1.45);
      g.addColorStop(0, "rgba(0,0,0,.45)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      circle(sx, sy, R * 1.45);
      ctx.fill();
      ctx.restore();
    }

    // Barrel
    let g: CanvasGradient = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.05, cx, cy, R);
    g.addColorStop(0, "#3b3b40");
    g.addColorStop(0.55, "#1d1d20");
    g.addColorStop(1, "#0d0d0f");
    ctx.fillStyle = g;
    circle(cx, cy, R);
    ctx.fill();
    ctx.lineWidth = Math.max(1, R * 0.01);
    ctx.strokeStyle = "rgba(255,255,255,.16)";
    circle(cx, cy, R * 0.994);
    ctx.stroke();

    // Knurled focus ring
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,.075)";
    ctx.lineWidth = Math.max(1, R * 0.007);
    ctx.beginPath();
    for (let i = 0; i < 160; i++) {
      const a = rot * 0.3 + (i / 160) * TAU, c = Math.cos(a), s = Math.sin(a);
      ctx.moveTo(cx + c * R * 0.875, cy + s * R * 0.875);
      ctx.lineTo(cx + c * R * 0.965, cy + s * R * 0.965);
    }
    ctx.stroke();
    ctx.restore();
    ctx.strokeStyle = "rgba(255,255,255,.12)";
    ctx.lineWidth = Math.max(1, R * 0.006);
    circle(cx, cy, R * 0.86);
    ctx.stroke();

    // Engraving + red index dot (the one accent)
    const ts = R * 0.04;
    // Neutral engraving: no camera specs (the site does not offer shoots).
    if (ts > 5 && ts < 140) ringText("HKS   ·   AI ADS   ·   MOTION   ·   DIRECTION", cx, cy, R * 0.805, ts, -Math.PI * 0.86 - rot * 0.08);
    const da = -Math.PI / 2 - rot * 0.08 - 0.12;
    ctx.fillStyle = "#E5484D";
    circle(cx + Math.cos(da) * R * 0.805, cy + Math.sin(da) * R * 0.805, R * 0.016);
    ctx.fill();

    // Inner bevel
    g = ctx.createLinearGradient(cx, cy - R * 0.76, cx, cy + R * 0.76);
    g.addColorStop(0, "#2c2c31");
    g.addColorStop(1, "#070708");
    ctx.fillStyle = g;
    circle(cx, cy, R * 0.755);
    ctx.fill();

    // Glass + aperture
    const gR = R * 0.7;
    ctx.save();
    circle(cx, cy, gR);
    ctx.clip();
    g = ctx.createRadialGradient(cx, cy, 0, cx, cy, gR);
    g.addColorStop(0, "#16171c");
    g.addColorStop(1, "#0b0c10");
    ctx.fillStyle = g;
    ctx.fillRect(cx - gR, cy - gR, gR * 2, gR * 2);

    const blades = 7;
    const a = gR * lerp(0.3, 1.2, open);
    const pts: [number, number][] = [];
    for (let i = 0; i < blades; i++) {
      const ang = -rot * 0.5 + (i / blades) * TAU;
      pts.push([cx + Math.cos(ang) * a, cy + Math.sin(ang) * a]);
    }
    ctx.strokeStyle = "rgba(255,255,255,.07)";
    ctx.lineWidth = Math.max(1, R * 0.004);
    ctx.beginPath();
    pts.forEach(([x, y], i) => {
      const [nx, ny] = pts[(i + 1) % blades];
      const dx = nx - x, dy = ny - y, len = Math.hypot(dx, dy) || 1;
      ctx.moveTo(x, y);
      ctx.lineTo(x - (dx / len) * gR * 2, y - (dy / len) * gR * 2);
    });
    ctx.stroke();
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    g = ctx.createRadialGradient(cx, cy, 0, cx, cy, a);
    g.addColorStop(0, "#17171b");
    g.addColorStop(1, "#0B0B0C");
    ctx.fillStyle = g;
    ctx.fill();

    // Coating reflections + specular highlights
    ctx.lineWidth = gR * 0.05;
    ctx.lineCap = "round";
    ctx.strokeStyle = "rgba(120,190,160,.10)";
    ctx.beginPath();
    ctx.arc(cx, cy, gR * 0.82, Math.PI * 1.04, Math.PI * 1.42);
    ctx.stroke();
    ctx.strokeStyle = "rgba(230,175,120,.08)";
    ctx.beginPath();
    ctx.arc(cx, cy, gR * 0.6, Math.PI * 1.12, Math.PI * 1.34);
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,.22)";
    ctx.beginPath();
    ctx.ellipse(cx - gR * 0.42, cy - gR * 0.44, gR * 0.17, gR * 0.07, -0.75, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,.08)";
    ctx.beginPath();
    ctx.ellipse(cx + gR * 0.35, cy + gR * 0.42, gR * 0.1, gR * 0.035, -0.75, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawFlashes(p: number) {
    const a = 0.64, b = 0.8;
    if (p < a || p > b || !flashes.length) return;
    const n = flashes.length;
    const f = seg(p, a, b) * n;
    const i = Math.min(n - 1, Math.floor(f));
    const local = f - i;
    if (local < 0.12 || local > 0.88) return;
    const { img, shape } = flashes[i];
    if (!img.complete || !img.naturalWidth) return;
    const k = seg(local, 0.12, 0.88);
    const r = srcRect(img, shape);
    const scale = Math.max(W / r.sw, H / r.sh) * (1.08 - 0.08 * k);
    const dw = r.sw * scale, dh = r.sh * scale;
    ctx.save();
    ctx.globalAlpha = Math.min(1, Math.sin(k * Math.PI) * 2.4) * 0.85;
    ctx.drawImage(img, r.sx, r.sy, r.sw, r.sh, (W - dw) / 2, (H - dh) / 2, dw, dh);
    const v = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.25, W / 2, H / 2, Math.hypot(W, H) * 0.6);
    v.addColorStop(0, "rgba(11,11,12,0)");
    v.addColorStop(1, "rgba(11,11,12,.85)");
    ctx.globalAlpha = 1;
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  function drawSequence(p: number) {
    const count = frames.length;
    const t = Math.round(p * (count - 1));
    let img: ImageBitmap | undefined;
    for (let d = 0; d < count && !img; d++) img = frames[t - d] || frames[t + d];
    if (!img) return false;
    const s = Math.max(W / img.width, H / img.height);
    ctx.drawImage(img, (W - img.width * s) / 2, (H - img.height * s) / 2, img.width * s, img.height * s);
    return true;
  }

  function render(p: number) {
    last = p;
    if (!W || !H) return;
    if (seqReady && drawSequence(p)) return;
    const dark = smooth(seg(p, 0.36, 0.6));
    ctx.fillStyle = mixRGB(PAPER, INK, dark);
    ctx.fillRect(0, 0, W, H);
    if (!mobile) drawGuide(1 - seg(p, 0, 0.22));
    if (p < 0.63) drawLens(p, 1 - dark);
    else {
      ctx.fillStyle = "#0B0B0C";
      ctx.fillRect(0, 0, W, H);
    }
    drawFlashes(p);
    drawBackdrop(p);
  }

  function dispose() {
    disposed = true;
    frames.forEach((f) => f?.close());
  }

  return { resize, render, setFlashes, dispose };
}
