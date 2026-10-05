"use client"

import { useState, useEffect, useMemo } from "react"

type SidebarBranding = {
  sidebarLogoExpandedLightUrl?: string | null
  sidebarLogoExpandedDarkUrl?: string | null
  sidebarLogoCollapsedLightUrl?: string | null
  sidebarLogoCollapsedDarkUrl?: string | null
}

type PublicIspData = {
  id?: number
  companyName?: string | null
  name?: string | null
  displayName?: string | null
  website?: string | null
  logoUrl?: string | null
  sidebarBranding?: SidebarBranding
}

function resolveAssetUrl(assetPath?: string | null): string {
  if (!assetPath) return ""
  if (/^https?:\/\//i.test(assetPath) || assetPath.startsWith("data:") || assetPath.startsWith("blob:")) {
    return assetPath
  }

  let cleanPath = assetPath.startsWith("/") ? assetPath : `/${assetPath}`

  // Always ensure /uploads/ routes through /api/uploads/ for Next.js rewrites and Nginx proxy
  if (cleanPath.startsWith("/uploads/")) {
    cleanPath = `/api${cleanPath}`
  }

  if (typeof window === "undefined") return cleanPath

  const hostname = window.location.hostname
  const isLocal = hostname === "localhost" || hostname === "127.0.0.1" || hostname.startsWith("192.168.")
  if (isLocal) {
    return `http://${hostname}:3200${cleanPath}`
  }

  return cleanPath
}

export function LoginBranding() {
  const [ispData, setIspData] = useState<PublicIspData | null>(null)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [imageError, setImageError] = useState(false)

  // Track theme changes (dark/light)
  useEffect(() => {
    setIsDarkMode(document.documentElement.classList.contains("dark"))

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "class") {
          setIsDarkMode(document.documentElement.classList.contains("dark"))
        }
      })
    })

    observer.observe(document.documentElement, { attributes: true })
    return () => observer.disconnect()
  }, [])

  // Fetch ISP Public Branding Info based on current browser domain
  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const domain = typeof window !== "undefined" ? window.location.hostname : ""
        const query = domain ? `?domain=${encodeURIComponent(domain)}` : ""

        // Try /api/isp/public first, then fallback to /isp/public
        const endpoints = [`/api/isp/public${query}`, `/isp/public${query}`]
        let data: PublicIspData | null = null

        for (const url of endpoints) {
          try {
            const res = await fetch(url, { credentials: "include" })
            if (res.ok) {
              const json = await res.json()
              data = json?.data || json
              if (data && (data.companyName || data.name || data.sidebarBranding)) {
                break
              }
            }
          } catch {
            // try next endpoint
          }
        }

        if (data && (data.companyName || data.name || data.sidebarBranding)) {
          setIspData(data)
          const titleName = data.companyName || data.name || data.displayName
          if (titleName && typeof document !== "undefined") {
            document.title = `${titleName} - Login`
          }
        }
      } catch {
        // Fallback gracefully to default Radius Manager
      }
    }

    fetchBranding()
  }, [])

  // Dynamically update Favicon with ISP logo
  useEffect(() => {
    if (!ispData) return

    const branding = ispData.sidebarBranding
    const faviconPath =
      branding?.sidebarLogoCollapsedLightUrl ||
      branding?.sidebarLogoCollapsedDarkUrl ||
      branding?.sidebarLogoExpandedLightUrl ||
      branding?.sidebarLogoExpandedDarkUrl ||
      ispData.logoUrl

    if (faviconPath) {
      const fullFaviconUrl = resolveAssetUrl(faviconPath)
      if (fullFaviconUrl && typeof document !== "undefined") {
        const existingIcons = document.querySelectorAll("link[rel*='icon']")
        existingIcons.forEach((el) => {
          (el as HTMLLinkElement).href = fullFaviconUrl
        })
        if (existingIcons.length === 0) {
          const newIcon = document.createElement("link")
          newIcon.rel = "shortcut icon"
          newIcon.href = fullFaviconUrl
          document.head.appendChild(newIcon)
        }
      }
    }
  }, [ispData])

  const companyName = ispData?.companyName || ispData?.name || ispData?.displayName || "Radius Manager"

  // Determine active logo based on light / dark mode
  const activeLogoPath = useMemo(() => {
    const branding = ispData?.sidebarBranding
    if (!branding && !ispData?.logoUrl) return null

    if (isDarkMode) {
      return (
        branding?.sidebarLogoExpandedDarkUrl ||
        branding?.sidebarLogoExpandedLightUrl ||
        branding?.sidebarLogoCollapsedDarkUrl ||
        ispData?.logoUrl ||
        null
      )
    }

    return (
      branding?.sidebarLogoExpandedLightUrl ||
      branding?.sidebarLogoExpandedDarkUrl ||
      branding?.sidebarLogoCollapsedLightUrl ||
      ispData?.logoUrl ||
      null
    )
  }, [ispData, isDarkMode])

  const fullLogoUrl = useMemo(() => {
    if (!activeLogoPath) return null
    return resolveAssetUrl(activeLogoPath)
  }, [activeLogoPath])

  // Generate initials for the badge if no logo is available
  const brandInitials = useMemo(() => {
    if (!companyName) return "RM"
    const words = companyName.split(" ").filter(Boolean)
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase()
    return (words[0][0] + (words[1]?.[0] || "")).toUpperCase()
  }, [companyName])

  return (
    <div className="mb-8 text-center relative z-10 transition-all duration-300">
      {fullLogoUrl && !imageError ? (
        <div className="flex flex-col items-center justify-center gap-2 mb-2">
          <img
            src={fullLogoUrl}
            alt={companyName}
            className="h-14 md:h-16 max-w-[280px] object-contain drop-shadow-md transition-all duration-300"
            onError={() => setImageError(true)}
          />
        </div>
      ) : (
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="size-12 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center shadow-lg font-bold text-white text-lg tracking-wider">
            {brandInitials}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
            <span className="text-primary">{companyName}</span>
          </h1>
        </div>
      )}
    </div>
  )
}
