"use client"

import type React from "react"

import { useState, useEffect, useRef, useMemo } from "react"
import {
  HelpCircle,
  Settings,
  Users,
  ChevronLeft,
  FileText,
  Phone,
  Package,
  Router,
  CreditCard,
  ChevronDown,
  ChevronRight,
  ListChecks,
  Shield,
  Activity,
  Cpu,
  MessageSquare,
  Server,
  Cable,
  Receipt,
  Coins,
  Crown,
  UserPlus,
  Building,
  RefreshCw,
  Bot,
  Building2,
  Navigation,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { TooltipProvider } from "@/components/ui/tooltip"
import { apiRequest, buildApiAssetUrl } from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"
import { BrandLogo } from "@/components/brand-logo"

interface SidebarProps {
  open: boolean
  setOpen: (open: boolean) => void
}

type MenuItem = {
  title: string
  icon: React.ElementType
  href?: string
  submenu?: { title: string; href: string; permission?: string | string[] }[]
  highlight?: boolean
  exactMatch?: boolean
  permission?: string | string[]
}

type MenuCategory = {
  category: string
  items: MenuItem[]
}

type SidebarBranding = {
  sidebarLogoExpandedLightUrl?: string | null
  sidebarLogoExpandedDarkUrl?: string | null
  sidebarLogoCollapsedLightUrl?: string | null
  sidebarLogoCollapsedDarkUrl?: string | null
}

type ActiveIspResponse = {
  companyName?: string
  name?: string
  logoUrl?: string | null
  sidebarBranding?: SidebarBranding
  data?: {
    companyName?: string
    name?: string
    logoUrl?: string | null
    sidebarBranding?: SidebarBranding
  }
  isp?: {
    companyName?: string
    name?: string
    logoUrl?: string | null
    sidebarBranding?: SidebarBranding
  }
}


// Organize menu items into categories
const menuCategories: MenuCategory[] = [
  {
    category: "Dashboard",
    items: [
      {
        title: "Dashboard",
        icon: Activity,
        permission: "dashboard_view",
        submenu: [
          { title: "Overview", href: "/dashboard/overview", permission: "dashboard_overview" },
          { title: "Real-Time Monitoring", href: "/dashboard/real-time", permission: "dashboard_realtime" },
        ],
      },
    ],
  },
  {
    category: "Administration",
    items: [
      {
        title: "Access Control",
        icon: Shield,
        permission: "users_read",
        submenu: [
          { title: "User Accounts", href: "/admin/users", permission: "users_read" },
          { title: "Roles & Permissions", href: "/admin/roles", permission: "roles_read" },
          { title: "Access Audit Trail", href: "/admin/audit-log", permission: "audit_log_read" },
        ],
      },
      {
        title: "Customers",
        icon: Users,
        permission: "customer_read",
        submenu: [
          { title: "Customer Directory", href: "/customers/all", permission: "customers_list" },
          { title: "Create Customer", href: "/customers/new", permission: "customers_create" },
        ],
      },
      {
        title: "Branches",
        icon: Building,
        permission: "branches_read",
        submenu: [
          { title: "Branch Directory", href: "/branch", permission: "branches_read" },
        ],
      },
      {
        title: "Departments",
        icon: Building,
        permission: "departments_read",
        submenu: [
          { title: "Department Directory", href: "/department", permission: "departments_read" },
        ],
      },
      {
        title: "Memberships",
        icon: Crown,
        permission: "membership_read",
        submenu: [
          { title: "Membership Plans", href: "/membership", permission: "membership_read" },
        ],
      },
    ],
  },
  {
    category: "Customer Portal",
    items: [
      {
        title: "Customer Dashboard",
        icon: Activity,
        href: "/customer/dashboard",
        permission: "dashboard_view",
        exactMatch: true,
      },
      {
        title: "Router",
        icon: Router,
        href: "/customer/router",
        permission: "dashboard_view",
        exactMatch: true,
      },
      {
        title: "Contact Details",
        icon: Phone,
        href: "/customer/contact",
        permission: "dashboard_view",
        exactMatch: true,
      },
      {
        title: "Chat",
        icon: MessageSquare,
        href: "/messages",
        permission: "dashboard_view",
        exactMatch: true,
      },
      {
        title: "Support Tickets",
        icon: HelpCircle,
        href: "/customer/support",
        permission: "dashboard_view",
        exactMatch: true,
      },
      {
        title: "Billing & Invoices",
        icon: CreditCard,
        href: "/customer/billing",
        permission: "dashboard_view",
        exactMatch: true,
      },
    ],
  },
  {
    category: "Sales & Marketing",
    items: [
      {
        title: "Leads",
        icon: UserPlus,
        permission: "lead_read",
        submenu: [
          { title: "Lead Pipeline", href: "/leads", permission: "leads_manage" },
          { title: "Create Lead", href: "/leads/create", permission: "lead_create" },
          { title: "Follow-ups", href: "/leads/follow-ups", permission: "lead_read" },
          { title: "Qualified Leads", href: "/leads/qualified", permission: "lead_read" },
          { title: "Unqualified Leads", href: "/leads/unqualified", permission: "lead_read" },
          { title: "Converted Leads", href: "/leads/converted", permission: "lead_read" },
          { title: "Import Leads", href: "/leads/import", permission: "lead_create" },
          { title: "Lead Reports", href: "/leads/reports", permission: "reports_read" },
        ],
      },
      {
        title: "Migrations",
        icon: RefreshCw,
        permission: "existingisp_read",
        submenu: [
          { title: "Migration Workspace", href: "/existing-isp", permission: "existingisp_read" },
        ],
      },
      {
        title: "SMS Campaigns",
        icon: MessageSquare,
        permission: "services_manage",
        href: "/sms-campaign",
      },
    ],
  },
  {
    category: "Network Infrastructure",
    items: [
      {
        title: "NAS",
        icon: Server,
        permission: "nas_read",
        submenu: [
          { title: "NAS Directory", href: "/nas", permission: "nas_read" },
          { title: "Register NAS", href: "/nas/new", permission: "nas_create" },
        ],
      },
      {
        title: "Devices",
        icon: Router,
        permission: ["devices_view", "olt_read", "nas_read"],
        submenu: [
          { title: "Device Inventory", href: "/device-management/all", permission: ["devices_view", "olt_read", "nas_read"] },
          { title: "MikroTik Management", href: "/device-management/mikrotik", permission: ["devices_view", "olt_read", "nas_read"] },
          { title: "Cisco Network Devices", href: "/device-management/cisco", permission: ["devices_view", "olt_read", "nas_read"] },
          { title: "Huawei OLTs", href: "/device-management/huawei-olt", permission: ["devices_view", "olt_read", "nas_read"] },
          { title: "Nokia BNG", href: "/device-management/nokia-bng", permission: ["devices_view", "olt_read", "nas_read"] },
          { title: "BDCOM OLTs", href: "/device-management/bdcom", permission: ["devices_view", "olt_read", "nas_read"] },
          { title: "C-DATA OLTs", href: "/device-management/cdata", permission: ["devices_view", "olt_read", "nas_read"] },
          { title: "VSOL", href: "/device-management/vsol", permission: ["devices_view", "olt_read", "nas_read"] },
          { title: "Nokia OLTs", href: "/device-management/nokia-olt", permission: ["devices_view", "olt_read", "nas_read"] },
          { title: "FortiGate Firewall", href: "/device-management/fortiget-firewall", permission: ["devices_view", "olt_read", "nas_read"] },
          { title: "Palo Alto Networks", href: "/device-management/alto-palo", permission: ["devices_view", "olt_read", "nas_read"] },
          { title: "Sophos Firewalls", href: "/device-management/sophos", permission: ["devices_view", "olt_read", "nas_read"] },
          { title: "Linux Servers", href: "/device-management/linux-server", permission: ["devices_view", "olt_read", "nas_read"] },
          { title: "Juniper Switches", href: "/device-management/juniper-switch", permission: ["devices_view", "olt_read", "nas_read"] },
          { title: "Juniper BRAS", href: "/device-management/juniper-bras", permission: ["devices_view", "olt_read", "nas_read"] },
        ],
      },
      {
        title: "Session Control",
        icon: Server,
        href: "/radius/disconnect",
        permission: "radius_disconnect",
      },
    ],
  },
  {
    category: "Access Networks",
    items: [
      {
        title: "Network Ops",
        icon: Activity,
        permission: ["dashboard_view", "devices_view", "olt_read"],
        submenu: [
          { title: "Network Monitoring", href: "/monitoring/dashboard", permission: ["dashboard_view", "devices_view", "olt_read"] },
          { title: "NOC Dashboard", href: "/noc/dashboard", permission: ["dashboard_view", "devices_view", "olt_read"] },
          { title: "ONU / ONT Inventory", href: "/network/onts", permission: "olt_read" },
        ],
      },
      {
        title: "Fiber",
        icon: Cable,
        permission: "olt_read",
        submenu: [
          { title: "Fiber Networks", href: "/fiber/networks", permission: "olt_read" },
          { title: "Fiber Map", href: "/fiber/map", permission: "olt_read" },
          { title: "OLT Management", href: "/fiber/olt", permission: "olt_read" },
          { title: "ONU / ONT Inventory", href: "/network/onts", permission: "olt_read" },
          { title: "Get Splitters", href: "/fiber/splitters/nearby", permission: "tasks_read_self" },
        ],
      },
      {
        title: "Inventory",
        icon: Package,
        permission: "inventory_read",
        submenu: [
          { title: "Inventory Assignments", href: "/inventory", permission: "inventory_manage" },
          { title: "Add Stock Item", href: "/inventory/add", permission: "inventory_manage" },
          { title: "Bulk Inventory", href: "/inventory/bulk", permission: "bulk_inventory_read" },
          { title: "Import Inventory", href: "/inventory/import", permission: "inventory_manage" },
          { title: "Device Lifecycle", href: "/inventory/lifecycle", permission: "inventory_read" },
          { title: "Vendors", href: "/vendors", permission: "settings_read" },
        ],
      },
      {
        title: "TR-069 ACS",
        icon: Router,
        permission: ["devices_view", "olt_read", "dashboard_view"],
        submenu: [
          { title: "ACS Dashboard", href: "/tr069", permission: ["devices_view", "olt_read", "dashboard_view"] },
          { title: "Presets & Profiles", href: "/tr069/presets", permission: ["devices_view", "olt_read", "dashboard_view"] },
          { title: "Provisions", href: "/tr069/provisions", permission: ["devices_view", "olt_read", "dashboard_view"] },
          { title: "Firmware Files", href: "/tr069/files", permission: ["devices_view", "olt_read", "dashboard_view"] },
          { title: "Virtual Parameters", href: "/tr069/virtual-parameters", permission: ["devices_view", "olt_read", "dashboard_view"] },
          { title: "ACS Configuration", href: "/tr069/config", permission: ["devices_view", "olt_read", "dashboard_view"] },
          { title: "ACS Users", href: "/tr069/users", permission: ["devices_view", "olt_read", "dashboard_view"] },
        ],
      },
      {
        title: "Drum Management",
        icon: Cable,
        permission: "drums_read",
        submenu: [
          { title: "Drums", href: "/drums", permission: "drums_read" },
          { title: "Drum Assignments", href: "/drums/assignments", permission: "drums_read" },
        ],
      },
    ],
  },
  {
    category: "Services",
    items: [
      {
        title: "Integrations / 3rd Party Services",
        icon: ListChecks,
        permission: "services_read",
        submenu: [
          { title: "Service Catalog", href: "/services", permission: "services_read" },
          { title: "Service Settings", href: "/services/settings", permission: "services_manage" },
          { title: "Register Service", href: "/services/add", permission: "services_manage" },
          { title: "NetTV Service", href: "/nettv", permission: "services_read" },
          { title: "Tshul Accounting", href: "/tshul", permission: "services_read" },
          { title: "Nepurix Accounting", href: "/nepurix", permission: "services_read" },
          { title: "RADIUS Service", href: "/radius", permission: "services_read" },
          { title: "eSewa Transactions", href: "/services/esewa", permission: "services_read" },
          { title: "Aakash SMS Setup", href: "/services/aakashsms", permission: "services_read" },
          { title: "Yeastar PBX", href: "/yeaster", permission: "nav_yeastar" },
          { title: "Asterisk PBX", href: "/asterisk", permission: "asterisk_read" },
        ],
      },
    ],
  },
  {
    category: "Finance",
    items: [
      {
        title: "Billing",
        icon: Receipt,
        permission: "billing_read",
        submenu: [
          { title: "Accounting Dashboard", href: "/accounting", permission: "billing_read" },
          { title: "Prepaid Wallets", href: "/finance/wallet", permission: ["billing_read", "wallet_view"] },
          { title: "Invoices", href: "/finance/invoices", permission: ["billing_read", "billing_read_self"] },
          { title: "Invoice Ranges", href: "/finance/invoice-ranges", permission: "billing_update" },
          { title: "Recharge", href: "/finance/recharge", permission: "billing_read_self" },
          { title: "Renewals", href: "/finance/renew", permission: "billing_read_self" },
          { title: "Branch Requests", href: "/finance/requests", permission: "billing_read" },
        ],
      },
      {
        title: "Resellers",
        icon: Building2,
        permission: "branch_read",
        href: "/reseller",
      },
    ],
  },
  {
    category: "Operations",
    items: [
      {
        title: "Tasks",
        icon: ListChecks,
        permission: "tasks_manage",
        submenu: [
          { title: "Tasks", href: "/tasks", permission: "tasks_manage" },
        ],
      },
      {
        title: "Field Staff GPS",
        icon: Navigation,
        permission: "branch_read",
        href: "/admin/field-staff",
      },
    ],
  },
  {
    category: "Support",
    items: [
      {
        title: "Support Tickets",
        icon: HelpCircle,
        permission: "tickets_manage",
        submenu: [
          { title: "Ticket Queue", href: "/tickets", permission: "tickets_manage" },
          { title: "Open Ticket", href: "/tickets/create", permission: "tickets_create" },
        ],
      },
    ],
  },
  {
    category: "System",
    items: [
      {
        title: "Settings",
        icon: Settings,
        permission: "settings_read",
        submenu: [
          { title: "Master Settings", href: "/master-settings", permission: "settings_read" },
          { title: "Package Configuration", href: "/dashboard/settings", permission: "settings_read" },
        ],
      },
      {
        title: "Reports",
        icon: FileText,
        permission: "reports_read",
        submenu: [
          { title: "Report Center", href: "/reports", permission: "reports_read" },
        ],
      },
      {
        title: "Audit Logs",
        icon: Shield,
        permission: "audit_log_read",
        href: "/admin/audit-log",
      },
      {
        title: "AI Agents",
        icon: Bot,
        permission: "dashboard_view",
        submenu: [
          { title: "Dashboard", href: "/ai-agents", permission: "dashboard_view" },
          { title: "Agent Directory", href: "/ai-agents/directory", permission: "dashboard_view" },
          { title: "AI Chat", href: "/ai-agents/chat", permission: "dashboard_view" },
          { title: "Tasks", href: "/ai-agents/tasks", permission: "dashboard_view" },
          { title: "Approvals", href: "/ai-agents/approvals", permission: "dashboard_view" },
          { title: "Activity", href: "/ai-agents/activity", permission: "dashboard_view" },
          { title: "Analytics", href: "/ai-agents/analytics", permission: "dashboard_view" },
          { title: "Usage & Cost", href: "/ai-agents/usage", permission: "dashboard_view" },
          { title: "Settings", href: "/ai-agents/settings", permission: "settings_read" },
        ],
      },
      {
        title: "Communications",
        icon: MessageSquare,
        permission: "dashboard_view",
        submenu: [
          { title: "Messaging", href: "/messages", permission: "dashboard_view" },
          { title: "Webmail", href: "/mail", permission: "dashboard_view" },
          { title: "Mail & SMS Templates", href: "/mail/templates", permission: "settings_read" },
          { title: "Notifications", href: "/notifications", permission: "dashboard_view" },
          { title: "Notices", href: "/notices", permission: "dashboard_view" },
          { title: "Push Notifications", href: "/notifications/push", permission: "dashboard_view" },
        ],
      },
    ],
  },
]






// Helper to get different icon colors for different modules
const getIconColorClass = (title: string): string => {
  const t = title.toLowerCase()
  if (t.includes("dashboard")) return "sidebar-icon-dashboard" // Blue
  if (t.includes("ai agent") || t.includes("automation")) return "sidebar-icon-ai" // Kashtrix AI magenta
  if (t.includes("access control") || t.includes("customer") || t.includes("user") || t.includes("role") || t.includes("branch") || t.includes("membership") || t.includes("department")) return "sidebar-icon-management" // Purple
  if (t.includes("lead") || t.includes("migration") || t.includes("sms campaign")) return "sidebar-icon-marketing" // Teal
  if (t.includes("service") || t.includes("tariff") || t.includes("3rd party")) return "sidebar-icon-services" // Green
  if (t.includes("finance") || t.includes("billing") || t.includes("invoice") || t.includes("recharge")) return "sidebar-icon-finance" // Orange
  if (t.includes("ticket") || t.includes("support")) return "sidebar-icon-support" // Red
  if (t.includes("report") || t.includes("analytics")) return "sidebar-icon-analytics" // Cyan
  if (t.includes("network") || t.includes("fiber") || t.includes("olt") || t.includes("nas") || t.includes("tr-069") || t.includes("topology")) return "sidebar-icon-infrastructure" // Indigo
  if (t.includes("inventory") || t.includes("drum") || t.includes("stock")) return "sidebar-icon-resources" // Pink
  if (t.includes("voip") || t.includes("yeastar") || t.includes("asterisk") || t.includes("pbx")) return "sidebar-icon-voip" // Rose
  if (t.includes("communication") || t.includes("message") || t.includes("notification") || t.includes("notice")) return "sidebar-icon-communication" // Violet
  if (t.includes("task")) return "sidebar-icon-operations" // Amber
  if (t.includes("registration") || t.includes("onboarding")) return "sidebar-icon-registration" // Lime
  return "sidebar-icon-system" // Slate
}

export function Sidebar({ open, setOpen }: SidebarProps) {
  const pathname = usePathname()
  const [openMenus, setOpenMenus] = useState<string[]>([])
  const [hoveredMenu, setHoveredMenu] = useState<string | null>(null)
  const [submenuPosition, setSubmenuPosition] = useState({ top: 0, left: 0 })
  const submenuRef = useRef<HTMLDivElement>(null)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const sidebarRef = useRef<HTMLDivElement>(null)
  const [showTooltip, setShowTooltip] = useState(true)
  const [brand] = useState<string>("Kashtrix")
  const [sidebarBranding, setSidebarBranding] = useState<SidebarBranding>({})
  const { user, hasPermission } = useAuth()

  const filteredMenuCategories = useMemo(() => {
    const roleName = typeof user?.role === 'string' ? user.role : (user?.role?.name || '');
    const roleClean = roleName.toLowerCase();
    const isGlobal = roleClean === 'administrator' ||
      roleClean === 'admin' ||
      roleClean === 'isp_admin' ||
      roleClean === 'isp admin' ||
      roleClean === 'super admin' ||
      roleClean.startsWith('global') ||
      !roleClean;

    const canAccess = (permission?: string | string[]) => {
      if (isGlobal) return true;
      if (!permission) return true;
      return Array.isArray(permission)
        ? permission.some(item => hasPermission(item))
        : hasPermission(permission);
    };

    const isCustomer = roleClean === 'customer';
    const isFieldStaff = roleClean.includes('field staff');

    const canSeeInventory = isGlobal ||
      roleClean.includes('branch admin') ||
      roleClean.includes('tech') ||
      roleClean.includes('support') ||
      roleClean.includes('field');

    // Role permissions remain authoritative. Field staff additionally receive
    // a safe, user-scoped inventory link even without global inventory access.
    const roleMenuCategories = isFieldStaff
      ? menuCategories
          .filter(category => !["Services", "Finance"].includes(category.category))
          .map(category => ({
            ...category,
            items: category.items
              .filter(item =>
                item.title !== "Leads" &&
                item.title !== "NAS" &&
                item.title !== "Communications" &&
                item.title !== "Settings"
              )
              .map(item => category.category === "Access Networks" && item.title === "Inventory"
                ? { ...item, permission: "inventory_assigned", submenu: [{ title: "My Assigned Items", href: "/inventory/assigned", permission: "inventory_assigned" }] }
                : item)
          }))
      : menuCategories;

    return roleMenuCategories.map(category => ({
      ...category,
      items: (category.category === "Customer Portal" && !isCustomer ? [] : category.items).map(item => {
        if (item.title === "Inventory" && !canSeeInventory) return null
        if (item.submenu) {
          const filteredSubmenu = item.submenu.filter(sub => {
            const isCustomerView = sub.href.startsWith("/customer/")
            if (isCustomerView && !isCustomer) return false;
            if (!isCustomerView && isCustomer) return false;
            return canAccess(sub.permission)
          })
          const hasParentAccess = canAccess(item.permission)
          const hasSubmenuAccess = filteredSubmenu.length > 0

          if (!hasParentAccess && !hasSubmenuAccess) return null
          if (filteredSubmenu.length === 0 && !item.href) return null

          return { ...item, submenu: filteredSubmenu }
        }

        const isCustomerPortalItem = item.href?.startsWith("/customer/")
        if (isCustomerPortalItem && !isCustomer) return null
        if (!isCustomerPortalItem && isCustomer) return null
        if (!canAccess(item.permission)) return null
        return item
      }).filter((item): item is MenuItem => item !== null)
    })).filter(category => category.items.length > 0)
  }, [user, hasPermission])

  // Check for dark mode
  useEffect(() => {
    // Initial check
    setIsDarkMode(document.documentElement.classList.contains("dark"))

    // Set up observer for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "class") {
          setIsDarkMode(document.documentElement.classList.contains("dark"))
        }
      })
    })

    observer.observe(document.documentElement, { attributes: true })
    return () => observer.disconnect()
  }, [])


  const ispData = async () => {
    try {
      const response = await apiRequest<ActiveIspResponse>("/isp/active");
      const isp = response?.data || response?.isp || response;
      setSidebarBranding(isp?.sidebarBranding || {});
    } catch (error) {
      console.error("Error fetching ISP data:", error);
    }
  }

  useEffect(() => {
    ispData()
  }, [])

  useEffect(() => {
    const handleBrandingUpdate = (event: Event) => {
      const branding = (event as CustomEvent<SidebarBranding>).detail
      if (branding) setSidebarBranding(branding)
    }

    window.addEventListener("isp-sidebar-branding-updated", handleBrandingUpdate)
    return () => window.removeEventListener("isp-sidebar-branding-updated", handleBrandingUpdate)
  }, [])



  // 1. HELPER FUNCTION to generate initials
  const getBrandInitials = (name: string): string => {
    // Return a default if the brand name isn't loaded yet
    if (!name) return "SI";

    const words = name.split(" ").filter(Boolean); // Split by space and remove any empty items

    if (words.length === 1) {
      // If one word, take the first two letters
      return words[0].substring(0, 2).toUpperCase();
    } else {
      // If multiple words, take the first letter of the first two words
      return (words[0][0] + (words[1]?.[0] || "")).toUpperCase();
    }
  };


  const brandInitials = useMemo(() => getBrandInitials(brand), [brand]);
  const activeLogoUrl = useMemo(() => {
    const logoPath = open
      ? isDarkMode
        ? sidebarBranding.sidebarLogoExpandedDarkUrl
        : sidebarBranding.sidebarLogoExpandedLightUrl
      : isDarkMode
        ? sidebarBranding.sidebarLogoCollapsedDarkUrl
        : sidebarBranding.sidebarLogoCollapsedLightUrl;

    return buildApiAssetUrl(logoPath);
  }, [isDarkMode, open, sidebarBranding]);


  // Add keyboard shortcut (Cmd/Ctrl + B)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "b") {
        e.preventDefault()
        setOpen(!open)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [open, setOpen])

  const isSubitemActive = (
    subitem: { href: string },
    parentSubmenu: { href: string }[] | undefined,
    currentPath: string
  ): boolean => {
    if (!subitem.href) return false
    if (currentPath === subitem.href) return true
    if (subitem.href !== "/ai-agents" && subitem.href !== "/" && currentPath.startsWith(subitem.href + "/")) {
      const hasMoreSpecificSibling = parentSubmenu?.some(
        (other) =>
          other.href !== subitem.href &&
          (currentPath === other.href || currentPath.startsWith(other.href + "/")) &&
          other.href.length > subitem.href.length
      )
      return !hasMoreSpecificSibling
    }
    return false
  }

  // Set open submenu based on current path
  useEffect(() => {
    let foundMenuItem: MenuItem | undefined

    if (filteredMenuCategories) {
      filteredMenuCategories.forEach((category) => {
        const item = category.items.find(
          (item) => item.submenu?.some((subitem) => isSubitemActive(subitem, item.submenu, pathname)) || pathname === item.href || (item.title === "AI Agents" && pathname.startsWith("/ai-agents")),
        )
        if (item) foundMenuItem = item
      })

      if (foundMenuItem) {
        setOpenMenus((prev) => (prev.includes(foundMenuItem!.title) ? prev : [...prev, foundMenuItem!.title]))
      }
    }
  }, [pathname, filteredMenuCategories])

  // Close submenu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // For submenu handling (existing code)
      if (submenuRef.current && !submenuRef.current.contains(event.target as Node)) {
        setHoveredMenu(null)
        setShowTooltip(true)
      }

      // For sidebar in mobile view
      // Check if we're in mobile view (window width < 768px), sidebar is open, and click is outside sidebar
      if (window.innerWidth < 768 && open && sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [open, setOpen])

  // Toggle menu open/closed
  const toggleMenu = (title: string) => {
    setOpenMenus((prev) => (prev.includes(title) ? prev.filter((item) => item !== title) : [...prev, title]))
  }

  // Handle hover for collapsed sidebar
  const handleMenuHover = (
    e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>,
    title: string,
    hasSubmenu: boolean,
  ) => {
    if (!open && hasSubmenu) {
      const rect = e.currentTarget.getBoundingClientRect()
      setSubmenuPosition({
        top: rect.top,
        left: rect.right + 10,
      })
      setHoveredMenu(title)
      setShowTooltip(false) // Hide tooltip when showing submenu
    }
  }

  // Handle mouse leave for collapsed sidebar
  const handleMenuLeave = () => {
    // Small delay to allow moving mouse to submenu
    setTimeout(() => {
      if (!submenuRef.current?.matches(":hover")) {
        setHoveredMenu(null)
        setShowTooltip(true) // Show tooltip again when submenu is closed
      }
    }, 100)
  }

  // Function to determine if a menu item is active
  const isMenuItemActive = (item: MenuItem): boolean => {
    // For items with exactMatch property, check for exact path match
    if (item.exactMatch) {
      return pathname === item.href
    }

    // For items with submenu, check if any submenu item matches the current path
    if (item.submenu) {
      return item.submenu.some((subitem) => isSubitemActive(subitem, item.submenu, pathname)) || (item.title === "AI Agents" && pathname.startsWith("/ai-agents"))
    }

    // For regular items, check if the path starts with the item's href
    // This ensures parent routes stay active when on child routes
    return item.href ? pathname === item.href || (!item.exactMatch && pathname.startsWith(item.href)) : false
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div
        ref={sidebarRef}
        className={cn(
          "kashtrix-sidebar fixed inset-y-0 left-0 z-50 flex w-[286px] flex-col border-r border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar-background))] text-[hsl(var(--sidebar-foreground))] transition-[width,transform] duration-200 ease-out",
          open ? "translate-x-0" : "-translate-x-full",
          "md:relative md:z-0 md:translate-x-0",
          !open ? "md:w-[68px]" : "md:w-[286px]",
        )}
      >
        <div className={cn("h-full flex flex-col", !open && "md:items-center")}>
          {/* Sidebar header */}
          <div
            className={cn(
              "relative flex h-[76px] shrink-0 items-center border-b border-[hsl(var(--sidebar-border))] px-5",
              open ? "justify-start" : "md:justify-center",
            )}
          >
            {activeLogoUrl ? (
              <img
                src={activeLogoUrl}
                alt={brand}
                className={cn(
                  "block object-contain",
                  open ? "h-8 max-w-[174px]" : "h-8 w-8"
                )}
              />
            ) : open ? (
              <BrandLogo variant="wide" priority className="h-8 max-w-[184px]" />
            ) : (
              <BrandLogo variant="icon" priority className="h-8 w-9" />
            )}
            {open && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
                className="absolute right-2"
                aria-label="Close sidebar"
              >
                <ChevronLeft className="size-4" />
              </Button>
            )}
          </div>

          {/* Sidebar content */}
          <div className={cn("flex-1 overflow-auto py-3 scrollbar-thin", open ? "px-2.5" : "px-0")}>
            <nav className="grid" aria-label="Main navigation">
              {filteredMenuCategories &&
                filteredMenuCategories.map((category, categoryIndex) => (
                  <div key={category.category} className="mb-2 last:mb-0">
                    {/* Category header - only show when sidebar is open */}
                    {open && (
                      <div className="mb-1 px-2.5 pt-1.5">
                        <h3 className="sidebar-category text-[10px] font-semibold uppercase tracking-[0.12em]">
                          {category.category}
                        </h3>
                      </div>
                    )}

                    {/* Category divider for collapsed sidebar */}
                    {!open && categoryIndex > 0 && <div className="my-2 mx-auto w-4 border-t border-border/40"></div>}

                    {/* Menu items */}
                    {category.items.map((item) => {
                      const isActive = isMenuItemActive(item)
                      const isOpen = openMenus.includes(item.title)
                      const hasSubmenu = item.submenu && item.submenu.length > 0

                      // Special styling for highlighted items
                      const highlightStyle = item.highlight ? "bg-primary/10 text-primary hover:bg-primary/20" : ""

                      if (hasSubmenu) {
                        return (
                          <div key={item.title} className={cn(!open && "md:w-10 md:mx-auto")}>
                            <div className="flex items-center">
                              {!open ? (
                                <div key={item.title} className="relative w-full">
                                  <button
                                    onMouseEnter={(e) => handleMenuHover(e, item.title, true)}
                                    onMouseLeave={handleMenuLeave}
                                    className={cn(
                                      "flex h-9 w-full items-center justify-center rounded-lg text-[13px] font-medium transition-colors",
                                      isActive
                                        ? "bg-primary/10 text-primary"
                                        : "text-adaptive hover:bg-muted hover:text-foreground",
                                      highlightStyle,
                                    )}
                                  >
                                    <div
                                      className={cn(
                                        "sidebar-icon",
                                        getIconColorClass(item.title),
                                        isActive && "sidebar-icon-active",
                                      )}
                                    >
                                      <item.icon aria-hidden="true" />
                                    </div>
                                    <span className="sr-only">{item.title}</span>
                                  </button>
                                  {/* Only show tooltip when not showing submenu */}
                                  {showTooltip && hoveredMenu !== item.title && (
                                    <div className="absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2">
                                      <div className="rounded bg-popover px-2 py-1 text-sm text-popover-foreground shadow-md">
                                        {item.title}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <button
                                  onClick={() => toggleMenu(item.title)}
                                  className={cn(
                                    "flex h-9 w-full items-center justify-between rounded-lg px-2.5 text-left text-[13px] font-medium transition-all",
                                    isActive
                                      ? "bg-primary/10 text-primary"
                                      : "text-adaptive hover:bg-muted hover:text-foreground",
                                    highlightStyle,
                                  )}
                                >
                                  <div className="flex min-w-0 items-center gap-2.5 text-left">
                                    <div
                                      className={cn(
                                        "sidebar-icon",
                                        getIconColorClass(item.title),
                                        isActive && "sidebar-icon-active",
                                      )}
                                    >
                                      <item.icon aria-hidden="true" />
                                    </div>
                                    <span className="truncate text-left">{item.title}</span>
                                  </div>
                                  {isOpen ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
                                </button>
                              )}
                            </div>
                            {open && isOpen && (
                              <div className="ml-[1.35rem] border-l border-[hsl(var(--sidebar-border))] pl-4 pr-2">
                                <div className="mt-1 space-y-0.5 py-1">
                                  {item.submenu?.map((subitem) => {
                                    const isSubActive = isSubitemActive(subitem, item.submenu, pathname)
                                    return (
                                      <Link
                                        key={subitem.title}
                                        href={subitem.href}
                                        className={cn(
                                          "flex min-h-7 items-center justify-start rounded-md px-2 py-1 text-left text-[12px] transition-colors submenu-item",
                                          isSubActive
                                            ? "bg-primary/10 text-primary"
                                            : "text-adaptive hover:bg-muted hover:text-foreground",
                                        )}
                                        aria-current={isSubActive ? "page" : undefined}
                                      >
                                        <span className="submenu-bullet"></span>
                                        {subitem.title}
                                      </Link>
                                    )
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      }

                      return !open ? (
                        <div key={item.title} className="relative w-full">
                          <Link
                            href={item.href!}
                            className={cn(
                              "flex items-center justify-center rounded-md p-2 text-sm font-medium transition-colors",
                              isActive
                                ? "bg-primary/10 text-primary"
                                : "text-adaptive hover:bg-muted hover:text-foreground",
                              highlightStyle,
                            )}
                            aria-current={isActive ? "page" : undefined}
                            onMouseEnter={() => setShowTooltip(true)}
                          >
                            <div
                              className={cn(
                                "sidebar-icon",
                                getIconColorClass(item.title),
                                isActive && "sidebar-icon-active",
                              )}
                            >
                              <item.icon aria-hidden="true" />
                            </div>
                            <span className="sr-only">{item.title}</span>
                          </Link>
                          {/* Simple tooltip */}
                          {showTooltip && (
                            <div className="absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2">
                              <div className="rounded bg-popover px-2 py-1 text-sm text-popover-foreground shadow-md">
                                {item.title}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <Link
                          key={item.title}
                          href={item.href!}
                          className={cn(
                            "flex h-9 items-center justify-start gap-2.5 rounded-lg px-2.5 text-left text-[13px] font-medium transition-colors",
                            isActive
                              ? "bg-primary/10 text-primary"
                              : "text-adaptive hover:bg-muted hover:text-foreground",
                            highlightStyle,
                          )}
                          aria-current={isActive ? "page" : undefined}
                        >
                          <div
                            className={cn(
                              "sidebar-icon",
                              getIconColorClass(item.title),
                              isActive && "sidebar-icon-active",
                            )}
                          >
                            <item.icon aria-hidden="true" />
                          </div>
                          <span className="truncate text-left">{item.title}</span>
                        </Link>
                      )
                    })}
                  </div>
                ))}
            </nav>
          </div>

          {/* Sidebar footer */}
          <div
            className={cn("m-3 rounded-xl border border-[hsl(var(--sidebar-border))] bg-background/55 p-3 shadow-sm", !open && "md:hidden", "hidden md:block")}
            style={{
              borderColor: isDarkMode ? "rgba(255, 255, 255, 0.08)" : "rgba(15, 23, 42, 0.08)",
            }}
          >
            <p className="text-xs text-muted-foreground">Kashtrix · Every System. One Platform.</p>
            <p className="text-xs text-muted-foreground mt-1">Press Ctrl+B to toggle sidebar</p>
          </div>
        </div>
      </div>

      {/* Floating submenu for collapsed sidebar */}
      {hoveredMenu && !open && (
        <div
          ref={submenuRef}
          className="fixed sidebar-submenu"
          style={{
            top: `${submenuPosition.top}px`,
            left: `${submenuPosition.left}px`,
            zIndex: 50,
            minWidth: "200px",
            padding: "8px",
            background: isDarkMode ? "rgba(17, 25, 40, 0.25)" : "rgba(255, 255, 255, 0.25)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: isDarkMode ? "1px solid rgba(255, 255, 255, 0.05)" : "1px solid rgba(255, 255, 255, 0.3)",
            boxShadow: isDarkMode ? "0 8px 32px rgba(0, 0, 0, 0.2)" : "0 8px 32px rgba(31, 38, 135, 0.1)",
            borderRadius: "var(--radius)",
          }}
          onMouseEnter={() => {
            setHoveredMenu(hoveredMenu)
            setShowTooltip(false)
          }}
          onMouseLeave={() => {
            setHoveredMenu(null)
            setShowTooltip(true)
          }}
        >
          {/* Parent menu name */}
          <div className="px-3 py-2 font-medium text-sm">{hoveredMenu}</div>

          {/* Divider */}
          <div className="h-px bg-border/40 mx-2 my-1"></div>
          {/* Submenu items */}
          <div className="py-1">
            {(() => {
              const activeParent = filteredMenuCategories
                .flatMap((category) => category.items)
                .find((item) => item && item.title === hoveredMenu);
              return activeParent?.submenu?.map((subitem) => {
                const isSubActive = isSubitemActive(subitem, activeParent.submenu, pathname);
                return (
                  <Link
                    key={subitem.title}
                    href={subitem.href}
                    className={cn(
                      "flex items-center justify-start rounded-md px-3 py-1.5 text-left text-sm transition-colors submenu-item",
                      isSubActive ? "bg-primary/10 text-primary" : "text-adaptive hover:bg-muted hover:text-foreground",
                    )}
                    aria-current={isSubActive ? "page" : undefined}
                  >
                    <span className="submenu-bullet"></span>
                    {subitem.title}
                  </Link>
                );
              });
            })()}
          </div>
        </div>
      )}
    </TooltipProvider>
  )
}
