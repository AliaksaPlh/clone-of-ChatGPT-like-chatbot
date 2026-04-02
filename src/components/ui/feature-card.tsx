import { type ReactNode } from "react";

type FeatureCardProps = {
  title: string;
  description: string;
  children?: ReactNode;
};

export const FeatureCard = ({
  title,
  description,
  children,
}: FeatureCardProps) => {
  return (
    <div className="rounded-2xl border border-black/5 bg-white/80 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">
        {title}
      </p>
      <p className="mt-2 text-sm leading-6 text-zinc-600">{description}</p>
      {children}
    </div>
  );
};
