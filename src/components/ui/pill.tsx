import { type ReactNode } from "react";

import { cn } from "@/lib/utils";

type PillTone = "neutral" | "success" | "success-dark";

type PillProps = {
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
  tone?: PillTone;
};

const toneClasses: Record<PillTone, string> = {
  neutral: "border border-zinc-200 bg-white text-zinc-600",
  success:
    "border-transparent bg-emerald-100 text-emerald-700 uppercase tracking-[0.14em]",
  "success-dark":
    "border border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
};

export const Pill = ({
  children,
  className,
  icon,
  tone = "neutral",
}: PillProps) => {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs",
        toneClasses[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
};
