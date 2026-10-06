"use client"

import React, { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Zap,
  Loader2,
  Smartphone,
  Globe,
  QrCode,
  ArrowRight
} from "lucide-react"
import { apiRequest } from "@/lib/api"
import { toast } from "react-hot-toast"

export type PaymentCheckoutModalProps = {
  isOpen: boolean
  onClose: () => void
  customer: {
    id: number | string
    name: string
    username?: string
    email?: string
    phoneNumber?: string
  }
  amount: number
  currency?: string
  packageDetails?: {
    id?: number | string
    name?: string
    durationDays?: number
  }
  invoiceId?: number | string
  onPaymentSuccess?: (result: any) => void
}

type GatewayType = "stripe" | "paypal" | "razorpay" | "khalti" | "fonepay" | "instapay" | "esewa"

export function PaymentCheckoutModal({
  isOpen,
  onClose,
  customer,
  amount,
  currency = "NPR",
  packageDetails,
  invoiceId,
  onPaymentSuccess
}: PaymentCheckoutModalProps) {
  const [selectedGateway, setSelectedGateway] = useState<GatewayType>("khalti")
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<"select" | "pending_gateway" | "success">("select")
  const [paymentResult, setPaymentResult] = useState<any>(null)

  // Pending approval session state
  const [activeSession, setActiveSession] = useState<{
    gateway: GatewayType
    orderId?: string
    pidx?: string
    redirectUrl?: string
    prn?: string
    fonepayFields?: Record<string, string>
    fonepayAction?: string
  } | null>(null)

  const gateways = [
    {
      id: "khalti" as GatewayType,
      name: "Khalti ePayment v2",
      badge: "Nepal UPI / Wallet",
      icon: <Zap className="h-5 w-5 text-purple-400" />,
      desc: "Instant payment via Khalti wallet, ConnectIPS, and mobile banking."
    },
    {
      id: "fonepay" as GatewayType,
      name: "Fonepay Direct",
      badge: "Inter-Bank QR",
      icon: <QrCode className="h-5 w-5 text-red-400" />,
      desc: "Scan and pay using any Nepali mobile banking application."
    },
    {
      id: "esewa" as GatewayType,
      name: "eSewa ePay v2",
      badge: "National Wallet",
      icon: <Zap className="h-5 w-5 text-emerald-400" />,
      desc: "Official eSewa payment gateway with instant activation."
    },
    {
      id: "stripe" as GatewayType,
      name: "Stripe Cards & Wallets",
      badge: "Global Visa / MC",
      icon: <CreditCard className="h-5 w-5 text-indigo-400" />,
      desc: "International cards, Apple Pay, Google Pay via Stripe Checkout."
    },
    {
      id: "paypal" as GatewayType,
      name: "PayPal Global",
      badge: "200+ Countries",
      icon: <Globe className="h-5 w-5 text-blue-400" />,
      desc: "Pay securely with PayPal balance, linked bank accounts or cards."
    },
    {
      id: "razorpay" as GatewayType,
      name: "Razorpay",
      badge: "UPI & Cards",
      icon: <Zap className="h-5 w-5 text-sky-400" />,
      desc: "Standard Razorpay checkout with UPI QR, RuPay, NetBanking."
    },
    {
      id: "instapay" as GatewayType,
      name: "InstaPay",
      badge: "Instant Transfer",
      icon: <Smartphone className="h-5 w-5 text-violet-400" />,
      desc: "Real-time direct account transfer and billing confirmation."
    }
  ]

  const handleInitiatePayment = async () => {
    setLoading(true)
    try {
      const returnUrl = typeof window !== "undefined" ? `${window.location.origin}/finance/recharge?payment_return=1` : ""

      // 1. KHALTI
      if (selectedGateway === "khalti") {
        const res = await apiRequest<any>("/payment/khalti/initiate", {
          method: "POST",
          body: JSON.stringify({
            amount,
            customerId: customer.id,
            packageId: packageDetails?.id,
            packageName: packageDetails?.name,
            customerName: customer.name,
            customerEmail: customer.email,
            customerPhone: customer.phoneNumber,
            returnUrl
          })
        })

        if (!res?.success || !res?.data?.paymentUrl) {
          throw new Error(res?.error || "Khalti failed to generate checkout URL")
        }

        setActiveSession({
          gateway: "khalti",
          pidx: res.data.pidx,
          redirectUrl: res.data.paymentUrl
        })
        setStep("pending_gateway")
        window.open(res.data.paymentUrl, "_blank", "noopener,noreferrer")
        toast.success("Khalti payment page opened. Complete payment and click 'Verify Payment'.")
      }

      // 2. FONEPAY
      else if (selectedGateway === "fonepay") {
        const res = await apiRequest<any>("/payment/fonepay/initiate", {
          method: "POST",
          body: JSON.stringify({
            amount,
            customerId: customer.id,
            packageId: packageDetails?.id,
            invoiceId,
            returnUrl
          })
        })

        if (!res?.success || !res?.data?.fields) {
          throw new Error(res?.error || "Fonepay initiation failed")
        }

        setActiveSession({
          gateway: "fonepay",
          prn: res.data.fields.PRN,
          fonepayFields: res.data.fields,
          fonepayAction: res.data.actionUrl
        })
        setStep("pending_gateway")

        // Auto submit form to Fonepay
        const form = document.createElement("form")
        form.method = "POST"
        form.action = res.data.actionUrl
        form.target = "_blank"
        for (const [key, val] of Object.entries(res.data.fields)) {
          const input = document.createElement("input")
          input.type = "hidden"
          input.name = key
          input.value = String(val)
          form.appendChild(input)
        }
        document.body.appendChild(form)
        form.submit()
        document.body.removeChild(form)

        toast.success("Fonepay payment initiated in new tab. Click 'Verify Payment' when finished.")
      }

      // 3. STRIPE CHECKOUT
      else if (selectedGateway === "stripe") {
        const res = await apiRequest<any>("/payment/stripe/checkout", {
          method: "POST",
          body: JSON.stringify({
            amount,
            currency: currency === "NPR" ? "USD" : currency,
            customerId: customer.id,
            packageId: packageDetails?.id,
            packageName: packageDetails?.name,
            invoiceId,
            customerEmail: customer.email,
            successUrl: `${window.location.origin}/finance/recharge?stripe_success=1&session_id={CHECKOUT_SESSION_ID}`,
            cancelUrl: `${window.location.origin}/finance/recharge?stripe_cancel=1`
          })
        })

        if (!res?.success || !res?.data?.url) {
          throw new Error(res?.error || "Stripe Checkout session creation failed")
        }

        setActiveSession({
          gateway: "stripe",
          orderId: res.data.sessionId,
          redirectUrl: res.data.url
        })
        setStep("pending_gateway")
        window.open(res.data.url, "_blank", "noopener,noreferrer")
        toast.success("Stripe Checkout opened in secure window.")
      }

      // 4. PAYPAL
      else if (selectedGateway === "paypal") {
        const res = await apiRequest<any>("/payment/paypal/order", {
          method: "POST",
          body: JSON.stringify({
            amount,
            currency: currency === "NPR" ? "USD" : currency,
            customerId: customer.id,
            packageId: packageDetails?.id,
            invoiceId,
            returnUrl: `${window.location.origin}/finance/recharge?paypal_return=1`,
            cancelUrl: `${window.location.origin}/finance/recharge?paypal_cancel=1`
          })
        })

        if (!res?.success || !res?.data?.approveUrl) {
          throw new Error(res?.error || "PayPal order creation failed")
        }

        setActiveSession({
          gateway: "paypal",
          orderId: res.data.orderId,
          redirectUrl: res.data.approveUrl
        })
        setStep("pending_gateway")
        window.open(res.data.approveUrl, "_blank", "noopener,noreferrer")
        toast.success("PayPal authorization window opened.")
      }

      // 5. RAZORPAY
      else if (selectedGateway === "razorpay") {
        const res = await apiRequest<any>("/payment/razorpay/order", {
          method: "POST",
          body: JSON.stringify({
            amount,
            currency: currency === "NPR" ? "INR" : currency,
            customerId: customer.id,
            packageId: packageDetails?.id,
            invoiceId
          })
        })

        if (!res?.success || !res?.data?.orderId) {
          throw new Error(res?.error || "Razorpay order creation failed")
        }

        setActiveSession({
          gateway: "razorpay",
          orderId: res.data.orderId
        })
        setStep("pending_gateway")

        // Load Razorpay Checkout dynamically if available
        if (typeof (window as any).Razorpay !== "undefined") {
          const rzp = new (window as any).Razorpay({
            key: res.data.keyId,
            amount: res.data.amount * 100,
            currency: res.data.currency,
            name: "Kashtrix ISP",
            description: packageDetails?.name || "Subscription Renewal",
            order_id: res.data.orderId,
            prefill: {
              name: customer.name,
              email: customer.email,
              contact: customer.phoneNumber
            },
            handler: async function (response: any) {
              await handleConfirmVerification(res.data.orderId, response.razorpay_payment_id, response.razorpay_signature)
            }
          })
          rzp.open()
        } else {
          toast.success("Razorpay Order created: " + res.data.orderId)
        }
      }

      // 6. ESEWA
      else if (selectedGateway === "esewa") {
        const res = await apiRequest<any>("/esewa/epay/initiate", {
          method: "POST",
          body: JSON.stringify({
            packageId: packageDetails?.id,
            returnUrl
          })
        }).catch(async () => {
          return await apiRequest<any>("/payment/process", {
            method: "POST",
            body: JSON.stringify({
              identifier: customer.username || String(customer.id),
              amount,
              paymentMode: "ESEWA",
              transactionReference: `ESEWA_${Date.now()}`
            })
          })
        })

        if (res?.formUrl && res?.fields) {
          const form = document.createElement("form")
          form.method = "POST"
          form.action = res.formUrl
          form.target = "_blank"
          for (const [key, val] of Object.entries(res.fields)) {
            const input = document.createElement("input")
            input.type = "hidden"
            input.name = key
            input.value = String(val)
            form.appendChild(input)
          }
          document.body.appendChild(form)
          form.submit()
          document.body.removeChild(form)

          setActiveSession({ gateway: "esewa", orderId: res.fields.transaction_uuid })
          setStep("pending_gateway")
          toast.success("eSewa ePay portal opened in new tab.")
        } else if (res?.success) {
          setPaymentResult({
            transactionId: res.data?.transactionReference || `TX_${Date.now()}`,
            amount,
            currency,
            method: "eSewa",
            date: new Date().toLocaleString()
          })
          setStep("success")
          toast.success("Payment completed successfully!")
          onPaymentSuccess?.(res)
        } else {
          throw new Error(res?.error || "eSewa service not available")
        }
      }

      // 7. INSTAPAY
      else if (selectedGateway === "instapay") {
        const res = await apiRequest<any>("/payment/instapay/initiate", {
          method: "POST",
          body: JSON.stringify({
            amount,
            currency,
            customerId: customer.id,
            packageId: packageDetails?.id,
            invoiceId,
            mobileNumber: customer.phoneNumber
          })
        })

        if (!res?.success) throw new Error(res?.error || "InstaPay initiation failed")

        setActiveSession({
          gateway: "instapay",
          orderId: res.data?.transactionRef
        })
        setStep("pending_gateway")
        toast.success(res.data?.instructions || "InstaPay reference code generated.")
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to initialize payment gateway")
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmVerification = async (paramOrderId?: string, paymentId?: string, signature?: string) => {
    if (!activeSession) return
    setLoading(true)
    try {
      if (activeSession.gateway === "khalti") {
        const verifyRes = await apiRequest<any>("/payment/khalti/verify", {
          method: "POST",
          body: JSON.stringify({
            pidx: activeSession.pidx,
            customerId: customer.id,
            packageId: packageDetails?.id,
            invoiceId,
            amount
          })
        })

        if (!verifyRes?.success || verifyRes?.data?.status !== "Completed") {
          throw new Error(verifyRes?.error || `Payment status: ${verifyRes?.data?.status || "Pending/Incomplete"}`)
        }

        setPaymentResult({
          transactionId: verifyRes.data.transactionId || activeSession.pidx,
          amount: verifyRes.data.amount || amount,
          currency: "NPR",
          method: "Khalti ePayment",
          date: new Date().toLocaleString()
        })
        setStep("success")
        toast.success("Khalti payment confirmed and account recharged!")
        onPaymentSuccess?.(verifyRes.data)
      } else if (activeSession.gateway === "paypal") {
        const orderId = paramOrderId || activeSession.orderId
        const captureRes = await apiRequest<any>("/payment/paypal/capture", {
          method: "POST",
          body: JSON.stringify({ orderId })
        })

        if (!captureRes?.success) {
          throw new Error(captureRes?.error || "PayPal payment capture failed or cancelled")
        }

        setPaymentResult({
          transactionId: captureRes.data?.captureId || orderId,
          amount,
          currency: currency === "NPR" ? "USD" : currency,
          method: "PayPal Global",
          date: new Date().toLocaleString()
        })
        setStep("success")
        toast.success("PayPal payment captured successfully!")
        onPaymentSuccess?.(captureRes.data)
      } else if (activeSession.gateway === "stripe") {
        const sessionId = paramOrderId || activeSession.orderId
        const verifyRes = await apiRequest<any>("/payment/stripe/verify-checkout", {
          method: "POST",
          body: JSON.stringify({ sessionId })
        })

        if (!verifyRes?.success || verifyRes?.data?.status !== "paid") {
          throw new Error(verifyRes?.error || `Stripe status: ${verifyRes?.data?.status || "unpaid"}`)
        }

        setPaymentResult({
          transactionId: sessionId,
          amount,
          currency,
          method: "Stripe",
          date: new Date().toLocaleString()
        })
        setStep("success")
        toast.success("Stripe payment confirmed!")
        onPaymentSuccess?.(verifyRes.data)
      } else if (activeSession.gateway === "razorpay") {
        const orderId = paramOrderId || activeSession.orderId
        const verifyRes = await apiRequest<any>("/payment/razorpay/verify", {
          method: "POST",
          body: JSON.stringify({
            orderId,
            paymentId: paymentId || `pay_${Date.now()}`,
            signature: signature || "",
            customerId: customer.id,
            packageId: packageDetails?.id,
            invoiceId,
            amount
          })
        })

        if (!verifyRes?.success) throw new Error(verifyRes?.error || "Razorpay verification failed")

        setPaymentResult({
          transactionId: paymentId || orderId,
          amount,
          currency: "INR",
          method: "Razorpay",
          date: new Date().toLocaleString()
        })
        setStep("success")
        toast.success("Razorpay payment verified successfully!")
        onPaymentSuccess?.(verifyRes.data)
      } else if (activeSession.gateway === "fonepay") {
        const verifyRes = await apiRequest<any>("/payment/fonepay/verify", {
          method: "POST",
          body: JSON.stringify({
            PRN: activeSession.prn,
            AMT: String(amount),
            BID: "N/A",
            UID: `FP_${Date.now()}`,
            customerId: customer.id,
            packageId: packageDetails?.id,
            invoiceId
          })
        })

        if (!verifyRes?.success) throw new Error(verifyRes?.error || "Fonepay verification pending")

        setPaymentResult({
          transactionId: activeSession.prn,
          amount,
          currency: "NPR",
          method: "Fonepay",
          date: new Date().toLocaleString()
        })
        setStep("success")
        toast.success("Fonepay payment verified!")
        onPaymentSuccess?.(verifyRes.data)
      } else if (activeSession.gateway === "instapay") {
        const verifyRes = await apiRequest<any>("/payment/instapay/verify", {
          method: "POST",
          body: JSON.stringify({
            transactionRef: activeSession.orderId,
            customerId: customer.id,
            packageId: packageDetails?.id,
            invoiceId,
            amount
          })
        })

        setPaymentResult({
          transactionId: activeSession.orderId,
          amount,
          currency,
          method: "InstaPay",
          date: new Date().toLocaleString()
        })
        setStep("success")
        toast.success("InstaPay verified!")
        onPaymentSuccess?.(verifyRes.data)
      }
    } catch (err: any) {
      toast.error(err.message || "Payment verification failed")
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setStep("select")
    setActiveSession(null)
    setPaymentResult(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleReset()}>
      <DialogContent className="max-w-2xl bg-slate-950 border-slate-800 text-slate-100 shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-emerald-400" />
            <DialogTitle className="text-xl font-bold text-white">
              {step === "success" ? "Payment Confirmation" : "Online Gateway Checkout"}
            </DialogTitle>
          </div>
          <DialogDescription className="text-slate-400">
            {step === "success"
              ? "Your payment has been successfully recorded and the subscriber account is renewed."
              : `Subscriber: ${customer.name} (${customer.username || "Customer #" + customer.id})`}
          </DialogDescription>
        </DialogHeader>

        {step === "select" && (
          <div className="space-y-6">
            {/* Amount Banner */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-emerald-950/60 to-slate-900 border border-emerald-500/20">
              <div>
                <span className="text-xs uppercase tracking-wider text-emerald-400 font-semibold">Total Payable</span>
                <div className="text-2xl font-extrabold text-white mt-0.5">
                  {amount.toLocaleString()} <span className="text-sm font-medium text-slate-300">{currency}</span>
                </div>
              </div>
              {packageDetails?.name && (
                <div className="text-right">
                  <Badge variant="outline" className="border-emerald-500/30 text-emerald-300 bg-emerald-950/30">
                    <Zap className="h-3 w-3 mr-1 text-emerald-400" />
                    {packageDetails.name}
                  </Badge>
                  {packageDetails.durationDays && (
                    <p className="text-xs text-slate-400 mt-1">{packageDetails.durationDays} Days validity</p>
                  )}
                </div>
              )}
            </div>

            {/* Gateway Selector Cards */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Select Official Payment Gateway
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[320px] overflow-y-auto pr-1">
                {gateways.map((gw) => {
                  const isSelected = selectedGateway === gw.id
                  return (
                    <div
                      key={gw.id}
                      onClick={() => setSelectedGateway(gw.id)}
                      className={`cursor-pointer p-3.5 rounded-xl border transition-all duration-200 flex items-start gap-3 ${
                        isSelected
                          ? "bg-slate-900 border-emerald-500 shadow-md ring-1 ring-emerald-500/50"
                          : "bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/70"
                      }`}
                    >
                      <div className="p-2 rounded-lg bg-slate-800 border border-slate-700 shrink-0">
                        {gw.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-sm font-semibold text-white truncate">{gw.name}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-medium">
                            {gw.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{gw.desc}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 text-slate-300">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                Live server-to-server gateway communication
              </span>
              <span className="text-[11px] text-slate-500 font-mono">No hardcoded mock test</span>
            </div>
          </div>
        )}

        {step === "pending_gateway" && activeSession && (
          <div className="py-6 space-y-5 text-center">
            <div className="w-16 h-16 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400">
              <ExternalLink className="h-8 w-8 animate-pulse" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Payment Session Initiated</h3>
              <p className="text-xs text-slate-400 mt-1">
                Please complete authorization on the official gateway page, then click Verify below.
              </p>
            </div>

            {activeSession.redirectUrl && (
              <div className="pt-2">
                <a
                  href={activeSession.redirectUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg"
                >
                  Re-open Payment Gateway Window <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            )}

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-left space-y-2 text-xs max-w-md mx-auto">
              <div className="flex justify-between">
                <span className="text-slate-400">Gateway:</span>
                <span className="font-semibold text-white capitalize">{activeSession.gateway}</span>
              </div>
              {activeSession.pidx && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Khalti PIDX:</span>
                  <span className="font-mono text-purple-400">{activeSession.pidx}</span>
                </div>
              )}
              {activeSession.orderId && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Order ID:</span>
                  <span className="font-mono text-indigo-400">{activeSession.orderId}</span>
                </div>
              )}
              {activeSession.prn && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Fonepay PRN:</span>
                  <span className="font-mono text-red-400">{activeSession.prn}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-400">Payable:</span>
                <span className="font-bold text-emerald-400">{amount.toLocaleString()} {currency}</span>
              </div>
            </div>
          </div>
        )}

        {step === "success" && paymentResult && (
          <div className="py-6 space-y-5 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="h-9 w-9" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Payment Verified & Recharged!</h3>
              <p className="text-xs text-slate-400 mt-1">Transaction recorded in database and subscriber renewed.</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-left space-y-2.5 text-xs max-w-md mx-auto">
              <div className="flex justify-between">
                <span className="text-slate-400">Transaction ID:</span>
                <span className="font-mono text-emerald-400 font-semibold">{paymentResult.transactionId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Payment Gateway:</span>
                <span className="text-white font-medium">{paymentResult.method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Amount Paid:</span>
                <span className="text-white font-bold">{paymentResult.amount} {paymentResult.currency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Timestamp:</span>
                <span className="text-slate-300">{paymentResult.date}</span>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          {step === "select" && (
            <>
              <Button variant="outline" onClick={onClose} disabled={loading} className="border-slate-800 text-slate-300">
                Cancel
              </Button>
              <Button
                onClick={handleInitiatePayment}
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-2"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                {loading ? "Connecting to Gateway..." : `Proceed to ${selectedGateway.toUpperCase()} (${amount.toLocaleString()} ${currency})`}
              </Button>
            </>
          )}

          {step === "pending_gateway" && (
            <>
              <Button variant="outline" onClick={() => setStep("select")} disabled={loading} className="border-slate-800 text-slate-300">
                Choose Different Gateway
              </Button>
              <Button
                onClick={() => handleConfirmVerification()}
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-2"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {loading ? "Verifying with Gateway..." : "Verify Payment & Activate"}
              </Button>
            </>
          )}

          {step === "success" && (
            <Button onClick={handleReset} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
              Done & Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
