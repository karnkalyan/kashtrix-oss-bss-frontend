"use client"

import { useCallback, useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { AlertTriangle, Copy, ExternalLink, KeyRound, Loader2, Mail, RefreshCw, ShieldCheck } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { apiRequest } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const DEFAULT_MESSAGE = "Your license has expired. Please install a valid license or contact Kashtrix."
const SUPPORT_COMPANY = "Kashtrix"
const SUPPORT_EMAIL = "info@kashtrix.com"
const SUPPORT_WEBSITE = "https://kashtrix.com"
const LICENSE_SERVER_URL = "https://license.simulcast.com.np"

type IspInfo = {
  companyName?: string | null
  contactPerson?: string | null
  masterEmail?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  country?: string | null
  website?: string | null
}

function formatIspAddress(isp?: IspInfo | null) {
  if (!isp) return ""
  return [isp.address, isp.city, isp.state, isp.country].filter(Boolean).join(", ")
}

type LicenseExpiredDetail = {
  message?: string
  hwid?: string | null
  provisioningId?: string | null
}

type LicenseStatus = {
  active: boolean
  status?: string
  message?: string
  reason?: string
  hwid?: string
  hardwareId?: string
  provisioningId?: string
  clientId?: string
  isp?: IspInfo | null
}

export function LicenseExpiredModal() {
  const { user, loading } = useAuth()
  const pathname = usePathname()
  const [gateState, setGateState] = useState<"idle" | "checking" | "blocked" | "active">("idle")
  const [message, setMessage] = useState(DEFAULT_MESSAGE)
  const [hwid, setHwid] = useState("")
  const [provisioningId, setProvisioningId] = useState("")
  const [clientId, setClientId] = useState("")
  const [ispInfo, setIspInfo] = useState<IspInfo | null>(null)
  const [licenseToken, setLicenseToken] = useState("")
  const [installing, setInstalling] = useState(false)
  const roleName = typeof user?.role === "string" ? user.role : user?.role?.name
  const isAdministrator = ["administrator", "admin"].includes(String(roleName || "").toLowerCase())
  const isCheckingLicense = gateState === "idle" || gateState === "checking"
  const isLicenseGeneratorPage = pathname === "/license-generator" || pathname.startsWith("/license-generator/")

  const blockApplication = useCallback((detail?: LicenseExpiredDetail) => {
    setMessage(detail?.message || DEFAULT_MESSAGE)
    setHwid(detail?.hwid || "")
    if (detail?.provisioningId) setProvisioningId(detail.provisioningId)
    setGateState("blocked")
  }, [])

  const verifyLicense = useCallback(async () => {
    if (!user) return
    setGateState("checking")
    try {
      const status = await apiRequest<LicenseStatus>("/license/status", { suppressToast: true })
      setIspInfo(status.isp || null)
      setHwid(status.hardwareId || status.hwid || "")
      setProvisioningId(status.provisioningId || "")
      setClientId(status.clientId || "")
      if (status.active) {
        setGateState("active")
        return
      }
      blockApplication({
        message: status.reason || status.message,
        hwid: status.hardwareId || status.hwid,
        provisioningId: status.provisioningId,
      })
    } catch {
      setMessage("The system could not verify an active license. Check the server connection and try again.")
      setGateState("blocked")
    }
  }, [blockApplication, user])

  useEffect(() => {
    const handleLicenseExpired = (event: Event) => {
      blockApplication((event as CustomEvent<LicenseExpiredDetail>).detail)
    }

    window.addEventListener("license-expired", handleLicenseExpired)
    return () => window.removeEventListener("license-expired", handleLicenseExpired)
  }, [blockApplication])

  useEffect(() => {
    if (loading || !user || isLicenseGeneratorPage) return

    void verifyLicense()
  }, [isLicenseGeneratorPage, loading, user, verifyLicense])

  const installLicense = async () => {
    if (!licenseToken.trim() || installing) return
    setInstalling(true)
    try {
      const status = await apiRequest<LicenseStatus>("/license/install", {
        method: "POST",
        body: JSON.stringify({ token: licenseToken.trim(), licenseKey: licenseToken.trim() }),
        suppressToast: true,
      })
      if (status.active) {
        setLicenseToken("")
        setGateState("active")
      } else {
        blockApplication({
          message: status.reason || status.message,
          hwid: status.hardwareId || status.hwid,
          provisioningId: status.provisioningId,
        })
      }
    } catch {
      setMessage("The license could not be activated. Verify that it is signed for this hardware ID and application.")
      setGateState("blocked")
    } finally {
      setInstalling(false)
    }
  }



  return (
    <Dialog open={Boolean(user) && !isLicenseGeneratorPage && gateState !== "active"} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-xl"
        hideCloseButton
        onEscapeKeyDown={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-md bg-destructive/10 text-destructive">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <DialogTitle>License activation required</DialogTitle>
          <DialogDescription>
            {isCheckingLicense ? "Verifying the license with the Secure License Server…" : message}
          </DialogDescription>
        </DialogHeader>

        {isCheckingLicense && (
          <div className="flex items-center justify-center gap-3 rounded-md border bg-muted/30 p-8 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            Checking license status
          </div>
        )}

        {gateState === "blocked" && (
          <>
            <div className="rounded-md border border-destructive/20 bg-destructive/5 p-4">
              <div className="text-sm font-semibold text-foreground">Contact Information</div>
              <div className="mt-3 grid gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Company: </span>
                  <strong>{SUPPORT_COMPANY}</strong>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Email:</span>
                  <a className="font-bold text-primary underline-offset-4 hover:underline" href={`mailto:${SUPPORT_EMAIL}`}>
                    {SUPPORT_EMAIL}
                  </a>
                </div>
                <div>
                  <span className="text-muted-foreground">Website: </span>
                  <a className="font-bold text-primary underline-offset-4 hover:underline" href={SUPPORT_WEBSITE} target="_blank" rel="noreferrer">
                    kashtrix.com
                  </a>
                </div>
              </div>
            </div>

            {provisioningId && (
              <div className="rounded-md border bg-muted/40 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">Client Provisioning ID</div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => navigator.clipboard.writeText(provisioningId)}
                  >
                    <Copy className="mr-1.5 h-3.5 w-3.5" />
                    Copy
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground">
                  Provide this provisioning identity to the License Manager (
                  <a href={LICENSE_SERVER_URL} target="_blank" rel="noreferrer" className="underline hover:text-foreground">
                    {LICENSE_SERVER_URL}
                  </a>
                  ) to issue a secure license.
                </div>
                <div className="break-all font-mono text-[11px] bg-background/60 p-2 rounded border">
                  {provisioningId}
                </div>
              </div>
            )}

            {hwid && (
              <div className="rounded-md border bg-muted/30 p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-muted-foreground">Scoped Hardware ID</div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[11px]"
                    onClick={() => navigator.clipboard.writeText(hwid)}
                  >
                    <Copy className="mr-1 h-3 w-3" />
                    Copy HWID
                  </Button>
                </div>
                <div className="break-all font-mono text-[11px] text-muted-foreground">{hwid}</div>
              </div>
            )}

            {ispInfo?.companyName && (
              <div className="rounded-md border bg-muted/20 p-3">
                <div className="text-xs font-semibold">ISP Identity</div>
                <div className="mt-1 grid gap-1 text-xs text-muted-foreground">
                  <div>
                    <span className="font-medium text-foreground">Name:</span> {ispInfo.companyName}
                  </div>
                  {formatIspAddress(ispInfo) && (
                    <div>
                      <span className="font-medium text-foreground">Address:</span> {formatIspAddress(ispInfo)}
                    </div>
                  )}
                  {ispInfo.contactPerson && (
                    <div>
                      <span className="font-medium text-foreground">Contact:</span> {ispInfo.contactPerson}
                    </div>
                  )}
                  {ispInfo.masterEmail && (
                    <div>
                      <span className="font-medium text-foreground">Email:</span> {ispInfo.masterEmail}
                    </div>
                  )}
                </div>
              </div>
            )}

            {isAdministrator && (
              <div className="space-y-3 rounded-md border bg-muted/20 p-4">
                <div>
                  <Label htmlFor="required-license-token">Install tenant license</Label>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Paste the signed JWT license key issued by the Secure License Server.
                  </p>
                </div>
                <Input
                  id="required-license-token"
                  type="password"
                  value={licenseToken}
                  onChange={(event) => setLicenseToken(event.target.value)}
                  onKeyDown={(event) => event.key === "Enter" && void installLicense()}
                  placeholder="Paste license JWT token"
                  autoComplete="off"
                />
                <Button
                  type="button"
                  className="w-full"
                  disabled={!licenseToken.trim() || installing}
                  onClick={() => void installLicense()}
                >
                  {installing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
                  Install and activate license
                </Button>
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              {provisioningId && (
                <Button type="button" variant="outline" onClick={() => navigator.clipboard.writeText(provisioningId)}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Provisioning ID
                </Button>
              )}
              <Button type="button" onClick={() => void verifyLicense()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Recheck license
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
