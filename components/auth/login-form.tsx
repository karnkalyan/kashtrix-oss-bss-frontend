"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Eye, EyeOff, Loader2, UserRound, AlertCircle } from "lucide-react"
import toast from "react-hot-toast"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CardContainer } from "@/components/ui/card-container"
import { Checkbox } from "@/components/ui/checkbox"
import { useTheme } from "next-themes"
import { useAuth } from "@/contexts/AuthContext"
import { apiRequest } from "@/lib/api"

const ROUTE_PERMISSIONS: Record<string, string | string[]> = {
  "/dashboard/overview": "dashboard_view",
  "/dashboard/real-time": "dashboard_view",
  "/admin/users": "users_read",
  "/admin/roles": "roles_read",
  "/admin/audit-log": "audit_log_read",
  "/customers": "customer_read",
  "/customers/all": "customer_read",
  "/customers/new": "customer_create",
  "/customer/dashboard": "dashboard_view",
  "/customer/router": "dashboard_view",
  "/customer/contact": "dashboard_view",
  "/customer/support": "dashboard_view",
  "/customer/billing": "dashboard_view",
  "/branch": "branches_read",
  "/department": "departments_read",
  "/membership": "membership_read",
  "/leads/create": "lead_create",
  "/leads": "lead_read",
  "/leads/qualified": "lead_read",
  "/leads/unqualified": "lead_read",
  "/leads/converted": "lead_read",
  "/leads/follow-ups": "lead_read",
  "/leads/import": "lead_create",
  "/leads/reports": "reports_read",
  "/existing-isp": "existingisp_read",
  "/sms-campaign": "services_manage",
  "/tr069": "olt_read",
  "/nas": "nas_read",
  "/nas/new": "nas_create",
  "/fiber/networks": "olt_read",
  "/fiber/map": "olt_read",
  "/fiber/olt": "olt_read",
  "/network/onts": "olt_read",
  "/network/onus": "olt_read",
  "/network/discovered-onus": "olt_read",
  "/monitoring": "dashboard_view",
  "/noc": "dashboard_view",
  "/technical-dashboard": "dashboard_view",
  "/inventory": "inventory_manage",
  "/inventory/add": "inventory_manage",
  "/inventory/bulk": "bulk_inventory_read",
  "/inventory/import": "inventory_manage",
  "/inventory/lifecycle": "inventory_read",
  "/vendors": "settings_read",
  "/drums": "drums_read",
  "/drums/assignments": "drums_read",
  "/services": "services_read",
  "/services/settings": "services_manage",
  "/services/add": "services_manage",
  "/nettv": "services_read",
  "/tshul": "services_read",
  "/nepurix": "services_read",
  "/radius": "services_read",
  "/services/aakashsms": "services_read",
  "/yeaster": "yeaster_read",
  "/asterisk": "asterisk_read",
  "/finance/invoices": "billing_read",
  "/finance/invoice-ranges": "billing_update",
  "/finance/recharge": "billing_read_self",
  "/finance/renew": "billing_read_self",
  "/finance/requests": "billing_read",
  "/tasks": "tasks_read_self",
  "/tickets": "tickets_read_self",
  "/tickets/create": "tickets_create",
  "/master-settings": "settings_read",
  "/dashboard/settings": "settings_read",
  "/reports": "reports_read",
  "/messages": "dashboard_view",
  "/mail": "dashboard_view",
  "/mail/templates": "settings_read",
  "/notifications": "dashboard_view",
  "/notices": "dashboard_view",
};

const getRequiredPermission = (path: string): string | string[] | undefined => {
  if (ROUTE_PERMISSIONS[path]) return ROUTE_PERMISSIONS[path];
  const sortedKeys = Object.keys(ROUTE_PERMISSIONS).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    if (path.startsWith(key)) {
      return ROUTE_PERMISSIONS[key];
    }
  }
  return undefined;
};

const checkPermissionForUser = (userObj: any, permission?: string | string[]): boolean => {
  if (!permission) return true;
  if (!userObj?.role?.permissions) return false;
  const userPermissions: string[] = userObj.role.permissions.map((p: any) => p.name);
  return Array.isArray(permission)
    ? permission.some(p => userPermissions.includes(p))
    : userPermissions.includes(permission);
};

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M21.8 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.5a4.7 4.7 0 0 1-2 3.1v2.6h3.3c1.9-1.8 3-4.4 3-7.5Z" />
      <path fill="#34A853" d="M12 22c2.7 0 5-0.9 6.7-2.4l-3.3-2.6c-.9.6-2.1 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3v2.7A10 10 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.4 13.9a6 6 0 0 1 0-3.8V7.4H3a10 10 0 0 0 0 9.2l3.4-2.7Z" />
      <path fill="#EA4335" d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.9-2.9A9.7 9.7 0 0 0 12 2a10 10 0 0 0-9 5.4l3.4 2.7C7.2 7.7 9.4 5.9 12 5.9Z" />
    </svg>
  )
}

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rememberMe, setRememberMe] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (typeof window !== "undefined") {
      const email = localStorage.getItem("remembered-email");
      const isRemembered = localStorage.getItem("remember-me") === "true";
      if (email && isRemembered) {
        setFormData(prev => ({ ...prev, email }));
        setRememberMe(true);
      }
    }
  }, []);
  const { resolvedTheme } = useTheme()
  const isDarkMode = resolvedTheme === "dark"

  const googleButtonRef = useRef<HTMLDivElement>(null)
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
  const { setUser } = useAuth()

  const handleAuthSuccess = (data: any) => {
    if (data.user) {
      setUser(data.user)
    }
    
    // Clear any stale branch context from previous sessions to prevent Access Denied errors
    if (typeof window !== "undefined") {
      localStorage.removeItem("selected-branch-id")
      
      // Save rememberMe configuration
      localStorage.setItem("remember-me", rememberMe ? "true" : "false")
      if (rememberMe && formData.email) {
        localStorage.setItem("remembered-email", formData.email)
      } else {
        localStorage.removeItem("remembered-email")
      }
    }
    
    toast.success("Signed in successfully!")
    
    // Role-based redirect
    const roleName = data.user?.role?.name?.toLowerCase() || ''
    let redirectPath = "/dashboard/overview"
    if (roleName === 'customer') {
      redirectPath = "/customer/dashboard"
    } else if (roleName.includes('field staff') || roleName.includes('field_staff')) {
      redirectPath = "/tasks"
    }

    // Redirect to from path if present and user has permission
    const fromPath = searchParams ? searchParams.get("from") : null
    if (fromPath) {
      const decodedFrom = decodeURIComponent(fromPath)
      // Check if not login/forgot-password to avoid loops
      if (decodedFrom && decodedFrom !== "/login" && decodedFrom !== "/forgot-password") {
        const reqPermission = getRequiredPermission(decodedFrom)
        if (checkPermissionForUser(data.user, reqPermission)) {
          redirectPath = decodedFrom
        }
      }
    }
    
    // Small delay to ensure cookies are settled before redirecting
    setTimeout(() => router.push(redirectPath), 150)
  }

  const handleAuthError = (err: any, toastId?: string) => {
    if (toastId) toast.dismiss(toastId)
    const message = err.message || "An unknown error occurred."
    toast.error(message)
    setError(message)
    setIsLoading(false)
  }

  const handleGoogleSignIn = async (credentialResponse: any) => {
    setIsLoading(true)
    setError(null)
    const toastId = toast.loading("Verifying with Google...")

    try {
      const data = await apiRequest("/auth/google", {
        method: "POST",
        body: JSON.stringify({ credential: credentialResponse.credential }),
      })

      toast.dismiss(toastId)
      handleAuthSuccess(data)
    } catch (err: any) {
      handleAuthError(err, toastId)
    }
  }

  useEffect(() => {
    if (!googleClientId) {
      console.error("Google Client ID is missing.");
      return;
    }

    const script = document.createElement("script")
    script.src = "https://accounts.google.com/gsi/client"
    script.async = true
    script.defer = true
    script.onload = () => {
      if ((window as any).google && googleButtonRef.current) {
        (window as any).google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleSignIn,
        });
        (window as any).google.accounts.id.renderButton(googleButtonRef.current, {
          theme: isDarkMode ? "filled_black" : "outline",
          size: "large",
          type: "standard",
          shape: "pill",
          width: "360",
        });
      }
    }
    document.body.appendChild(script)
    return () => {
      const scriptElement = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (scriptElement) document.body.removeChild(scriptElement);
    }
  }, [isDarkMode, googleClientId])



  const handleAdminLogin = async () => {
    setError(null)
    setIsLoading(true)
    const toastId = toast.loading("Signing in as Admin...")

    try {
      const data = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: "karnkalyan@gmail.com",
          password: "kalyan_vickey",
          rememberMe: true,
        }),
      })

      toast.dismiss(toastId)
      handleAuthSuccess(data)
    } catch (err: any) {
      handleAuthError(err, toastId)
    }
  }



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    const toastId = toast.loading("Signing in...")

    try {
      const data = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ ...formData, rememberMe }),
      })

      toast.dismiss(toastId)
      handleAuthSuccess(data)
    } catch (err: any) {
      handleAuthError(err, toastId)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <div className="relative w-full">

      <CardContainer
        title={undefined}
        gradientColor="#4A1B7A"
        forceDarkMode={isDarkMode}
        className="relative z-10 rounded-2xl border border-[#351147]/15 bg-card px-6 py-6 shadow-[0_18px_55px_rgba(43,13,58,.14)] dark:border-[#4A1B7A]/45"
      >
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-500">
            <AlertCircle className="h-4 w-4" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="font-normal">Email, username, or phone</Label>
            <div className="relative">
              <Input id="email" name="email" type="text" autoCapitalize="none" placeholder="Email, username, or phone" required value={formData.email} onChange={handleChange} className="rounded-lg border-[#351147]/20 bg-card/60 pl-10 focus-visible:border-[#4A1B7A] focus-visible:ring-[#4A1B7A]/20" disabled={isLoading} />
              <UserRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="font-normal">Password</Label>
              <Button variant="link" type="button" className="h-auto p-0 text-xs text-[#4A1B7A] hover:text-[#351147] dark:text-purple-200" onClick={() => router.push("/forgot-password")}>Forgot password?</Button>
            </div>
            <div className="relative">
              <Input id="password" name="password" type={showPassword ? "text" : "password"} placeholder="••••••••" required value={formData.password} onChange={handleChange} className="rounded-lg border-[#351147]/20 bg-card/60 pl-4 pr-10 focus-visible:border-[#4A1B7A] focus-visible:ring-[#4A1B7A]/20" disabled={isLoading} />
              <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3" onClick={() => setShowPassword(!showPassword)} disabled={isLoading}>
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox id="remember" checked={rememberMe} onCheckedChange={(checked) => setRememberMe(checked === true)} />
            <Label htmlFor="remember" className="text-sm font-medium cursor-pointer">Remember me for 30 days</Label>
          </div>

          <Button type="submit" className="w-full bg-[linear-gradient(90deg,#2B0D3A_0%,#351147_48%,#4A1B7A_100%)] text-white shadow-[0_10px_24px_rgba(74,27,122,.24)] hover:brightness-110" loading={isLoading} disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign in"}
          </Button>


          {/* <Button
            type="button" // IMPORTANT: prevent default form submit
            className="w-full rounded-lg bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white"
            onClick={handleAdminLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in...
              </>
            ) : (
              "Admin Login"
            )}
          </Button> */}

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/60"></div></div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card/60 px-4 py-1 rounded-full text-muted-foreground border border-border/30">Or continue with</span>
              </div>
            </div>
            <div className="mt-6">
              <div className="group relative h-9 overflow-hidden rounded-lg border border-[#351147]/15 bg-background transition-colors hover:border-[#4A1B7A]/55 dark:bg-white/[0.06]">
                <div className="pointer-events-none flex h-full items-center justify-center gap-3 px-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-black/5">
                    <GoogleIcon className="h-4 w-4" />
                  </span>
                  <span className="text-sm font-semibold text-foreground">Sign in with Google</span>
                </div>
                <div className="absolute inset-0 opacity-0">
                  <div ref={googleButtonRef} className="h-full w-full" />
                </div>
              </div>
            </div>
          </div>
        </form>
      </CardContainer>
    </div>
  )
}
