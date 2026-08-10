"use client"

import { useParams } from "next/navigation"
import { DeviceWorkspace } from "@/components/device-management/device-workspace"

export default function NetworkDeviceWorkspacePage() {
    const params = useParams<{ deviceId: string }>()
    const id = Number(params.deviceId)

    if (!Number.isInteger(id)) {
        return <div className="p-8 text-sm text-destructive font-medium">Invalid device identifier.</div>
    }

    return <DeviceWorkspace deviceId={id} />
}
