"use client"

import { useState, useEffect, useRef } from "react"
import { CardContainer } from "@/components/ui/card-container"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "react-hot-toast"
import { Save, Loader2, Upload } from "lucide-react"
import { apiRequest, buildApiAssetUrl } from "@/lib/api"

type DiscountEntry = {
  enabled: boolean
  isPercent: boolean
  value: number // if isPercent -> 0-100, else NPR flat amount
}

type BrandingKey =
  | "expandedLightLogo"
  | "expandedDarkLogo"
  | "collapsedLightLogo"
  | "collapsedDarkLogo"

type SidebarBranding = {
  sidebarLogoExpandedLightUrl?: string | null
  sidebarLogoExpandedDarkUrl?: string | null
  sidebarLogoCollapsedLightUrl?: string | null
  sidebarLogoCollapsedDarkUrl?: string | null
}

type ActiveIsp = {
  id?: number
  companyName?: string | null
  businessType?: string | null
  website?: string | null
  contactPerson?: string | null
  phoneNumber?: string | null
  masterEmail?: string | null
  description?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  zipCode?: string | null
  country?: string | null
  asnNumber?: string | null
  ipv4Blocks?: string | null
  ipv6Blocks?: string | null
  upstreamProviders?: string | null
  sidebarBranding?: SidebarBranding
}

const BRANDING_FIELDS: Array<{
  key: BrandingKey
  settingKey: keyof SidebarBranding
  label: string
  helper: string
}> = [
  {
    key: "expandedLightLogo",
    settingKey: "sidebarLogoExpandedLightUrl",
    label: "Expanded Light Logo",
    helper: "Logo plus text for light mode sidebar",
  },
  {
    key: "expandedDarkLogo",
    settingKey: "sidebarLogoExpandedDarkUrl",
    label: "Expanded Dark Logo",
    helper: "Logo plus text for dark mode sidebar",
  },
  {
    key: "collapsedLightLogo",
    settingKey: "sidebarLogoCollapsedLightUrl",
    label: "Collapsed Light Logo",
    helper: "Small icon for light mode sidebar",
  },
  {
    key: "collapsedDarkLogo",
    settingKey: "sidebarLogoCollapsedDarkUrl",
    label: "Collapsed Dark Logo",
    helper: "Small icon for dark mode sidebar",
  },
]

export function SystemSettings() {
  const [settings, setSettings] = useState({
    timezone: "Asia/Kathmandu",
    currency: "NPR",
    language: "en",
    maintenanceMode: false,
    autoBackup: true,
    emailNotifications: true,
    smsNotifications: false,
    backupRetentionDays: "30",
    sessionTimeout: "60",
    maxLoginAttempts: "5",
    passwordMinLength: "8",
    termsAndConditions: "By using our services, you agree to our terms and conditions...",
    privacyPolicy: "We respect your privacy and are committed to protecting your personal data...",
    autoTrialEnabled: true,
    pushTrialPackageToAccount: true,
    trialDurationDays: 3,
    trialDeductionOnSubscriptionActivation: false,
    customerDocumentsRequired: false,
    customerDeviceRequired: false,
    fiberOnuRequired: false,
    expiredTerminateDays: 0,
    expiredSoftDeleteDays: 0,
    maxStaffGraceDays: 3,
    allowStaffCompensation: false,
    tscPercentage: 10,
    freeCustomerSecretKey: "",
    customerIdPrefix: "CUS",
    customerIdIncludeMembership: true,
    customerIdIncludeBranch: false,
    customerIdIncludeSubBranch: false,
    customerIdPaddingLength: 5,
    customerIdIncludeNamePart: true,
    customerIdNamePartLength: 5,
    showLicenseTab: true,
    leadBranchValidation: "optional",
    allowDuplicateLeadPhone: "false",
    allowDuplicateLeadEmail: "false",
    autoGenerateRadius: "false",
    autoGenerateCustomerLogin: "false",
    auto_update_radius_password: false,
    // NEW: global discount settings for members
    newMemberDiscount: {
      enabled: true,
      isPercent: true,
      value: 13,
    } as DiscountEntry,
    renewalDiscount: {
      enabled: true,
      isPercent: true,
      value: 10.5,
    } as DiscountEntry,
  })
  const [ispInfo, setIspInfo] = useState<ActiveIsp>({
    companyName: "",
    businessType: "",
    website: "",
    contactPerson: "",
    phoneNumber: "",
    masterEmail: "",
    description: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    asnNumber: "",
    ipv4Blocks: "",
    ipv6Blocks: "",
    upstreamProviders: "",
  })

  const updateSetting = (key: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const updateIspInfo = (key: keyof ActiveIsp, value: string) => {
    setIspInfo((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const updateDiscount = (which: "newMemberDiscount" | "renewalDiscount", patch: Partial<DiscountEntry>) => {
    setSettings((prev) => ({
      ...prev,
      [which]: {
        ...(prev as any)[which],
        ...patch,
      },
    }))
  }

  const validate = () => {
    const n = settings.newMemberDiscount
    const r = settings.renewalDiscount
    if (!ispInfo.companyName?.trim()) {
      toast.error("Company name is required")
      return false
    }
    if (!ispInfo.masterEmail?.trim()) {
      toast.error("Master email is required")
      return false
    }
    if (n.enabled && n.isPercent && (n.value < 0 || n.value > 100)) {
      toast.error("New member discount percent must be between 0 and 100")
      return false
    }
    if (r.enabled && r.isPercent && (r.value < 0 || r.value > 100)) {
      toast.error("Renewal discount percent must be between 0 and 100")
      return false
    }
    if (n.enabled && !n.isPercent && n.value < 0) {
      toast.error("New member flat discount must be >= 0")
      return false
    }
    if (r.enabled && !r.isPercent && r.value < 0) {
      toast.error("Renewal flat discount must be >= 0")
      return false
    }
    return true
  }

  const [saving, setSaving] = useState(false)
  const [brandingSaving, setBrandingSaving] = useState(false)
  const [branding, setBranding] = useState<SidebarBranding>({})
  const [brandingFiles, setBrandingFiles] = useState<Partial<Record<BrandingKey, File>>>({})
  const [brandingPreviews, setBrandingPreviews] = useState<Partial<Record<BrandingKey, string>>>({})
  const brandingPreviewsRef = useRef(brandingPreviews)

  // Load settings from backend on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await apiRequest<Record<string, string>>("/settings")
        if (data && typeof data === 'object') {
          setSettings(prev => ({
            ...prev,
            timezone: data.timezone || prev.timezone,
            currency: data.currency || prev.currency,
            language: data.language || prev.language,
            maintenanceMode: data.maintenanceMode === 'true',
            autoBackup: data.autoBackup !== 'false',
            emailNotifications: data.emailNotifications !== 'false',
            smsNotifications: data.smsNotifications === 'true',
            backupRetentionDays: data.backupRetentionDays || prev.backupRetentionDays,
            sessionTimeout: data.sessionTimeout || prev.sessionTimeout,
            maxLoginAttempts: data.maxLoginAttempts || prev.maxLoginAttempts,
            passwordMinLength: data.passwordMinLength || prev.passwordMinLength,
            termsAndConditions: data.termsAndConditions || prev.termsAndConditions,
            privacyPolicy: data.privacyPolicy || prev.privacyPolicy,
            autoTrialEnabled: data.autoTrialEnabled !== 'false',
            pushTrialPackageToAccount: data.pushTrialPackageToAccount !== 'false',
            trialDurationDays: parseInt(data.trialDurationDays || '3'),
            trialDeductionOnSubscriptionActivation: data.trialDeductionOnSubscriptionActivation === 'true',
            customerDocumentsRequired: data.customerDocumentsRequired === 'true',
            customerDeviceRequired: data.customerDeviceRequired === 'true',
            fiberOnuRequired: data.fiberOnuRequired === 'true',
            expiredTerminateDays: parseInt(data.expiredTerminateDays || '0'),
            expiredSoftDeleteDays: parseInt(data.expiredSoftDeleteDays || '0'),
            maxStaffGraceDays: parseInt(data.maxStaffGraceDays || '3'),
            allowStaffCompensation: data.allowStaffCompensation === 'true',
            tscPercentage: parseInt(data.tscPercentage || '10'),
            freeCustomerSecretKey: data.freeCustomerSecretKey || "",
            customerIdPrefix: data.customerIdPrefix !== undefined ? data.customerIdPrefix : prev.customerIdPrefix,
            customerIdIncludeMembership: data.customerIdIncludeMembership !== 'false',
            customerIdIncludeBranch: data.customerIdIncludeBranch === 'true',
            customerIdIncludeSubBranch: data.customerIdIncludeSubBranch === 'true',
            customerIdPaddingLength: parseInt(data.customerIdPaddingLength || '5'),
            customerIdIncludeNamePart: data.customerIdIncludeNamePart !== 'false',
            customerIdNamePartLength: parseInt(data.customerIdNamePartLength || '5'),
            showLicenseTab: data.showLicenseTab !== 'false',
            leadBranchValidation: data.leadBranchValidation || prev.leadBranchValidation,
            allowDuplicateLeadPhone: data.allowDuplicateLeadPhone || prev.allowDuplicateLeadPhone,
            allowDuplicateLeadEmail: data.allowDuplicateLeadEmail || prev.allowDuplicateLeadEmail,
            autoGenerateRadius: data.autoGenerateRadius || prev.autoGenerateRadius,
            autoGenerateCustomerLogin: data.autoGenerateCustomerLogin || prev.autoGenerateCustomerLogin,
            auto_update_radius_password: data.auto_update_radius_password === 'true' || data.auto_update_radius_password === 'Enable' || data.autoUpdateRadiusPassword === 'true',
            newMemberDiscount: data.newMemberDiscount ? JSON.parse(data.newMemberDiscount) : prev.newMemberDiscount,
            renewalDiscount: data.renewalDiscount ? JSON.parse(data.renewalDiscount) : prev.renewalDiscount,
          }))
        }
      } catch (e) {
        // Fall back to defaults if settings haven't been saved yet
      }
    }
    loadSettings()
  }, [])

  useEffect(() => {
    const loadActiveIsp = async () => {
      try {
        const response = await apiRequest<{ data?: { sidebarBranding?: SidebarBranding } } | any>("/isp/active")
        const activeIsp = response?.data || response?.isp || response
        if (activeIsp) {
          setIspInfo({
            companyName: activeIsp.companyName || "",
            businessType: activeIsp.businessType || "",
            website: activeIsp.website || "",
            contactPerson: activeIsp.contactPerson || "",
            phoneNumber: activeIsp.phoneNumber || "",
            masterEmail: activeIsp.masterEmail || "",
            description: activeIsp.description || "",
            address: activeIsp.address || "",
            city: activeIsp.city || "",
            state: activeIsp.state || "",
            zipCode: activeIsp.zipCode || "",
            country: activeIsp.country || "",
            asnNumber: activeIsp.asnNumber || "",
            ipv4Blocks: activeIsp.ipv4Blocks || "",
            ipv6Blocks: activeIsp.ipv6Blocks || "",
            upstreamProviders: activeIsp.upstreamProviders || "",
          })
        }
        setBranding(activeIsp?.sidebarBranding || {})
      } catch (e) {
        // ISP details and sidebar branding are optional during first setup.
      }
    }
    loadActiveIsp()
  }, [])

  const handleBrandingFileChange = (key: BrandingKey, file: File | null) => {
    setBrandingFiles((prev) => {
      const next = { ...prev }
      if (file) next[key] = file
      else delete next[key]
      return next
    })

    setBrandingPreviews((prev) => {
      const previous = prev[key]
      if (previous?.startsWith("blob:")) URL.revokeObjectURL(previous)

      const next = { ...prev }
      if (file) next[key] = URL.createObjectURL(file)
      else delete next[key]
      return next
    })
  }

  useEffect(() => {
    brandingPreviewsRef.current = brandingPreviews
  }, [brandingPreviews])

  useEffect(() => {
    return () => {
      Object.values(brandingPreviewsRef.current).forEach((preview) => {
        if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview)
      })
    }
  }, [])

  const saveBranding = async () => {
    if (Object.keys(brandingFiles).length === 0) {
      toast.error("Select at least one logo to upload")
      return
    }

    setBrandingSaving(true)
    try {
      const formData = new FormData()
      Object.entries(brandingFiles).forEach(([key, file]) => {
        if (file) formData.append(key, file)
      })

      const response = await apiRequest<{ data?: SidebarBranding }>("/isp/active/branding", {
        method: "PUT",
        body: formData,
      })

      Object.values(brandingPreviews).forEach((preview) => {
        if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview)
      })
      const nextBranding = response?.data || {}
      setBranding(nextBranding)
      setBrandingFiles({})
      setBrandingPreviews({})
      window.dispatchEvent(new CustomEvent("isp-sidebar-branding-updated", { detail: nextBranding }))
      toast.success("Sidebar logos updated successfully")
    } catch (error: any) {
      toast.error(error.message || "Failed to update sidebar logos")
    } finally {
      setBrandingSaving(false)
    }
  }

  const saveSettings = async () => {
    if (!validate()) return
    setSaving(true)

    try {
      const settingsArray = Object.entries(settings)
        .filter(([key, value]) => key !== "freeCustomerSecretKey" || String(value || "").trim().length > 0)
        .map(([key, value]) => ({
          key,
          value: typeof value === 'object' ? JSON.stringify(value) : String(value),
          description: `System setting: ${key}`,
        }))

      await apiRequest("/settings/batch", {
        method: "POST",
        body: JSON.stringify({ settings: settingsArray }),
      })
      window.dispatchEvent(new CustomEvent("system-settings-saved", { detail: settings }))
      const response = await apiRequest<{ data?: ActiveIsp }>("/isp/active", {
        method: "PUT",
        body: JSON.stringify(ispInfo),
      })
      const updatedIsp = (response?.data || response) as ActiveIsp | null
      if (updatedIsp) {
        setIspInfo((prev) => ({
          ...prev,
          ...updatedIsp,
        }))
        if (updatedIsp.sidebarBranding) setBranding(updatedIsp.sidebarBranding)
      }
      toast.success("System settings saved successfully!")
    } catch (error: any) {
      toast.error(error.message || "Failed to save system settings")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">System Configuration</h2>
          <p className="text-muted-foreground">Configure general system settings</p>
        </div>
        <Button onClick={saveSettings} disabled={saving} className="flex items-center gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>

      <div className="grid gap-6">
        {/* eSewa settings moved to the Payment Gateway tab.
        <CardContainer title="eSewa Payment Configuration" description="Enable token payment and ePay independently, securely configure token credentials, and generate the Base64 values supplied to eSewa.">
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div><Label>Token Payment</Label><p className="text-xs text-muted-foreground">Inbound access-token, inquiry, payment and status APIs</p></div>
                <Switch checked={esewaConfig.tokenEnabled} onCheckedChange={checked => setEsewaConfig(prev => ({ ...prev, tokenEnabled: checked }))} />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div><Label>ePay v2</Label><p className="text-xs text-muted-foreground">Customer dashboard redirect-based renewal</p></div>
                <Switch checked={esewaConfig.epayEnabled} onCheckedChange={checked => setEsewaConfig(prev => ({ ...prev, epayEnabled: checked }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="esewaUsername">Token API Username</Label>
              <Input id="esewaUsername" value={esewaConfig.username} onChange={event => setEsewaConfig(prev => ({ ...prev, username: event.target.value }))} placeholder="esewa-client" />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="esewaPassword">eSewa Password</Label>
                <Input
                  id="esewaPassword"
                  type="password"
                  autoComplete="new-password"
                  value={esewaCredentials.password}
                  onChange={(event) => setEsewaCredentials(prev => ({ ...prev, password: event.target.value }))}
                  placeholder={esewaConfig.passwordConfigured ? "Configured — leave blank to keep" : "Minimum 8 characters"}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="esewaClientSecret">eSewa Client Secret</Label>
                <Input
                  id="esewaClientSecret"
                  type="password"
                  autoComplete="new-password"
                  value={esewaCredentials.clientSecret}
                  onChange={(event) => setEsewaCredentials(prev => ({ ...prev, clientSecret: event.target.value }))}
                  placeholder={esewaConfig.clientSecretConfigured ? "Configured — leave blank to keep" : "32–64 characters"}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={saveEsewaConfiguration} disabled={savingEsewa || !esewaConfig.serviceEnabled} className="gap-2">
                {savingEsewa ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save eSewa Configuration
              </Button>
              <Button type="button" variant="outline" onClick={generateEsewaBase64} disabled={encodingEsewa} className="gap-2">
                {encodingEsewa ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                Generate Base64 Values
              </Button>
            </div>
            {!esewaConfig.serviceEnabled && <p className="text-sm text-amber-600">Enable eSewa in the Service Catalog before saving these options.</p>}

            {(esewaEncoded.passwordBase64 || esewaEncoded.clientSecretBase64) && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>REPLACE_WITH_BASE64_PASSWORD</Label>
                  <div className="flex gap-2">
                    <Input value={esewaEncoded.passwordBase64} readOnly className="font-mono text-xs" />
                    <Button type="button" variant="outline" size="icon" onClick={() => copyEsewaValue(esewaEncoded.passwordBase64, "Password Base64")}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>REPLACE_WITH_BASE64_CLIENT_SECRET</Label>
                  <div className="flex gap-2">
                    <Input value={esewaEncoded.clientSecretBase64} readOnly className="font-mono text-xs" />
                    <Button type="button" variant="outline" size="icon" onClick={() => copyEsewaValue(esewaEncoded.clientSecretBase64, "Client Secret Base64")}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContainer>

        */}
        <CardContainer title="Sidebar Branding" description="Upload ISP logos for expanded and collapsed sidebar states">
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {BRANDING_FIELDS.map((field) => {
                const preview = brandingPreviews[field.key] || buildApiAssetUrl(branding[field.settingKey])
                const isCollapsedLogo = field.key.includes("collapsed")

                return (
                  <div key={field.key} className="space-y-3 rounded-lg border bg-background/60 p-4">
                    <div>
                      <Label htmlFor={field.key}>{field.label}</Label>
                      <p className="text-xs text-muted-foreground">{field.helper}</p>
                    </div>
                    <div
                      className={`flex h-24 items-center justify-center rounded-md border border-dashed bg-muted/30 ${
                        isCollapsedLogo ? "px-8" : "px-4"
                      }`}
                    >
                      {preview ? (
                        <img
                          src={preview}
                          alt={field.label}
                          className={`object-contain ${isCollapsedLogo ? "h-12 w-12" : "h-14 max-w-full"}`}
                        />
                      ) : (
                        <span className="text-sm text-muted-foreground">No logo uploaded</span>
                      )}
                    </div>
                    <div>
                      <Input
                        id={field.key}
                        type="file"
                        accept="image/*"
                        onChange={(event) => handleBrandingFileChange(field.key, event.target.files?.[0] || null)}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="flex justify-end">
              <Button onClick={saveBranding} disabled={brandingSaving} className="gap-2">
                {brandingSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {brandingSaving ? "Uploading..." : "Upload Sidebar Logos"}
              </Button>
            </div>
          </div>
        </CardContainer>

        <CardContainer title="ISP Information" description="Details loaded from the active ISP profile">
          <div className="grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={ispInfo.companyName || ""}
                  onChange={(e) => updateIspInfo("companyName", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="masterEmail">Master Email</Label>
                <Input
                  id="masterEmail"
                  type="email"
                  value={ispInfo.masterEmail || ""}
                  onChange={(e) => updateIspInfo("masterEmail", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="businessType">Business Type</Label>
                <Input
                  id="businessType"
                  value={ispInfo.businessType || ""}
                  onChange={(e) => updateIspInfo("businessType", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={ispInfo.website || ""}
                  onChange={(e) => updateIspInfo("website", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactPerson">Contact Person</Label>
                <Input
                  id="contactPerson"
                  value={ispInfo.contactPerson || ""}
                  onChange={(e) => updateIspInfo("contactPerson", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  value={ispInfo.phoneNumber || ""}
                  onChange={(e) => updateIspInfo("phoneNumber", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={3}
                value={ispInfo.description || ""}
                onChange={(e) => updateIspInfo("description", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={ispInfo.address || ""}
                  onChange={(e) => updateIspInfo("address", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={ispInfo.city || ""}
                  onChange={(e) => updateIspInfo("city", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={ispInfo.state || ""}
                  onChange={(e) => updateIspInfo("state", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipCode">Zip Code</Label>
                <Input
                  id="zipCode"
                  value={ispInfo.zipCode || ""}
                  onChange={(e) => updateIspInfo("zipCode", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={ispInfo.country || ""}
                  onChange={(e) => updateIspInfo("country", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="asnNumber">ASN Number</Label>
                <Input
                  id="asnNumber"
                  value={ispInfo.asnNumber || ""}
                  onChange={(e) => updateIspInfo("asnNumber", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ipv4Blocks">IPv4 Blocks</Label>
                <Input
                  id="ipv4Blocks"
                  value={ispInfo.ipv4Blocks || ""}
                  onChange={(e) => updateIspInfo("ipv4Blocks", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ipv6Blocks">IPv6 Blocks</Label>
                <Input
                  id="ipv6Blocks"
                  value={ispInfo.ipv6Blocks || ""}
                  onChange={(e) => updateIspInfo("ipv6Blocks", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="upstreamProviders">Upstream Providers</Label>
              <Input
                id="upstreamProviders"
                value={ispInfo.upstreamProviders || ""}
                onChange={(e) => updateIspInfo("upstreamProviders", e.target.value)}
              />
            </div>
          </div>
        </CardContainer>

        <CardContainer title="Regional Settings" description="Timezone, currency and language settings">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select value={settings.timezone} onValueChange={(value) => updateSetting("timezone", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Asia/Kathmandu">Asia/Kathmandu</SelectItem>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="Asia/Kolkata">Asia/Kolkata</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select value={settings.currency} onValueChange={(value) => updateSetting("currency", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NPR">NPR - Nepalese Rupee</SelectItem>
                  <SelectItem value="USD">USD - US Dollar</SelectItem>
                  <SelectItem value="INR">INR - Indian Rupee</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select value={settings.language} onValueChange={(value) => updateSetting("language", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ne">Nepali</SelectItem>
                  <SelectItem value="hi">Hindi</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContainer>

        <CardContainer title="Customer ID Generation" description="Configure settings for generating unique customer IDs and view a live preview of the pattern.">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customerIdPrefix">ID Prefix</Label>
                  <Input
                    id="customerIdPrefix"
                    type="text"
                    value={settings.customerIdPrefix}
                    onChange={(e) => updateSetting("customerIdPrefix", e.target.value)}
                    placeholder="e.g. CUS"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerIdPaddingLength">ID Padding Length</Label>
                  <Input
                    id="customerIdPaddingLength"
                    type="number"
                    min={1}
                    max={10}
                    value={settings.customerIdPaddingLength}
                    onChange={(e) => updateSetting("customerIdPaddingLength", Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Include Membership Code</Label>
                  <p className="text-xs text-muted-foreground">Add membership type code (e.g. GEN, LIFE) to ID</p>
                </div>
                <Switch
                  checked={settings.customerIdIncludeMembership}
                  onCheckedChange={(v) => updateSetting("customerIdIncludeMembership", v)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Include Branch Code</Label>
                  <p className="text-xs text-muted-foreground">Add current branch prefix/code to customer ID</p>
                </div>
                <Switch
                  checked={settings.customerIdIncludeBranch}
                  onCheckedChange={(v) => updateSetting("customerIdIncludeBranch", v)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Include Sub-Branch Code</Label>
                  <p className="text-xs text-muted-foreground">Add sub-branch prefix/code to customer ID</p>
                </div>
                <Switch
                  checked={settings.customerIdIncludeSubBranch}
                  onCheckedChange={(v) => updateSetting("customerIdIncludeSubBranch", v)}
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <div className="space-y-0.5">
                  <Label>Include Name Initials</Label>
                  <p className="text-xs text-muted-foreground">Append character prefix of customer name at the end</p>
                </div>
                <Switch
                  checked={settings.customerIdIncludeNamePart}
                  onCheckedChange={(v) => updateSetting("customerIdIncludeNamePart", v)}
                />
              </div>

              {settings.customerIdIncludeNamePart && (
                <div className="space-y-2 pl-4 border-l-2 border-slate-200 dark:border-slate-700">
                  <Label htmlFor="customerIdNamePartLength">Name Characters Length</Label>
                  <Input
                    id="customerIdNamePartLength"
                    type="number"
                    min={1}
                    max={10}
                    value={settings.customerIdNamePartLength}
                    onChange={(e) => updateSetting("customerIdNamePartLength", Number(e.target.value))}
                  />
                </div>
              )}
            </div>

            <div className="flex flex-col justify-between p-6 rounded-lg border bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800">
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Live Preview
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  This shows what the customer ID will look like for a newly registered user (e.g. sequence number 123, name John Doe).
                </p>
                
                <div className="mt-6 p-4 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 shadow-sm flex items-center justify-center">
                  <span className="font-mono text-lg font-bold tracking-wider text-primary select-all">
                    {(() => {
                      const parts = []
                      const prefix = settings.customerIdPrefix || ""
                      if (prefix) parts.push(prefix)
                      
                      if (settings.customerIdIncludeMembership) {
                        parts.push("MEM")
                      }
                      if (settings.customerIdIncludeBranch) {
                        parts.push("BR01")
                      }
                      if (settings.customerIdIncludeSubBranch) {
                        parts.push("SUB02")
                      }
                      
                      const padded = "123".padStart(Number(settings.customerIdPaddingLength || 5), "0")
                      parts.push(padded)
                      
                      if (settings.customerIdIncludeNamePart) {
                        const namePartLength = Number(settings.customerIdNamePartLength || 5)
                        const mockName = "JOHNDOE"
                        let namePart = mockName.substring(0, namePartLength).toUpperCase()
                        if (namePart.length < namePartLength) {
                          namePart = namePart.padEnd(namePartLength, "X")
                        }
                        parts.push(namePart)
                      }
                      
                      return parts.join("-")
                    })()}
                  </span>
                </div>
              </div>

              <div className="text-[10px] text-muted-foreground mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                Note: The actual branch and sub-branch codes will dynamically load from the ones selected in the customer registration form. Membership code will be determined by the selected membership type.
              </div>
            </div>
          </div>
        </CardContainer>

        <CardContainer title="Global Membership Discounts" description="Set default discounts applied to members (first install + renewals)">
          <div className="space-y-4">
            {/* New Member Discount */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">New Member Discount</h4>
                  <div className="text-sm text-muted-foreground">Applied to first/installation invoice for members</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm">Enable</span>
                  <Switch
                    checked={settings.newMemberDiscount.enabled}
                    onCheckedChange={(v) =>
                      updateDiscount("newMemberDiscount", { enabled: Boolean(v) })
                    }
                  />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <div className="flex items-center gap-2">
                  <span className="text-sm">Percent</span>
                  <Switch
                    checked={settings.newMemberDiscount.isPercent}
                    onCheckedChange={(v) =>
                      updateDiscount("newMemberDiscount", { isPercent: Boolean(v) })
                    }
                  />
                  <span className="text-sm">{settings.newMemberDiscount.isPercent ? "%" : "Flat"}</span>
                </div>

                <div>
                  <Label>Value</Label>
                  <Input
                    type="number"
                    placeholder={settings.newMemberDiscount.isPercent ? "e.g. 13" : "e.g. 1500"}
                    value={String(settings.newMemberDiscount.value)}
                    onChange={(e) =>
                      updateDiscount("newMemberDiscount", { value: Number(e.target.value) })
                    }
                    min={0}
                    max={settings.newMemberDiscount.isPercent ? 100 : undefined}
                  />
                </div>

                <div className="flex items-center">
                  <div className="text-sm text-muted-foreground">Preview: </div>
                  <div className="ml-2 font-medium">
                    {settings.newMemberDiscount.enabled
                      ? settings.newMemberDiscount.isPercent
                        ? `${settings.newMemberDiscount.value}% off`
                        : `Flat ${settings.newMemberDiscount.value} NPR off`
                      : "Disabled"}
                  </div>
                </div>
              </div>
            </div>

            {/* Renewal Discount */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Renewal Discount</h4>
                  <div className="text-sm text-muted-foreground">Applied to recurring/recharge invoices</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm">Enable</span>
                  <Switch
                    checked={settings.renewalDiscount.enabled}
                    onCheckedChange={(v) =>
                      updateDiscount("renewalDiscount", { enabled: Boolean(v) })
                    }
                  />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <div className="flex items-center gap-2">
                  <span className="text-sm">Percent</span>
                  <Switch
                    checked={settings.renewalDiscount.isPercent}
                    onCheckedChange={(v) =>
                      updateDiscount("renewalDiscount", { isPercent: Boolean(v) })
                    }
                  />
                  <span className="text-sm">{settings.renewalDiscount.isPercent ? "%" : "Flat"}</span>
                </div>

                <div>
                  <Label>Value</Label>
                  <Input
                    type="number"
                    placeholder={settings.renewalDiscount.isPercent ? "e.g. 10.5" : "e.g. 850"}
                    value={String(settings.renewalDiscount.value)}
                    onChange={(e) =>
                      updateDiscount("renewalDiscount", { value: Number(e.target.value) })
                    }
                    min={0}
                    max={settings.renewalDiscount.isPercent ? 100 : undefined}
                  />
                </div>

                <div className="flex items-center">
                  <div className="text-sm text-muted-foreground">Preview: </div>
                  <div className="ml-2 font-medium">
                    {settings.renewalDiscount.enabled
                      ? settings.renewalDiscount.isPercent
                        ? `${settings.renewalDiscount.value}% off`
                        : `Flat ${settings.renewalDiscount.value} NPR off`
                      : "Disabled"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContainer>

        <CardContainer title="Billing & Provisioning Features" description="Configure auto-trials, grace periods, and technical compensation limits.">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 border rounded-lg bg-slate-50 dark:bg-slate-800/50">
               <h4 className="font-medium mb-1">Trial Auto-Assignment</h4>
               <p className="text-xs text-muted-foreground mb-4">Automatically assign a free trial package to newly provisioned customers.</p>
               <div className="space-y-4">
                 <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Enable Auto-Trial</span>
                    <Switch
                       checked={settings.autoTrialEnabled ?? true}
                       onCheckedChange={(checked) => updateSetting("autoTrialEnabled", checked)}
                    />
                 </div>
                 <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Push Trial Package to Account</span>
                    <Switch
                       checked={settings.pushTrialPackageToAccount ?? true}
                       onCheckedChange={(checked) => {
                         updateSetting("pushTrialPackageToAccount", checked)
                       }}
                    />
                 </div>
                 {settings.autoTrialEnabled !== false && (
                    <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Default Trial Duration (Days)</Label>
                      <Input
                        type="number"
                        min={1}
                        max={30}
                        value={settings.trialDurationDays ?? 3}
                        onChange={(e) => updateSetting("trialDurationDays", Number(e.target.value))}
                      />
                    </div>
                    <div className="flex items-center justify-between border-t pt-3">
                      <div><Label>Deduct trial days on paid activation</Label><p className="text-[10px] text-muted-foreground">Off: the paid plan receives its full duration from recharge time. On: trial days are deducted from the first paid term.</p></div>
                      <Switch checked={settings.trialDeductionOnSubscriptionActivation} onCheckedChange={checked => updateSetting("trialDeductionOnSubscriptionActivation", checked)} />
                    </div>
                    </div>
                 )}
               </div>
            </div>

            <div className="p-4 border rounded-lg bg-orange-50/50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-900/30">
               <h4 className="font-medium mb-1 text-orange-800 dark:text-orange-400">Grace & Compensation Limits</h4>
               <p className="text-xs text-muted-foreground mb-4">Set maximum days staff can extend packages without Admin approval.</p>
               <div className="space-y-4">
                 <div className="space-y-2">
                   <Label>Max Grace Period Extension (Staff)</Label>
                   <div className="flex items-center gap-2">
                     <Input
                       type="number"
                       min={0}
                       max={10}
                       value={settings.maxStaffGraceDays ?? 3}
                       onChange={(e) => updateSetting("maxStaffGraceDays", Number(e.target.value))}
                     />
                     <span className="text-sm">Days</span>
                   </div>
                   <p className="text-[10px] text-muted-foreground">Grace days are automatically deducted from the customer's next renewal.</p>
                 </div>
                 
                 <div className="flex items-center justify-between pt-2 border-t border-orange-200/50 w-full">
                    <div className="space-y-0.5">
                      <Label className="text-sm">Allow Staff Compensation</Label>
                      <p className="text-[10px] text-muted-foreground">Free extensions (No deduction on renew)</p>
                    </div>
                    <Switch
                       checked={settings.allowStaffCompensation ?? false}
                       onCheckedChange={(checked) => updateSetting("allowStaffCompensation", checked)}
                    />
                 </div>
               </div>
            </div>

            <div className="p-4 border rounded-lg bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30">
               <h4 className="font-medium mb-1 text-blue-800 dark:text-blue-400">TSC Configuration</h4>
               <p className="text-xs text-muted-foreground mb-4">Configure the Telecommunication Service Charge (TSC) percentage applied to packages.</p>
               <div className="space-y-2">
                 <Label htmlFor="tscPercentage">TSC Percentage (%)</Label>
                 <Input
                   id="tscPercentage"
                   type="number"
                   min={0}
                   max={100}
                   value={settings.tscPercentage ?? 10}
                   onChange={(e) => updateSetting("tscPercentage", Number(e.target.value))}
                 />
                 <p className="text-[10px] text-muted-foreground">Applied to packages with 'TSC Applicable' checked.</p>
               </div>
            </div>
            <div className="p-4 border rounded-lg bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30 space-y-4">
              <div><h4 className="font-medium text-emerald-800 dark:text-emerald-400">New Customer Requirements</h4><p className="text-xs text-muted-foreground">Enforced by the API during customer creation.</p></div>
              <div className="flex items-center justify-between"><Label>Customer documents required</Label><Switch checked={settings.customerDocumentsRequired} onCheckedChange={v => updateSetting("customerDocumentsRequired", v)} /></div>
              <div className="flex items-center justify-between"><Label>Device required</Label><Switch checked={settings.customerDeviceRequired} onCheckedChange={v => updateSetting("customerDeviceRequired", v)} /></div>
              <div className="flex items-center justify-between"><Label>ONU/ONT required for Fiber</Label><Switch checked={settings.fiberOnuRequired} onCheckedChange={v => updateSetting("fiberOnuRequired", v)} /></div>
            </div>
            <div className="p-4 border rounded-lg bg-rose-50/50 dark:bg-rose-900/10 border-rose-100 dark:border-rose-900/30 space-y-3">
              <div><h4 className="font-medium text-rose-800 dark:text-rose-400">Expired Customer Lifecycle</h4><p className="text-xs text-muted-foreground">Use 0 to disable an automatic action.</p></div>
              <div><Label>Days after expiry to terminate</Label><Input type="number" min={0} value={settings.expiredTerminateDays} onChange={e => updateSetting("expiredTerminateDays", Number(e.target.value))} /></div>
              <div><Label>Days after expiry to soft-delete</Label><Input type="number" min={0} value={settings.expiredSoftDeleteDays} onChange={e => updateSetting("expiredSoftDeleteDays", Number(e.target.value))} /></div>
            </div>

            <div className="p-4 border rounded-lg bg-purple-50/50 dark:bg-purple-900/10 border-purple-100 dark:border-purple-900/30">
               <h4 className="font-medium mb-1 text-purple-800 dark:text-purple-400">Free Customer Settings</h4>
               <p className="text-xs text-muted-foreground mb-4">Configure the secret key required to register/update a customer as 'Free'.</p>
               <div className="space-y-2">
                 <Label htmlFor="freeCustomerSecretKey">Free Customer Secret Key</Label>
                 <Input
                   id="freeCustomerSecretKey"
                   type="text"
                   value={settings.freeCustomerSecretKey ?? ""}
                   onChange={(e) => updateSetting("freeCustomerSecretKey", e.target.value)}
                 />
                 <p className="text-[10px] text-muted-foreground">Only administrators can toggle a customer as free with this key.</p>
               </div>
            </div>
          </div>
        </CardContainer>

        <CardContainer title="System Preferences" description="General system behavior settings">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Maintenance Mode</Label>
                  <div className="text-sm text-muted-foreground">Enable maintenance mode to restrict access</div>
                </div>
                <Switch
                  checked={settings.maintenanceMode}
                  onCheckedChange={(checked) => updateSetting("maintenanceMode", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto Backup</Label>
                  <div className="text-sm text-muted-foreground">Automatically backup system data</div>
                </div>
                <Switch
                  checked={settings.autoBackup}
                  onCheckedChange={(checked) => updateSetting("autoBackup", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <div className="text-sm text-muted-foreground">Send email notifications for important events</div>
                </div>
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => updateSetting("emailNotifications", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>SMS Notifications</Label>
                  <div className="text-sm text-muted-foreground">Send SMS notifications for critical alerts</div>
                </div>
                <Switch
                  checked={settings.smsNotifications}
                  onCheckedChange={(checked) => updateSetting("smsNotifications", checked)}
                />
              </div>

            </div>
          </div>
        </CardContainer>

        <CardContainer title="Security Settings" description="Authentication and security preferences">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
              <Input
                id="sessionTimeout"
                type="number"
                value={settings.sessionTimeout}
                onChange={(e) => updateSetting("sessionTimeout", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
              <Input
                id="maxLoginAttempts"
                type="number"
                value={settings.maxLoginAttempts}
                onChange={(e) => updateSetting("maxLoginAttempts", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="passwordMinLength">Minimum Password Length</Label>
              <Input
                id="passwordMinLength"
                type="number"
                value={settings.passwordMinLength}
                onChange={(e) => updateSetting("passwordMinLength", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="backupRetentionDays">Backup Retention (days)</Label>
              <Input
                id="backupRetentionDays"
                type="number"
                value={settings.backupRetentionDays}
                onChange={(e) => updateSetting("backupRetentionDays", e.target.value)}
              />
            </div>

            <div className="md:col-span-2 p-3 border rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-between mt-2">
              <div className="space-y-1 mr-4">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-semibold text-emerald-900 dark:text-emerald-300">Auto-Update RADIUS Login Password</Label>
                  <span className="text-[10px] font-semibold bg-emerald-200/80 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 px-1.5 py-0.5 rounded">
                    Active
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Automatically capture & update customer's RADIUS/PPPoE password in database and FreeRADIUS whenever an authentication attempt with a different password is made, accepting the connection.
                </p>
              </div>
              <Switch
                checked={settings.auto_update_radius_password ?? false}
                onCheckedChange={(checked) => updateSetting("auto_update_radius_password", checked)}
              />
            </div>
          </div>
        </CardContainer>

        <CardContainer title="Legal Documents" description="Terms and conditions, privacy policy">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="termsAndConditions">Terms and Conditions</Label>
              <Textarea
                id="termsAndConditions"
                rows={4}
                value={settings.termsAndConditions}
                onChange={(e) => updateSetting("termsAndConditions", e.target.value)}
                placeholder="Enter terms and conditions..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="privacyPolicy">Privacy Policy</Label>
              <Textarea
                id="privacyPolicy"
                rows={4}
                value={settings.privacyPolicy}
                onChange={(e) => updateSetting("privacyPolicy", e.target.value)}
                placeholder="Enter privacy policy..."
              />
            </div>
          </div>
        </CardContainer>

        <CardContainer title="Lead & Customer Settings" description="Configure branch validation rules and auto-generation of credentials during customer onboarding">
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label className="text-base">Lead Branch Requirement</Label>
                <p className="text-xs text-muted-foreground">Validation rules for branch selection during lead creation</p>
              </div>
              <Select
                value={settings.leadBranchValidation || "optional"}
                onValueChange={(value) => updateSetting("leadBranchValidation", value)}
              >
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Select validation rule" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="optional">Not Required (Optional)</SelectItem>
                  <SelectItem value="branch_only">Branch Compulsory</SelectItem>
                  <SelectItem value="both">Branch &amp; Sub-Branch Compulsory</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label className="text-base">Auto-generate Radius Credentials</Label>
                <p className="text-xs text-muted-foreground">Automatically create FreeRADIUS username &amp; password when adding a customer (Fiber / Infra Share)</p>
              </div>
              <Switch
                checked={settings.autoGenerateRadius === "true"}
                onCheckedChange={(checked) => updateSetting("autoGenerateRadius", checked.toString())}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label className="text-base">Auto-generate Customer Login</Label>
                <p className="text-xs text-muted-foreground">Automatically create Customer Portal login username &amp; password</p>
              </div>
              <Switch
                checked={settings.autoGenerateCustomerLogin === "true"}
                onCheckedChange={(checked) => updateSetting("autoGenerateCustomerLogin", checked.toString())}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label className="text-base">Allow Duplicate Phone in Leads</Label>
                <p className="text-xs text-muted-foreground">Permit multiple leads to have the same phone number</p>
              </div>
              <Switch
                checked={settings.allowDuplicateLeadPhone === "true"}
                onCheckedChange={(checked) => updateSetting("allowDuplicateLeadPhone", checked.toString())}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label className="text-base">Allow Duplicate Email in Leads</Label>
                <p className="text-xs text-muted-foreground">Permit multiple leads to have the same email address</p>
              </div>
              <Switch
                checked={settings.allowDuplicateLeadEmail === "true"}
                onCheckedChange={(checked) => updateSetting("allowDuplicateLeadEmail", checked.toString())}
              />
            </div>
          </div>
        </CardContainer>
      </div>
    </div>
  )
}
