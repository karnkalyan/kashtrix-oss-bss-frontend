"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "react-hot-toast";
import { FloatingAiChat } from "@/components/layout/floating-ai-chat";
import { FieldStaffLocationTracker } from "@/components/field-staff/location-tracker";

const pathPermissionMap: Record<string, string | string[]> = {
  "/admin/users": "users_read",
  "/admin/roles": "roles_read",
  "/dashboard/overview": "dashboard_view",
  "/dashboard/real-time": "dashboard_view",
  "/customers/new": "customer_create",
  "/customers": "customer_read",
  "/branch": "branches_read",
  "/department": "departments_read",
  "/membership": "membership_read",
  "/leads": "lead_read",
  "/existing-isp": "existingisp_read",
  "/sms-campaign": "lead_read",
  "/radius/disconnect": "customer_update",
  "/tr069": "olt_read",
  "/nas": "nas_read",
  "/device-management": ["devices_view", "olt_read", "nas_read"],
  "/fiber/olt": "olt_read",
  "/fiber/ont": "olt_read",
  "/fiber/map": "olt_read",
  "/network/onts": "olt_read",
  "/network/onus": "olt_read",
  "/network/discovered-onus": "olt_read",
  "/monitoring": ["dashboard_view", "devices_view", "olt_read"],
  "/noc": ["dashboard_view", "devices_view", "olt_read"],
  "/technical-dashboard": ["dashboard_view", "devices_view", "olt_read"],
  "/inventory/assigned": "inventory_read",
  "/settings/radius-pools": "settings_read",
  "/inventory": ["inventory_read", "inventory_manage"],
  "/inventory/bulk": "bulk_inventory_read",
  "/drums": "drums_read",
  "/finance/recharge": "billing_read_self",
  "/finance/renew": "billing_read_self",
  "/finance/invoices": "billing_read_self",
  "/finance/invoice-ranges": "billing_update",
  "/finance/requests": "billing_read",
  "/tasks": ["tasks_read", "tasks_read_self"],
  "/tickets": ["tickets_read", "tickets_read_self"],
  "/mail/templates": "settings_read",
  "/mail": "dashboard_view",
  "/nettv": "services_read",
  "/tshul": "services_read",
  "/nepurix": "services_read",
  "/radius": "services_read",
  "/services": "services_read",
  "/dashboard/settings": "settings_read",
  "/master-settings": "settings_read",
  "/reports": "reports_read",
  "/admin/audit-log": "audit_log_read",
};

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  
  const { user, loading, hasPermission } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(true);
  const roleName = typeof user?.role === "string" ? user.role : user?.role?.name;
  const normalizedRole = String(roleName || "").toLowerCase();
  const isCustomer = normalizedRole === "customer";
  const isFieldStaff = normalizedRole.includes("field staff") || normalizedRole.includes("field_staff");
  const useMobilePortalChrome = isMobile && (isCustomer || isFieldStaff);

  useEffect(() => {
    // Read the real theme only after hydration — this is the correct moment.
    const dark = document.documentElement.classList.contains("dark");
    setIsDarkMode(dark);
    setMounted(true);


    const obs = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains("dark");
      setIsDarkMode(isDark);
    });
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const resize = () => {
      setIsMobile(window.innerWidth < 768);
      setSidebarOpen(window.innerWidth >= 1024);
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const saved = localStorage.getItem("sidebar-state");
    if (saved) setSidebarOpen(saved === "open");
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("sidebar-state", sidebarOpen ? "open" : "closed");
  }, [sidebarOpen, mounted]);

  useEffect(() => {
    if (loading || !mounted) return;

    // Guard matching paths
    const keys = Object.keys(pathPermissionMap).sort((a, b) => b.length - a.length);
    const matchedKey = keys.find(key => pathname === key || pathname.startsWith(key + "/"));

    if (matchedKey) {
      const permission = /^\/customers\/\d+(?:\/|$)/.test(pathname)
        ? "customers_list"
        : pathPermissionMap[matchedKey];
      const isAllowed = Array.isArray(permission)
        ? permission.length === 0 || permission.some(item => hasPermission(item))
        : hasPermission(permission);
      if (!isAllowed) {
        setIsAuthorized(false);
        toast.error("Access Denied: You do not have permission to view this page.");
        router.push("/");
        return;
      }
    }
    setIsAuthorized(true);
  }, [pathname, user, loading, router, hasPermission, mounted]);

  useEffect(() => {
    if (!mounted || loading || !user) return;
    
    const checkLoginNotifications = async () => {
      const toasted = sessionStorage.getItem("login-items-toasted");
      if (toasted === "true") return;

      try {
        const { apiRequest } = await import("@/lib/api");
        
        // Fetch tasks
        const tasks = await apiRequest<any[]>("/tasks").catch(() => []);
        const activeTasks = Array.isArray(tasks) ? tasks.filter((t: any) => 
          (t.assignedToId === user.id || t.assignedTo?.id === user.id) &&
          ["PENDING", "ACCEPTED", "IN_PROGRESS"].includes(t.status)
        ) : [];

        // Fetch tickets
        const ticketsRes = await apiRequest<any>("/tickets?limit=100").catch(() => null);
        const ticketsList = ticketsRes?.data || [];
        const activeTickets = Array.isArray(ticketsList) ? ticketsList.filter((t: any) => 
          (t.assignedToId === user.id || t.assignedTo?.id === user.id) &&
          ["OPEN", "IN_PROGRESS"].includes(t.status)
        ) : [];

        if (activeTasks.length > 0 || activeTickets.length > 0) {
          toast.success(
            `Welcome back, ${user.name || user.email || "User"}! You have ${activeTasks.length} active task(s) and ${activeTickets.length} open ticket(s) assigned to you.`,
            { duration: 8000 }
          );
        }
      } catch (err) {
        console.error("Error fetching login notification counts:", err);
      } finally {
        sessionStorage.setItem("login-items-toasted", "true");
      }
    };

    checkLoginNotifications();
  }, [user, loading, mounted]);

  return (
    <div
      className="flex h-dvh bg-background text-foreground"
      data-theme={mounted ? (isDarkMode ? "dark" : "light") : undefined}
      suppressHydrationWarning
    >
      <FieldStaffLocationTracker />
      {!useMobilePortalChrome && <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />}
      <div className="flex flex-1 flex-col overflow-hidden">
        {!useMobilePortalChrome && <Navbar onMenuClick={() => setSidebarOpen((o) => !o)} />}
        <main id="main-content" className="flex-1 overflow-auto bg-background pb-20 md:pb-0">
          <div className="app-page-frame">
            {isAuthorized ? children : <div className="flex h-full items-center justify-center">Redirecting...</div>}
          </div>
        </main>
        {isMobile && <BottomNav />}
        <FloatingAiChat />
      </div>
    </div>
  );
}
