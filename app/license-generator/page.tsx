"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Copy, ExternalLink, KeyRound, Loader2, RefreshCw, ShieldCheck } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PageHeader } from "@/components/ui/page-header"
import { apiRequest } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CardContainer } from "@/components/ui/card-container"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "react-hot-toast"
import { LicenseStatus } from "@/components/master-settings/license-settings"

const LICENSE_SERVER_URL = "https://license.simulcast.com.np"

export default function LicenseGeneratorPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [status, setStatus] = useState<LicenseStatus | null>(null)
  const [token, setToken] = useState("")
  const [activating, setActivating] = useState(false)
  const [fetching, setFetching] = useState(false)

  const isAdmin = useMemo(() => {
    if (!user) return false
    const roleStr = typeof user.role === "string" ? user.role : user.role?.name || ""
    const roleName = roleStr.toLowerCase()
    return roleName === "administrator" || roleName === "admin"
  }, [user])

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.replace("/")
    }
  }, [isAdmin, loading, router])

  const loadStatus = async () => {
    setFetching(true)
    try {
      const data = await apiRequest<LicenseStatus>("/license/status", { suppressToast: true })
      setStatus(data)
    } catch {
      // Ignored
    } finally {
      setFetching(false)
    }
  }

  useEffect(() => {
    if (isAdmin) {
      loadStatus()
    }
  }, [isAdmin])

  const activate = async () => {
    if (!token.trim()) {
      toast.error("License key token is required")
      return
    }
    setActivating(true)
    try {
      const data = await apiRequest<LicenseStatus>("/license/install", {
        method: "POST",
        body: JSON.stringify({ token: token.trim(), licenseKey: token.trim() }),
      })
      setStatus(data)
      setToken("")
      toast.success(data.active ? "License activated successfully!" : "Status updated")
    } catch (err: any) {
      toast.error(err.message || "Failed to activate license")
    } finally {
      setActivating(false)
    }
  }

  if (loading || !isAdmin) {
    return null
  }

  const isActivated = Boolean(status?.active)

  return (
    <DashboardLayout>
      <div className="w-full px-4 py-6 space-y-6 max-w-4xl mx-auto">
        <PageHeader
          title="Secure License Provisioning"
          description="Provision and activate this Kashtrix OSS/BSS instance with the centralized Secure License Server"
        />

        <CardContainer
          title="Centralized License Server"
          description="Instance authentication is managed through mTLS and cryptographic Ed25519 signatures"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant={isActivated ? "default" : "destructive"}>
                  {isActivated ? "Active & Authorized" : status?.status ? status.status.toUpperCase() : "Unlicensed"}
                </Badge>
                {status?.validationMode && (
                  <Badge variant="outline" className="text-xs">
                    {status.validationMode === "online" ? "mTLS Online Validated" : "Ed25519 Offline Verified"}
                  </Badge>
                )}
              </div>
              <Button type="button" variant="outline" size="sm" onClick={loadStatus} disabled={fetching}>
                {fetching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                Refresh Status
              </Button>
            </div>

            {status?.provisioningId && (
              <div className="rounded-md border bg-muted/40 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">Instance Provisioning ID</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      navigator.clipboard.writeText(status.provisioningId!)
                      toast.success("Provisioning ID copied to clipboard")
                    }}
                  >
                    <Copy className="mr-1.5 h-3.5 w-3.5" />
                    Copy
                  </Button>
                </div>
                <div className="break-all font-mono text-xs bg-background/80 p-2.5 rounded border select-all">
                  {status.provisioningId}
                </div>
                <p className="text-xs text-muted-foreground">
                  Copy this Provisioning ID and enter it in the Secure License Manager at{" "}
                  <a href={LICENSE_SERVER_URL} target="_blank" rel="noreferrer" className="underline text-primary font-medium">
                    {LICENSE_SERVER_URL}
                  </a>{" "}
                  to issue an authorized license token.
                </p>
              </div>
            )}

            {status?.hardwareId && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-semibold">Scoped Hardware ID</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[11px]"
                    onClick={() => {
                      navigator.clipboard.writeText(status.hardwareId!)
                      toast.success("Hardware ID copied")
                    }}
                  >
                    <Copy className="mr-1 h-3 w-3" />
                    Copy HWID
                  </Button>
                </div>
                <div className="font-mono text-xs text-muted-foreground break-all">{status.hardwareId}</div>
              </div>
            )}
          </div>
        </CardContainer>

        <CardContainer
          title="Install License Key"
          description="Paste the signed JWT license key received from the Secure License Server"
        >
          <div className="space-y-4">
            <Textarea
              value={token}
              onChange={(e) => setToken(e.target.value)}
              rows={5}
              placeholder="Paste license JWT token here..."
              className="font-mono text-xs"
            />
            <div className="flex justify-between items-center">
              <Button type="button" variant="outline" asChild size="sm">
                <a href={LICENSE_SERVER_URL} target="_blank" rel="noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open License Server
                </a>
              </Button>
              <Button onClick={activate} disabled={activating || !token.trim()}>
                {activating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                Activate License Key
              </Button>
            </div>
          </div>
        </CardContainer>
      </div>
    </DashboardLayout>
  )
}
