"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "react-hot-toast"
import { apiRequest } from "@/lib/api"
import { Phone, PhoneCall, UserCheck } from "lucide-react"

interface AsteriskMakeCallModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ispId: number
  onSuccess: () => void
  capabilities?: any
}

interface Extension {
  extensionNumber: string
  extensionName: string
  status?: string
  registered?: boolean
}

interface AuthMeResponse {
  user?: {
    yeastarExt?: string | null
    extId?: string | null
  }
}

export default function AsteriskMakeCallModal({
  open,
  onOpenChange,
  ispId,
  onSuccess,
  capabilities
}: AsteriskMakeCallModalProps) {
  const [loading, setLoading] = useState(false)
  const [assignedExtension, setAssignedExtension] = useState<string>("")
  const [callerExtension, setCallerExtension] = useState<string>("")
  const [targetNumber, setTargetNumber] = useState("")

  useEffect(() => {
    if (open) {
      fetchUserExtension()
    } else {
      setTargetNumber("")
    }
  }, [open])

  const fetchUserExtension = async () => {
    try {
      const me = await apiRequest<AuthMeResponse>('/auth/me', { suppressToast: true })
      const ext = String(me.user?.yeastarExt || me.user?.extId || "").trim()
      if (ext) {
        setAssignedExtension(ext)
        setCallerExtension(ext)
      }
    } catch (err) {
      console.warn("Error fetching user profile extension:", err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const caller = callerExtension.trim() || assignedExtension.trim()
    const destination = targetNumber.trim()

    if (!caller) {
      toast.error("Please specify a caller extension")
      return
    }

    if (!destination) {
      toast.error("Please enter a target destination number")
      return
    }

    try {
      setLoading(true)
      const response = await apiRequest<any>('/asterisk/calls/make', {
        method: 'POST',
        body: JSON.stringify({
          extension: caller,
          number: destination
        })
      })

      if (response.success) {
        toast.success(response.message || `Call initiated from ${caller} to ${destination}`)
        onSuccess()
        onOpenChange(false)
        setTargetNumber("")
      } else {
        toast.error(response.error || "Failed to initiate call")
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to initiate call")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PhoneCall className="h-5 w-5 text-primary" />
              Make Direct Call (Asterisk)
            </DialogTitle>
            <DialogDescription>
              Originate a call from an extension to any local or external number.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="callerExt">Your Extension (Caller)</Label>
              <div className="relative">
                <Input
                  id="callerExt"
                  placeholder="e.g. 1001"
                  value={callerExtension}
                  onChange={(e) => setCallerExtension(e.target.value)}
                  disabled={loading}
                />
                {assignedExtension && (
                  <span className="absolute right-3 top-2.5 text-xs text-muted-foreground flex items-center gap-1">
                    <UserCheck className="h-3 w-3 text-green-500" />
                    Assigned: {assignedExtension}
                  </span>
                )}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="targetNumber">Target Destination Number</Label>
              <Input
                id="targetNumber"
                placeholder="e.g. 1002 or 9841234567"
                value={targetNumber}
                onChange={(e) => setTargetNumber(e.target.value)}
                disabled={loading}
                autoFocus
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !targetNumber.trim()}>
              {loading ? "Originating..." : "Start Call"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
