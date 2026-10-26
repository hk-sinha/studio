type Variant = "primary" | "ghost" | "paper" | "paper-ghost" | "danger";
type Size = "md" | "sm";

const base =
  "group inline-flex items-center justify-center gap-2.5 rounded-btn border font-medium whitespace-nowrap " +
  "transition-[transform,background-color,color,border-color,opacity] duration-300 ease-expo active:scale-[0.98] " +
  "disabled:pointer-events-none disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary: "border-transparent bg-fg text-ink-950 hover:bg-rec-strong hover:text-white",
  ghost: "border-line-strong text-fg hover:border-fg",
  paper: "border-transparent bg-paper-ink text-paper hover:bg-rec-strong hover:text-white",
  "paper-ghost": "border-paper-ink/20 bg-paper/60 text-paper-ink hover:border-paper-ink",
  danger: "border-rec/40 text-[#FF8A8E] hover:border-rec hover:bg-rec/10",
};

const sizes: Record<Size, string> = {
  md: "h-12 px-[22px] text-[15px]",
  sm: "h-10 px-4 text-sm",
};

export const btn = (variant: Variant = "primary", size: Size = "md", extra = "") =>
  `${base} ${variants[variant]} ${sizes[size]} ${extra}`;

/** Arrow that nudges right on hover of the parent `.group`. */
export const nudge = "transition-transform duration-300 ease-expo group-hover:translate-x-[3px]";
