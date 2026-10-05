"use client"

import { useState, useEffect, useCallback } from "react"
import { CardContainer } from "@/components/ui/card-container"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  PhoneOff,
  PhoneForwarded,
  Square,
  Radio,
  Ear,
  Mic,
  MoreVertical,
  Clock,
  Search,
  AlertCircle,
  RefreshCw
} from "lucide-react"
import { toast } from "react-hot-toast"
import { apiRequest } from "@/lib/api"
import { useWebSocket } from "@/contexts/WebSocketContext"

export interface AsteriskActiveCall {
  callid: string
  channelid: string
  caller: string
  called: string
  extension?: string
  status: string
  direction: string
  startTime: string
  duration?: number
}

interface AsteriskActiveCallsProps {
  ispId?: number
  calls?: AsteriskActiveCall[]
  capabilities?: any
  onRefresh?: () => void
  webSocketConnected?: boolean
  serverDown?: boolean
}

export default function AsteriskActiveCalls({
  ispId,
  calls: initialCalls,
  capabilities: initialCapabilities,
  onRefresh,
  webSocketConnected,
  serverDown
}: AsteriskActiveCallsProps) {
  const [calls, setCalls] = useState<AsteriskActiveCall[]>(initialCalls || [])
  const [capabilities, setCapabilities] = useState<any>(initialCapabilities || {})
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const { on } = useWebSocket()

  // Transfer modal state
  const [transferModalOpen, setTransferModalOpen] = useState(false)
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null)
  const [transferTarget, setTransferTarget] = useState("")

  // Spy / Monitor modal state
  const [spyModalOpen, setSpyModalOpen] = useState(false)
  const [spyTargetExt, setSpyTargetExt] = useState("")
  const [spySupervisorExt, setSpySupervisorExt] = useState("")
  const [spyMode, setSpyMode] = useState<'listen' | 'whisper' | 'barge'>('listen')

  const fetchActiveCalls = useCallback(async () => {
    if (serverDown) return
    try {
      setLoading(true)
      const res = await apiRequest<{ success: boolean; data: AsteriskActiveCall[] }>('/asterisk/calls/active')
      if (res.success && res.data) {
        setCalls(res.data)
      }
    } catch (err: any) {
      console.error("Failed to fetch active calls:", err)
    } finally {
      setLoading(false)
    }
  }, [serverDown])

  useEffect(() => {
    if (initialCalls) {
      setCalls(initialCalls)
    } else {
      fetchActiveCalls()
    }
  }, [initialCalls, fetchActiveCalls])

  useEffect(() => {
    if (initialCapabilities) {
      setCapabilities(initialCapabilities)
    }
  }, [initialCapabilities])

  // Realtime updates
  useEffect(() => {
    const handleUpdate = () => {
      fetchActiveCalls()
      if (onRefresh) onRefresh()
    }

    const unsubStart = on('asterisk.call.start', handleUpdate)
    const unsubEnd = on('asterisk.call.end', handleUpdate)
    const unsubStatus = on('asterisk.call.status', handleUpdate)

    return () => {
      unsubStart()
      unsubEnd()
      unsubStatus()
    }
  }, [on, fetchActiveCalls, onRefresh])

  const filteredCalls = calls.filter(c =>
    (c.caller || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.called || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.channelid || "").toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleHangup = async (channelid: string) => {
    try {
      setActionLoading(channelid)
      const res = await apiRequest<any>('/asterisk/calls/hangup', {
        method: 'POST',
        body: JSON.stringify({ channelid })
      })
      if (res.success) {
        toast.success("Hangup command sent successfully")
        fetchActiveCalls()
        if (onRefresh) onRefresh()
      } else {
        toast.error(res.error || "Hangup failed")
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to hang up call")
    } finally {
      setActionLoading(null)
    }
  }

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedChannel || !transferTarget.trim()) {
      toast.error("Please enter a target extension")
      return
    }

    try {
      setActionLoading(selectedChannel)
      const res = await apiRequest<any>('/asterisk/calls/transfer', {
        method: 'POST',
        body: JSON.stringify({
          channelid: selectedChannel,
          target: transferTarget.trim()
        })
      })
      if (res.success) {
        toast.success(`Call transferred to ${transferTarget}`)
        setTransferModalOpen(false)
        setTransferTarget("")
        fetchActiveCalls()
        if (onRefresh) onRefresh()
      } else {
        toast.error(res.error || "Transfer failed")
      }
    } catch (err: any) {
      toast.error(err.message || "Transfer error")
    } finally {
      setActionLoading(null)
    }
  }

  const handleSpySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!spySupervisorExt.trim() || !spyTargetExt.trim()) {
      toast.error("Please provide both supervisor extension and target extension")
      return
    }

    try {
      setActionLoading("spy")
      const endpoint = spyMode === 'whisper' ? '/asterisk/calls/whisper' :
                       spyMode === 'barge' ? '/asterisk/calls/barge' :
                       '/asterisk/calls/listen'

      const res = await apiRequest<any>(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          supervisorExt: spySupervisorExt.trim(),
          targetExt: spyTargetExt.trim(),
          mode: spyMode
        })
      })

      if (res.success) {
        toast.success(`ChanSpy (${spyMode}) initiated to extension ${spyTargetExt}`)
        setSpyModalOpen(false)
      } else {
        toast.error(res.error || `Failed to initiate ${spyMode}`)
      }
    } catch (err: any) {
      toast.error(err.message || "Monitor action failed")
    } finally {
      setActionLoading(null)
    }
  }

  const handleRecordToggle = async (channelid: string, currentlyRecording: boolean) => {
    try {
      setActionLoading(channelid)
      const endpoint = currentlyRecording ? '/asterisk/calls/record/stop' : '/asterisk/calls/record/start'
      const res = await apiRequest<any>(endpoint, {
        method: 'POST',
        body: JSON.stringify({ channelid })
      })

      if (res.success) {
        toast.success(currentlyRecording ? "Recording stopped" : "MixMonitor recording started")
        fetchActiveCalls()
        if (onRefresh) onRefresh()
      } else {
        toast.error(res.error || "Recording toggle failed")
      }
    } catch (err: any) {
      toast.error(err.message || "Recording action failed")
    } finally {
      setActionLoading(null)
    }
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "00:00"
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <CardContainer
      title={`Active Calls (${calls.length})`}
      description="Live Asterisk channels and ongoing conversations"
      actions={[
        {
          label: "Refresh",
          onClick: fetchActiveCalls,
          icon: <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />,
          variant: "outline"
        }
      ]}
    >
      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by caller, called, or channel ID..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Calls Table */}
        <div className="rounded-lg border dark:border-gray-800 bg-card overflow-hidden">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b bg-muted/40 font-medium text-muted-foreground">
                <th className="p-3">Channel / Call ID</th>
                <th className="p-3">Direction</th>
                <th className="p-3">Caller</th>
                <th className="p-3">Called</th>
                <th className="p-3">Status</th>
                <th className="p-3">Duration</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCalls.map((call) => {
                const isOpLoading = actionLoading === call.channelid

                return (
                  <tr key={call.channelid} className="border-b hover:bg-accent/20 transition-colors">
                    <td className="p-3">
                      <div className="font-mono text-xs font-semibold text-foreground truncate max-w-[200px]" title={call.channelid}>
                        {call.channelid}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono">
                        Call ID: {call.callid || "N/A"}
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge variant="outline" className="capitalize text-xs">
                        {call.direction || "Internal"}
                      </Badge>
                    </td>
                    <td className="p-3 font-medium">
                      {call.caller}
                    </td>
                    <td className="p-3 font-medium">
                      {call.called}
                    </td>
                    <td className="p-3">
                      <Badge variant="success" className="animate-pulse">
                        {call.status}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{formatDuration(call.duration)}</span>
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Quick Hangup */}
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={isOpLoading}
                          onClick={() => handleHangup(call.channelid)}
                          className="h-8 px-2 text-xs gap-1"
                        >
                          <PhoneOff className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Hangup</span>
                        </Button>

                        {/* Dropdown Menu for Advanced Controls */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={isOpLoading}>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Call Controls</DropdownMenuLabel>
                            <DropdownMenuSeparator />

                            {/* Transfer */}
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedChannel(call.channelid)
                                setTransferModalOpen(true)
                              }}
                              className="gap-2 cursor-pointer"
                            >
                              <PhoneForwarded className="h-4 w-4 text-blue-500" />
                              <span>Blind Transfer</span>
                            </DropdownMenuItem>

                            {/* MixMonitor Recording */}
                            <DropdownMenuItem
                              onClick={() => handleRecordToggle(call.channelid, false)}
                              className="gap-2 cursor-pointer"
                            >
                              <Radio className="h-4 w-4 text-red-500" />
                              <span>Start Recording</span>
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>Supervisor (ChanSpy)</DropdownMenuLabel>

                            {/* Listen */}
                            <DropdownMenuItem
                              onClick={() => {
                                setSpyMode('listen')
                                setSpyTargetExt(call.caller || call.called)
                                setSpyModalOpen(true)
                              }}
                              className="gap-2 cursor-pointer"
                            >
                              <Ear className="h-4 w-4 text-emerald-500" />
                              <span>Listen in</span>
                            </DropdownMenuItem>

                            {/* Whisper */}
                            <DropdownMenuItem
                              onClick={() => {
                                setSpyMode('whisper')
                                setSpyTargetExt(call.caller || call.called)
                                setSpyModalOpen(true)
                              }}
                              className="gap-2 cursor-pointer"
                            >
                              <Mic className="h-4 w-4 text-amber-500" />
                              <span>Whisper to Agent</span>
                            </DropdownMenuItem>

                            {/* Barge */}
                            <DropdownMenuItem
                              onClick={() => {
                                setSpyMode('barge')
                                setSpyTargetExt(call.caller || call.called)
                                setSpyModalOpen(true)
                              }}
                              className="gap-2 cursor-pointer text-purple-600 font-medium"
                            >
                              <Square className="h-4 w-4 text-purple-600" />
                              <span>Barge (Join Call)</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                )
              })}

              {filteredCalls.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle className="h-8 w-8 text-muted-foreground/60" />
                      <p>No active Asterisk calls at this time.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Blind Transfer Dialog */}
      <Dialog open={transferModalOpen} onOpenChange={setTransferModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer Active Call</DialogTitle>
            <DialogDescription>
              Redirect channel <code className="font-mono text-xs">{selectedChannel}</code> to another extension or external number.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleTransferSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="transferTarget">Target Extension / Destination</Label>
              <Input
                id="transferTarget"
                placeholder="e.g. 1002 or 9841234567"
                value={transferTarget}
                onChange={(e) => setTransferTarget(e.target.value)}
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setTransferModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={actionLoading === selectedChannel}>
                Confirm Transfer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ChanSpy Dialog */}
      <Dialog open={spyModalOpen} onOpenChange={setSpyModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="capitalize">{spyMode} Channel (ChanSpy)</DialogTitle>
            <DialogDescription>
              {spyMode === 'listen' && "Listen to both parties on this extension without being heard."}
              {spyMode === 'whisper' && "Speak to the target agent only (customer will not hear you)."}
              {spyMode === 'barge' && "Join the call in full two-way conference mode."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSpySubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="spySupervisorExt">Your Supervisor Extension</Label>
              <Input
                id="spySupervisorExt"
                placeholder="e.g. 1000"
                value={spySupervisorExt}
                onChange={(e) => setSpySupervisorExt(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="spyTargetExt">Target Extension</Label>
              <Input
                id="spyTargetExt"
                placeholder="e.g. 1001"
                value={spyTargetExt}
                onChange={(e) => setSpyTargetExt(e.target.value)}
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setSpyModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={actionLoading === "spy"}>
                Start {spyMode}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </CardContainer>
  )
}
