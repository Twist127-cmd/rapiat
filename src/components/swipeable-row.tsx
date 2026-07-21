"use client";

import { useRef, useState } from "react";

import { cn } from "@/lib/utils";

export interface SwipeAction {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  /** Destructive styling (red). */
  destructive?: boolean;
}

const ACTION_WIDTH = 72; // px per revealed action button

/**
 * Touch swipe-to-reveal row. Swipe left to expose the actions on the right;
 * tap (no drag) fires `onTap`. Pointer-based, no dependency. Vertical scrolling
 * stays free (`touch-action: pan-y`). Falls back gracefully with a visible menu
 * elsewhere for non-touch users.
 */
export function SwipeableRow({
  children,
  actions,
  onTap,
  className,
}: {
  children: React.ReactNode;
  actions: SwipeAction[];
  onTap?: () => void;
  className?: string;
}) {
  const [tx, setTx] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const startTx = useRef(0);
  const dragging = useRef(false);
  const moved = useRef(false);
  const openWidth = actions.length * ACTION_WIDTH;

  function onPointerDown(e: React.PointerEvent) {
    if (e.pointerType === "mouse") return; // swipe is touch-only
    dragging.current = true;
    setIsDragging(true);
    moved.current = false;
    startX.current = e.clientX;
    startTx.current = tx;
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!dragging.current) return;
    const dx = e.clientX - startX.current;
    if (Math.abs(dx) > 6) moved.current = true;
    const next = Math.min(0, Math.max(-openWidth, startTx.current + dx));
    setTx(next);
  }
  function onPointerUp() {
    if (!dragging.current) return;
    dragging.current = false;
    setIsDragging(false);
    setTx((cur) => (cur < -openWidth / 2 ? -openWidth : 0));
  }
  function handleClick() {
    if (moved.current) return; // was a swipe, not a tap
    if (tx !== 0) {
      setTx(0);
      return;
    }
    onTap?.();
  }

  return (
    <div className={cn("relative overflow-hidden rounded-xl", className)}>
      {/* Actions behind */}
      <div className="absolute inset-y-0 right-0 flex">
        {actions.map((a) => (
          <button
            key={a.label}
            type="button"
            aria-label={a.label}
            onClick={() => {
              a.onClick();
              setTx(0);
            }}
            style={{ width: ACTION_WIDTH }}
            className={cn(
              "flex flex-col items-center justify-center gap-1 text-xs font-medium text-white",
              a.destructive ? "bg-destructive" : "bg-primary",
            )}
          >
            {a.icon}
            {a.label}
          </button>
        ))}
      </div>
      {/* Front */}
      <div
        role={onTap ? "button" : undefined}
        tabIndex={onTap ? 0 : undefined}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (onTap && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            onTap();
          }
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{
          transform: `translateX(${tx}px)`,
          touchAction: "pan-y",
        }}
        className={cn(
          "bg-card relative motion-safe:transition-transform",
          isDragging ? "" : "duration-200",
        )}
      >
        {children}
      </div>
    </div>
  );
}
