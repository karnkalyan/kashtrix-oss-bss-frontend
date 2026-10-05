"use client"

import { useState, useEffect } from "react"
import { CardContainer } from "@/components/ui/card-container"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toast } from "react-hot-toast"
import { Save, Loader2, Plus, Edit2, Trash2, ShieldCheck, CheckCircle2, AlertTriangle } from "lucide-react"
import { apiRequest } from "@/lib/api"

type CustomerType = {
  id: number
  name: string
  allowDuplicateMobile: boolean
  allowDuplicateEmail: boolean
  createdAt?: string
}

export function EnhancementsSettings() {
  // Global setting switches
  const [globalSettings, setGlobalSettings] = useState({
    allow_branch_to_create_subbranch: false,
    show_ticket_comments_to_customer: false,
    auto_update_radius_password: false,
  })

  // Customer Types state
  const [customerTypes, setCustomerTypes] = useState<CustomerType[]>([])
  const [loadingTypes, setLoadingTypes] = useState(true)
  const [savingGlobal, setSavingGlobal] = useState(false)
  const [syncingRadius, setSyncingRadius] = useState(false)
  
  // Form states for creating/editing customer types
  const [editingType, setEditingType] = useState<CustomerType | null>(null)
  const [formName, setFormName] = useState("")
  const [formDupMobile, setFormDupMobile] = useState(false)
  const [formDupEmail, setFormDupEmail] = useState(false)
  const [submittingType, setSubmittingType] = useState(false)

  // Load everything
  const loadData = async () => {
    try {
      // Load global master settings
      const settingsData = await apiRequest<Record<string, string>>("/settings")
      if (settingsData) {
        setGlobalSettings({
          allow_branch_to_create_subbranch: settingsData.allow_branch_to_create_subbranch === "true" || settingsData.allow_branch_to_create_subbranch === "Enable",
          show_ticket_comments_to_customer: settingsData.show_ticket_comments_to_customer === "true" || settingsData.show_ticket_comments_to_customer === "Enable",
          auto_update_radius_password: settingsData.auto_update_radius_password === "true" || settingsData.auto_update_radius_password === "Enable" || settingsData.autoUpdateRadiusPassword === "true",
        })
      }

      // Load customer types
      const typesData = await apiRequest<CustomerType[]>("/customer-types")
      setCustomerTypes(Array.isArray(typesData) ? typesData : [])
    } catch (e) {
      toast.error("Failed to load settings or customer types")
    } finally {
      setLoadingTypes(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Save global settings
  const saveGlobalSettings = async () => {
    setSavingGlobal(true)
    try {
      const settingsArray = [
        {
          key: "allow_branch_to_create_subbranch",
          value: String(globalSettings.allow_branch_to_create_subbranch),
          description: "Allow branch offices to create sub-branches"
        },
        {
          key: "show_ticket_comments_to_customer",
          value: String(globalSettings.show_ticket_comments_to_customer),
          description: "Display support ticket comments to customer"
        },
        {
          key: "auto_update_radius_password",
          value: String(globalSettings.auto_update_radius_password),
          description: "Auto-update customer RADIUS login password on dial-in rejection"
        }
      ]

      await apiRequest("/settings/batch", {
        method: "POST",
        body: JSON.stringify({ settings: settingsArray }),
      })
      toast.success("Global controls updated successfully!")
    } catch (err: any) {
      toast.error(err.message || "Failed to update global controls")
    } finally {
      setSavingGlobal(false)
    }
  }

  // Manual Trigger: Sync Rejected RADIUS Passwords Now
  const handleSyncRadiusPasswords = async () => {
    setSyncingRadius(true)
    try {
      const res = await apiRequest<any>("/services/radius/auto-sync-passwords", {
        method: "POST"
      })
      if (res?.updatedUsersCount > 0) {
        toast.success(`Successfully auto-updated ${res.updatedUsersCount} rejected user passwords in RADIUS!`)
      } else {
        toast.success(res?.message || "RADIUS passwords are fully synchronized.")
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to sync RADIUS passwords")
    } finally {
      setSyncingRadius(false)
    }
  }

  // Handle Customer Type submit
  const handleTypeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim()) {
      toast.error("Customer Type name is required")
      return
    }

    setSubmittingType(true)
    try {
      if (editingType) {
        // Update
        const updated = await apiRequest<CustomerType>(`/customer-types/${editingType.id}`, {
          method: "PUT",
          body: JSON.stringify({
            name: formName.trim(),
            allowDuplicateMobile: formDupMobile,
            allowDuplicateEmail: formDupEmail
          })
        })
        setCustomerTypes(prev => prev.map(t => t.id === editingType.id ? updated : t))
        toast.success("Customer Type updated!")
      } else {
        // Create
        const created = await apiRequest<CustomerType>("/customer-types", {
          method: "POST",
          body: JSON.stringify({
            name: formName.trim(),
            allowDuplicateMobile: formDupMobile,
            allowDuplicateEmail: formDupEmail
          })
        })
        setCustomerTypes(prev => [...prev, created])
        toast.success("Customer Type created successfully!")
      }
      resetForm()
    } catch (err: any) {
      toast.error(err.message || "Failed to save customer type")
    } finally {
      setSubmittingType(false)
    }
  }

  // Handle delete
  const handleDeleteType = async (id: number) => {
    if (!confirm("Are you sure you want to delete this customer type?")) return
    try {
      await apiRequest(`/customer-types/${id}`, { method: "DELETE" })
      setCustomerTypes(prev => prev.filter(t => t.id !== id))
      toast.success("Customer Type deleted successfully")
    } catch (err: any) {
      toast.error(err.message || "Failed to delete customer type")
    }
  }

  const handleEdit = (type: CustomerType) => {
    setEditingType(type)
    setFormName(type.name)
    setFormDupMobile(type.allowDuplicateMobile)
    setFormDupEmail(type.allowDuplicateEmail)
  }

  const resetForm = () => {
    setEditingType(null)
    setFormName("")
    setFormDupMobile(false)
    setFormDupEmail(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">System Enhancements</h2>
          <p className="text-muted-foreground">Configure duplicate check rules, sub-branch creation controls, and ticket settings</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Toggles */}
        <div className="lg:col-span-1 space-y-6">
          <CardContainer title="Global Master Controls" description="Toggle administrative and visibility switches">
            <div className="space-y-6">
              <div className="flex items-start justify-between border-b pb-4 border-slate-100 dark:border-slate-800">
                <div className="space-y-1 mr-4">
                  <Label className="text-sm font-semibold">Allow Sub-Branch Creation</Label>
                  <p className="text-xs text-muted-foreground">Allows branch users to create sub-branches under their parent branch.</p>
                </div>
                <Switch 
                  checked={globalSettings.allow_branch_to_create_subbranch} 
                  onCheckedChange={v => setGlobalSettings(prev => ({ ...prev, allow_branch_to_create_subbranch: v }))} 
                />
              </div>

              <div className="flex items-start justify-between border-b pb-4 border-slate-100 dark:border-slate-800">
                <div className="space-y-1 mr-4">
                  <Label className="text-sm font-semibold">Customer Ticket Comments</Label>
                  <p className="text-xs text-muted-foreground">Toggle visibility of support comments to customers. If disabled, customers will not see internal comment updates.</p>
                </div>
                <Switch 
                  checked={globalSettings.show_ticket_comments_to_customer} 
                  onCheckedChange={v => setGlobalSettings(prev => ({ ...prev, show_ticket_comments_to_customer: v }))} 
                />
              </div>

              <div className="flex items-start justify-between pb-4">
                <div className="space-y-1 mr-4">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-semibold">Auto-Update RADIUS Login Password</Label>
                    <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                      RADIUS Auto-Capture
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    When enabled, if a customer dials in with a new/different password that gets rejected, the system will automatically capture the dialed password, update FreeRADIUS and Connection User, and authenticate the customer.
                  </p>
                </div>
                <Switch 
                  checked={globalSettings.auto_update_radius_password} 
                  onCheckedChange={v => setGlobalSettings(prev => ({ ...prev, auto_update_radius_password: v }))} 
                />
              </div>

              <Button onClick={saveGlobalSettings} disabled={savingGlobal} className="w-full flex items-center justify-center gap-2 mt-2 bg-primary text-primary-foreground hover:bg-primary/95 transition-all">
                {savingGlobal ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {savingGlobal ? "Saving Controls..." : "Save Master Toggles"}
              </Button>

              {globalSettings.auto_update_radius_password && (
                <Button 
                  onClick={handleSyncRadiusPasswords} 
                  disabled={syncingRadius} 
                  variant="outline" 
                  className="w-full flex items-center justify-center gap-2 mt-2 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-xs"
                >
                  {syncingRadius ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                  {syncingRadius ? "Scanning & Syncing..." : "Sync Rejected Passwords Now"}
                </Button>
              )}
            </div>
          </CardContainer>
        </div>

        {/* Right Column - Customer Types List and Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer Types list */}
            <CardContainer title="Customer Types Master" description="List of configured customer types and duplicate verification configurations">
              {loadingTypes ? (
                <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              ) : customerTypes.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">No customer types configured. Create one.</div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {customerTypes.map(type => (
                    <div key={type.id} className="py-3 flex items-center justify-between group">
                      <div className="space-y-1">
                        <div className="font-semibold text-sm flex items-center gap-2">
                          {type.name}
                          <span className="text-[10px] uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded">ID: {type.id}</span>
                        </div>
                        <div className="flex flex-col gap-1 text-[11px]">
                          <span className="flex items-center gap-1.5">
                            Duplicate Phone: 
                            {type.allowDuplicateMobile ? (
                              <span className="text-emerald-600 dark:text-emerald-400 font-medium">Allowed</span>
                            ) : (
                              <span className="text-rose-600 dark:text-rose-400 font-medium">Restricted (Unique)</span>
                            )}
                          </span>
                          <span className="flex items-center gap-1.5">
                            Duplicate Email: 
                            {type.allowDuplicateEmail ? (
                              <span className="text-emerald-600 dark:text-emerald-400 font-medium">Allowed</span>
                            ) : (
                              <span className="text-rose-600 dark:text-rose-400 font-medium">Restricted (Unique)</span>
                            )}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(type)} className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20">
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteType(type.id)} className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContainer>

            {/* Customer Type Form */}
            <CardContainer title={editingType ? "Edit Customer Type" : "Add Customer Type"} description="Configure duplicate restrictions for a customer classification">
              <form onSubmit={handleTypeSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="typeName">Classification Name</Label>
                  <Input 
                    id="typeName" 
                    placeholder="e.g. Residential, Corporate" 
                    value={formName} 
                    onChange={e => setFormName(e.target.value)} 
                    required 
                    className="border-slate-200 dark:border-slate-800"
                  />
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between border p-3 rounded-md border-slate-100 dark:border-slate-800">
                    <div className="space-y-0.5 pr-2">
                      <Label className="text-xs font-semibold">Allow Duplicate Mobile</Label>
                      <p className="text-[10px] text-muted-foreground">If disabled, system will reject duplicate mobile numbers during customer creation.</p>
                    </div>
                    <Switch checked={formDupMobile} onCheckedChange={setFormDupMobile} />
                  </div>

                  <div className="flex items-center justify-between border p-3 rounded-md border-slate-100 dark:border-slate-800">
                    <div className="space-y-0.5 pr-2">
                      <Label className="text-xs font-semibold">Allow Duplicate Email</Label>
                      <p className="text-[10px] text-muted-foreground">If disabled, system will reject duplicate email addresses during customer creation.</p>
                    </div>
                    <Switch checked={formDupEmail} onCheckedChange={setFormDupEmail} />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <Button type="submit" disabled={submittingType} className="flex-1 flex items-center justify-center gap-2">
                    {submittingType ? <Loader2 className="h-4 w-4 animate-spin" /> : (editingType ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />)}
                    {editingType ? "Update Type" : "Create Type"}
                  </Button>
                  {editingType && (
                    <Button type="button" variant="outline" onClick={resetForm} className="border-slate-200 dark:border-slate-800">
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </CardContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
