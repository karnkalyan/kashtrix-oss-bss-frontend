"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Menu, Search, X, Headset, CircleHelp, Settings, WalletCards } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserNav } from "@/components/layout/user-nav";
import { SearchModal } from "@/components/layout/search-modal";
import { MessagesDropdown } from "@/components/layout/messages-dropdown";
import { NotificationsDropdown } from "@/components/layout/notifications-dropdown";
import { TasksDropdown } from "@/components/layout/tasks-dropdown";
import { TicketsDropdown } from "@/components/layout/tickets-dropdown";
import { InquiryDialog } from "@/components/layout/inquery";
import { BranchSwitcher } from "@/components/layout/branch-switcher";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/api";
import { useWebSocket } from "@/contexts/WebSocketContext";

interface NavbarProps {
  onMenuClick: () => void;
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const [showSearch, setShowSearch] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [inquiryDialogOpen, setInquiryDialogOpen] = useState(false);
  const [activeCallsCount, setActiveCallsCount] = useState(0);
  const [yeastarConfigured, setYeastarConfigured] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const { user } = useAuth();
  const { on } = useWebSocket();
  const roleName = typeof user?.role === "string" ? user.role : user?.role?.name;
  const normalizedRole = String(roleName || "").toLowerCase();
  const isCustomer = normalizedRole === "customer";
  const isGlobalRole = normalizedRole === "administrator" || normalizedRole.startsWith("global ");
  const assignedExtension = String(user?.yeastarExt || user?.extId || "").trim();
  const resellerId = user?.resellerId ? Number(user.resellerId) : null;

  useEffect(() => {
    if (!resellerId) return;
    let active = true;
    const loadBalance = async () => {
      try {
        const response = await apiRequest<{ success: boolean; data?: { balance?: number | string; availableBalance?: number | string } }>("/wallets", { suppressToast: true });
        if (active && response?.success) setWalletBalance(Number(response.data?.availableBalance ?? response.data?.balance ?? 0));
      } catch {
        if (active) setWalletBalance(null);
      }
    };
    void loadBalance();
    const timer = window.setInterval(() => void loadBalance(), 30_000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [resellerId]);

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchModalOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Check active calls and open inquiry on realtime call events
  useEffect(() => {
    // Wait for auth hydration so a customer is never briefly treated as staff.
    if (!user) return;
    // Customer accounts never use the PBX controls. Avoid probing Yeastar from
    // every customer portal page (including the dashboard and chat).
    if (isCustomer) {
      setYeastarConfigured(false);
      setActiveCallsCount(0);
      return;
    }
    let alive = true;
    const checkYeastarStatus = async () => {
      try {
        const status = await apiRequest<any>("/yeaster/status", { method: "GET", suppressToast: true });
        const configured = Boolean(status?.configured || status?.isActive || status?.enabled);
        if (alive) setYeastarConfigured(configured);
        return configured;
      } catch {
        if (alive) setYeastarConfigured(false);
        return false;
      }
    };

    const checkActiveCalls = async (configured = yeastarConfigured) => {
      if (!configured || !assignedExtension) {
        setActiveCallsCount(0);
        return;
      }
      try {
        const response = await apiRequest<any>(`/yeaster/calls/my-extension`, { method: "GET", suppressToast: true });
        const count = (response?.data?.calllist || []).reduce(
          (total: number, item: any) => total + (item.numbercalls?.length || 0),
          0
        );
        setActiveCallsCount(count);
      } catch (error) {
        console.error("Failed to fetch active calls:", error);
        setActiveCallsCount(0);
      }
    };

    checkYeastarStatus().then((configured) => checkActiveCalls(configured));

    const handleCallEvent = (event: any) => {
      const eventType = String(event?.eventType || event?.data?.event || "").toLowerCase();
      if (!["callstatus", "newcdr", "forward", "tranfer", "transfer", "callfailed"].includes(eventType)) return;

      const members = event?.data?.members || [];
      const isForMe = assignedExtension && members.some((member: any) =>
        String(member.ext?.number || "") === assignedExtension ||
        String(member.inbound?.to || "") === assignedExtension ||
        String(member.inbound?.callpath || "") === assignedExtension ||
        String(member.outbound?.from || "") === assignedExtension ||
        String(member.outbound?.to || "") === assignedExtension
      );
      if (!yeastarConfigured || !isForMe) return;

      const statuses = members.flatMap((member: any) => [
        member.ext?.memberstatus,
        member.inbound?.memberstatus,
        member.outbound?.memberstatus,
      ].filter(Boolean));
      const ended = eventType === "newcdr" || statuses.some((status: string) => String(status).toUpperCase() === "BYE");
      setActiveCallsCount(prev => ended ? Math.max(0, prev - 1) : Math.max(1, prev));
      setInquiryDialogOpen(true);
      checkActiveCalls();
    };

    const unsubscribeStatus = on("yeastar.call.status", handleCallEvent);
    const unsubscribeEvent = on("yeastar.event", handleCallEvent);

    return () => {
      alive = false;
      unsubscribeStatus();
      unsubscribeEvent();
    };
  }, [on, assignedExtension, yeastarConfigured, isCustomer, user]);

  const handleOpenChange = (open: boolean) => {
    setSearchModalOpen(open);
    if (!open) setSearchQuery("");
  };

  // Derive styles from resolvedTheme — no MutationObserver needed.
  // During SSR / before mount, default to light so server & client match.
  return (
    <>
      <header className="glass-navbar sticky top-0 z-40 w-full border-b border-border/70 bg-background/90 shadow-[0_1px_8px_rgba(15,23,42,0.035)] backdrop-blur-xl">
        <div className="flex h-[68px] items-center gap-2 px-3 md:px-4 lg:px-5">
          <div className="flex items-center gap-2 md:gap-4">
            <Button variant="outline" size="icon" onClick={onMenuClick} aria-label="Toggle navigation" className={`h-9 w-9 rounded-xl border-border/70 bg-card shadow-sm ${isCustomer ? "hidden md:inline-flex" : ""}`}>
              <Menu className="h-5 w-5" />
            </Button>
          </div>

          {/* Search */}
          <div className={`${showSearch ? "flex" : "hidden md:flex"} ml-1 max-w-[640px] flex-1 items-center px-1 md:px-2`}>
            <div className="relative w-full group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors duration-200" />
              <Input
                type="search"
                placeholder="Search customers, invoices, devices..."
                className="h-10 w-full rounded-xl border border-border/60 bg-card/80 pl-10 pr-16 text-sm shadow-sm transition-all placeholder:text-muted-foreground/75 hover:border-border focus-visible:border-primary/35 focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-primary/10"
                onClick={() => setSearchModalOpen(true)}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && setSearchModalOpen(true)}
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-10 top-1/2 -translate-y-1/2 h-7 w-7 opacity-70 hover:opacity-100"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
              <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 hidden md:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                Ctrl K
              </kbd>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-1 rounded-xl md:gap-1.5">
            {!isCustomer && !isGlobalRole && (
              <BranchSwitcher className="hidden lg:flex" />
            )}
            {resellerId && (
              <Link
                href="/finance/wallet"
                className="hidden h-9 items-center gap-2 rounded-xl border border-border/70 bg-card px-3 text-xs font-semibold text-primary shadow-sm md:inline-flex"
                title="Available reseller wallet balance"
              >
                <WalletCards className="size-4" />
                NPR {Number(walletBalance || 0).toLocaleString()}
              </Link>
            )}
            <button className="hidden h-9 items-center gap-2 rounded-xl border border-border/70 bg-card px-3 font-data text-[11px] font-semibold text-foreground shadow-sm transition-colors hover:bg-accent xl:flex" aria-label="Application version">
              v1.4.0 <span className="text-muted-foreground">⌄</span>
            </button>
            <span className="mx-0.5 hidden h-6 w-px bg-border xl:block" aria-hidden="true" />
            <Button variant="ghost" size="icon-sm" className="hidden h-9 w-9 rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground lg:inline-flex" aria-label="Help center"><CircleHelp className="size-4" /></Button>
            <Button asChild variant="ghost" size="icon-sm" className="hidden h-9 w-9 rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground lg:inline-flex"><Link href="/master-settings" aria-label="System settings"><Settings className="size-4" /></Link></Button>
            
            {/* Inquiry Button */}
            {yeastarConfigured && (
              <Button
                variant="ghost"
                size="icon"
                className="relative hidden h-9 w-9 rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground md:flex"
                onClick={() => setInquiryDialogOpen(true)}
                aria-label="Call inquiry"
                title="Call inquiry"
              >
                <Headset className="h-5 w-5" />
                {activeCallsCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-80" />
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-red-600 text-[9px] text-white items-center justify-center">
                      {activeCallsCount > 9 ? "9+" : activeCallsCount}
                    </span>
                  </span>
                )}
              </Button>
            )}

            {/* Mobile search toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-xl md:hidden"
              onClick={() => setShowSearch(!showSearch)}
              aria-label={showSearch ? "Close search" : "Open search"}
            >
              {showSearch ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
            </Button>

             {!isCustomer && <TasksDropdown className="hidden md:flex" />}
            {!isCustomer && <TicketsDropdown className="hidden md:flex" />}
            {!isCustomer && <MessagesDropdown className="hidden md:flex" />}
            {!isCustomer && <NotificationsDropdown className="hidden md:flex" />}
            <ThemeToggle />
            <UserNav />
          </div>
        </div>
      </header>

      <SearchModal open={searchModalOpen} onOpenChange={handleOpenChange} initialQuery={searchQuery} />

      {yeastarConfigured && (
        <InquiryDialog
          open={inquiryDialogOpen}
          onOpenChange={setInquiryDialogOpen}
          onCallsCountChange={setActiveCallsCount}
        />
      )}
    </>
  );
}
