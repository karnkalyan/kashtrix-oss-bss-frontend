"use client"

import { useEffect, useMemo, useState } from "react"
import { Activity, Database, Eye, Loader2, Pencil, Plus, RadioTower, RefreshCw, Search, Send, Shield, Trash2, Users } from "lucide-react"
import { ServicesAPI } from "@/lib/api/service"
import { CardContainer } from "@/components/ui/card-container"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "react-hot-toast"

const unwrapUsers = (payload: any): any[] => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.users)) return payload.users
  if (Array.isArray(payload?.data)) return payload.data
  return []
}

const valueOf = (item: any, keys: string[], fallback = "N/A") => {
  for (const key of keys) {
    const value = item?.[key]
    if (value !== undefined && value !== null && value !== "") return String(value)
  }
  return fallback
}

const isActiveSession = (entry: any) => !entry?.acctstoptime || entry.acctstoptime === "0000-00-00 00:00:00"

function AttributeTable({ title, rows }: { title: string; rows: any[] }) {
  if (!Array.isArray(rows) || rows.length === 0) return null

  return (
    <div className="rounded-lg border">
      <div className="border-b px-3 py-2 text-sm font-semibold">{title}</div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Attribute</TableHead>
            <TableHead>Operator</TableHead>
            <TableHead>Value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={`${title}-${row?.id || index}`}>
              <TableCell className="font-mono text-xs">{valueOf(row, ["attribute", "groupname", "acctsessionid"])}</TableCell>
              <TableCell className="font-mono text-xs">{valueOf(row, ["op", "priority"], "")}</TableCell>
              <TableCell className="break-all text-xs">{valueOf(row, ["value", "nasipaddress", "framedipaddress", "acctstarttime"])}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

const radiusTables = [
  { key: "radcheck", label: "Radcheck" },
  { key: "radreply", label: "Radreply" },
  { key: "radusergroup", label: "Radusergroup" },
  { key: "radgroupreply", label: "Groupreply" },
  { key: "radgroupcheck", label: "Groupcheck" },
  { key: "radpostauth", label: "Postauth" },
  { key: "nas", label: "NAS" },
  { key: "nasreload", label: "NAS reload" },
  { key: "radacct", label: "Accounting" },
]

function RawRadiusTable({ table, search }: { table: string; search: string }) {
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [ispId, setIspId] = useState<number | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingRow, setEditingRow] = useState<any | null>(null)
  const [jsonValue, setJsonValue] = useState("{}")
  const [saving, setSaving] = useState(false)
  const editable = ["radcheck", "radreply", "radusergroup", "radgroupreply", "radgroupcheck", "nas"].includes(table)

  const fetchRows = async () => {
    setLoading(true)
    try {
      const response = await ServicesAPI.getRadiusTable(table, ["radacct", "radpostauth", "nasreload"].includes(table) ? 1000 : 2000, 0)
      setRows(response.data?.rows || [])
      setIspId(response.data?.ispId ?? null)
    } catch (error: any) {
      toast.error(error.message || `Failed to load ${table}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRows()
  }, [table])

  const filteredRows = useMemo(() => {
    const term = search.toLowerCase().trim()
    if (!term) return rows
    return rows.filter((row) => JSON.stringify(row).toLowerCase().includes(term))
  }, [rows, search])

  const columns = useMemo(() => {
    const keys = new Set<string>()
    filteredRows.slice(0, 50).forEach((row) => {
      Object.keys(row || {}).forEach((key) => {
        if (!["createdAt", "updatedAt"].includes(key)) keys.add(key)
      })
    })
    return Array.from(keys).slice(0, 9)
  }, [filteredRows])

  const openEditor = (row?: any) => {
    setEditingRow(row || null)
    const clean = row ? Object.fromEntries(Object.entries(row).filter(([key]) => !["id", "ID", "ispId", "ispid", "isp_id", "createdAt", "updatedAt"].includes(key))) : {}
    setJsonValue(JSON.stringify(clean, null, 2))
    setEditorOpen(true)
  }

  const saveRow = async () => {
    let payload: Record<string, any>
    try {
      payload = JSON.parse(jsonValue)
      if (!payload || Array.isArray(payload) || typeof payload !== "object") throw new Error()
    } catch {
      toast.error("Enter a valid JSON object")
      return
    }
    setSaving(true)
    try {
      const id = editingRow?.id ?? editingRow?.ID
      if (editingRow) await ServicesAPI.updateRadiusTableRow(table, id, payload)
      else await ServicesAPI.createRadiusTableRow(table, payload)
      toast.success(`${table} record ${editingRow ? "updated" : "created"}`)
      setEditorOpen(false)
      await fetchRows()
    } catch (error: any) {
      toast.error(error.message || `Failed to save ${table} record`)
    } finally {
      setSaving(false)
    }
  }

  const deleteRow = async (row: any) => {
    const id = row?.id ?? row?.ID
    if (id === undefined || !confirm(`Delete ${table} record #${id} for ISP ${ispId}?`)) return
    try {
      await ServicesAPI.deleteRadiusTableRow(table, id)
      toast.success(`${table} record deleted`)
      await fetchRows()
    } catch (error: any) {
      toast.error(error.message || `Failed to delete ${table} record`)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
        <div className="flex items-center gap-2"><span>{filteredRows.length} rows</span><Badge variant="outline">ISP {ispId ?? "-"} only</Badge></div>
        <div className="flex gap-2">
        {editable && <Button size="sm" onClick={() => openEditor()}><Plus className="mr-2 h-3.5 w-3.5" />Add row</Button>}
        <Button variant="outline" size="sm" onClick={fetchRows} disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="mr-2 h-3.5 w-3.5" />}
          Refresh
        </Button>
        </div>
      </div>
      <div className="max-h-[520px] overflow-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => <TableHead key={column} className="whitespace-nowrap">{column}</TableHead>)}
              {editable && <TableHead className="w-[100px]">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell colSpan={Math.max(columns.length, 1)}><Skeleton className="h-7 w-full" /></TableCell>
                </TableRow>
              ))
            ) : filteredRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={Math.max(columns.length, 1)} className="h-24 text-center text-muted-foreground">No records found.</TableCell>
              </TableRow>
            ) : (
              filteredRows.slice(0, 300).map((row, rowIndex) => (
                <TableRow key={`${table}-${row?.id || rowIndex}`}>
                  {columns.map((column) => (
                    <TableCell key={column} className="max-w-[240px] truncate font-mono text-xs" title={String(row?.[column] ?? "")}>
                      {String(row?.[column] ?? "") || "-"}
                    </TableCell>
                  ))}
                  {editable && <TableCell><div className="flex gap-1"><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditor(row)}><Pencil className="h-3.5 w-3.5" /></Button><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteRow(row)}><Trash2 className="h-3.5 w-3.5" /></Button></div></TableCell>}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="sm:max-w-[680px]">
          <DialogHeader><DialogTitle>{editingRow ? "Edit" : "Add"} {table} record</DialogTitle><DialogDescription>The backend fixes ISP ID to {ispId ?? "the current tenant"}; it cannot be changed here.</DialogDescription></DialogHeader>
          <div className="space-y-2"><Label>Record fields (JSON)</Label><Textarea className="min-h-[300px] font-mono text-xs" value={jsonValue} onChange={(event) => setJsonValue(event.target.value)} /></div>
          <DialogFooter><Button variant="outline" onClick={() => setEditorOpen(false)}>Cancel</Button><Button onClick={saveRow} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function RadiusDashboard() {
  const [users, setUsers] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [search, setSearch] = useState("")
  const [tableSearch, setTableSearch] = useState("")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(25)
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [accounting, setAccounting] = useState<any[]>([])
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [coaOpen, setCoaOpen] = useState(false)
  const [coaUser, setCoaUser] = useState<any>(null)
  const [coaSubmitting, setCoaSubmitting] = useState(false)
  const [coaForm, setCoaForm] = useState({
    action: "disconnect",
    nasIpAddress: "",
    framedIpAddress: "",
    sessionId: "",
    attributes: ""
  })

  const fetchAllUsers = async () => {
    const batch = 500
    let offset = 0
    const all: any[] = []

    for (let guard = 0; guard < 50; guard++) {
      const response = await ServicesAPI.getRadiusUsers(batch, offset)
      const payload = response.data
      const rows = unwrapUsers(payload)
      all.push(...rows)
      const total = Number(payload?.total || all.length)
      const hasMore = payload?.hasMore ?? all.length < total
      if (!hasMore || rows.length === 0) break
      offset += batch
    }

    return all
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const [userList, statsRes] = await Promise.all([
        fetchAllUsers(),
        ServicesAPI.getRadiusStats().catch(() => ({ data: null })),
      ])
      setUsers(userList)
      setStats(statsRes.data)
    } catch (error: any) {
      toast.error(error.message || "Failed to load Radius service data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filteredUsers = useMemo(() => {
    const term = search.toLowerCase().trim()
    if (!term) return users
    return users.filter(user =>
      [user?.username, user?.groupname, user?.nasipaddress, user?.framedipaddress]
        .filter(Boolean)
        .some(value => String(value).toLowerCase().includes(term))
    )
  }, [search, users])

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / limit))
  const paginatedUsers = filteredUsers.slice((page - 1) * limit, page * limit)

  const openDetails = async (user: any) => {
    const username = valueOf(user, ["username"], "")
    setSelectedUser(user)
    setAccounting([])
    if (!username) return
    setDetailsLoading(true)
    try {
      const [detailRes, accountingRes] = await Promise.all([
        ServicesAPI.getRadiusUser(username),
        ServicesAPI.getRadiusAccounting(username).catch(() => ({ data: [] })),
      ])
      setSelectedUser(detailRes.data || user)
      setAccounting(Array.isArray(accountingRes.data) ? accountingRes.data : unwrapUsers(accountingRes.data))
    } catch (error: any) {
      toast.error(error.message || "Failed to load Radius user details")
    } finally {
      setDetailsLoading(false)
    }
  }

  const openCoA = (user: any) => {
    const latestSession = Array.isArray(user?.radacct) ? user.radacct.find(isActiveSession) : null
    setCoaUser(user)
    setCoaForm({
      action: "disconnect",
      nasIpAddress: valueOf(latestSession || user, ["nasipaddress"], ""),
      framedIpAddress: valueOf(latestSession || user, ["framedipaddress"], ""),
      sessionId: valueOf(latestSession || user, ["acctsessionid"], ""),
      attributes: ""
    })
    setCoaOpen(true)
  }

  const submitCoA = async () => {
    const username = valueOf(coaUser, ["username"], "")
    if (!username) return

    let attributes = {}
    if (coaForm.attributes.trim()) {
      try {
        attributes = JSON.parse(coaForm.attributes)
      } catch {
        toast.error("COA attributes must be valid JSON")
        return
      }
    }

    setCoaSubmitting(true)
    try {
      await ServicesAPI.sendRadiusCoA(username, {
        action: coaForm.action,
        nasIpAddress: coaForm.nasIpAddress || undefined,
        framedIpAddress: coaForm.framedIpAddress || undefined,
        sessionId: coaForm.sessionId || undefined,
        attributes
      })
      toast.success("Radius COA request sent")
      setCoaOpen(false)
    } catch (error: any) {
      toast.error(error.message || "Failed to send Radius COA")
    } finally {
      setCoaSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <CardContainer title="Radius Users" gradientColor="#6366f1">
          <div className="flex items-center gap-3 py-2">
            <Users className="h-8 w-8 text-indigo-500" />
            <div className="text-3xl font-bold">{stats?.summary?.totalUsers ?? users.length}</div>
          </div>
        </CardContainer>
        <CardContainer title="Active Sessions" gradientColor="#22c55e">
          <div className="flex items-center gap-3 py-2">
            <Activity className="h-8 w-8 text-green-500" />
            <div className="text-3xl font-bold">{stats?.summary?.activeConnections ?? stats?.counts?.activeSessions ?? 0}</div>
          </div>
        </CardContainer>
        <CardContainer title="Auth Entries" gradientColor="#0ea5e9">
          <div className="flex items-center gap-3 py-2">
            <Shield className="h-8 w-8 text-sky-500" />
            <div className="text-3xl font-bold">{stats?.counts?.radcheck ?? 0}</div>
          </div>
        </CardContainer>
        <CardContainer title="Accounting" gradientColor="#f59e0b">
          <div className="flex items-center gap-3 py-2">
            <Database className="h-8 w-8 text-amber-500" />
            <div className="text-3xl font-bold">{stats?.counts?.radacct ?? 0}</div>
          </div>
        </CardContainer>
      </div>

      <CardContainer
        title="Radius Users"
        description="FreeRADIUS users, authentication attributes, groups, accounting sessions, and COA controls"
        gradientColor="#6366f1"
        actions={[{ label: "Refresh", onClick: fetchData, icon: <RefreshCw className="h-4 w-4" />, variant: "outline" }]}
      >
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} placeholder="Search radius users" className="pl-9" />
          </div>
          <select value={limit} onChange={(event) => { setLimit(Number(event.target.value)); setPage(1) }} className="h-10 rounded-md border bg-background px-3 text-sm">
            {[10, 25, 50, 100].map(value => <option key={value} value={value}>{value} rows</option>)}
          </select>
        </div>

        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Entries</TableHead>
                <TableHead>Password</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[150px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell colSpan={5}><Skeleton className="h-7 w-full" /></TableCell>
                  </TableRow>
                ))
              ) : paginatedUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-28 text-center text-muted-foreground">No Radius users found.</TableCell>
                </TableRow>
              ) : (
                paginatedUsers.map((user, index) => (
                  <TableRow key={`${user.username}-${index}`}>
                    <TableCell className="font-mono text-sm font-semibold">{valueOf(user, ["username"])}</TableCell>
                    <TableCell>{valueOf(user, ["entryCount"], "0")}</TableCell>
                    <TableCell>{user?.hasPassword ? <Badge variant="success">Set</Badge> : <Badge variant="secondary">Unknown</Badge>}</TableCell>
                    <TableCell>{user?.hasActiveSession ? <Badge variant="success">Online</Badge> : <Badge variant="secondary">Available</Badge>}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openDetails(user)}><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => openCoA(user)}><RadioTower className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <div>Showing {paginatedUsers.length ? (page - 1) * limit + 1 : 0} to {Math.min(page * limit, filteredUsers.length)} of {filteredUsers.length}</div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(1)}>First</Button>
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(prev => prev - 1)}>Prev</Button>
            <span className="px-2">Page {page} of {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(prev => prev + 1)}>Next</Button>
            <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(totalPages)}>Last</Button>
          </div>
        </div>
      </CardContainer>

      <CardContainer
        title="Radius Database Tables"
        description="Inspect Radius radcheck, radreply, user groups, group replies, NAS, and accounting records"
        gradientColor="#0ea5e9"
      >
        <Tabs defaultValue="radreply" className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <TabsList className="h-auto flex-wrap justify-start">
              {radiusTables.map((item) => (
                <TabsTrigger key={item.key} value={item.key}>{item.label}</TabsTrigger>
              ))}
            </TabsList>
            <div className="relative w-full lg:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={tableSearch} onChange={(event) => setTableSearch(event.target.value)} placeholder="Search any table value" className="pl-9" />
            </div>
          </div>
          {radiusTables.map((item) => (
            <TabsContent key={item.key} value={item.key}>
              <RawRadiusTable table={item.key} search={tableSearch} />
            </TabsContent>
          ))}
        </Tabs>
      </CardContainer>

      <Dialog open={!!selectedUser} onOpenChange={(open) => { if (!open) setSelectedUser(null) }}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[950px]">
          <DialogHeader>
            <DialogTitle>Radius User Details</DialogTitle>
            <DialogDescription>{selectedUser?.username}</DialogDescription>
          </DialogHeader>
          {detailsLoading ? (
            <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading details...
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button size="sm" onClick={() => openCoA(selectedUser)}><RadioTower className="mr-2 h-4 w-4" /> COA</Button>
              </div>
              <AttributeTable title="Radcheck" rows={selectedUser?.radcheck || []} />
              <AttributeTable title="Radreply" rows={selectedUser?.radreply || []} />
              <AttributeTable title="Radusergroup" rows={selectedUser?.radusergroup || []} />
              <AttributeTable title="Groupreply" rows={selectedUser?.radgroupreply || []} />
              <AttributeTable title="Groupcheck" rows={selectedUser?.radgroupcheck || []} />
              <AttributeTable title="Postauth" rows={selectedUser?.radpostauth || []} />
              <AttributeTable title="Recent Accounting" rows={selectedUser?.radacct || accounting || []} />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={coaOpen} onOpenChange={setCoaOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Radius COA</DialogTitle>
            <DialogDescription>{valueOf(coaUser, ["username"], "")}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Action</Label>
              <select value={coaForm.action} onChange={(event) => setCoaForm(prev => ({ ...prev, action: event.target.value }))} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                <option value="disconnect">Disconnect</option>
                <option value="coa">Change Authorization</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Session ID</Label>
              <Input value={coaForm.sessionId} onChange={(event) => setCoaForm(prev => ({ ...prev, sessionId: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>NAS IP</Label>
              <Input value={coaForm.nasIpAddress} onChange={(event) => setCoaForm(prev => ({ ...prev, nasIpAddress: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Framed IP</Label>
              <Input value={coaForm.framedIpAddress} onChange={(event) => setCoaForm(prev => ({ ...prev, framedIpAddress: event.target.value }))} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Attributes JSON</Label>
              <Textarea value={coaForm.attributes} onChange={(event) => setCoaForm(prev => ({ ...prev, attributes: event.target.value }))} placeholder='{"Mikrotik-Rate-Limit":"20M/20M"}' />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCoaOpen(false)}>Cancel</Button>
            <Button onClick={submitCoA} disabled={coaSubmitting}>
              {coaSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Send COA
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
