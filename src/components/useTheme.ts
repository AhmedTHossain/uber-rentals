"use client";

import { useEffect, useState } from "react";
import type { ThemeValue } from "./ThemeToggle";

// <html> owns the active theme: the pre-paint script in the root layout puts
// the class there before first paint, and this hook is the only thing that
// changes it afterwards. Nothing else renders a theme class, so there is no
// window where the page and its contents disagree.
//
// Dark is the default and is never persisted -- only an explicit switch to
// light is stored, so clearing the key returns you to dark.
// Public uses key "ur-theme-public"; admin "ur-theme-admin".
export function useTheme(storageKey: string) {
  const [theme, setTheme] = useState<ThemeValue>("dark");

  // Sync state to whatever the pre-paint script decided. Runs after paint, so
  // the initial "dark" above is only ever used for the server-rendered markup.
  useEffect(() => {
    setTheme(
      document.documentElement.classList.contains("theme-light") ? "light" : "dark",
    );
  }, []);

  function toggle() {
    setTheme((t) => {
      const next: ThemeValue = t === "dark" ? "light" : "dark";
      const root = document.documentElement;
      root.classList.toggle("theme-light", next === "light");
      root.classList.toggle("theme-dark", next === "dark");
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
