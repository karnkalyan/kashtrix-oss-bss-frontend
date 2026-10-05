"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PageHeader } from "@/components/ui/page-header"
import { CustomersList } from "@/components/customers/customers-list"
import {
  CustomerFilters,
  CustomerFilterValues,
  defaultCustomerFilters,
} from "@/components/customers/customer-filters"

export default function CustomersPage() {
  const [filters, setFilters] = useState<CustomerFilterValues>(defaultCustomerFilters)

  const handleResetFilters = () => {
    setFilters(defaultCustomerFilters)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Customer Management"
          description="View and manage all customer accounts"
          actions={[
            { label: "Add Customer", href: "/customers/new" },
            { label: "Import Customers", href: "/import?type=customers" },
            { label: "Export", href: "#" },
          ]}
        />

        <CustomerFilters
          filters={filters}
          onFilterChange={setFilters}
          onReset={handleResetFilters}
        />
        <CustomersList
          filters={filters}
          onResetFilters={handleResetFilters}
        />
      </div>
    </DashboardLayout>
  )
}
