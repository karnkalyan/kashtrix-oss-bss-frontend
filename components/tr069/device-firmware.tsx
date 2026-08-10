"use client";

import { useEffect, useState } from "react";
import { CardContainer } from "@/components/ui/card-container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "react-hot-toast";
import { CheckCircle, Download, Upload, Clock } from "lucide-react";
import { apiRequest } from "@/lib/api";

interface TR069DeviceFirmwareProps {
  deviceId: string;
}

export function TR069DeviceFirmware({ deviceId }: TR069DeviceFirmwareProps) {
  const [deviceInfo, setDeviceInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentFirmware, setCurrentFirmware] = useState<any>({ version: "N/A" });
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateProgress, setUpdateProgress] = useState(0);

  const [availableFirmware, setAvailableFirmware] = useState<{
    version: string;
    releaseDate: string;
    status: string;
    size: string;
    releaseNotes: string[];
  } | null>(null);

  const fetchDeviceInfo = async () => {
    try {
      setIsLoading(true);
      const data = await apiRequest<{ success: boolean; data: any }>(
        `/services/genieacs/devices/${deviceId}/deviceinfo`
      ).catch(() => ({ success: false, data: null }));

      if (data.success && data.data?.deviceInfo) {
        setDeviceInfo(data.data.deviceInfo);
        setCurrentFirmware({ version: data.data.deviceInfo.softwareVersion || "N/A" });
      } else {
        setDeviceInfo({
          modelName: "N/A",
          description: "N/A",
          hardwareVersion: "N/A",
          softwareVersion: "N/A",
          firstUseDate: null
        });
        setCurrentFirmware({ version: "N/A" });
      }
    } catch (error) {
      console.error("Error fetching device info:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDeviceInfo();
  }, [deviceId]);

  const updateFirmware = () => {
    toast.error("Select a real firmware file before starting an upgrade.");
  };

  const checkForUpdates = () => {
    toast("No firmware registry is configured. The installed CPE version is shown above.");
  };

  if (isLoading || !deviceInfo) {
    return (
      <div className="flex items-center justify-center h-48 bg-card/45 border rounded-2xl">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        <p className="ml-3 text-xs text-muted-foreground font-bold uppercase tracking-wider">Loading firmware parameters...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-6">
        <CardContainer title="Current Firmware Profile" description="CPE Software status details" gradientColor="#6366f1">
          <div className="space-y-4 mt-2 text-xs font-semibold">
            <div className="flex justify-between items-center py-2 border-b">
              <div>
                <span className="text-[10px] text-muted-foreground uppercase">Software Version</span>
                <div className="text-lg font-bold text-slate-800 dark:text-slate-200 mt-0.5">{currentFirmware.version}</div>
              </div>
              <Badge className="text-emerald-500 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-0.5 rounded-full font-bold">
                <CheckCircle className="h-3 w-3 mr-1" />
                Latest Installed
              </Badge>
            </div>

            <div className="flex justify-between py-2 border-b">
              <span className="text-[10px] text-muted-foreground uppercase">Hardware Model</span>
              <span className="text-slate-800 dark:text-slate-200">{deviceInfo.modelName || "N/A"}</span>
            </div>

            <div className="flex justify-between py-2">
              <span className="text-[10px] text-muted-foreground uppercase">Hardware revision</span>
              <span className="text-slate-800 dark:text-slate-200">{deviceInfo.hardwareVersion || "N/A"}</span>
            </div>
          </div>
        </CardContainer>

        <CardContainer title="ACS Update Controller" description="Update and schedule firmware releases" gradientColor="#22c55e">
          {isUpdating ? (
            <div className="space-y-4 pt-2">
              <div className="text-center">
                <div className="text-base font-extrabold mb-1">Applying Firmware Upgrade...</div>
                <div className="text-[10px] text-muted-foreground mb-4">Do not interrupt power or link state during transfer</div>
              </div>

              <Progress value={updateProgress} className="h-2" />

              <div className="flex justify-between text-xs font-semibold">
                <span className="text-indigo-500">Writing Flash sector</span>
                <span>{updateProgress}%</span>
              </div>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              {availableFirmware ? (
                <>
                  <div className="flex justify-between items-center py-2 border-b">
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase">Target Version</span>
                      <div className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5">{availableFirmware.version}</div>
                    </div>
                    <Badge className="text-indigo-500 bg-indigo-500/10 border border-indigo-500/25 px-2.5 py-0.5 rounded-full font-bold">
                      <Download className="h-3 w-3 mr-1" />
                      Upgrade Available
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase block">Release Date</span>
                      <span className="text-slate-800 dark:text-slate-200">{availableFirmware.releaseDate}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase block">Package Size</span>
                      <span className="text-slate-800 dark:text-slate-200">{availableFirmware.size}</span>
                    </div>
                  </div>

                  <div className="border-t pt-3">
                    <span className="text-[10px] text-muted-foreground uppercase block font-bold mb-2">Release Notes</span>
                    <ul className="list-disc pl-5 space-y-1 text-xs text-muted-foreground font-medium">
                      {availableFirmware.releaseNotes.map((note, index) => (
                        <li key={index}>{note}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button onClick={updateFirmware} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-9 text-xs font-bold">
                      <Upload className="h-4 w-4 mr-2" />
                      Push Update Now
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-6">
                  <div className="text-base font-extrabold mb-1">Standardized Firmware Profile</div>
                  <p className="text-xs text-muted-foreground mb-4">
                    Your CPE device matches the current baseline firmware profile.
                  </p>
                  <Button variant="outline" onClick={checkForUpdates} className="rounded-xl border-indigo-500/20 hover:bg-indigo-500/10 text-xs font-bold h-9">
                    <Download className="h-4 w-4 mr-2" />
                    Check Registry
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContainer>
      </div>

      <CardContainer title="Provisioning Registry Metadata" description="Firmware descriptors retrieved via XML inform" gradientColor="#3b82f6">
        <div className="space-y-4 mt-2">
          <div className="p-4 rounded-xl border bg-secondary/15">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-500/10 border border-blue-500/25 p-2">
                <Clock className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <div className="text-xs font-extrabold text-slate-800 dark:text-slate-200">Hardware Reference Class</div>
                <div className="text-[11px] text-muted-foreground font-semibold mt-0.5">{deviceInfo.modelName}</div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl border bg-secondary/15">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-purple-500/10 border border-purple-500/25 p-2">
                <CheckCircle className="h-4 w-4 text-purple-500" />
              </div>
              <div>
                <div className="text-xs font-extrabold text-slate-800 dark:text-slate-200">Description</div>
                <div className="text-[11px] text-muted-foreground font-semibold mt-0.5">{deviceInfo.description}</div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl border bg-secondary/15">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-amber-500/10 border border-amber-500/25 p-2">
                <Download className="h-4 w-4 text-amber-500" />
              </div>
              <div>
                <div className="text-xs font-extrabold text-slate-800 dark:text-slate-200">First Provisioning Date</div>
                <div className="text-[11px] text-muted-foreground font-semibold mt-0.5">
                  {deviceInfo.firstUseDate ? new Date(deviceInfo.firstUseDate).toLocaleString() : "N/A"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContainer>
    </div>
  );
}
