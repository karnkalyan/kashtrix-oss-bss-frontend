import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PageHeader } from "@/components/ui/page-header"
import { NetworkTopology } from "@/components/networking/network-topology"
import { NetworkStats } from "@/components/networking/network-stats"
import { DeviceList } from "@/components/networking/device-list"

export default function NetworkTopologyPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Network Topology"
          description="Visual representation of your network infrastructure"
          actions={[
            { label: "Export Map", href: "#" },
            { label: "Print", href: "#" },
            { label: "Refresh", href: "#" },
          ]}
        />

        <NetworkStats />
        <NetworkTopology />
        <DeviceList />
      </div>
    </DashboardLayout>
  )
}
