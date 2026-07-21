import type { ReactNode } from "react";

import { cn } from "@/lib/cn";
import { Container } from "@/components/ui/primitives";

/**
 * Shared "leave your details" section used wherever the site offers a call-back
 * (contact page, dress page). One layout everywhere: on desktop a balanced
 * two-column grid — heading and explanation on the left, the form on the right;
 * on mobile it stacks with full-width fields. Keeps the form from stranding
 * empty space beside it inside an over-wide container.
 */
export function LeadSection({
  title,
  description,
  children,
  className,
  id,
}: {
  title: string;
  description: ReactNode;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={cn("scroll-mt-24 border-t border-line bg-ivory-deep py-14 lg:py-20", className)}
    >
      <Container>
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2 className="font-display text-[1.75rem] leading-tight text-ink lg:text-[2.25rem]">
              {title}
            </h2>
            <p className="mt-4 max-w-[44ch] text-sm leading-relaxed text-stone">
              {description}
            </p>
          </div>
          <div className="w-full">{children}</div>
        </div>
      </Container>
    </section>
  );
}
