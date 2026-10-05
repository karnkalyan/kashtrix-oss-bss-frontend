"use client"

import React from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PageHeader } from "@/components/ui/page-header"
import { PaymentGatewaySettings } from "@/components/master-settings/payment-gateway-settings"

export default function PaymentGatewaysPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Payment & Communication Gateways"
          description="Configure global card processing, PayPal, Razorpay, InstaPay, Twilio SMS/Calls, and external aggregator endpoints."
        />
        <PaymentGatewaySettings />
      </div>
    </DashboardLayout>
  )
}
