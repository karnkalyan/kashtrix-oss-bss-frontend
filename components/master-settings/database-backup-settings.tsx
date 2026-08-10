"use client"

import { useEffect, useState } from "react"
import { Archive, Clock, Database, Loader2, Mail, Play, Save } from "lucide-react"
import toast from "react-hot-toast"
import { apiRequest } from "@/lib/api"
import { CardContainer } from "@/components/ui/card-container"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

type BackupConfig = {
  enabled: boolean
  email: string
  time: string
  timezone: string
  retentionDays: number
  running?: boolean
  lastRun?: {
    status?: string
    message?: string
    operation?: string
    createdAt?: string
    fileName?: string
    sizeBytes?: number
    recipient?: string
  } | null
}

const defaults: BackupConfig = {
  enabled: false,
  email: "",
  time: "00:00",
  timezone: "Asia/Kathmandu",
  retentionDays: 7,
  lastRun: null,
}

export function DatabaseBackupSettings() {
  const [config, setConfig] = useState<BackupConfig>(defaults)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [running, setRunning] = useState(false)

  const load = async () => {
    try {
      const data = await apiRequest<BackupConfig>("/settings/database-backup", { suppressToast: true })
      setConfig({ ...defaults, ...data })
    } catch (error: any) {
      toast.error(error.message || "Failed to load database backup settings")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const update = <K extends keyof BackupConfig>(key: K, value: BackupConfig[K]) => {
    setConfig(current => ({ ...current, [key]: value }))
  }

  const save = async () => {
    setSaving(true)
    try {
      const data = await apiRequest<BackupConfig>("/settings/database-backup", {
        method: "PUT",
        body: JSON.stringify({
          enabled: config.enabled,
          email: config.email,
          time: config.time,
          timezone: config.timezone,
          retentionDays: config.retentionDays,
        }),
      })
      setConfig({ ...defaults, ...data })
      toast.success("Database backup schedule saved")
    } catch (error: any) {
      toast.error(error.message || "Failed to save database backup settings")
    } finally {
      setSaving(false)
    }
  }

  const runNow = async () => {
    setRunning(true)
    try {
      // Persist the visible recipient/schedule first so Back Up Now always uses
      // exactly what the administrator sees in this form.
      await apiRequest("/settings/database-backup", {
        method: "PUT",
        body: JSON.stringify({
          enabled: config.enabled,
          email: config.email,
          time: config.time,
          timezone: config.timezone,
          retentionDays: config.retentionDays,
        }),
      })
      await apiRequest("/settings/database-backup/run", { method: "POST", body: "{}" })
      toast.success("Database backup created and emailed")
      await load()
    } catch (error: any) {
      toast.error(error.message || "Database backup failed")
    } finally {
      setRunning(false)
    }
  }

  if (loading) {
    return <div className="flex min-h-48 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
  }

  const lastRun = config.lastRun
  const fileSize = lastRun?.sizeBytes
    ? `${(lastRun.sizeBytes / 1024 / 1024).toFixed(2)} MB`
    : null

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Database Backup</h2>
          <p className="text-muted-foreground">Create a compressed full SQL backup and email it automatically.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={runNow} disabled={running || saving || !config.email}>
            {running ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
            {running ? "Backing up…" : "Back Up Now & Email"}
          </Button>
          <Button onClick={save} disabled={saving || running}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Schedule
          </Button>
        </div>
      </div>

      <CardContainer title="Daily Full Database Backup" description="The schedule runs every day in the selected timezone and catches up after a server restart." gradientColor="#0ea5e9">
        <div className="space-y-6">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-start gap-3">
              <Database className="mt-0.5 h-5 w-5 text-sky-600" />
              <div>
                <Label htmlFor="database-backup-enabled">Automatic backup</Label>
                <p className="text-sm text-muted-foreground">Email one compressed schema-and-data backup each day.</p>
              </div>
            </div>
            <Switch id="database-backup-enabled" checked={config.enabled} onCheckedChange={value => update("enabled", value)} />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="database-backup-email">Backup recipient email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input id="database-backup-email" type="email" className="pl-9" value={config.email} onChange={event => update("email", event.target.value)} placeholder="backup@example.com" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="database-backup-time">Daily backup time</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input id="database-backup-time" type="time" className="pl-9" value={config.time} onChange={event => update("time", event.target.value)} />
              </div>
              <p className="text-xs text-muted-foreground">Use 00:00 for midnight (12 AM).</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="database-backup-timezone">Timezone</Label>
              <select id="database-backup-timezone" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={config.timezone} onChange={event => update("timezone", event.target.value)}>
                <option value="Asia/Kathmandu">Asia/Kathmandu (Nepal)</option>
                <option value="Asia/Kolkata">Asia/Kolkata (India)</option>
                <option value="UTC">UTC</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="database-backup-retention">Local retention (days)</Label>
              <div className="relative">
                <Archive className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input id="database-backup-retention" type="number" min={1} max={90} className="pl-9" value={config.retentionDays} onChange={event => update("retentionDays", Number(event.target.value))} />
              </div>
            </div>
          </div>
        </div>
      </CardContainer>

      <CardContainer title="Last Backup" description="Latest manual or scheduled backup attempt" gradientColor={lastRun?.status === "success" ? "#22c55e" : "#f97316"}>
        {!lastRun ? (
          <p className="text-sm text-muted-foreground">No database backup has run yet.</p>
        ) : (
          <div className="grid gap-3 text-sm md:grid-cols-2">
            <div><span className="text-muted-foreground">Status:</span> <span className={lastRun.status === "success" ? "font-medium text-green-600" : "font-medium text-red-600"}>{lastRun.status}</span></div>
            <div><span className="text-muted-foreground">Run:</span> {lastRun.operation || "—"}</div>
            <div><span className="text-muted-foreground">Time:</span> {lastRun.createdAt ? new Date(lastRun.createdAt).toLocaleString() : "—"}</div>
            <div><span className="text-muted-foreground">Recipient:</span> {lastRun.recipient || config.email || "—"}</div>
            {lastRun.fileName && <div><span className="text-muted-foreground">File:</span> {lastRun.fileName}</div>}
            {fileSize && <div><span className="text-muted-foreground">Compressed size:</span> {fileSize}</div>}
            {lastRun.message && <div className="md:col-span-2"><span className="text-muted-foreground">Result:</span> {lastRun.message}</div>}
          </div>
        )}
      </CardContainer>

      <p className="text-xs text-muted-foreground">Full backups can contain sensitive data. Access is restricted to system/global administrators and files are retained only in the server backup directory.</p>
    </div>
  )
}
