"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CardContainer } from "@/components/ui/card-container"
import { apiRequest } from "@/lib/api"
import { toast } from "react-hot-toast"
import { Copy, ExternalLink, KeyRound, Loader2, ShieldCheck, Trash2, CheckCircle2, AlertCircle } from "lucide-react"

export type LicenseStatus = {
  active: boolean
  status?: string
  configured?: boolean
  hardwareId?: string
  hwid?: string
  provisioningId?: string
  clientId?: string
  tenantId?: string
  applicationId?: string
  validationMode?: "online" | "offline"
  company?: string
  customerName?: string
  contact?: string | null
  customerEmail?: string | null
  licenseId?: string
  licenseSerial?: string
  expiresAt?: string | null
  validFrom?: string | null
  maxSubscribers?: number
  maxDevices?: number
  modules?: string[]
  entitlements?: Record<string, any>
  message?: string
  reason?: string
  error?: string
}

export type GeneratedLicense = {
  id: number
  licenseId: string
  company: string
  contact?: string | null
  hwid: string
  status: string
  expiresAt: string
  issuedAt?: string
  installedAt?: string | null
  installedIspId?: number | null
  createdByEmail?: string | null
  revokedAt?: string | null
  revokedByEmail?: string | null
  revokeReason?: string | null
  createdAt?: string
  updatedAt?: string
}

const LICENSE_SERVER_URL = "https://license.simulcast.com.np"

export function LicenseSettings() {
  const [status, setStatus] = useState<LicenseStatus | null>(null)
  const [token, setToken] = useState("")
  const [loading, setLoading] = useState(false)

  const loadStatus = async () => {
    try {
      const data = await apiRequest<LicenseStatus>("/license/status", { suppressToast: true })
      setStatus(data)
    } catch (err: any) {
      toast.error(err.message || "Failed to load license status")
    }
  }

  useEffect(() => {
    loadStatus().catch(() => {})
  }, [])

  const install = async () => {
    if (!token.trim()) return toast.error("License JWT key is required")
    setLoading(true)
    try {
      const data = await apiRequest<LicenseStatus>("/license/install", {
        method: "POST",
        body: JSON.stringify({ token: token.trim(), licenseKey: token.trim() }),
      })
      setStatus(data)
      setToken("")
      toast.success(data.active ? "License activated successfully" : "License status updated")
    } catch (err: any) {
      toast.error(err.message || "Failed to activate license")
    } finally {
      setLoading(false)
    }
  }

  const remove = async () => {
    if (!confirm("Are you sure you want to deactivate the current license?")) return
    setLoading(true)
    try {
      const data = await apiRequest<LicenseStatus>("/license", { method: "DELETE" })
      setStatus(data)
      toast.success("License deactivated")
    } catch (err: any) {
      toast.error(err.message || "Failed to deactivate license")
    } finally {
      setLoading(false)
    }
  }

  const isActivated = Boolean(status?.active)

  return (
    <div className="space-y-6">
      <CardContainer
        title="Secure License Manager"
        description="Cryptographically secured instance license bound to server hardware and centralized management"
      >
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant={isActivated ? "default" : "destructive"} className="text-xs px-2.5 py-0.5">
              {isActivated ? "Active" : status?.status ? status.status.toUpperCase() : "Inactive"}
            </Badge>

            {status?.validationMode && (
              <Badge variant="outline" className="text-xs">
                {status.validationMode === "online" ? "mTLS Online Validated" : "Ed25519 Offline Verified"}
              </Badge>
            )}

            {!isActivated && (
              <span className="text-sm text-destructive font-medium">
                {status?.reason || status?.message || "Activation required"}
              </span>
            )}
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <Info label="Customer / Organization" value={status?.customerName || status?.company || "-"} />
            <Info label="Contact Email" value={status?.customerEmail || status?.contact || "-"} />
            <Info label="License Serial" value={status?.licenseSerial || status?.licenseId || "-"} />
            <Info
              label="Valid Through"
              value={status?.expiresAt ? new Date(status.expiresAt).toLocaleDateString() : "Perpetual / Not set"}
            />
          </div>

          {status?.modules && status.modules.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                Licensed Modules
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {status.modules.map((mod) => (
                  <Badge key={mod} variant="secondary" className="font-mono text-xs">
                    <CheckCircle2 className="mr-1 h-3 w-3 text-emerald-500" />
                    {mod}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {status?.provisioningId && (
            <div className="space-y-2 rounded-lg border bg-muted/30 p-3.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Client Provisioning ID</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => {
                    navigator.clipboard.writeText(status.provisioningId!)
                    toast.success("Provisioning ID copied")
                  }}
                >
                  <Copy className="mr-1.5 h-3.5 w-3.5" />
                  Copy ID
                </Button>
              </div>
              <div className="break-all font-mono text-[11px] bg-background/80 p-2.5 rounded border select-all">
                {status.provisioningId}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Paste this Provisioning ID on the{" "}
                <a href={LICENSE_SERVER_URL} target="_blank" rel="noreferrer" className="underline text-primary">
                  Secure License Manager Portal
                </a>{" "}
                to issue or update the license for this node.
              </p>
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Scoped Hardware ID (HWID)</Label>
              <div className="flex gap-2">
                <Input value={status?.hardwareId || status?.hwid || ""} readOnly className="font-mono text-xs" />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    navigator.clipboard.writeText(status?.hardwareId || status?.hwid || "")
                    toast.success("Hardware ID copied")
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Client Scoped ID</Label>
              <div className="flex gap-2">
                <Input value={status?.clientId || ""} readOnly className="font-mono text-xs" />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    navigator.clipboard.writeText(status?.clientId || "")
                    toast.success("Client ID copied")
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContainer>

      <CardContainer
        title="Activate License Key"
        description="Paste the signed JWT license key issued by the Centralized Secure License Server"
      >
        <div className="space-y-4">
          <Textarea
            value={token}
            onChange={(event) => setToken(event.target.value)}
            rows={5}
            placeholder="eyJhbGciOiJFZERTQSI..."
            className="font-mono text-xs"
          />
          <div className="flex justify-between items-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              asChild
            >
              <a href={LICENSE_SERVER_URL} target="_blank" rel="noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Open License Server
              </a>
            </Button>
            <div className="flex gap-2">
              {isActivated && (
                <Button variant="destructive" onClick={remove} disabled={loading}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Deactivate License
                </Button>
              )}
              <Button onClick={install} disabled={loading || !token.trim()}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                Install License
              </Button>
            </div>
          </div>
        </div>
      </CardContainer>
    </div>
  )
}

export function LicenseGenerator({ onGenerated }: { onGenerated?: (license: GeneratedLicense) => void }) {
  const [status, setStatus] = useState<LicenseStatus | null>(null)
  const [token, setToken] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    apiRequest<LicenseStatus>("/license/status", { suppressToast: true })
      .then((data) => setStatus(data))
      .catch(() => {})
  }, [])

  const install = async () => {
    if (!token.trim()) return toast.error("License JWT key is required")
    setLoading(true)
    try {
      const data = await apiRequest<LicenseStatus>("/license/install", {
        method: "POST",
        body: JSON.stringify({ token: token.trim(), licenseKey: token.trim() }),
      })
      setStatus(data)
      setToken("")
      toast.success("License activated successfully")
      onGenerated?.({
        id: 1,
        licenseId: data.licenseSerial || "SECURE-LICENSE",
        company: data.customerName || "Activated License",
        hwid: data.hardwareId || "",
        status: "ACTIVE",
        expiresAt: data.expiresAt || new Date(Date.now() + 365 * 86400000).toISOString(),
      })
    } catch (err: any) {
      toast.error(err.message || "Failed to activate license")
    } finally {
      setLoading(false)
    }
  }

  return (
    <CardContainer
      title="Secure License Portal"
      description="License generation is centralized on the Secure License Server"
    >
      <div className="space-y-4">
        <div className="rounded-lg border bg-muted/40 p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <KeyRound className="h-4 w-4 text-primary" />
            Centralized License Provisioning
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Licenses for this instance are generated through the centralized Secure License Server at{" "}
            <a href={LICENSE_SERVER_URL} target="_blank" rel="noreferrer" className="underline text-primary font-medium">
              {LICENSE_SERVER_URL}
            </a>
            . Provide your Provisioning ID below to authorize or renew entitlements.
          </p>

          {status?.provisioningId && (
            <div className="space-y-1.5 pt-1">
              <Label className="text-xs font-semibold">Instance Provisioning ID</Label>
              <div className="flex gap-2">
                <Input value={status.provisioningId} readOnly className="font-mono text-xs" />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(status.provisioningId!)
                    toast.success("Provisioning ID copied")
                  }}
                >
                  <Copy className="mr-1.5 h-3.5 w-3.5" />
                  Copy
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Paste Issued License Key (JWT)</Label>
          <Textarea
            value={token}
            onChange={(e) => setToken(e.target.value)}
            rows={4}
            placeholder="Paste your signed license token from license.simulcast.com.np"
            className="font-mono text-xs"
          />
        </div>

        <div className="flex justify-between items-center">
          <Button variant="outline" asChild size="sm">
            <a href={LICENSE_SERVER_URL} target="_blank" rel="noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              Open License Server
            </a>
          </Button>
          <Button onClick={install} disabled={loading || !token.trim()}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
            Activate License Key
          </Button>
        </div>
      </div>
    </CardContainer>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 break-all text-sm font-medium">{value}</div>
    </div>
  )
}
