"use client";

import type React from "react";
import { usePathname } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

const SHELL_FREE_ROUTES = ["/login", "/forgot-password", "/reset-password"];

function isShellFreeRoute(pathname: string) {
  if (pathname === "/") return true;
  return SHELL_FREE_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export function RootDashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (isShellFreeRoute(pathname)) return <>{children}</>;

  return <DashboardLayout>{children}</DashboardLayout>;
}
