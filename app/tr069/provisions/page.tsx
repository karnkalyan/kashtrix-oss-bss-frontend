"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { CardContainer } from "@/components/ui/card-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/api";
import { toast } from "react-hot-toast";
import { Code, Trash, Play, Plus, RefreshCw, FileCode, CheckCircle, Edit3 } from "lucide-react";

interface Provision {
  _id: string;
  name: string;
  script: string;
}

const DEFAULT_PROVISION_SCRIPT = `// --- Set all refreshes to real-time (NOW) ---
const NOW = Date.now();

// --- 1. DEVICE INFO (Including Memory, CPU, and Identity) ---
declare("InternetGatewayDevice.DeviceInfo.*", {path: NOW, value: NOW});
declare("InternetGatewayDevice.DeviceInfo.MemoryStatus.*", {path: NOW, value: NOW});
declare("InternetGatewayDevice.DeviceInfo.ProcessStatus.*", {path: NOW, value: NOW});

// --- 2. COMPLETE WAN STACK ---
declare("InternetGatewayDevice.WANDevice.*.WANConnectionDevice.*.WANIPConnection.*.*", {path: NOW, value: NOW});
declare("InternetGatewayDevice.WANDevice.*.WANConnectionDevice.*.WANPPPConnection.*.*", {path: NOW, value: NOW});
declare("InternetGatewayDevice.WANDevice.*.WANCommonInterfaceConfig.*", {path: NOW, value: NOW});

// --- 3. COMPLETE WIFI (L2/L3 Configuration) ---
declare("InternetGatewayDevice.LANDevice.*.WLANConfiguration.*.*", {path: NOW, value: NOW});

// --- 4. COMPLETE LAN & HOSTS ---
declare("InternetGatewayDevice.LANDevice.*.Hosts.Host.*.*", {path: NOW, value: NOW});
declare("InternetGatewayDevice.LANDevice.*.LANEthernetInterfaceConfig.*.*", {path: NOW, value: NOW});

// --- 5. VENDOR-SPECIFIC OPTICAL POWER ---
declare("InternetGatewayDevice.WANDevice.1.X_HW_OPTMNG.*", {path: NOW, value: NOW});
declare("InternetGatewayDevice.X_ALU_OntOpticalParam.*", {path: NOW, value: NOW});
declare("InternetGatewayDevice.DeviceInfo.XponInterface.*", {path: NOW, value: NOW});

// --- 6. VIRTUAL PARAMETERS ---
declare("VirtualParameters.CPU", {path: NOW, value: NOW});
declare("VirtualParameters.RxPower", {path: NOW, value: NOW});
declare("VirtualParameters.Memory", {path: NOW, value: NOW});
declare("VirtualParameters.Temperature", {path: NOW, value: NOW});
declare("VirtualParameters.Wifi_Key_Dynamic", {path: NOW, value: NOW});`;

export default function ProvisionsPage() {
  const [provisions, setProvisions] = useState<Provision[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProvision, setSelectedProvision] = useState<Provision | null>(null);
  
  // Editor / Edit State
  const [name, setName] = useState("");
  const [script, setScript] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const fetchProvisions = async () => {
    try {
      setIsLoading(true);
      const res = await apiRequest<{ success: boolean; data: any[] }>("/services/genieacs/provisions");
      if (res.success && res.data) {
        const mapped = (res.data || []).map((p: any) => ({
          _id: p._id || p.name || "unknown",
          name: p._id || p.name || "unknown",
          script: p.script || ""
        }));
        setProvisions(mapped);
        if (mapped.length > 0 && !selectedProvision) {
          handleSelectProvision(mapped[0]);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load provisions");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProvisions();
  }, []);

  const handleSelectProvision = async (prov: Provision) => {
    setSelectedProvision(prov);
    setName(prov.name);
    setScript(prov.script || DEFAULT_PROVISION_SCRIPT);
  };

  const handleCreateNew = () => {
    setSelectedProvision(null);
    setName("");
    setScript(DEFAULT_PROVISION_SCRIPT);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Provision name is required");
      return;
    }
    try {
      setIsSaving(true);
      toast.loading("Saving provision script to GenieACS...", { id: "prov-save" });
      const res = await apiRequest<{ success: boolean; message: string }>("/services/genieacs/provisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, script })
      });
      if (res.success) {
        toast.success(res.message || "Provision saved successfully", { id: "prov-save" });
        fetchProvisions();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to save provision script", { id: "prov-save" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (provName: string) => {
    if (!confirm(`Are you sure you want to delete provision "${provName}"?`)) return;
    try {
      toast.loading("Deleting provision...", { id: "prov-del" });
      const res = await apiRequest<{ success: boolean }>("/services/genieacs/provisions/" + encodeURIComponent(provName), {
        method: "DELETE"
      });
      if (res.success) {
        toast.success("Provision deleted successfully", { id: "prov-del" });
        if (selectedProvision?.name === provName) {
          setSelectedProvision(null);
          setName("");
          setScript("");
        }
        fetchProvisions();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete provision", { id: "prov-del" });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-1">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">GenieACS Provisions</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Manage bootstrap and inform scripts for automated TR-069 CPE provisioning</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">Provisions List</h3>
              <Button size="sm" onClick={handleCreateNew} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-8 text-[10px] font-bold">
                <Plus className="h-3.5 w-3.5 mr-1" /> Create New
              </Button>
            </div>

            <CardContainer title="Scripts" description="Active GenieACS scripts" gradientColor="#6366f1">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <RefreshCw className="h-6 w-6 animate-spin text-indigo-500" />
                </div>
              ) : (
                <div className="space-y-2 mt-2">
                  {provisions.length === 0 ? (
                    <div className="text-center py-8 text-xs text-muted-foreground">No provisions found.</div>
                  ) : (
                    provisions.map((prov) => (
                      <div
                        key={prov.name}
                        onClick={() => handleSelectProvision(prov)}
                        className={`w-full flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all duration-200 ${
                          selectedProvision?.name === prov.name
                            ? "bg-indigo-500/5 border-indigo-500/40 shadow-sm"
                            : "bg-card/60 hover:bg-secondary/20 border-border/60"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/25">
                            <FileCode className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-extrabold text-xs text-slate-800 dark:text-slate-200">{prov.name}</div>
                            <div className="text-[9px] text-muted-foreground font-semibold mt-0.5">TR-069 Trigger Script</div>
                          </div>
                        </div>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-rose-500 hover:bg-rose-500/10 rounded-xl" onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(prov.name);
                        }}>
                          <Trash className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContainer>
          </div>

          <div className="lg:col-span-8 space-y-4">
            <CardContainer title={selectedProvision ? `Edit Provision: ${selectedProvision.name}` : "Create Provision"} description="Edit script content and triggers" gradientColor="#22c55e">
              <div className="space-y-4 mt-2">
                <div className="grid grid-cols-1 gap-2 text-xs font-semibold">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] text-muted-foreground uppercase">Provision Name</Label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={!!selectedProvision}
                      placeholder="e.g. default_bootstrap"
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] text-muted-foreground uppercase">Provision Script</Label>
                    <textarea
                      value={script}
                      onChange={(e) => setScript(e.target.value)}
                      rows={18}
                      className="w-full p-4 rounded-xl border font-mono text-xs bg-secondary/20 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t">
                  <Button onClick={handleSave} disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-9 text-xs font-bold">
                    <CheckCircle className="h-3.5 w-3.5 mr-1.5" /> Save Provision
                  </Button>
                </div>
              </div>
            </CardContainer>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
