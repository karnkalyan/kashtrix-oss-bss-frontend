"use client"

import { useEffect } from "react"
import { XTermTerminal } from "@/components/terminal/xterm-terminal"

interface OLT {
  id: string
  name: string
  ipAddress?: string
  sshHost?: string
  sshPort?: number
  sshUsername?: string
  sshPassword?: string
  sshConfig?: {
    host?: string
    port?: number
    username?: string
    password?: string
  }
}

interface TerminalProps {
  olt: OLT
  isOpen: boolean
  onClose: () => void
}

export function OLTTerminal({ olt, isOpen, onClose }: TerminalProps) {
  useEffect(() => {
    if (!isOpen) return

    const previousBodyOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !document.fullscreenElement) onClose()
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = previousBodyOverflow
    }
  }, [isOpen, onClose])

  if (!isOpen || !olt) return null

  const host = olt.sshConfig?.host || olt.sshHost || olt.ipAddress || ""
  const port = olt.sshConfig?.port || olt.sshPort || 22
  const username = olt.sshConfig?.username || olt.sshUsername || ""
  const password = olt.sshConfig?.password || olt.sshPassword || ""

  return (
    <div
      className="terminal-modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-transparent p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label={`${olt.name} SSH Terminal`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="terminal-modal-panel w-full max-w-6xl">
        <XTermTerminal
          title={`${olt.name} (${host})`}
          host={host}
          port={port}
          username={username}
          password={password}
          deviceId={olt.id}
          resourceType="olt"
          autoConnect={true}
          onClose={onClose}
          className="!h-[min(720px,calc(100dvh-4rem))]"
          quickCommands={[
            "display version",
            "display board 0",
            "display ont info 0 1 all",
            "display cpu-usage",
            "display memory-usage"
          ]}
        />
      </div>
    </div>
  )
}
