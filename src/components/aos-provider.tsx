"use client";

import AOS from "aos";
import { useEffect } from "react";
import "aos/dist/aos.css";

type AOSProviderProps = {
  children: React.ReactNode;
  /** Optional AOS init options (duration, offset, once, etc.) */
  options?: {
    duration?: number;
    offset?: number;
    once?: boolean;
    delay?: number;
    easing?: string;
    anchorPlacement?: string;
  };
};

const defaultOptions = {
  duration: 1000,
  offset: 50,
  once: true,
};

export function AOSProvider({ children, options }: AOSProviderProps) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduceMotion.matches) return;
    AOS.init({ ...defaultOptions, ...options });
  }, []);

  return <>{children}</>;
}
