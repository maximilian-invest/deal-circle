"use client";
import { useEffect } from "react";

/**
 * Inverted scroll-reveal: content is visible by default. After mount, JS
 * adds .dc-pre-reveal to off-screen .dc-reveal elements and removes it as
 * they enter the viewport. If JS doesn't run, everything stays readable.
 */
export default function RevealManager() {
  useEffect(() => {
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.remove("dc-pre-reveal");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );

    const raf = requestAnimationFrame(() => {
      const vh = window.innerHeight || document.documentElement.clientHeight;
      document.querySelectorAll<HTMLElement>(".dc-reveal").forEach((el) => {
        const rect = el.getBoundingClientRect();
        const inView = rect.top < vh * 0.92 && rect.bottom > 0;
        if (!inView) {
          el.classList.add("dc-pre-reveal");
          io.observe(el);
        }
      });
    });

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, []);

  return null;
}
