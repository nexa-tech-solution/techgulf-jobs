"use client";

import { useEffect, useRef } from "react";

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Dot grid that brightens and parts around the pointer. Fills its positioned parent. */
export function DotField() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const parent = canvas?.parentElement;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !parent || !ctx) return;

    const GAP = 26, REACH = 150, PUSH = 7;
    let pointer: { x: number; y: number } | null = null;
    let frame = 0;

    const draw = () => {
      frame = 0;
      const { width, height } = parent.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = getComputedStyle(canvas).getPropertyValue("--primary");
      for (let y = GAP / 2; y < height; y += GAP) {
        for (let x = GAP / 2; x < width; x += GAP) {
          let px = x, py = y, near = 0;
          if (pointer) {
            const dx = x - pointer.x, dy = y - pointer.y, dist = Math.hypot(dx, dy);
            near = Math.max(0, 1 - dist / REACH);
            if (dist > 0) { px += (dx / dist) * near * PUSH; py += (dy / dist) * near * PUSH; }
          }
          ctx.globalAlpha = 0.28 + near * 0.72;
          ctx.beginPath();
          ctx.arc(px, py, 1.1 + near * 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(draw); };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch" || reducedMotion()) return;
      const box = parent.getBoundingClientRect();
      pointer = { x: e.clientX - box.left, y: e.clientY - box.top };
      schedule();
    };
    const onLeave = () => { pointer = null; schedule(); };

    parent.addEventListener("pointermove", onMove);
    parent.addEventListener("pointerleave", onLeave);
    const resize = new ResizeObserver(schedule);
    resize.observe(parent);
    const theme = new MutationObserver(schedule);
    theme.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    schedule();

    return () => {
      cancelAnimationFrame(frame);
      parent.removeEventListener("pointermove", onMove);
      parent.removeEventListener("pointerleave", onLeave);
      resize.disconnect();
      theme.disconnect();
    };
  }, []);

  return <canvas ref={ref} aria-hidden className="dot-field pointer-events-none absolute inset-0 -z-10 h-full w-full" />;
}

/** Counts up once on load. The final value is server-rendered, so it works without JS. */
export function CountUp({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion()) return;
    const format = (n: number) => new Intl.NumberFormat("en-US").format(n) + suffix;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 900);
      el.textContent = format(Math.round(value * (1 - (1 - t) ** 3)));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(frame); el.textContent = format(value); };
  }, [value, suffix]);

  return <span ref={ref}>{new Intl.NumberFormat("en-US").format(value)}{suffix}</span>;
}
