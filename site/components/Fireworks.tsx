"use client";
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

export type FireworksHandle = {
  welcome: () => void;
  celebrate: (x: number, y: number) => void;
};

type Part = {
  t: "c" | "s" | "r";
  x: number; y: number;
  vx: number; vy: number;
  g: number;
  w?: number; h?: number; rot?: number; vr?: number;
  r?: number;
  targetY?: number;
  col: string;
  life: number; fade: number;
  dim?: number;
};

const COLORS = ["#8A4BFF", "#B14CFF", "#FF6FD8", "#FF8A3D", "#FF6B6B", "#3DDC97", "#FFD23D", "#FFFFFF"];

const Fireworks = forwardRef<FireworksHandle>(function Fireworks(_, ref) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const apiRef = useRef<FireworksHandle | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const maybeCtx = canvas.getContext("2d");
    if (!maybeCtx) return;
    const ctx: CanvasRenderingContext2D = maybeCtx;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let parts: Part[] = [];
    let raf: number | null = null;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let disposed = false;
    const timeouts: number[] = [];

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const rand = (a: number, b: number) => a + Math.random() * (b - a);
    const pick = <T,>(a: T[]) => a[(Math.random() * a.length) | 0];

    function confetti(x: number, y: number, n: number, power: number) {
      for (let i = 0; i < n; i++) {
        const a = rand(0, Math.PI * 2), s = rand(0.35, 1) * power;
        parts.push({
          t: "c", x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - rand(1, 4),
          g: 0.12, w: rand(5, 11), h: rand(7, 14), rot: rand(0, 6.28),
          vr: rand(-0.3, 0.3), col: pick(COLORS), life: 1, fade: rand(0.006, 0.014),
        });
      }
    }
    function spark(x: number, y: number, n: number, fixedCol?: string | null, dim?: number) {
      for (let i = 0; i < n; i++) {
        const a = rand(0, Math.PI * 2), s = rand(2, 8);
        parts.push({
          t: "s", x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
          g: 0.06, r: rand(1.5, 3.4), col: fixedCol || pick(COLORS),
          life: 1, fade: rand(0.012, 0.024), dim: dim || 1,
        });
      }
    }
    function rain(n: number) {
      for (let i = 0; i < n; i++) {
        parts.push({
          t: "c", x: rand(0, window.innerWidth), y: rand(-120, -10),
          vx: rand(-0.6, 0.6), vy: rand(1.5, 4), g: 0.05,
          w: rand(5, 11), h: rand(7, 14), rot: rand(0, 6.28), vr: rand(-0.3, 0.3),
          col: pick(COLORS), life: 1, fade: rand(0.004, 0.008),
        });
      }
    }
    function rocket() {
      const col = pick(COLORS);
      parts.push({
        t: "r",
        x: rand(window.innerWidth * 0.12, window.innerWidth * 0.88),
        y: window.innerHeight * 0.98,
        vx: rand(-0.4, 0.4), vy: -rand(7, 10),
        g: 0.12, r: 1.8, col,
        targetY: rand(window.innerHeight * 0.14, window.innerHeight * 0.46),
        life: 1, fade: 0, dim: 0.55,
      });
    }

    function tick() {
      if (disposed) return;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.vy += p.g; p.x += p.vx; p.y += p.vy; p.life -= p.fade;
        if (p.life <= 0 || p.y > window.innerHeight + 60) { parts.splice(i, 1); continue; }
        ctx.globalAlpha = Math.max(0, Math.min(1, p.life)) * (p.dim || 1);
        ctx.fillStyle = p.col;
        if (p.t === "c") {
          p.rot! += p.vr!;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot!);
          ctx.fillRect(-(p.w! / 2), -(p.h! / 2), p.w!, p.h!);
          ctx.restore();
        } else if (p.t === "r") {
          if (p.y <= p.targetY! || p.vy >= -0.6) {
            spark(p.x, p.y, 34, Math.random() < 0.5 ? p.col : null, 0.7);
            parts.splice(i, 1);
            continue;
          }
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r!, 0, 6.2832);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r!, 0, 6.2832);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      raf = parts.length ? requestAnimationFrame(tick) : null;
    }
    function run() {
      if (raf === null && !disposed) raf = requestAnimationFrame(tick);
    }

    apiRef.current = {
      welcome() {
        if (reduce || disposed) return;
        const loop = () => {
          if (disposed) return;
          rocket();
          if (Math.random() < 0.25) {
            timeouts.push(window.setTimeout(rocket, rand(220, 600)));
          }
          run();
          timeouts.push(window.setTimeout(loop, rand(1600, 3000)));
        };
        loop();
      },
      celebrate(x: number, y: number) {
        if (reduce || disposed) return;
        spark(x, y, 90);
        confetti(x, y, 140, 12);
        rain(120);
        timeouts.push(window.setTimeout(() => {
          spark(window.innerWidth * 0.3, window.innerHeight * 0.35, 60);
          confetti(window.innerWidth * 0.3, window.innerHeight * 0.35, 80, 10);
        }, 220));
        timeouts.push(window.setTimeout(() => {
          spark(window.innerWidth * 0.7, window.innerHeight * 0.35, 60);
          confetti(window.innerWidth * 0.7, window.innerHeight * 0.35, 80, 10);
        }, 420));
        timeouts.push(window.setTimeout(() => rain(120), 650));
        run();
      },
    };

    return () => {
      disposed = true;
      timeouts.forEach((id) => clearTimeout(id));
      if (raf !== null) cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      apiRef.current = null;
    };
  }, []);

  useImperativeHandle(ref, () => ({
    welcome: () => apiRef.current?.welcome(),
    celebrate: (x, y) => apiRef.current?.celebrate(x, y),
  }));

  return (
    <canvas
      ref={canvasRef}
      id="fx"
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 60,
        pointerEvents: "none",
      }}
    />
  );
});

export default Fireworks;
