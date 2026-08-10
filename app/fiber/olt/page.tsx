import type { Metadata } from "next"
import { Activity } from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { OLTDetailed } from "@/components/fiber/olt-detailed"

export const metadata: Metadata = {
  title: "OLT Management | KisanNET Dashboard",
  description: "Manage your Optical Line Terminals (OLTs) and monitor their performance",
}

export default function OLTPage() {
  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-violet-500/10 p-2.5 text-violet-600"><Activity className="size-6" /></div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">OLT Management</h1>
            <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
              Complete OLT details with SSH configuration, ports, subscribers, and network health
            </p>
          </div>
        </div>
        <OLTDetailed />
      </div>
    </DashboardLayout>
  )
}
