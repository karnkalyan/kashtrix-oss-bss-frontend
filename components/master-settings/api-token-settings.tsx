"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { apiRequest } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CardContainer } from "@/components/ui/card-container"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Check, Copy, KeyRound, Loader2, RefreshCw, ShieldCheck, Trash2 } from "lucide-react"
import toast from "react-hot-toast"

type Scope = { value: string; label: string; description: string }
type ApiRoute = {
  method: string
  path: string
  scope: string | null
  title: string
  description: string
  query?: Record<string, string>
}
type Documentation = {
  title: string
  version: string
  baseUrl: string
  authentication: { scheme: string; header: string; note: string }
  scopes: Scope[]
  routes: ApiRoute[]
  examples: { curl: string; javascript: string }
}
type TokenRow = {
  id: number
  tokenPrefix: string
  name: string
  description?: string | null
  scopes: string
  ipRestrictions?: string | null
  branchId?: number | null
  resellerId?: number | null
  lastUsedAt?: string | null
  expiresAt?: string | null
  createdAt: string
}

function parseScopes(value: string) {
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.map(String) : []
  } catch {
    return value.split(",").map((scope) => scope.trim()).filter(Boolean)
  }
}

function formatDate(value?: string | null) {
  if (!value) return "Never"
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "Unknown" : date.toLocaleString()
}

export function ApiTokenSettings() {
  const [tokens, setTokens] = useState<TokenRow[]>([])
  const [documentation, setDocumentation] = useState<Documentation | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [revealedToken, setRevealedToken] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: "",
    description: "",
    scopes: ["profile:read", "customers:read", "devices:read"],
    expiresInDays: "90",
    ipRestrictions: "",
    branchId: "",
    resellerId: "",
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [tokenResponse, docsResponse] = await Promise.all([
        apiRequest<{ success: boolean; data: TokenRow[] }>("/api-tokens"),
        apiRequest<{ success: boolean; data: Documentation }>("/api-tokens/documentation"),
      ])
      setTokens(tokenResponse.data || [])
      setDocumentation(docsResponse.data)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load API token settings")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const availableScopes = documentation?.scopes || []
  const selectedScopeSet = useMemo(() => new Set(form.scopes), [form.scopes])

  const toggleScope = (scope: string) => {
    setForm((current) => ({
      ...current,
      scopes: current.scopes.includes(scope)
        ? current.scopes.filter((item) => item !== scope)
        : [...current.scopes, scope],
    }))
  }

  const createToken = async () => {
    if (!form.name.trim()) return toast.error("Enter a token name")
    if (!form.scopes.length) return toast.error("Select at least one scope")
    if (form.branchId && form.resellerId) return toast.error("Choose either a branch or reseller restriction")
    setSaving(true)
    try {
      const response = await apiRequest<{ success: boolean; rawToken: string }>("/api-tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || null,
          scopes: form.scopes,
          expiresInDays: Number(form.expiresInDays) || null,
          ipRestrictions: form.ipRestrictions.trim() || null,
          branchId: form.branchId ? Number(form.branchId) : null,
          resellerId: form.resellerId ? Number(form.resellerId) : null,
        }),
      })
      setRevealedToken(response.rawToken)
      setForm((current) => ({ ...current, name: "", description: "" }))
      toast.success("API token generated")
      await load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to generate token")
    } finally {
      setSaving(false)
    }
  }

  const revoke = async (token: TokenRow) => {
    if (!window.confirm(`Revoke API token "${token.name}"? Existing integrations will stop working immediately.`)) return
    await apiRequest(`/api-tokens/${token.id}/revoke`, { method: "POST" })
    toast.success("API token revoked")
    await load()
  }

  const rotate = async (token: TokenRow) => {
    if (!window.confirm(`Rotate API token "${token.name}"? The current secret will stop working immediately.`)) return
    const response = await apiRequest<{ success: boolean; rawToken: string }>(`/api-tokens/${token.id}/rotate`, { method: "POST" })
    setRevealedToken(response.rawToken)
    toast.success("API token rotated")
    await load()
  }

  const copy = async (value: string, key: string) => {
    await navigator.clipboard.writeText(value)
    setCopied(key)
    setTimeout(() => setCopied(null), 1500)
  }

  return (
    <div className="space-y-6">
      <CardContainer title="Generate API Token" description="Create scoped Bearer tokens for trusted external integrations" gradientColor="#6366f1">
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api-token-name">Token name</Label>
              <Input id="api-token-name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Billing integration" maxLength={100} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="api-token-description">Description</Label>
              <Textarea id="api-token-description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Where and why this token is used" />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="api-token-expiry">Expires in days</Label>
                <Input id="api-token-expiry" type="number" min={1} max={3650} value={form.expiresInDays} onChange={(event) => setForm({ ...form, expiresInDays: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="api-token-branch">Branch ID</Label>
                <Input id="api-token-branch" type="number" min={1} value={form.branchId} onChange={(event) => setForm({ ...form, branchId: event.target.value, resellerId: event.target.value ? "" : form.resellerId })} placeholder="Optional" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="api-token-reseller">Reseller ID</Label>
                <Input id="api-token-reseller" type="number" min={1} value={form.resellerId} onChange={(event) => setForm({ ...form, resellerId: event.target.value, branchId: event.target.value ? "" : form.branchId })} placeholder="Optional" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="api-token-ips">Allowed IP addresses</Label>
              <Input id="api-token-ips" value={form.ipRestrictions} onChange={(event) => setForm({ ...form, ipRestrictions: event.target.value })} placeholder="203.0.113.10, 203.0.113.11 (blank allows all)" />
            </div>
          </div>

          <div className="space-y-3">
            <Label>API scopes</Label>
            {availableScopes.map((scope) => (
              <button key={scope.value} type="button" onClick={() => toggleScope(scope.value)} className={`w-full rounded-xl border p-3 text-left transition ${selectedScopeSet.has(scope.value) ? "border-indigo-500 bg-indigo-500/5" : "hover:bg-muted/40"}`}>
                <div className="flex items-start gap-3">
                  <span className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded border ${selectedScopeSet.has(scope.value) ? "border-indigo-600 bg-indigo-600 text-white" : ""}`}>
                    {selectedScopeSet.has(scope.value) && <Check className="h-3.5 w-3.5" />}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">{scope.label}</span>
                    <code className="text-[11px] text-indigo-600">{scope.value}</code>
                    <span className="mt-1 block text-xs text-muted-foreground">{scope.description}</span>
                  </span>
                </div>
              </button>
            ))}
            <Button className="w-full" onClick={createToken} disabled={saving || loading}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
              Generate token
            </Button>
          </div>
        </div>
      </CardContainer>

      <CardContainer title="Active API Tokens" description="Only token prefixes are retained for identification; secrets cannot be recovered" gradientColor="#0ea5e9">
        <div className="mb-3 flex justify-end">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}><RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />Refresh</Button>
        </div>
        {tokens.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">No active API tokens.</div>
        ) : (
          <div className="space-y-3">
            {tokens.map((token) => (
              <div key={token.id} className="rounded-xl border p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-600" /><span className="font-semibold">{token.name}</span><code className="text-xs text-muted-foreground">{token.tokenPrefix}</code></div>
                    {token.description && <p className="mt-1 text-xs text-muted-foreground">{token.description}</p>}
                    <div className="mt-2 flex flex-wrap gap-1">{parseScopes(token.scopes).map((scope) => <Badge key={scope} variant="outline" className="text-[10px]">{scope}</Badge>)}</div>
                    <div className="mt-2 text-[11px] text-muted-foreground">
                      Created {formatDate(token.createdAt)} · Expires {formatDate(token.expiresAt)} · Last used {formatDate(token.lastUsedAt)}
                      {token.ipRestrictions && ` · IPs ${token.ipRestrictions}`}
                      {token.branchId && ` · Branch ${token.branchId}`}
                      {token.resellerId && ` · Reseller ${token.resellerId}`}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => rotate(token)}><RefreshCw className="mr-1 h-3.5 w-3.5" />Rotate</Button>
                    <Button variant="destructive" size="sm" onClick={() => revoke(token)}><Trash2 className="mr-1 h-3.5 w-3.5" />Revoke</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContainer>

      {documentation && (
        <CardContainer title="External API Documentation" description={`${documentation.title} ${documentation.version}`} gradientColor="#22c55e">
          <div className="space-y-5">
            <div className="rounded-xl border bg-muted/20 p-4 text-sm">
              <div><span className="font-semibold">Base URL:</span> <code>{documentation.baseUrl}</code></div>
              <div className="mt-1"><span className="font-semibold">Authentication:</span> <code>{documentation.authentication.header}</code></div>
              <p className="mt-2 text-xs text-muted-foreground">{documentation.authentication.note}</p>
            </div>
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 text-xs uppercase"><tr><th className="p-3">Method</th><th className="p-3">Route</th><th className="p-3">Scope</th><th className="p-3">Description</th></tr></thead>
                <tbody>
                  {documentation.routes.map((route) => (
                    <tr key={`${route.method}-${route.path}`} className="border-t">
                      <td className="p-3"><Badge>{route.method}</Badge></td>
                      <td className="p-3"><code>{route.path}</code></td>
                      <td className="p-3"><code className="text-xs">{route.scope || "authenticated token"}</code></td>
                      <td className="p-3"><span className="font-medium">{route.title}</span><p className="text-xs text-muted-foreground">{route.description}</p></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {(["curl", "javascript"] as const).map((key) => (
              <div key={key}>
                <div className="mb-1 flex items-center justify-between"><Label className="uppercase">{key}</Label><Button variant="ghost" size="sm" onClick={() => copy(documentation.examples[key], key)}>{copied === key ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}</Button></div>
                <pre className="overflow-x-auto rounded-xl bg-slate-950 p-4 text-xs text-emerald-300"><code>{documentation.examples[key]}</code></pre>
              </div>
            ))}
          </div>
        </CardContainer>
      )}

      <Dialog open={Boolean(revealedToken)} onOpenChange={(open) => !open && setRevealedToken(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Copy your API token now</DialogTitle>
            <DialogDescription>This secret is shown only once. Store it in a password manager or server-side environment variable.</DialogDescription>
          </DialogHeader>
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
            <code className="break-all text-sm">{revealedToken}</code>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => revealedToken && copy(revealedToken, "token")}>{copied === "token" ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}Copy token</Button>
            <Button onClick={() => setRevealedToken(null)}>I stored it safely</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
