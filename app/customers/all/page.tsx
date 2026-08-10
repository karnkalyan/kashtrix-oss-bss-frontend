import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PageHeader } from "@/components/ui/page-header"
import { CustomersList } from "@/components/customers/customers-list"
import { Download, Upload, UserPlus, Users } from "lucide-react"

export default function CustomersPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Customers"
          description="Manage subscriber accounts, service plans, connectivity, and lifecycle status"
          icon={Users}
          breadcrumbs={[{ label: "Customers" }, { label: "All Customers" }]}
          actions={[
            { label: "Import", href: "#", variant: "outline", icon: <Upload /> },
            { label: "Export", href: "#", variant: "outline", icon: <Download /> },
            { label: "Add Customer", href: "/customers/new", icon: <UserPlus /> },
          ]}
        />

        <CustomersList />
      </div>
    </DashboardLayout>
  )
}
