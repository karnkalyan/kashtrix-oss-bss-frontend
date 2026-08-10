import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PageHeader } from "@/components/ui/page-header"
import { CustomerProfile } from "@/components/customers/customer-profile"
import { ArrowLeft, ChevronDown, Pencil, UserRound } from "lucide-react"

export default async function CustomerDetailsPage({
  params,
}: {
  params: { id: string }
}) {
  // await params per Next.js requirement
  const { id } = await params

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Customer Profile"
          description="View and manage customer details and subscription information"
          icon={UserRound}
          breadcrumbs={[{ label: "Customers", href: "/customers/all" }, { label: "Profile" }, { label: `Customer ${id}` }]}
          actions={[
            { label: "Actions", href: "#customer-actions", variant: "outline", icon: <ChevronDown /> },
            { label: "Edit Profile", href: `/customers/${id}/edit`, icon: <Pencil /> },
            { label: "Back to Customers", href: "/customers/all", variant: "outline", icon: <ArrowLeft /> },
          ]}
        />

        <CustomerProfile customerId={id} />
      </div>
    </DashboardLayout>
  )
}
