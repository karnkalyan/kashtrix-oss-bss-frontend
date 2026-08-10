"use client"

import React from "react"
import { useAuth } from "@/contexts/AuthContext"
import { AdminDashboard } from "./variants/AdminDashboard"
import { CustomerDashboard } from "./variants/CustomerDashboard"
import { Loader2 } from "lucide-react"

export function RoleBasedDashboard() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const roleName = user?.role?.name?.toLowerCase() || ""

  if (roleName === "customer") {
    return <CustomerDashboard />
  }

  return <AdminDashboard />
}
