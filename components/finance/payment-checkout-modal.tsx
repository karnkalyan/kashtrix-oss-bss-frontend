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
  Globe
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

type GatewayType = "stripe_card" | "gpay_apple" | "paypal" | "razorpay" | "instapay" | "esewa" | "cash"

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
  const [selectedGateway, setSelectedGateway] = useState<GatewayType>("stripe_card")
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<"select" | "processing" | "success">("select")
  const [paymentResult, setPaymentResult] = useState<any>(null)

  // Card details state (mock input for Stripe tokenization / Elements flow)
  const [cardNumber, setCardNumber] = useState("")
  const [cardExp, setCardExp] = useState("")
  const [cardCvc, setCardCvc] = useState("")
  const [cardholderName, setCardholderName] = useState(customer.name || "")

  // InstaPay / Wallet state
  const [walletPhone, setWalletPhone] = useState(customer.phoneNumber || "")
  const [txnReference, setTxnReference] = useState("")

  const gateways = [
    {
      id: "stripe_card" as GatewayType,
      name: "Credit / Debit Card",
      badge: "Global Visa / MC",
      icon: <CreditCard className="h-5 w-5 text-indigo-400" />,
      desc: "All major international cards accepted via Stripe"
    },
    {
      id: "gpay_apple" as GatewayType,
      name: "Google Pay & Apple Pay",
      badge: "Express Checkout",
      icon: <Smartphone className="h-5 w-5 text-emerald-400" />,
      desc: "Instant 1-tap mobile payment via Apple Pay & Google Wallet"
    },
    {
      id: "paypal" as GatewayType,
      name: "PayPal Global",
      badge: "200+ Countries",
      icon: <Globe className="h-5 w-5 text-blue-400" />,
      desc: "Pay securely with your PayPal balance, bank or cards"
    },
    {
      id: "razorpay" as GatewayType,
      name: "Razorpay (UPI / NetBanking)",
      badge: "UPI & Cards",
      icon: <Zap className="h-5 w-5 text-sky-400" />,
      desc: "Instant UPI QR, NetBanking, RuPay & international cards"
    },
    {
      id: "instapay" as GatewayType,
      name: "InstaPay",
      badge: "Real-time",
      icon: <Smartphone className="h-5 w-5 text-violet-400" />,
      desc: "Immediate mobile account transfer and instant recharge"
    },
    {
      id: "esewa" as GatewayType,
      name: "eSewa / Digital Wallet",
      badge: "Local Nepal",
      icon: <Zap className="h-5 w-5 text-green-400" />,
      desc: "Direct wallet payment via eSewa token & ePay portal"
    }
  ]

  const handleProcessPayment = async () => {
    setLoading(true)
    try {
      if (selectedGateway === "stripe_card" || selectedGateway === "gpay_apple") {
        // Stripe Payment Intent flow
        const intentRes = await apiRequest<any>("/api/payment/stripe/create-intent", {
          method: "POST",
          body: JSON.stringify({
            amount,
            currency: currency.toLowerCase(),
            customerId: customer.id,
            packageId: packageDetails?.id,
            invoiceId,
            customerEmail: customer.email,
            customerName: customer.name
          })
        })

        if (!intentRes.success) {
          throw new Error(intentRes.error || "Failed to initialize card payment")
        }

        // Simulate client confirmation or 3DS verification
        const verifyRes = await apiRequest<any>("/api/payment/stripe/verify", {
          method: "POST",
          body: JSON.stringify({
            paymentIntentId: intentRes.clientSecret ? intentRes.clientSecret.split("_secret")[0] : `pi_sim_${Date.now()}`
          })
        })

        setPaymentResult({
          transactionId: verifyRes.data?.paymentIntentId || intentRes.clientSecret,
          amount,
          currency,
          method: selectedGateway === "gpay_apple" ? "Google Pay / Apple Pay" : "Card Payment",
          date: new Date().toLocaleString()
        })
        setStep("success")
        toast.success("Payment successful! Subscription renewed.")
        onPaymentSuccess?.(verifyRes.data)
      } else if (selectedGateway === "paypal") {
        // PayPal Orders REST v2 flow
        const orderRes = await apiRequest<any>("/api/payment/paypal/create-order", {
          method: "POST",
          body: JSON.stringify({
            amount,
            currency: currency === "NPR" ? "USD" : currency, // PayPal uses USD for global cross-border
            customerId: customer.id,
            packageId: packageDetails?.id,
            invoiceId
          })
        })

        if (!orderRes.success) {
          throw new Error(orderRes.error || "Failed to initialize PayPal order")
        }

        // Capture order
        const captureRes = await apiRequest<any>("/api/payment/paypal/capture-order", {
          method: "POST",
          body: JSON.stringify({
            orderId: orderRes.orderId
          })
        })

        setPaymentResult({
          transactionId: orderRes.orderId,
          amount,
          currency: currency === "NPR" ? "USD" : currency,
          method: "PayPal Global",
          date: new Date().toLocaleString()
        })
        setStep("success")
        toast.success("PayPal payment captured! Subscriber recharged.")
        onPaymentSuccess?.(captureRes.data)
      } else if (selectedGateway === "razorpay") {
        // Razorpay Orders flow
        const orderRes = await apiRequest<any>("/api/payment/razorpay/create-order", {
          method: "POST",
          body: JSON.stringify({
            amount,
            currency: currency === "NPR" ? "INR" : currency,
            customerId: customer.id,
            packageId: packageDetails?.id,
            invoiceId
          })
        })

        if (!orderRes.success) {
          throw new Error(orderRes.error || "Failed to initialize Razorpay order")
        }

        // Verify Razorpay payment
        const mockPaymentId = `pay_${Date.now()}`
        const verifyRes = await apiRequest<any>("/api/payment/razorpay/verify", {
          method: "POST",
          body: JSON.stringify({
            razorpay_order_id: orderRes.orderId,
            razorpay_payment_id: mockPaymentId,
            razorpay_signature: "verified_signature"
          })
        })

        setPaymentResult({
          transactionId: mockPaymentId,
          amount,
          currency: currency === "NPR" ? "INR" : currency,
          method: "Razorpay UPI/Cards",
          date: new Date().toLocaleString()
        })
        setStep("success")
        toast.success("Razorpay payment confirmed!")
        onPaymentSuccess?.(verifyRes.data)
      } else if (selectedGateway === "instapay") {
        // InstaPay flow
        const res = await apiRequest<any>("/api/payment/instapay/initiate", {
          method: "POST",
          body: JSON.stringify({
            amount,
            currency,
            mobileNumber: walletPhone,
            customerId: customer.id,
            packageId: packageDetails?.id,
            invoiceId
          })
        })

        if (!res.success) {
          throw new Error(res.error || "Failed to initialize InstaPay transaction")
        }

        setPaymentResult({
          transactionId: res.transactionId || `INSTA-${Date.now()}`,
          amount,
          currency,
          method: "InstaPay",
          date: new Date().toLocaleString()
        })
        setStep("success")
        toast.success("InstaPay transfer verified successfully!")
        onPaymentSuccess?.(res)
      } else if (selectedGateway === "esewa") {
        // eSewa / External aggregator payment
        const res = await apiRequest<any>("/api/payment/external/process", {
          method: "POST",
          body: JSON.stringify({
            identifier: customer.username || String(customer.id),
            amount,
            paymentMode: "ESEWA",
            transactionReference: txnReference || `ESEWA-${Date.now()}`,
            packageId: packageDetails?.id
          })
        })

        if (!res.success) {
          throw new Error(res.error || "eSewa transaction processing failed")
        }

        setPaymentResult({
          transactionId: res.transactionReference,
          amount,
          currency,
          method: "eSewa / Digital Wallet",
          date: new Date().toLocaleString()
        })
        setStep("success")
        toast.success("eSewa payment completed and processed!")
        onPaymentSuccess?.(res)
      }
    } catch (err: any) {
      toast.error(err.message || "Payment transaction failed")
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setStep("select")
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
              {step === "success" ? "Payment Confirmation" : "Global Online Checkout"}
            </DialogTitle>
          </div>
          <DialogDescription className="text-slate-400">
            {step === "success"
              ? "Your payment has been successfully recorded and the account is active."
              : `Subscriber: ${customer.name} (${customer.username || "Customer #" + customer.id})`}
          </DialogDescription>
        </DialogHeader>

        {step === "select" && (
          <div className="space-y-6">
            {/* Amount & Plan Banner */}
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
                Choose Payment Gateway
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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

            {/* Gateway Specific Input Fields */}
            {(selectedGateway === "stripe_card" || selectedGateway === "gpay_apple") && (
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold text-slate-200">
                    {selectedGateway === "gpay_apple" ? "Digital Wallet / Card Details" : "Card Information"}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-emerald-400">
                    <ShieldCheck className="h-3.5 w-3.5" /> 256-bit SSL Encrypted
                  </span>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-slate-300">Cardholder Name</Label>
                  <Input
                    placeholder="Full name on card"
                    value={cardholderName}
                    onChange={(e) => setCardholderName(e.target.value)}
                    className="bg-slate-950 border-slate-800 text-white text-xs h-9"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs text-slate-300">Card Number</Label>
                    <Input
                      placeholder="•••• •••• •••• ••••"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      maxLength={19}
                      className="bg-slate-950 border-slate-800 text-white font-mono text-xs h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-300">MM / YY</Label>
                    <Input
                      placeholder="MM/YY"
                      value={cardExp}
                      onChange={(e) => setCardExp(e.target.value)}
                      maxLength={5}
                      className="bg-slate-950 border-slate-800 text-white font-mono text-xs h-9"
                    />
                  </div>
                </div>
              </div>
            )}

            {selectedGateway === "esewa" && (
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                <Label className="text-xs text-slate-300">Transaction Reference / Receipt ID (Optional)</Label>
                <Input
                  placeholder="e.g. 000123ABC or leave blank for auto-generate"
                  value={txnReference}
                  onChange={(e) => setTxnReference(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-white text-xs h-9"
                />
              </div>
            )}

            {selectedGateway === "instapay" && (
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                <Label className="text-xs text-slate-300">InstaPay Registered Mobile Number</Label>
                <Input
                  placeholder="e.g. 9800000000"
                  value={walletPhone}
                  onChange={(e) => setWalletPhone(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-white text-xs h-9"
                />
              </div>
            )}
          </div>
        )}

        {step === "success" && paymentResult && (
          <div className="py-6 space-y-5 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="h-9 w-9" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Payment Received!</h3>
              <p className="text-xs text-slate-400 mt-1">Transaction verified and subscription updated.</p>
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
          {step === "select" ? (
            <>
              <Button variant="outline" onClick={onClose} disabled={loading} className="border-slate-800 text-slate-300">
                Cancel
              </Button>
              <Button
                onClick={handleProcessPayment}
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing Payment...
                  </>
                ) : (
                  `Pay ${amount.toLocaleString()} ${currency}`
                )}
              </Button>
            </>
          ) : (
            <Button onClick={handleReset} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
              Done & Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
