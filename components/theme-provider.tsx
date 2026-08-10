"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ThemeProviderProps } from "next-themes";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { getDynamicBaseUrl } from "@/lib/api";
import { applyThemeTokens, type ThemeTokens } from "@/lib/theme-runtime";

// Separated into its own component so it can use useTheme()
function ThemeSyncer() {
  const { resolvedTheme } = useTheme();
  const [tenantTokens, setTenantTokens] = useState<ThemeTokens | null>(null);
  const cacheKey = "active-tenant-theme-tokens";

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const base = getDynamicBaseUrl().replace(/\/+$/, "");
        const branch = localStorage.getItem("selected-branch-id");
        const response = await fetch(base + "/themes/active", { credentials: "include", headers: branch ? { "x-selected-branch-id": branch } : undefined });
        if (!response.ok) return;
        const payload = await response.json();
        if (active && payload?.data?.tokens) {
          setTenantTokens(payload.data.tokens);
          localStorage.setItem(cacheKey, JSON.stringify(payload.data.tokens));
        }
      } catch {}
    };
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) setTenantTokens(JSON.parse(cached));
    } catch {
      localStorage.removeItem(cacheKey);
    }
    load();
    const changed = (event: Event) => {
      const tokens = (event as CustomEvent).detail?.tokens;
      if (tokens) {
        setTenantTokens(tokens);
        localStorage.setItem(cacheKey, JSON.stringify(tokens));
      }
      else load();
    };
    const storageChanged = (event: StorageEvent) => {
      if (event.key !== cacheKey) return;
      if (!event.newValue) {
        load();
        return;
      }
      try {
        setTenantTokens(JSON.parse(event.newValue));
      } catch {
        load();
      }
    };
    window.addEventListener("tenant-theme-changed", changed);
    window.addEventListener("storage", storageChanged);
    return () => {
      active = false;
      window.removeEventListener("tenant-theme-changed", changed);
      window.removeEventListener("storage", storageChanged);
    };
  }, []);

  useEffect(() => {
    if (!resolvedTheme) return;
    
    const isDark = resolvedTheme === "dark";
    const root = document.documentElement;

    root.classList.add("js-loaded");
    root.classList.remove("no-js");

    // Remove and add dark class to trigger all dark: CSS updates
    if (isDark) {
      root.classList.add("dark");
      root.style.colorScheme = "dark";
      root.style.setProperty("--theme-bg", "#09050f");
      root.style.setProperty("--theme-text", "#ffffff");
      root.style.setProperty("--theme-card", "#1a0d24");
      root.style.setProperty("--theme-card-foreground", "#ffffff");
      root.style.setProperty("--theme-border", "#342044");
      root.style.setProperty("--theme-muted", "#2b0d3a");
      root.style.setProperty("--theme-muted-foreground", "#b8a8c2");
      document.body.style.backgroundColor = "#09050f";
      document.body.style.color = "#ffffff";
    } else {
      root.classList.remove("dark");
      root.style.colorScheme = "light";
      root.style.setProperty("--theme-bg", "#f8f7fa");
      root.style.setProperty("--theme-text", "#1b1024");
      root.style.setProperty("--theme-card", "#ffffff");
      root.style.setProperty("--theme-card-foreground", "#1b1024");
      root.style.setProperty("--theme-border", "#e8dff0");
      root.style.setProperty("--theme-muted", "#f4eeff");
      root.style.setProperty("--theme-muted-foreground", "#6f6078");
      document.body.style.backgroundColor = "#f8f7fa";
      document.body.style.color = "#1b1024";
    }
    
    if (tenantTokens) applyThemeTokens(tenantTokens, isDark ? "dark" : "light");
    root.dataset.tenantTheme = tenantTokens ? "active" : "default";
    // Trigger a re-render of all components that depend on theme
    // by dispatching a custom event
    window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: resolvedTheme } }));
  }, [resolvedTheme, tenantTokens]);

  return null;
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey="theme"
      {...props}
    >
      <ThemeSyncer />
      {children}
    </NextThemesProvider>
  );
}
