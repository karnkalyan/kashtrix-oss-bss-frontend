"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { apiRequest } from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"
import type { CalendarSystem } from "@/lib/calendar-system"

const CalendarContext = createContext<{ system: CalendarSystem; setViewSystem: (system: CalendarSystem) => void; loading: boolean }>({ system: "AD", setViewSystem: () => undefined, loading: true })

export function CalendarSystemProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const [system, setSystem] = useState<CalendarSystem>("AD")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Try to load cached calendar system preference immediately
    const cached = localStorage.getItem("calendar-system-preference") as CalendarSystem
    if (cached === "AD" || cached === "BS") {
      setSystem(cached)
    }
  }, [])

  useEffect(() => {
    if (authLoading) return
    if (!user) { setLoading(false); return }
    apiRequest<{ system?: string }>("/settings/calendar-system", { suppressToast: true })
      .then(settings => {
        const fetched = String(settings.system || "AD").toUpperCase() === "BS" ? "BS" : "AD"
        setSystem(fetched)
        localStorage.setItem("calendar-system-preference", fetched)
      })
      .finally(() => setLoading(false))
  }, [user, authLoading])

  useEffect(() => {
    const saved = (event: Event) => {
      const value = String((event as CustomEvent).detail?.defaultCalendarSystem || "").toUpperCase()
      if (value === "AD" || value === "BS") {
        setSystem(value)
        localStorage.setItem("calendar-system-preference", value)
      }
    }
    window.addEventListener("system-settings-saved", saved)
    return () => window.removeEventListener("system-settings-saved", saved)
  }, [])

  const setViewSystem = (newSystem: CalendarSystem) => {
    setSystem(newSystem)
    localStorage.setItem("calendar-system-preference", newSystem)
  }

  const value = useMemo(() => ({ system, setViewSystem, loading }), [system, loading])
  return <CalendarContext.Provider value={value}>{children}</CalendarContext.Provider>
}

export const useCalendarSystem = () => useContext(CalendarContext)
