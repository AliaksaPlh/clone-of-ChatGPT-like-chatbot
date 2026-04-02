import { type ReactNode } from "react";

import { cn } from "@/lib/utils";

type InfoBannerProps = {
  title: string;
  description: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
};

export const InfoBanner = ({
  title,
  description,
  icon,
  action,
  className,
}: InfoBannerProps) => {
  return (
    <div className={cn("rounded-2xl border p-4", className)}>
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-sm font-medium">{title}</p>
      </div>
      <div className="mt-2 text-xs leading-5">{description}</div>
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
};
