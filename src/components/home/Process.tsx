"use client";
import { useEffect, useRef } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { ScrollTrigger, prefersReducedMotion, refreshScroll } from "@/lib/scroll";

const STEPS = [
  { title: "Brief", text: "A short call to lock goals, audience, references and deadline. You get a clear plan and quote." },
  { title: "Script & storyboard", text: "I write the script and storyboard every scene, so you approve the film before anything is made." },
  { title: "Generate & animate", text: "AI generation for realistic scenes, motion design for product and type. Directed frame by frame." },
  { title: "Edit, sound & deliver", text: "Edit, motion, colour, voice and sound design. Delivered in every format your channels need." },
];

// Desktop staircase: steps alternate sides so the drawn curve swings between them.
const PLACE = [
  "min-[900px]:col-[1/span_4]",
  "min-[900px]:col-[7/span_5] min-[900px]:mt-[60px]",
  "min-[900px]:col-[2/span_5]",
  "min-[900px]:col-[8/span_5] min-[900px]:mt-[60px]",
];

/** A single line draws itself through the four steps as you scroll. */
export function Process() {
  const body = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const path = useRef<SVGPathElement>(null);
  const nodes = useRef<(HTMLSpanElement | null)[]>([]);
  const state = useRef({ len: 0, fr: [] as number[], prog: 1 });

  useEffect(() => {
    const s = state.current;

    const set = (p: number) => {
      s.prog = p;
      if (path.current) path.current.style.strokeDashoffset = String(s.len * (1 - p));
      nodes.current.forEach((n, i) => n?.classList.toggle("is-on", p >= (s.fr[i] ?? 0) - 0.005));
    };

    const layout = () => {
      const b = body.current!.getBoundingClientRect();
      if (!b.width) return;
      svg.current!.setAttribute("viewBox", `0 0 ${b.width} ${b.height}`);
      const pts = nodes.current.map((n) => {
        const r = n!.getBoundingClientRect();
        return { x: r.left - b.left + r.width / 2, y: r.top - b.top + r.height / 2 };
      });
      const narrow = b.width < 700;
      const parts = [`M ${pts[0].x} ${pts[0].y - (narrow ? 40 : 140)}`, `L ${pts[0].x} ${pts[0].y}`];
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1], c = pts[i], k = (c.y - a.y) * 0.75 + 30;
        parts.push(`C ${a.x} ${a.y + k}, ${c.x} ${c.y - k}, ${c.x} ${c.y}`);
      }
      const L = pts[pts.length - 1];
      parts.push(narrow ? `L ${L.x} ${b.height}` : `C ${L.x} ${L.y + 160}, ${b.width * 0.92} ${b.height + 20}, ${b.width + 60} ${b.height + 40}`);
      path.current!.setAttribute("d", parts.join(" "));
      s.len = path.current!.getTotalLength();
      // Path length up to each node, so nodes light up as the line reaches them.
      const tmp = document.createElementNS("http://www.w3.org/2000/svg", "path");
      svg.current!.appendChild(tmp);
      s.fr = pts.map((_, i) => {
        tmp.setAttribute("d", parts.slice(0, i + 2).join(" "));
        return tmp.getTotalLength() / s.len;
      });
      tmp.remove();
      path.current!.style.strokeDasharray = String(s.len);
      set(s.prog);
    };

    let t: ReturnType<typeof setTimeout>;
    const ro = new ResizeObserver(() => { clearTimeout(t); t = setTimeout(layout, 120); });
    ro.observe(body.current!);
    layout();

    let st: ScrollTrigger | undefined;
    if (!prefersReducedMotion()) {
      set(0);
      st = ScrollTrigger.create({
        trigger: body.current,
        start: "top 75%",
        end: "bottom 60%",
        onUpdate: (self) => set(self.progress),
      });
      refreshScroll();
    } else set(1);

    return () => {
      ro.disconnect();
      clearTimeout(t);
      st?.kill();
    };
  }, []);

  return (
    <section id="process" className="py-[clamp(96px,12vw,160px)]">
      <div className="wrap">
        <Reveal as="h2" className="display mb-[clamp(40px,6vw,72px)] text-[clamp(36px,5vw,64px)]">How a project runs.</Reveal>
        <div ref={body} className="relative">
          <svg ref={svg} aria-hidden="true" className="pointer-events-none absolute inset-0 size-full overflow-visible">
            <path ref={path} className="fill-none stroke-line-strong" strokeWidth={1.25} />
          </svg>
          <ol className="relative grid grid-cols-1 gap-y-12 min-[900px]:grid-cols-12 min-[900px]:gap-y-[72px]">
            {STEPS.map((s, i) => (
              <li key={s.title} className={`liquid relative max-w-[440px] rounded-[20px] py-6 pl-12 pr-6 ${PLACE[i]}`}>
                <span
                  ref={(el) => { nodes.current[i] = el; }}
                  aria-hidden="true"
                  className="absolute left-5 top-[34px] size-[13px] rounded-full border border-line-strong bg-ink-950 transition-[background-color,border-color,box-shadow] duration-500 ease-expo [&.is-on]:border-fg [&.is-on]:bg-fg [&.is-on]:shadow-[0_0_0_6px_rgb(237_237_234/0.08)]"
                />
                <h3 className="font-display text-[clamp(22px,2.2vw,28px)] uppercase leading-[1.05]">{s.title}</h3>
                <p className="mt-3 max-w-[38ch] text-[15px] text-muted">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
