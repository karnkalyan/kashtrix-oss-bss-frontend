"use client"

import { BarChart3, CreditCard, HelpCircle, LayoutDashboard, Settings, Users, Server, MessageSquare, ShieldCheck, Building2 } from "lucide-react"
import {
  Sidebar as SidebarComponent,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { usePathname } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { BrandLogo } from "@/components/brand-logo"

const menuItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/",
    category: "Dashboard",
    roles: ["Administrator", "Global Manager", "Branch Admin", "Staff", "Manager", "Customer", "Technical", "Field Support"]
  },
  {
    title: "Access Control",
    icon: Users,
    href: "/users",
    category: "Administration",
    roles: ["Administrator", "Global Manager"]
  },
  {
    title: "Customers",
    icon: Users,
    href: "/customers/list",
    category: "Administration",
    roles: ["Administrator", "Global Manager", "Branch Admin", "Staff", "Technical", "Field Support"]
  },
  {
    title: "Branches",
    icon: Building2,
    href: "/branch",
    category: "Administration",
    roles: ["Administrator", "Global Manager"]
  },
  {
    title: "Billing",
    icon: CreditCard,
    href: "/billing",
    category: "Finance",
    roles: ["Administrator", "Global Manager", "Branch Admin", "Staff", "Customer"]
  },
  {
    title: "SMS Campaigns",
    icon: MessageSquare,
    href: "/sms-campaign",
    category: "Sales & Marketing",
    roles: ["Administrator", "Global Manager", "Branch Admin"]
  },
  {
    title: "Reports",
    icon: BarChart3,
    href: "/reports",
    category: "System",
    roles: ["Administrator", "Global Manager", "Branch Admin"]
  },
  {
    title: "Support Tickets",
    icon: HelpCircle,
    href: "/support",
    category: "Support",
    roles: ["Administrator", "Global Manager", "Branch Admin", "Staff", "Manager", "Customer", "Technical", "Field Support"]
  },
  {
    title: "NAS",
    icon: Server,
    href: "/nas",
    category: "Network Infrastructure",
    roles: ["Administrator", "Global Manager", "Branch Admin", "Technical"]
  },
  {
    title: "System Settings",
    icon: ShieldCheck,
    href: "/master-settings",
    category: "System",
    roles: ["Administrator"]
  },
  {
    title: "My Settings",
    icon: Settings,
    href: "/settings",
    category: "System",
    roles: ["Administrator", "Global Manager", "Branch Admin", "Customer"]
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user } = useAuth()

  const filteredItems = menuItems.filter(item => {
    if (!user || !user.role) return false
    return item.roles.includes(user.role.name)
  })

  const categoryOrder = ["Dashboard", "Administration", "Sales & Marketing", "Network Infrastructure", "Finance", "Support", "System"]

  return (
    <SidebarComponent variant="floating" collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center justify-center p-2">
          <BrandLogo variant="wide" priority className="h-7 max-w-[180px]" />
        </div>
      </SidebarHeader>
      <SidebarContent className="px-2">
        {categoryOrder.map((category) => {
          const categoryItems = filteredItems.filter((item) => item.category === category)
          if (!categoryItems.length) return null
          return (
            <div key={category} className="border-b border-border/60 py-3 last:border-b-0">
              <div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground group-data-[collapsible=icon]:hidden">
                {category}
              </div>
              <SidebarMenu>
          {categoryItems.map((item) => {
            const isActive = pathname === item.href

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                  <a href={item.href} className="group">
                    <item.icon
                      className={`transition-colors duration-200 ${isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary"}`}
                    />
                    <span>{item.title}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
              </SidebarMenu>
            </div>
          )
        })}
      </SidebarContent>
      <SidebarFooter>
        <div className="p-4 text-xs text-muted-foreground">
          <p>Kashtrix · Connected operations</p>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </SidebarComponent>
  )
}
