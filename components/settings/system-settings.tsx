"use client"

import { useState, useEffect } from "react"
import { apiRequest } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toast } from "react-hot-toast"
import { Loader2, Mail, Ticket, Save } from "lucide-react"

export function SystemSettings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Settings state
  const [settings, setSettings] = useState({
    smtpHost: "",
    smtpPort: "",
    smtpUser: "",
    smtpPass: "",
    smtpFrom: "",
    enableTickets: "true",
    enableMailNotifications: "true",
    leadBranchValidation: "optional",
    allowDuplicateLeadPhone: "false",
    allowDuplicateLeadEmail: "false",
    autoGenerateRadius: "false",
    autoGenerateCustomerLogin: "false"
  })

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await apiRequest("/settings")
        setSettings(prev => ({ ...prev, ...res }))
      } catch (err) {
        console.error("Failed to load settings:", err)
      } finally {
        setLoading(false)
      }
    }
    loadSettings()
  }, [])

  const handleChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = Object.entries(settings).map(([key, value]) => ({ key, value }))
      await apiRequest("/settings/batch", {
        method: "POST",
        body: JSON.stringify({ settings: payload })
      })
      toast.success("System settings updated successfully")
    } catch (err: any) {
      toast.error(err.message || "Failed to update settings")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Mail Configuration */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium flex items-center gap-2 border-b pb-2">
          <Mail className="h-5 w-5 text-primary" />
          Mail Configuration (SMTP)
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>SMTP Host</Label>
            <Input 
              value={settings.smtpHost || ""} 
              onChange={e => handleChange("smtpHost", e.target.value)} 
              placeholder="smtp.example.com"
            />
          </div>
          <div className="space-y-2">
            <Label>SMTP Port</Label>
            <Input 
              value={settings.smtpPort || ""} 
              onChange={e => handleChange("smtpPort", e.target.value)} 
              placeholder="587"
            />
          </div>
          <div className="space-y-2">
            <Label>SMTP Username</Label>
            <Input 
              value={settings.smtpUser || ""} 
              onChange={e => handleChange("smtpUser", e.target.value)} 
              placeholder="user@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label>SMTP Password</Label>
            <Input 
              type="password"
              value={settings.smtpPass || ""} 
              onChange={e => handleChange("smtpPass", e.target.value)} 
              placeholder="••••••••"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>From Address</Label>
            <Input 
              value={settings.smtpFrom || ""} 
              onChange={e => handleChange("smtpFrom", e.target.value)} 
              placeholder="noreply@example.com"
            />
          </div>
        </div>
      </div>

      {/* Feature Toggles */}
      <div className="space-y-4 pt-4">
        <h3 className="text-lg font-medium flex items-center gap-2 border-b pb-2">
          <Ticket className="h-5 w-5 text-primary" />
          System Features
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label className="text-base">Support Tickets System</Label>
              <p className="text-sm text-muted-foreground">Enable the support ticketing system for customers</p>
            </div>
            <Switch 
              checked={settings.enableTickets === "true"} 
              onCheckedChange={checked => handleChange("enableTickets", checked.toString())} 
            />
          </div>
          
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label className="text-base">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">Send automated emails for invoices, tickets, and alerts</p>
            </div>
            <Switch 
              checked={settings.enableMailNotifications === "true"} 
              onCheckedChange={checked => handleChange("enableMailNotifications", checked.toString())} 
            />
          </div>
        </div>
      </div>

      {/* Lead & Customer Settings */}
      <div className="space-y-4 pt-4">
        <h3 className="text-lg font-medium flex items-center gap-2 border-b pb-2">
          <Save className="h-5 w-5 text-primary" />
          Lead & Customer Settings
        </h3>

        <div className="space-y-4">
          <div className="flex flex-col gap-2 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Lead Branch Requirement</Label>
                <p className="text-sm text-muted-foreground">Select validation rules for branch selection during lead creation</p>
              </div>
              <select
                value={settings.leadBranchValidation || "optional"}
                onChange={e => handleChange("leadBranchValidation", e.target.value)}
                className="h-10 w-64 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="optional">Not Required (Optional)</option>
                <option value="branch_only">Branch Compulsory</option>
                <option value="both">Branch & Sub-Branch Compulsory</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label className="text-base">Auto-generate Radius Credentials</Label>
              <p className="text-sm text-muted-foreground">Automatically generate Username & Password for FreeRADIUS during onboarding</p>
            </div>
            <Switch 
              checked={settings.autoGenerateRadius === "true"} 
              onCheckedChange={checked => handleChange("autoGenerateRadius", checked.toString())} 
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label className="text-base">Auto-generate Customer Login</Label>
              <p className="text-sm text-muted-foreground">Automatically generate Customer Login Portal username & password</p>
            </div>
            <Switch 
              checked={settings.autoGenerateCustomerLogin === "true"} 
              onCheckedChange={checked => handleChange("autoGenerateCustomerLogin", checked.toString())} 
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label className="text-base">Allow Duplicate Phone in Leads</Label>
              <p className="text-sm text-muted-foreground">Permit multiple leads to have the same phone number</p>
            </div>
            <Switch 
              checked={settings.allowDuplicateLeadPhone === "true"} 
              onCheckedChange={checked => handleChange("allowDuplicateLeadPhone", checked.toString())} 
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label className="text-base">Allow Duplicate Email in Leads</Label>
              <p className="text-sm text-muted-foreground">Permit multiple leads to have the same email address</p>
            </div>
            <Switch 
              checked={settings.allowDuplicateLeadEmail === "true"} 
              onCheckedChange={checked => handleChange("allowDuplicateLeadEmail", checked.toString())} 
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Settings
        </Button>
      </div>
    </div>
  )
}
