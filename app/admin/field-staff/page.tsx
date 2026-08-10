"use client";

import { PageHeader } from "@/components/ui/page-header";
import { FieldStaffMap } from "@/components/dashboard/field-staff-map";

export default function FieldStaffGPSPage() {
    return (
        <div className="space-y-6">
            <PageHeader
                title="Field Staff Live GPS Tracking"
                description="Real-time geographic location monitoring for field technicians, engineers, and support staff"
            />
            <FieldStaffMap />
        </div>
    );
}
