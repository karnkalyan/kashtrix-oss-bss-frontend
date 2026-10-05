"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PageHeader } from "@/components/ui/page-header"
import dynamic from "next/dynamic"

const FiberService = dynamic(
    () => import("@/components/fiber/fiber-service"),
    { ssr: false }
)

export default function FiberServicePage() {
    return (
        <DashboardLayout>
            <div className="-mx-3 space-y-3 sm:mx-0 sm:space-y-6">
                <PageHeader
                    title="Fiber Service Availability"
                    description="Check service availability, view splitter coverage, and search locations on the map"
                    breadcrumbs={[
                        { label: "Fiber Management", href: "/fiber/map" },
                        { label: "Fiber Service" }
                    ]}
                />
                <FiberService />
            </div>
        </DashboardLayout>
    )
}
