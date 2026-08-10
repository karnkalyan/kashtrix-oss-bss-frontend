"use client"
import { useState, useEffect } from "react"
import { SystemSettings } from "./system-settings"
import { MailSettings } from "./mail-settings"
import { BranchSettings } from "./branch-settings"
import { EnhancementsSettings } from "./enhancements-settings"
import { NotificationsWhatsAppSettings } from "./notifications-whatsapp-settings"
import { LicenseSettings } from "./license-settings"
import { RolesList } from "@/components/admin/roles-list"
import { RolePermissionsMatrix } from "@/components/admin/role-permissions-matrix"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { apiRequest } from "@/lib/api"
import { CardContainer } from "@/components/ui/card-container"
import { BillingConfigurationSettings } from "@/components/settings/billing-configuration-settings"
import { TicketSettings } from "@/components/settings/ticket-settings"
import { RadiusPoolsSettings } from "@/components/settings/radius-pools-settings"
import { ServicesSyncSettings } from "@/components/settings/services-sync-settings"
import { PaymentGatewaySettings } from "./payment-gateway-settings"
import { ThemeEditor } from "./theme-editor"
import { ApiTokenSettings } from "./api-token-settings"
import { DatabaseBackupSettings } from "./database-backup-settings"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ShieldCheck } from "lucide-react"
import toast from "react-hot-toast"

export function MasterSettingsTabs() {
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null)
  const [showLicense, setShowLicense] = useState(true)
  const [showProviderAccess, setShowProviderAccess] = useState(false)
  const [providerSecret, setProviderSecret] = useState("")
  const [savingProviderSecret, setSavingProviderSecret] = useState(false)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await apiRequest<Record<string, string>>("/settings")
        if (data && typeof data === 'object') {
          setShowLicense(data.showLicenseTab !== 'false')
        }
      } catch (e) {
        console.error("Failed to load settings in MasterSettingsTabs:", e)
      }
    }
    fetchSettings()
  }, [])

  useEffect(() => {
    const handleSettingsSaved = (e: CustomEvent<any>) => {
      if (e.detail && e.detail.showLicenseTab !== undefined) {
        setShowLicense(e.detail.showLicenseTab)
      }
    }
    window.addEventListener("system-settings-saved" as any, handleSettingsSaved)
    return () => window.removeEventListener("system-settings-saved" as any, handleSettingsSaved)
  }, [])

  useEffect(() => {
    const handleSecretLicenseToggle = async (event: KeyboardEvent) => {
      if (!(event.ctrlKey && event.altKey && event.shiftKey && event.key === "F12")) return
      event.preventDefault()
      const nextValue = !showLicense
      setShowLicense(nextValue)
      try {
        await apiRequest("/settings", {
          method: "POST",
          body: JSON.stringify({
            key: "showLicenseTab",
            value: String(nextValue),
            description: "Hidden license tab visibility setting",
          }),
          suppressToast: true,
        })
      } catch (error) {
        setShowLicense(!nextValue)
        console.error("Failed to toggle license tab:", error)
      }
    }

    window.addEventListener("keydown", handleSecretLicenseToggle)
    return () => window.removeEventListener("keydown", handleSecretLicenseToggle)
  }, [showLicense])

  useEffect(() => {
    const revealProviderAccess = (event: KeyboardEvent) => {
      if (!(event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "z")) return
      event.preventDefault()
      setShowProviderAccess(value => !value)
    }
    window.addEventListener("keydown", revealProviderAccess)
    return () => window.removeEventListener("keydown", revealProviderAccess)
  }, [])

  const saveProviderSecret = async () => {
    if (providerSecret.length < 12) return toast.error("Use at least 12 characters")
    setSavingProviderSecret(true)
    try {
      await apiRequest("/tr069-devices/provider-access/configure", {
        method: "POST",
        body: JSON.stringify({ secret: providerSecret }),
      })
      setProviderSecret("")
      setShowProviderAccess(false)
      toast.success("Provider access secret updated")
    } finally {
      setSavingProviderSecret(false)
    }
  }

  return (
    <div className="w-full">
      {showProviderAccess && (
        <div className="mb-6 rounded-2xl border border-primary/20 bg-primary/[0.04] p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-primary/10 p-2 text-primary"><ShieldCheck className="size-5" /></div>
            <div className="flex-1">
              <h2 className="font-semibold">Provider TR-069 inventory access</h2>
              <p className="mt-1 text-xs text-muted-foreground">Set the server-verified secret used to reveal the complete ACS inventory. The stored value is one-way hashed.</p>
              <div className="mt-4 flex max-w-xl flex-col gap-2 sm:flex-row sm:items-end">
                <div className="flex-1 space-y-1.5"><Label htmlFor="tr069-provider-secret">Provider secret</Label><Input id="tr069-provider-secret" type="password" autoComplete="new-password" value={providerSecret} onChange={event => setProviderSecret(event.target.value)} /></div>
                <Button onClick={saveProviderSecret} disabled={savingProviderSecret || providerSecret.length < 12}>Save secret</Button>
              </div>
            </div>
          </div>
        </div>
      )}
      <Tabs defaultValue="system" className="space-y-6">
        <TabsList className="bg-slate-100 dark:bg-slate-800 flex-wrap h-auto">
          <TabsTrigger value="system">System Overview</TabsTrigger>
          <TabsTrigger value="appearance">Theme Studio</TabsTrigger>
          <TabsTrigger value="mail">Mail Setup</TabsTrigger>
          <TabsTrigger value="database-backup">Database Backup</TabsTrigger>
          <TabsTrigger value="branch">Service & Branch Settings</TabsTrigger>
          <TabsTrigger value="enhancements">Enhancements & Customer Types</TabsTrigger>
          <TabsTrigger value="roles">Role & Sidebar Management</TabsTrigger>
          <TabsTrigger value="ticket-settings">Ticket Settings</TabsTrigger>
          <TabsTrigger value="billing-configuration">Billing Configuration</TabsTrigger>
          <TabsTrigger value="payment-gateway">Payment Gateway</TabsTrigger>
          <TabsTrigger value="radius-pools">RADIUS Pools</TabsTrigger>
          <TabsTrigger value="services-sync">Services Sync</TabsTrigger>
          <TabsTrigger value="api-tokens">API Tokens & Docs</TabsTrigger>
          <TabsTrigger value="notifications">Notifications & WhatsApp</TabsTrigger>
          {showLicense && <TabsTrigger value="license">License</TabsTrigger>}
        </TabsList>
        <TabsContent value="system">
          <SystemSettings />
        </TabsContent>
        <TabsContent value="appearance"><ThemeEditor /></TabsContent>
        <TabsContent value="mail">
          <MailSettings />
        </TabsContent>
        <TabsContent value="database-backup">
          <DatabaseBackupSettings />
        </TabsContent>
        <TabsContent value="branch">
          <BranchSettings />
        </TabsContent>
        <TabsContent value="enhancements">
          <EnhancementsSettings />
        </TabsContent>
        <TabsContent value="roles">
          <div className="grid gap-6 md:grid-cols-12">
            <div className="md:col-span-5">
              <RolesList 
                selectedRoleId={selectedRoleId}
                onRoleSelect={setSelectedRoleId}
              />
            </div>
            <div className="md:col-span-7">
              <RolePermissionsMatrix 
                selectedRoleId={selectedRoleId}
              />
            </div>
          </div>
        </TabsContent>
        <TabsContent value="ticket-settings">
          <CardContainer title="Ticket Types & SLA" description="Configure support queues and priority deadlines" gradientColor="#f97316">
            <TicketSettings />
          </CardContainer>
        </TabsContent>
        <TabsContent value="billing-configuration">
          <CardContainer title="Fiscal Years & Payment Methods" description="Configure fiscal sessions and accepted renewal payment methods" gradientColor="#0ea5e9">
            <BillingConfigurationSettings />
          </CardContainer>
        </TabsContent>
        <TabsContent value="payment-gateway">
          <PaymentGatewaySettings />
        </TabsContent>
        <TabsContent value="radius-pools">
          <CardContainer title="RADIUS Pool Management" description="Create Framed-Pool values and assign them to Internet Plans" gradientColor="#0ea5e9">
            <RadiusPoolsSettings />
          </CardContainer>
        </TabsContent>
        <TabsContent value="services-sync">
          <CardContainer title="Services Sync Manager" description="Sync packages, plans, devices, and VoIP log integrations across services" gradientColor="#f59e0b">
            <ServicesSyncSettings />
          </CardContainer>
        </TabsContent>
        <TabsContent value="api-tokens">
          <ApiTokenSettings />
        </TabsContent>
        <TabsContent value="notifications">
          <NotificationsWhatsAppSettings />
        </TabsContent>
        {showLicense && (
          <TabsContent value="license">
            <LicenseSettings />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
