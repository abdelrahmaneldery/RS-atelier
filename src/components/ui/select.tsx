"use client";

import {
  Children,
  isValidElement,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check } from "lucide-react";

import { cn } from "@/lib/cn";

/**
 * The single custom dropdown for the whole public site.
 *
 * Drop-in for a native <select>: it accepts <option> children, a `value` and an
 * `onChange` that fires an event-like `{ currentTarget: { value } }`, so every
 * existing call site keeps working. It renders an accessible listbox (no native
 * browser menu, no blue highlight), styled to RS Atelier — warm ivory, black
 * text, thin border, muted-gold hover/focus, custom chevron and a soft shadow.
 *
 * The popover is portaled and fixed-positioned, so it never clips inside a
 * scrolling drawer and always sits above other content.
 */

type Option = { value: string; label: string; disabled?: boolean };
type ChangeLike = { currentTarget: { value: string }; target: { value: string } };

function childText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(childText).join("");
  return "";
}

type PopStyle = { left: number; width: number; maxHeight: number } & (
  | { top: number }
  | { bottom: number }
);

export function Select({
  value,
  onChange,
  children,
  id,
  disabled,
  error,
  className,
  "aria-label": ariaLabel,
}: {
  value?: string;
  onChange?: (event: ChangeLike) => void;
  children: ReactNode;
  id?: string;
  disabled?: boolean;
  error?: boolean;
  className?: string;
  "aria-label"?: string;
}) {
  const options: Option[] = Children.toArray(children)
    .filter(isValidElement)
    .map((c) => {
      const props = (c as { props: { value?: unknown; disabled?: boolean; children?: ReactNode } }).props;
      return {
        value: String(props.value ?? ""),
        label: childText(props.children),
        disabled: !!props.disabled,
      };
    });

  const current = String(value ?? "");
  const selectedIndex = Math.max(0, options.findIndex((o) => o.value === current));
  const selected = options[selectedIndex];

  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(selectedIndex);
  const [pop, setPop] = useState<PopStyle | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listboxId = useId();

  function computePop() {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const gap = 4;
    const spaceBelow = window.innerHeight - r.bottom;
    const spaceAbove = r.top;
    const desired = Math.min(272, options.length * 40 + 8);
    if (spaceBelow < desired && spaceAbove > spaceBelow) {
      setPop({ left: r.left, width: r.width, maxHeight: Math.max(120, spaceAbove - 12), bottom: window.innerHeight - r.top + gap });
    } else {
      setPop({ left: r.left, width: r.width, maxHeight: Math.max(120, spaceBelow - 12), top: r.bottom + gap });
    }
  }

  function openList() {
    if (disabled) return;
    computePop();
    setActive(selectedIndex < 0 ? 0 : selectedIndex);
    setOpen(true);
  }
  function close(returnFocus = true) {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }
  function commit(i: number) {
    const opt = options[i];
    if (!opt || opt.disabled) return;
    onChange?.({ currentTarget: { value: opt.value }, target: { value: opt.value } });
    close();
  }

  useEffect(() => {
    if (!open) return;
    listRef.current?.focus();
    const reposition = () => computePop();
    function onDown(e: PointerEvent) {
      const t = e.target as Node;
      if (listRef.current?.contains(t) || triggerRef.current?.contains(t)) return;
      setOpen(false);
    }
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    document.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  function moveActive(delta: number) {
    setActive((prev) => {
      let i = prev;
      for (let step = 0; step < options.length; step++) {
        i = (i + delta + options.length) % options.length;
        if (!options[i]?.disabled) return i;
      }
      return prev;
    });
  }
  const firstEnabled = () => options.findIndex((o) => !o.disabled);
  const lastEnabled = () => {
    for (let i = options.length - 1; i >= 0; i--) if (!options[i].disabled) return i;
    return 0;
  };

  function onListKey(e: React.KeyboardEvent) {
    switch (e.key) {
      case "ArrowDown": e.preventDefault(); moveActive(1); break;
      case "ArrowUp": e.preventDefault(); moveActive(-1); break;
      case "Home": e.preventDefault(); setActive(firstEnabled()); break;
      case "End": e.preventDefault(); setActive(lastEnabled()); break;
      case "Enter":
      case " ": e.preventDefault(); commit(active); break;
      case "Escape": e.preventDefault(); close(); break;
      case "Tab": setOpen(false); break;
      default:
        if (e.key.length === 1) {
          const k = e.key.toLowerCase();
          const i = options.findIndex((o) => !o.disabled && o.label.toLowerCase().startsWith(k));
          if (i >= 0) setActive(i);
        }
    }
  }

  return (
    <div className={cn("relative", className)}>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-label={ariaLabel}
        aria-invalid={error || undefined}
        disabled={disabled}
        onClick={() => (open ? close(false) : openList())}
        onKeyDown={(e) => {
          if (disabled) return;
          if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
            e.preventDefault();
            openList();
          }
        }}
        className={cn(
          "flex min-h-11 w-full items-center justify-between gap-2 border bg-offwhite px-3.5 py-2.5 text-left font-sans text-sm text-ink transition-colors",
          error ? "border-danger" : open ? "border-gold" : "border-line-strong hover:border-stone",
          "focus:border-gold focus:outline-none",
          "disabled:cursor-not-allowed disabled:bg-ivory-deep disabled:text-mist",
        )}
      >
        <span className="truncate">{selected?.label}</span>
        <ChevronDown
          aria-hidden="true"
          strokeWidth={1.5}
          className={cn("h-4 w-4 shrink-0 text-stone transition-transform duration-200", open && "rotate-180 text-gold-deep")}
        />
      </button>

      {open && pop
        ? createPortal(
            <ul
              ref={listRef}
              id={listboxId}
              role="listbox"
              tabIndex={-1}
              aria-activedescendant={`${listboxId}-${active}`}
              onKeyDown={onListKey}
              style={{
                position: "fixed",
                left: pop.left,
                width: pop.width,
                maxHeight: pop.maxHeight,
                ...("top" in pop ? { top: pop.top } : { bottom: pop.bottom }),
              }}
              className="z-[100] overflow-auto border border-line bg-ivory py-1 shadow-raised focus:outline-none"
            >
              {options.map((o, i) => {
                const isSel = i === selectedIndex;
                const isActive = i === active;
                return (
                  <li
                    key={`${o.value}-${i}`}
                    id={`${listboxId}-${i}`}
                    role="option"
                    aria-selected={isSel}
                    aria-disabled={o.disabled || undefined}
                    onMouseEnter={() => !o.disabled && setActive(i)}
                    onClick={() => commit(i)}
                    className={cn(
                      "flex items-center justify-between gap-2 px-3.5 py-2 font-sans text-sm",
                      o.disabled
                        ? "cursor-not-allowed text-mist"
                        : isActive
                          ? "cursor-pointer bg-gold-soft/50 text-ink"
                          : "cursor-pointer text-ink",
                      isSel && "font-medium",
                    )}
                  >
                    <span className="truncate">{o.label}</span>
                    {isSel ? (
                      <Check aria-hidden="true" strokeWidth={2} className="h-3.5 w-3.5 shrink-0 text-gold-deep" />
                    ) : null}
                  </li>
                );
              })}
            </ul>,
            document.body,
          )
        : null}
    </div>
  );
}
