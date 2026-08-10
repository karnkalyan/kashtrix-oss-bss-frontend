"use client"

import dynamic from "next/dynamic"
import { DashboardLayout } from "@/components/layout/dashboard-layout"

const FiberMap = dynamic(() => import("@/components/fiber/fiber-map"), {
    ssr: false,
    loading: () => <div className="h-[calc(100vh-3.5rem)] animate-pulse rounded-lg bg-muted/20" />
})

export default function FiberMapPage() {
    return (
        <DashboardLayout>
            <FiberMap />
        </DashboardLayout>
    )
}
