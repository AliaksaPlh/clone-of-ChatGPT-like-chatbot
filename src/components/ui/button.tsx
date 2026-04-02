import { type ButtonHTMLAttributes, type ReactNode } from "react";

import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "dark" | "light";
type ButtonSize = "sm" | "md" | "icon" | "icon-sm";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconLeft?: ReactNode;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-black text-white hover:bg-zinc-800 disabled:bg-zinc-300 disabled:text-white",
  secondary:
    "border border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100",
  ghost:
    "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 disabled:text-zinc-300",
  dark: "bg-white text-black hover:bg-white/90",
  light: "border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "rounded-full px-3 py-2 text-xs font-medium",
  md: "rounded-full px-4 py-2 text-sm font-semibold",
  icon: "size-10 rounded-full",
  "icon-sm": "size-9 rounded-xl",
};

export const Button = ({
  children,
  className,
  iconLeft,
  size = "md",
  type = "button",
  variant = "primary",
  ...props
}: ButtonProps) => {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 transition disabled:cursor-not-allowed",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {iconLeft}
      {children}
    </button>
  );
};
