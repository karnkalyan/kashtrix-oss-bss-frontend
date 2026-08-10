"use client"

import { TR069Dashboard } from "@/components/tr069/dashboard"
import { DashboardLayout } from "@/components/layout/dashboard-layout"

export default function TR069Page() {
    return (
        <DashboardLayout>
            <TR069Dashboard />
        </DashboardLayout>
    )
}
