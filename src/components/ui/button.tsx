import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/cn";

/**
 * Buttons are square-edged and quiet. Gold is reserved for the single most
 * important action on a view — never applied to several buttons at once.
 */

type Variant = "primary" | "secondary" | "gold" | "ghost" | "danger" | "onDark";
type Size = "sm" | "md" | "lg";

const BASE =
  "inline-flex items-center justify-center gap-2 font-sans font-medium " +
  "uppercase tracking-[0.14em] " +
  // Colour and a whisper of press feedback animate on the house easing.
  "transition-[color,background-color,border-color,transform] duration-200 " +
  "ease-[cubic-bezier(0.22,0.61,0.36,1)] active:scale-[0.985] " +
  "disabled:pointer-events-none disabled:opacity-40 disabled:saturate-0 " +
  // Touch targets stay comfortable on mobile (§31).
  "min-h-11 text-center";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-ink text-ivory hover:bg-charcoal border border-ink",
  secondary:
    "bg-transparent text-ink border border-line-strong hover:border-ink hover:bg-ivory-deep",
  gold: "bg-gold text-white border border-gold hover:bg-gold-deep hover:border-gold-deep",
  ghost:
    "bg-transparent text-charcoal border border-transparent hover:text-ink hover:bg-ivory-deep",
  danger:
    "bg-transparent text-danger border border-danger/40 hover:bg-danger-soft hover:border-danger",
  onDark:
    "bg-transparent text-ivory border border-ivory/35 hover:border-gold hover:text-gold-soft",
};

const SIZES: Record<Size, string> = {
  sm: "px-4 py-2 text-[0.6875rem]",
  md: "px-6 py-3 text-xs",
  lg: "px-8 py-4 text-xs",
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  className?: string;
  children: ReactNode;
};

export function Button({
  variant = "primary",
  size = "md",
  fullWidth,
  className,
  children,
  ...props
}: CommonProps & ComponentProps<"button">) {
  return (
    <button
      className={cn(
        BASE,
        VARIANTS[variant],
        SIZES[size],
        fullWidth && "w-full",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  fullWidth,
  className,
  children,
  ...props
}: CommonProps & ComponentProps<typeof Link>) {
  return (
    <Link
      className={cn(
        BASE,
        VARIANTS[variant],
        SIZES[size],
        fullWidth && "w-full",
        className,
      )}
      {...props}
    >
      {children}
    </Link>
  );
}
