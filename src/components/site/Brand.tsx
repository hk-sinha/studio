export function Brand({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 text-[15px] font-medium ${className}`}>
      <span className="grid size-[30px] place-items-center rounded-md border border-current font-display text-[10px] font-medium tracking-[0.06em]">HKS</span>
      <span className="max-[420px]:hidden">Himanshu Sinha</span>
    </span>
  );
}
