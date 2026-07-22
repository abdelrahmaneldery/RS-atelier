"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/cn";

/**
 * The single click-and-drag horizontal scroller for the whole public site.
 *
 * Drop-in replacement for a horizontally scrolling `<ul>`: keep the same
 * flex/overflow/snap classes and children, and it adds pointer drag on top.
 *
 * - Desktop (mouse): click, hold and drag left/right to scroll.
 * - Mobile/tablet (touch/pen): left untouched, so native swipe momentum stays.
 * - `cursor: grab` when the row can scroll, `cursor: grabbing` while dragging.
 * - Text selection and image ghost-dragging are suppressed during a drag.
 * - Scroll-snap is released mid-drag for smooth movement, then restored so the
 *   row settles onto a snap point. Vertical page scrolling is never affected —
 *   only the row's own `scrollLeft` is moved, and only for a mouse pointer.
 * - A real drag swallows the click that follows it, so cards/links/buttons do
 *   not fire mid-drag; a plain click (no movement) still activates them.
 */

const DRAG_THRESHOLD = 5; // px of movement before it counts as a drag, not a click

type DragScrollProps = React.ComponentPropsWithoutRef<"ul">;

export function DragScroll({ className, children, ...rest }: DragScrollProps) {
  const ref = useRef<HTMLUListElement>(null);
  const [dragging, setDragging] = useState(false);
  const [canScroll, setCanScroll] = useState(false);

  const drag = useRef({ down: false, startX: 0, startLeft: 0, moved: false, captured: false });
  const suppressClick = useRef(false);

  // Only offer the grab affordance when the row actually overflows. The
  // ResizeObserver callback runs asynchronously, so this never sets state
  // synchronously inside the effect body.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setCanScroll(el.scrollWidth - el.clientWidth > 1);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  function onPointerDown(e: React.PointerEvent<HTMLUListElement>) {
    // Touch and pen keep their native swipe; only hijack a primary mouse press.
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    const el = ref.current;
    if (!el || el.scrollWidth - el.clientWidth <= 1) return;

    suppressClick.current = false;
    drag.current = { down: true, startX: e.clientX, startLeft: el.scrollLeft, moved: false, captured: false };
    // Imperative so it takes effect within this gesture: kill selection and snap
    // for a smooth 1:1 drag. Pointer capture is deliberately NOT taken here — a
    // plain click must keep reaching the inner link, and capture would retarget
    // the click to this element. It is taken only once a real drag begins.
    el.style.userSelect = "none";
    el.style.scrollSnapType = "none";
  }

  function onPointerMove(e: React.PointerEvent<HTMLUListElement>) {
    const s = drag.current;
    if (!s.down) return;
    const el = ref.current;
    if (!el) return;
    const dx = e.clientX - s.startX;
    if (!s.moved) {
      if (Math.abs(dx) <= DRAG_THRESHOLD) return; // still a click, not a drag yet
      s.moved = true;
      try {
        el.setPointerCapture(e.pointerId);
        s.captured = true;
      } catch {
        /* capture unavailable */
      }
      setDragging(true);
    }
    el.scrollLeft = s.startLeft - dx;
  }

  function endDrag(e: React.PointerEvent<HTMLUListElement>) {
    const s = drag.current;
    if (!s.down) return;
    s.down = false;
    const el = ref.current;
    if (el) {
      el.style.userSelect = "";
      // Restoring the class-driven snap lets the row settle onto a snap point.
      el.style.scrollSnapType = "";
      if (s.captured) {
        try {
          el.releasePointerCapture(e.pointerId);
        } catch {
          /* pointer already released */
        }
      }
    }
    // A genuine drag must not also click through to a card/link/button.
    if (s.moved) {
      suppressClick.current = true;
      setDragging(false);
    }
  }

  return (
    <ul
      ref={ref}
      {...rest}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onClickCapture={(e) => {
        if (suppressClick.current) {
          e.preventDefault();
          e.stopPropagation();
          suppressClick.current = false;
        }
      }}
      onDragStart={(e) => e.preventDefault()} // no image/text ghost drag
      className={cn(
        className,
        "[&_img]:select-none",
        dragging ? "cursor-grabbing select-none" : canScroll ? "cursor-grab" : "",
      )}
    >
      {children}
    </ul>
  );
}
