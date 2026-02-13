"use client";

import { useEffect } from "react";
import AOS from "aos";
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
    AOS.init({ ...defaultOptions, ...options });
  // eslint-disable-next-line react-hooks/exhaustive-deps -- init once on mount
  }, []);

  return <>{children}</>;
}
