"use client"
import { useParams } from "next/navigation";import { DeviceListPage } from "@/components/device-management/device-list-page";import { DEVICE_TYPES,type DeviceType } from "@/lib/device-management";
export default function DeviceTypePage(){const params=useParams<{deviceType:string}>(),type=params.deviceType as DeviceType;if(params.deviceType==="all")return <DeviceListPage/>;if(!DEVICE_TYPES[type])return <div className="p-8">Unsupported device type.</div>;return <DeviceListPage deviceType={type}/>}
