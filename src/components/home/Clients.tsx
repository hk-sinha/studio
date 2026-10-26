import { CLIENTS } from "@/lib/config";

function Group({ hidden }: { hidden?: boolean }) {
  return (
    <div aria-hidden={hidden || undefined} className={`flex items-center gap-20 pr-20 ${hidden ? "motion-reduce:hidden" : "motion-reduce:flex-wrap motion-reduce:justify-center motion-reduce:gap-y-6 motion-reduce:pr-0"}`}>
      {CLIENTS.map((c) => (
        <span key={c.name} className="inline-flex items-center gap-3 whitespace-nowrap font-display text-xl font-medium text-subtle transition-colors hover:text-fg">
          <span className="grid size-8 place-items-center rounded-lg border-[1.5px] border-current text-[11px] tracking-[0.04em]">{c.mark}</span>
          {c.name}
        </span>
      ))}
    </div>
  );
}

/** The site's only marquee. Logos only, no labels. */
export function Clients() {
  return (
    <section aria-label="Clients" className="border-b border-line pb-14 pt-12">
      <div className="marquee overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_10%,#000_90%,transparent)] motion-reduce:[mask-image:none]">
        <div className="marquee-track flex w-max motion-reduce:w-auto motion-reduce:justify-center">
          <Group />
          <Group hidden />
        </div>
      </div>
    </section>
  );
}
