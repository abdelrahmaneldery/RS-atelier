import type { ElementType, ReactNode } from "react";

import { cn } from "@/lib/cn";

/** Page gutter. One place so every section aligns to the same measure. */
export function Container({
  className,
  children,
  size = "default",
}: {
  className?: string;
  children: ReactNode;
  size?: "default" | "wide" | "narrow";
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-5 sm:px-8 lg:px-12",
        size === "default" && "max-w-[1400px]",
        size === "wide" && "max-w-[1680px]",
        size === "narrow" && "max-w-[820px]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Eyebrow({
  children,
  gold,
  className,
  as: Tag = "p",
}: {
  children: ReactNode;
  gold?: boolean;
  className?: string;
  as?: ElementType;
}) {
  return (
    <Tag className={cn("eyebrow", gold && "eyebrow-gold", className)}>
      {children}
    </Tag>
  );
}

/** Editorial section header: small label, large serif heading, optional lede. */
export function SectionHeading({
  eyebrow,
  title,
  lede,
  align = "left",
  onDark,
  rule,
  className,
  headingLevel: Heading = "h2",
}: {
  eyebrow?: string;
  title: ReactNode;
  lede?: ReactNode;
  align?: "left" | "center";
  onDark?: boolean;
  rule?: boolean;
  className?: string;
  headingLevel?: "h1" | "h2" | "h3";
}) {
  return (
    <div
      className={cn(
        "flex flex-col",
        align === "center" && "items-center text-center",
        className,
      )}
    >
      {eyebrow ? (
        <Eyebrow gold={onDark} className={cn(onDark && "text-gold-soft", "mb-4")}>
          {eyebrow}
        </Eyebrow>
      ) : null}
      <Heading
        className={cn(
          "text-[2rem] leading-[1.1] sm:text-[2.6rem] lg:text-[3.2rem]",
          onDark && "text-ivory",
          rule && "rule-gold",
        )}
      >
        {title}
      </Heading>
      {lede ? (
        <p
          className={cn(
            "mt-5 max-w-[58ch] text-[0.975rem] leading-relaxed",
            onDark ? "text-ivory/70" : "text-stone",
            align === "center" && "mx-auto",
          )}
        >
          {lede}
        </p>
      ) : null}
    </div>
  );
}

/** Small uppercase label used for tiers, statuses and product flags. */
export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "gold" | "dark" | "success" | "warning" | "danger" | "info";
  className?: string;
}) {
  const tones: Record<string, string> = {
    neutral: "bg-ivory-deep text-graphite border-line",
    gold: "bg-transparent text-gold-deep border-gold/45",
    dark: "bg-ink text-ivory border-ink",
    success: "bg-success-soft text-success border-success/25",
    warning: "bg-warning-soft text-warning border-warning/25",
    danger: "bg-danger-soft text-danger border-danger/25",
    info: "bg-info-soft text-info border-info/25",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center border px-2.5 py-1 font-sans text-[0.625rem] font-medium uppercase tracking-[0.14em]",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Hairline divider. */
export function Divider({ className }: { className?: string }) {
  return <hr className={cn("border-0 border-t border-line", className)} />;
}

/**
 * Empty state (§17). Every list view has one — a blank screen is never
 * acceptable.
 */
export function EmptyState({
  title,
  body,
  action,
  className,
}: {
  title: string;
  body?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center border border-line bg-offwhite px-6 py-16 text-center",
        className,
      )}
    >
      <h3 className="font-display text-2xl text-ink">{title}</h3>
      {body ? (
        <p className="mt-3 max-w-[46ch] text-sm leading-relaxed text-stone">
          {body}
        </p>
      ) : null}
      {action ? <div className="mt-7">{action}</div> : null}
    </div>
  );
}

/** Error state. Distinct from empty — something went wrong, not nothing found. */
export function ErrorState({
  title = "Something went wrong",
  body,
  action,
  className,
}: {
  title?: string;
  body?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center border border-danger/25 bg-danger-soft px-6 py-14 text-center",
        className,
      )}
      role="alert"
    >
      <h3 className="font-display text-2xl text-ink">{title}</h3>
      {body ? (
        <p className="mt-3 max-w-[46ch] text-sm leading-relaxed text-graphite">
          {body}
        </p>
      ) : null}
      {action ? <div className="mt-7">{action}</div> : null}
    </div>
  );
}

/**
 * Marks information that has not yet been confirmed by the atelier (§33).
 *
 * Placeholder business data must never be presented as verified. Anywhere a
 * branch address, policy or price is still demo content, this notice appears
 * alongside it — or the value is omitted entirely.
 */
export function UnconfirmedNotice({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "border-l-2 border-warning/45 bg-warning-soft px-4 py-3 text-xs leading-relaxed text-warning",
        className,
      )}
    >
      {children}
    </p>
  );
}

/** Definition row used across detail pages and admin. */
export function DetailRow({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1 border-b border-line py-3 sm:flex-row sm:items-baseline sm:gap-6",
        className,
      )}
    >
      <dt className="eyebrow shrink-0 sm:w-52">{label}</dt>
      <dd className="text-sm text-charcoal">{children}</dd>
    </div>
  );
}
