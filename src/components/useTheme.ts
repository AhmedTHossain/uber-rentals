"use client";

import { useEffect, useState } from "react";
import type { ThemeValue } from "./ThemeToggle";

// Persisted theme preference. Reads localStorage on mount, writes on toggle.
// Dark is the default everywhere; light is opt-in per surface.
// Public uses key "ur-public-theme"; admin "ur-admin-theme".
export function useTheme(storageKey: string, fallback: ThemeValue) {
  const [theme, setTheme] = useState<ThemeValue>(fallback);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved === "light" || saved === "dark") setTheme(saved);
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  function toggle() {
    setTheme((t) => {
      const next: ThemeValue = t === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(storageKey, next);
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  return { theme, toggle };
}
