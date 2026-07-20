import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/cn";

/**
 * Form primitives.
 *
 * Every control has a real, associated <label>. Errors are wired with
 * aria-describedby and aria-invalid so screen readers announce them, and are
 * never conveyed by colour alone (§29).
 */

const CONTROL =
  "w-full min-h-11 border bg-offwhite px-3.5 py-2.5 font-sans text-sm text-ink " +
  "placeholder:text-mist transition-colors " +
  "focus:border-gold focus:outline-none focus:ring-0 " +
  "disabled:cursor-not-allowed disabled:bg-ivory-deep disabled:text-mist";

const CONTROL_OK = "border-line-strong hover:border-stone";
const CONTROL_ERROR = "border-danger";

export function Field({
  label,
  htmlFor,
  error,
  hint,
  required,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: ReactNode;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label
        htmlFor={htmlFor}
        className="font-sans text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-graphite"
      >
        {label}
        {required ? (
          <span className="ml-1 text-gold-deep" aria-hidden="true">
            *
          </span>
        ) : (
          <span className="ml-2 font-normal normal-case tracking-normal text-mist">
            (optional)
          </span>
        )}
      </label>
      {children}
      {hint && !error ? (
        <p id={`${htmlFor}-hint`} className="text-xs leading-relaxed text-mist">
          {hint}
        </p>
      ) : null}
      {error ? <FieldError id={`${htmlFor}-error`}>{error}</FieldError> : null}
    </div>
  );
}

export function FieldError({
  id,
  children,
}: {
  id?: string;
  children: ReactNode;
}) {
  return (
    <p id={id} className="flex items-start gap-1.5 text-xs text-danger">
      {/* A glyph as well as colour, so the error is not colour-only. */}
      <span aria-hidden="true">!</span>
      <span>{children}</span>
    </p>
  );
}

export function Input({
  error,
  className,
  ...props
}: ComponentProps<"input"> & { error?: boolean }) {
  return (
    <input
      className={cn(CONTROL, error ? CONTROL_ERROR : CONTROL_OK, className)}
      aria-invalid={error || undefined}
      {...props}
    />
  );
}

export function Textarea({
  error,
  className,
  ...props
}: ComponentProps<"textarea"> & { error?: boolean }) {
  return (
    <textarea
      className={cn(
        CONTROL,
        error ? CONTROL_ERROR : CONTROL_OK,
        "min-h-28 resize-y leading-relaxed",
        className,
      )}
      aria-invalid={error || undefined}
      {...props}
    />
  );
}

export function Select({
  error,
  className,
  children,
  ...props
}: ComponentProps<"select"> & { error?: boolean }) {
  return (
    <select
      className={cn(
        CONTROL,
        error ? CONTROL_ERROR : CONTROL_OK,
        "appearance-none bg-[length:14px] bg-[right_0.9rem_center] bg-no-repeat pr-10",
        className,
      )}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='%237a7267' stroke-width='1.5'%3E%3Cpath d='M4 6l4 4 4-4'/%3E%3C/svg%3E\")",
      }}
      aria-invalid={error || undefined}
      {...props}
    >
      {children}
    </select>
  );
}

export function Checkbox({
  label,
  id,
  className,
  ...props
}: ComponentProps<"input"> & { label: ReactNode; id: string }) {
  return (
    <div className={cn("flex items-start gap-3", className)}>
      {/* The control stays a real <input type="checkbox">; the tick is an
          overlaid SVG revealed by the peer-checked state. A data-URI in an
          arbitrary Tailwind value would not survive CSS minification. */}
      <span className="relative mt-0.5 inline-flex shrink-0">
        <input
          id={id}
          type="checkbox"
          className={cn(
            "peer h-5 w-5 cursor-pointer appearance-none border border-line-strong bg-offwhite",
            "checked:border-ink checked:bg-ink",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-deep",
          )}
          {...props}
        />
        <svg
          aria-hidden="true"
          viewBox="0 0 16 16"
          className="pointer-events-none absolute inset-0 h-5 w-5 opacity-0 peer-checked:opacity-100"
          fill="none"
          stroke="var(--color-ivory)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3.5 8.5l3 3 6-6" />
        </svg>
      </span>
      <label htmlFor={id} className="cursor-pointer text-sm leading-relaxed text-charcoal">
        {label}
      </label>
    </div>
  );
}

/** Radio group rendered as selectable cards — easier to hit on touch. */
export function RadioCards({
  legend,
  name,
  options,
  value,
  onChange,
  error,
  columns = 2,
}: {
  legend: string;
  name: string;
  options: Array<{ value: string; label: string; description?: string }>;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  columns?: number;
}) {
  return (
    <fieldset className="border-0 p-0">
      <legend className="mb-3 font-sans text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-graphite">
        {legend}
      </legend>
      <div
        className={cn(
          "grid gap-3",
          columns === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3",
        )}
      >
        {options.map((option) => {
          const id = `${name}-${option.value}`;
          const selected = value === option.value;
          return (
            <div key={option.value}>
              <input
                type="radio"
                id={id}
                name={name}
                value={option.value}
                checked={selected}
                onChange={() => onChange(option.value)}
                className="peer sr-only"
              />
              <label
                htmlFor={id}
                className={cn(
                  "flex min-h-12 cursor-pointer flex-col justify-center border px-4 py-3 transition-colors",
                  "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-gold-deep",
                  selected
                    ? "border-ink bg-ink text-ivory"
                    : "border-line-strong bg-offwhite text-charcoal hover:border-ink",
                )}
              >
                <span className="text-sm font-medium">{option.label}</span>
                {option.description ? (
                  <span
                    className={cn(
                      "mt-0.5 text-xs",
                      selected ? "text-ivory/65" : "text-mist",
                    )}
                  >
                    {option.description}
                  </span>
                ) : null}
              </label>
            </div>
          );
        })}
      </div>
      {error ? <FieldError>{error}</FieldError> : null}
    </fieldset>
  );
}
