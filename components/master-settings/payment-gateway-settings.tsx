"use client"

import { useEffect, useState } from "react"
import {
  Copy,
  KeyRound,
  Loader2,
  Save,
  CreditCard,
  Globe,
  Zap,
  Smartphone,
  PhoneCall,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  Send
} from "lucide-react"
import { apiRequest } from "@/lib/api"
import { toast } from "react-hot-toast"
import { CardContainer } from "@/components/ui/card-container"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

type EsewaConfig = {
  tokenEnabled: boolean
  epayEnabled: boolean
  username: string
  passwordConfigured: boolean
  clientSecretConfigured: boolean
  serviceEnabled: boolean
}

type GatewaysState = {
  stripe: {
    enabled: boolean
    publishableKey: string
    secretKey: string
    webhookSecret: string
    currency: string
    testMode: boolean
  }
  paypal: {
    enabled: boolean
    clientId: string
    clientSecret: string
    mode: "sandbox" | "live"
    currency: string
  }
  razorpay: {
    enabled: boolean
    keyId: string
    keySecret: string
    webhookSecret: string
    currency: string
  }
  instapay: {
    enabled: boolean
    merchantId: string
    apiKey: string
    baseUrl: string
  }
}

type TwilioConfig = {
  accountSid: string
  authToken: string
  fromNumber: string
  messagingServiceSid: string
  enabled: boolean
}

export function PaymentGatewaySettings() {
  const [activeTab, setActiveTab] = useState("stripe")
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})

  // Esewa state
  const [esewaCredentials, setEsewaCredentials] = useState({ password: "", clientSecret: "" })
  const [esewaEncoded, setEsewaEncoded] = useState({ passwordBase64: "", clientSecretBase64: "" })
  const [esewaConfig, setEsewaConfig] = useState<EsewaConfig>({
    tokenEnabled: false,
    epayEnabled: true,
    username: "esewa-client",
    passwordConfigured: false,
    clientSecretConfigured: false,
    serviceEnabled: false
  })

  // Global Gateways state
  const [gateways, setGateways] = useState<GatewaysState>({
    stripe: {
      enabled: false,
      publishableKey: "",
      secretKey: "",
      webhookSecret: "",
      currency: "USD",
      testMode: true
    },
    paypal: {
      enabled: false,
      clientId: "",
      clientSecret: "",
      mode: "sandbox",
      currency: "USD"
    },
    razorpay: {
      enabled: false,
      keyId: "",
      keySecret: "",
      webhookSecret: "",
      currency: "INR"
    },
    instapay: {
      enabled: false,
      merchantId: "",
      apiKey: "",
      baseUrl: "https://api.instapay.ph/v1"
    }
  })

  // Twilio state
  const [twilioConfig, setTwilioConfig] = useState<TwilioConfig>({
    accountSid: "",
    authToken: "",
    fromNumber: "",
    messagingServiceSid: "",
    enabled: false
  })
  const [testPhone, setTestPhone] = useState("")
  const [testingTwilio, setTestingTwilio] = useState(false)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [encoding, setEncoding] = useState(false)

  const toggleSecret = (field: string) => {
    setShowSecrets(prev => ({ ...prev, [field]: !prev[field] }))
  }

  useEffect(() => {
    async function loadAllConfigs() {
      setLoading(true)
      try {
        const [esewaRes, gatewaysRes, twilioRes] = await Promise.allSettled([
          apiRequest<EsewaConfig>("/settings/esewa/config"),
          apiRequest<any>("/api/payment/gateways"),
          apiRequest<any>("/api/twilio/config")
        ])

        if (esewaRes.status === "fulfilled" && esewaRes.value) {
          setEsewaConfig(esewaRes.value)
        }
        if (gatewaysRes.status === "fulfilled" && gatewaysRes.value?.data) {
          setGateways(prev => ({
            ...prev,
            ...gatewaysRes.value.data
          }))
        }
        if (twilioRes.status === "fulfilled" && twilioRes.value?.data) {
          setTwilioConfig(prev => ({
            ...prev,
            ...twilioRes.value.data
          }))
        }
      } catch (err: any) {
        toast.error("Failed to load gateway configurations")
      } finally {
        setLoading(false)
      }
    }
    loadAllConfigs()
  }, [])

  // Save Global Gateways
  const saveGlobalGateways = async () => {
    setSaving(true)
    try {
      await apiRequest("/api/payment/gateways", {
        method: "PUT",
        body: JSON.stringify(gateways)
      })
      toast.success("Global payment gateway settings saved!")
    } catch (error: any) {
      toast.error(error.message || "Failed to save payment settings")
    } finally {
      setSaving(false)
    }
  }

  // Save Twilio Configuration
  const saveTwilioConfig = async () => {
    setSaving(true)
    try {
      await apiRequest("/api/twilio/config", {
        method: "PUT",
        body: JSON.stringify(twilioConfig)
      })
      toast.success("Twilio communication settings saved!")
    } catch (error: any) {
      toast.error(error.message || "Failed to save Twilio settings")
    } finally {
      setSaving(false)
    }
  }

  // Test Twilio SMS
  const testTwilioSms = async () => {
    if (!testPhone.trim()) return toast.error("Enter phone number to receive test SMS")
    setTestingTwilio(true)
    try {
      const res = await apiRequest<any>("/api/twilio/sms", {
        method: "POST",
        body: JSON.stringify({
          to: testPhone.trim(),
          message: "Kashtrix OSS/BSS Twilio Integration Test: SMS service is active."
        })
      })
      if (res?.success) {
        toast.success("Test SMS sent successfully!")
      } else {
        toast.error(res?.error || "Failed to send test SMS")
      }
    } catch (err: any) {
      toast.error(err.message || "Twilio test SMS failed")
    } finally {
      setTestingTwilio(false)
    }
  }

  // Save eSewa Configuration
  const saveEsewa = async () => {
    setSaving(true)
    try {
      await apiRequest("/settings/esewa/config", {
        method: "PUT",
        body: JSON.stringify({
          ...esewaConfig,
          password: esewaCredentials.password || undefined,
          clientSecret: esewaCredentials.clientSecret || undefined
        })
      })
      setEsewaConfig(prev => ({
        ...prev,
        passwordConfigured: prev.passwordConfigured || Boolean(esewaCredentials.password),
        clientSecretConfigured: prev.clientSecretConfigured || Boolean(esewaCredentials.clientSecret)
      }))
      setEsewaCredentials({ password: "", clientSecret: "" })
      toast.success("eSewa configuration saved")
    } catch (error: any) {
      toast.error(error.message || "Failed to save eSewa configuration")
    } finally {
      setSaving(false)
    }
  }

  const generateEsewa = async () => {
    if (!esewaCredentials.password || !esewaCredentials.clientSecret) {
      return toast.error("Enter the eSewa password and client secret")
    }
    setEncoding(true)
    try {
      const result = await apiRequest<typeof esewaEncoded>("/settings/esewa/base64", {
        method: "POST",
        body: JSON.stringify(esewaCredentials)
      })
      setEsewaEncoded(result)
      toast.success("eSewa Base64 values generated")
    } catch (error: any) {
      toast.error(error.message || "Failed to generate Base64 values")
    } finally {
      setEncoding(false)
    }
  }

  const copy = async (value: string, label: string) => {
    await navigator.clipboard.writeText(value)
    toast.success(`${label} copied to clipboard`)
  }

  if (loading) {
    return (
      <div className="flex justify-center p-16">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
      </div>
    )
  }

  return (
    <CardContainer
      title="Global Payment & Communication Gateways"
      description="Manage enterprise payment services, digital wallets (Apple Pay, Google Pay, Card), Twilio SMS/Voice, and localized billing aggregators."
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-slate-900 border border-slate-800 p-1 flex flex-wrap gap-1">
          <TabsTrigger value="stripe" className="gap-2 text-xs">
            <CreditCard className="h-3.5 w-3.5 text-indigo-400" /> Stripe (Cards / GPay / Apple Pay)
          </TabsTrigger>
          <TabsTrigger value="paypal" className="gap-2 text-xs">
            <Globe className="h-3.5 w-3.5 text-blue-400" /> PayPal Global
          </TabsTrigger>
          <TabsTrigger value="razorpay" className="gap-2 text-xs">
            <Zap className="h-3.5 w-3.5 text-sky-400" /> Razorpay
          </TabsTrigger>
          <TabsTrigger value="instapay" className="gap-2 text-xs">
            <Smartphone className="h-3.5 w-3.5 text-violet-400" /> InstaPay
          </TabsTrigger>
          <TabsTrigger value="esewa" className="gap-2 text-xs">
            <Zap className="h-3.5 w-3.5 text-emerald-400" /> eSewa & Aggregator
          </TabsTrigger>
          <TabsTrigger value="twilio" className="gap-2 text-xs">
            <PhoneCall className="h-3.5 w-3.5 text-rose-400" /> Twilio (SMS & Voice)
          </TabsTrigger>
        </TabsList>

        {/* ================= STRIPE & WALLETS ================= */}
        <TabsContent value="stripe" className="space-y-5">
          <div className="flex items-center justify-between p-4 rounded-xl border border-indigo-500/20 bg-indigo-950/20">
            <div>
              <div className="flex items-center gap-2">
                <Label className="text-base font-bold text-white">Stripe Express & Card Payments</Label>
                <Badge className={gateways.stripe.enabled ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-800 text-slate-400"}>
                  {gateways.stripe.enabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Enables Visa, MasterCard, American Express, Apple Pay, Google Pay, and Link checkout.
              </p>
            </div>
            <Switch
              checked={gateways.stripe.enabled}
              onCheckedChange={(enabled) =>
                setGateways(prev => ({ ...prev, stripe: { ...prev.stripe, enabled } }))
              }
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs">Publishable Key</Label>
              <Input
                placeholder="pk_live_... or pk_test_..."
                value={gateways.stripe.publishableKey}
                onChange={(e) =>
                  setGateways(prev => ({ ...prev, stripe: { ...prev.stripe, publishableKey: e.target.value } }))
                }
                className="bg-slate-950 border-slate-800 text-xs font-mono"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Secret Key</Label>
                <button
                  type="button"
                  onClick={() => toggleSecret("stripeSecret")}
                  className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
                >
                  {showSecrets.stripeSecret ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  {showSecrets.stripeSecret ? "Hide" : "Show"}
                </button>
              </div>
              <Input
                type={showSecrets.stripeSecret ? "text" : "password"}
                placeholder="sk_live_... or sk_test_..."
                value={gateways.stripe.secretKey}
                onChange={(e) =>
                  setGateways(prev => ({ ...prev, stripe: { ...prev.stripe, secretKey: e.target.value } }))
                }
                className="bg-slate-950 border-slate-800 text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label className="text-xs">Webhook Signing Secret</Label>
              <Input
                placeholder="whsec_..."
                value={gateways.stripe.webhookSecret}
                onChange={(e) =>
                  setGateways(prev => ({ ...prev, stripe: { ...prev.stripe, webhookSecret: e.target.value } }))
                }
                className="bg-slate-950 border-slate-800 text-xs font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Default Currency</Label>
              <Input
                placeholder="USD, NPR, EUR, GBP"
                value={gateways.stripe.currency}
                onChange={(e) =>
                  setGateways(prev => ({ ...prev, stripe: { ...prev.stripe, currency: e.target.value.toUpperCase() } }))
                }
                className="bg-slate-950 border-slate-800 text-xs uppercase"
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950 p-3">
              <div>
                <Label className="text-xs">Test Mode (Sandbox)</Label>
                <p className="text-[10px] text-slate-500">Process test cards</p>
              </div>
              <Switch
                checked={gateways.stripe.testMode}
                onCheckedChange={(testMode) =>
                  setGateways(prev => ({ ...prev, stripe: { ...prev.stripe, testMode } }))
                }
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <a
              href="https://dashboard.stripe.com/apikeys"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-indigo-400 hover:underline flex items-center gap-1"
            >
              Get Stripe API Keys <ExternalLink className="h-3 w-3" />
            </a>
            <Button onClick={saveGlobalGateways} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Stripe Settings
            </Button>
          </div>
        </TabsContent>

        {/* ================= PAYPAL ================= */}
        <TabsContent value="paypal" className="space-y-5">
          <div className="flex items-center justify-between p-4 rounded-xl border border-blue-500/20 bg-blue-950/20">
            <div>
              <div className="flex items-center gap-2">
                <Label className="text-base font-bold text-white">PayPal Global Checkout</Label>
                <Badge className={gateways.paypal.enabled ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-800 text-slate-400"}>
                  {gateways.paypal.enabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                REST v2 Orders API with Smart Payment Buttons and PayPal credit/balance funding.
              </p>
            </div>
            <Switch
              checked={gateways.paypal.enabled}
              onCheckedChange={(enabled) =>
                setGateways(prev => ({ ...prev, paypal: { ...prev.paypal, enabled } }))
              }
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs">PayPal Client ID</Label>
              <Input
                placeholder="A...client_id"
                value={gateways.paypal.clientId}
                onChange={(e) =>
                  setGateways(prev => ({ ...prev, paypal: { ...prev.paypal, clientId: e.target.value } }))
                }
                className="bg-slate-950 border-slate-800 text-xs font-mono"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">PayPal Client Secret</Label>
                <button
                  type="button"
                  onClick={() => toggleSecret("paypalSecret")}
                  className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
                >
                  {showSecrets.paypalSecret ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  {showSecrets.paypalSecret ? "Hide" : "Show"}
                </button>
              </div>
              <Input
                type={showSecrets.paypalSecret ? "text" : "password"}
                placeholder="E...client_secret"
                value={gateways.paypal.clientSecret}
                onChange={(e) =>
                  setGateways(prev => ({ ...prev, paypal: { ...prev.paypal, clientSecret: e.target.value } }))
                }
                className="bg-slate-950 border-slate-800 text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs">Environment Mode</Label>
              <select
                value={gateways.paypal.mode}
                onChange={(e) =>
                  setGateways(prev => ({ ...prev, paypal: { ...prev.paypal, mode: e.target.value as any } }))
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-md p-2 text-xs text-white"
              >
                <option value="sandbox">Sandbox (Testing)</option>
                <option value="live">Live (Production)</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Currency</Label>
              <Input
                placeholder="USD, EUR, GBP"
                value={gateways.paypal.currency}
                onChange={(e) =>
                  setGateways(prev => ({ ...prev, paypal: { ...prev.paypal, currency: e.target.value.toUpperCase() } }))
                }
                className="bg-slate-950 border-slate-800 text-xs uppercase"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <a
              href="https://developer.paypal.com/dashboard/applications"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-blue-400 hover:underline flex items-center gap-1"
            >
              PayPal Developer Portal <ExternalLink className="h-3 w-3" />
            </a>
            <Button onClick={saveGlobalGateways} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save PayPal Settings
            </Button>
          </div>
        </TabsContent>

        {/* ================= RAZORPAY ================= */}
        <TabsContent value="razorpay" className="space-y-5">
          <div className="flex items-center justify-between p-4 rounded-xl border border-sky-500/20 bg-sky-950/20">
            <div>
              <div className="flex items-center gap-2">
                <Label className="text-base font-bold text-white">Razorpay Payments</Label>
                <Badge className={gateways.razorpay.enabled ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-800 text-slate-400"}>
                  {gateways.razorpay.enabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Support for UPI, RuPay, NetBanking, Cards and international transactions.
              </p>
            </div>
            <Switch
              checked={gateways.razorpay.enabled}
              onCheckedChange={(enabled) =>
                setGateways(prev => ({ ...prev, razorpay: { ...prev.razorpay, enabled } }))
              }
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs">Razorpay Key ID</Label>
              <Input
                placeholder="rzp_live_... or rzp_test_..."
                value={gateways.razorpay.keyId}
                onChange={(e) =>
                  setGateways(prev => ({ ...prev, razorpay: { ...prev.razorpay, keyId: e.target.value } }))
                }
                className="bg-slate-950 border-slate-800 text-xs font-mono"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Razorpay Key Secret</Label>
                <button
                  type="button"
                  onClick={() => toggleSecret("razorpaySecret")}
                  className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
                >
                  {showSecrets.razorpaySecret ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  {showSecrets.razorpaySecret ? "Hide" : "Show"}
                </button>
              </div>
              <Input
                type={showSecrets.razorpaySecret ? "text" : "password"}
                placeholder="Secret key"
                value={gateways.razorpay.keySecret}
                onChange={(e) =>
                  setGateways(prev => ({ ...prev, razorpay: { ...prev.razorpay, keySecret: e.target.value } }))
                }
                className="bg-slate-950 border-slate-800 text-xs font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <a
              href="https://dashboard.razorpay.com/app/keys"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-sky-400 hover:underline flex items-center gap-1"
            >
              Razorpay API Keys <ExternalLink className="h-3 w-3" />
            </a>
            <Button onClick={saveGlobalGateways} disabled={saving} className="bg-sky-600 hover:bg-sky-700 text-white gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Razorpay Settings
            </Button>
          </div>
        </TabsContent>

        {/* ================= INSTAPAY ================= */}
        <TabsContent value="instapay" className="space-y-5">
          <div className="flex items-center justify-between p-4 rounded-xl border border-violet-500/20 bg-violet-950/20">
            <div>
              <div className="flex items-center gap-2">
                <Label className="text-base font-bold text-white">InstaPay Real-Time Transfers</Label>
                <Badge className={gateways.instapay.enabled ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-800 text-slate-400"}>
                  {gateways.instapay.enabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Instant payment network for mobile wallets, bank accounts, and QR payments.
              </p>
            </div>
            <Switch
              checked={gateways.instapay.enabled}
              onCheckedChange={(enabled) =>
                setGateways(prev => ({ ...prev, instapay: { ...prev.instapay, enabled } }))
              }
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs">Merchant ID</Label>
              <Input
                placeholder="Merchant code / ID"
                value={gateways.instapay.merchantId}
                onChange={(e) =>
                  setGateways(prev => ({ ...prev, instapay: { ...prev.instapay, merchantId: e.target.value } }))
                }
                className="bg-slate-950 border-slate-800 text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">API Secret Key</Label>
              <Input
                type="password"
                placeholder="API Key"
                value={gateways.instapay.apiKey}
                onChange={(e) =>
                  setGateways(prev => ({ ...prev, instapay: { ...prev.instapay, apiKey: e.target.value } }))
                }
                className="bg-slate-950 border-slate-800 text-xs font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-end pt-2">
            <Button onClick={saveGlobalGateways} disabled={saving} className="bg-violet-600 hover:bg-violet-700 text-white gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save InstaPay Settings
            </Button>
          </div>
        </TabsContent>

        {/* ================= ESEWA & EXTERNAL PAYMENT ================= */}
        <TabsContent value="esewa" className="space-y-5">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950 p-4">
              <div>
                <Label>Token Payment API</Label>
                <p className="text-xs text-muted-foreground">Inbound access-token, customer inquiry, and recharge APIs</p>
              </div>
              <Switch
                checked={esewaConfig.tokenEnabled}
                onCheckedChange={(tokenEnabled) => setEsewaConfig(prev => ({ ...prev, tokenEnabled }))}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950 p-4">
              <div>
                <Label>ePay v2 Gateway</Label>
                <p className="text-xs text-muted-foreground">Customer-dashboard redirect renewal portal</p>
              </div>
              <Switch
                checked={esewaConfig.epayEnabled}
                onCheckedChange={(epayEnabled) => setEsewaConfig(prev => ({ ...prev, epayEnabled }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Token API Username</Label>
            <Input
              value={esewaConfig.username}
              onChange={(e) => setEsewaConfig(prev => ({ ...prev, username: e.target.value }))}
              className="bg-slate-950 border-slate-800"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>eSewa Password</Label>
              <Input
                type="password"
                autoComplete="new-password"
                value={esewaCredentials.password}
                onChange={(e) => setEsewaCredentials(prev => ({ ...prev, password: e.target.value }))}
                placeholder={esewaConfig.passwordConfigured ? "Configured - leave blank to keep" : "Minimum 8 characters"}
                className="bg-slate-950 border-slate-800"
              />
            </div>
            <div className="space-y-2">
              <Label>eSewa Client Secret</Label>
              <Input
                type="password"
                autoComplete="new-password"
                value={esewaCredentials.clientSecret}
                onChange={(e) => setEsewaCredentials(prev => ({ ...prev, clientSecret: e.target.value }))}
                placeholder={esewaConfig.clientSecretConfigured ? "Configured - leave blank to keep" : "32-64 characters"}
                className="bg-slate-950 border-slate-800"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={saveEsewa} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save eSewa Configuration
            </Button>
            <Button variant="outline" onClick={generateEsewa} disabled={encoding} className="gap-2 border-slate-800">
              {encoding ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
              Generate Base64 Values
            </Button>
          </div>

          {(esewaEncoded.passwordBase64 || esewaEncoded.clientSecretBase64) && (
            <div className="grid gap-4 md:grid-cols-2 pt-2">
              {[
                ["REPLACE_WITH_BASE64_PASSWORD", esewaEncoded.passwordBase64],
                ["REPLACE_WITH_BASE64_CLIENT_SECRET", esewaEncoded.clientSecretBase64]
              ].map(([lbl, val]) => (
                <div key={lbl} className="space-y-2">
                  <Label className="text-xs">{lbl}</Label>
                  <div className="flex gap-2">
                    <Input value={val} readOnly className="font-mono text-xs bg-slate-950 border-slate-800" />
                    <Button variant="outline" size="icon" onClick={() => copy(val, lbl)} className="border-slate-800">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ================= TWILIO (SMS & CALLS) ================= */}
        <TabsContent value="twilio" className="space-y-5">
          <div className="flex items-center justify-between p-4 rounded-xl border border-rose-500/20 bg-rose-950/20">
            <div>
              <div className="flex items-center gap-2">
                <Label className="text-base font-bold text-white">Twilio Programmable Communications</Label>
                <Badge className={twilioConfig.enabled ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-800 text-slate-400"}>
                  {twilioConfig.enabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Official Twilio Messages API for SMS notifications, OTP, and Voice Calls API.
              </p>
            </div>
            <Switch
              checked={twilioConfig.enabled}
              onCheckedChange={(enabled) =>
                setTwilioConfig(prev => ({ ...prev, enabled }))
              }
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs">Account SID</Label>
              <Input
                placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                value={twilioConfig.accountSid}
                onChange={(e) => setTwilioConfig(prev => ({ ...prev, accountSid: e.target.value }))}
                className="bg-slate-950 border-slate-800 text-xs font-mono"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Auth Token</Label>
                <button
                  type="button"
                  onClick={() => toggleSecret("twilioAuth")}
                  className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
                >
                  {showSecrets.twilioAuth ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  {showSecrets.twilioAuth ? "Hide" : "Show"}
                </button>
              </div>
              <Input
                type={showSecrets.twilioAuth ? "text" : "password"}
                placeholder="Twilio Auth Token"
                value={twilioConfig.authToken}
                onChange={(e) => setTwilioConfig(prev => ({ ...prev, authToken: e.target.value }))}
                className="bg-slate-950 border-slate-800 text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs">From Phone Number</Label>
              <Input
                placeholder="+1234567890"
                value={twilioConfig.fromNumber}
                onChange={(e) => setTwilioConfig(prev => ({ ...prev, fromNumber: e.target.value }))}
                className="bg-slate-950 border-slate-800 text-xs font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Messaging Service SID (Optional)</Label>
              <Input
                placeholder="MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                value={twilioConfig.messagingServiceSid}
                onChange={(e) => setTwilioConfig(prev => ({ ...prev, messagingServiceSid: e.target.value }))}
                className="bg-slate-950 border-slate-800 text-xs font-mono"
              />
            </div>
          </div>

          {/* Test SMS box */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <Label className="text-xs text-slate-300 font-semibold">Test Twilio Outbound SMS</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Receiver phone number (e.g. +9779800000000)"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                className="bg-slate-900 border-slate-800 text-xs"
              />
              <Button
                variant="outline"
                onClick={testTwilioSms}
                disabled={testingTwilio || !twilioConfig.enabled}
                className="shrink-0 gap-1 border-slate-700 text-xs"
              >
                {testingTwilio ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                Send Test SMS
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <a
              href="https://console.twilio.com"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-rose-400 hover:underline flex items-center gap-1"
            >
              Twilio Console <ExternalLink className="h-3 w-3" />
            </a>
            <Button onClick={saveTwilioConfig} disabled={saving} className="bg-rose-600 hover:bg-rose-700 text-white gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Twilio Settings
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </CardContainer>
  )
}
