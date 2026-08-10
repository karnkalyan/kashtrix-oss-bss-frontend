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
import { Cpu, Trash, Plus, RefreshCw, FileCode, CheckCircle } from "lucide-react";

interface VirtualParameter {
  _id: string;
  name: string;
  script: string;
}

const DEFAULT_VIRTUAL_PARAM_SCRIPT = `// Example script for Virtual Parameter CPU
let cpu = declare("InternetGatewayDevice.DeviceInfo.CPUUsage", {value: 1})[0].value;
return cpu;`;

export default function VirtualParametersPage() {
  const [virtualParams, setVirtualParams] = useState<VirtualParameter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedParam, setSelectedParam] = useState<VirtualParameter | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [script, setScript] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const fetchVirtualParams = async () => {
    try {
      setIsLoading(true);
      const res = await apiRequest<{ success: boolean; data: any[] }>("/services/genieacs/virtual-parameters");
      if (res.success && res.data) {
        const mapped = (res.data || []).map((p: any) => ({
          _id: p._id || p.name || "unknown",
          name: p._id || p.name || "unknown",
          script: p.script || ""
        }));
        setVirtualParams(mapped);
        if (mapped.length > 0 && !selectedParam) {
          handleSelectParam(mapped[0]);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load virtual parameters");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVirtualParams();
  }, []);

  const handleSelectParam = (param: VirtualParameter) => {
    setSelectedParam(param);
    setName(param.name);
    setScript(param.script || DEFAULT_VIRTUAL_PARAM_SCRIPT);
  };

  const handleCreateNew = () => {
    setSelectedParam(null);
    setName("");
    setScript(DEFAULT_VIRTUAL_PARAM_SCRIPT);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Virtual parameter name is required");
      return;
    }
    try {
      setIsSaving(true);
      toast.loading("Saving virtual parameter script...", { id: "vp-save" });
      const res = await apiRequest<{ success: boolean; message: string }>("/services/genieacs/virtual-parameters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, script })
      });
      if (res.success) {
        toast.success(res.message || "Virtual parameter saved successfully", { id: "vp-save" });
        fetchVirtualParams();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to save virtual parameter", { id: "vp-save" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (paramName: string) => {
    if (!confirm(`Are you sure you want to delete virtual parameter "${paramName}"?`)) return;
    try {
      toast.loading("Deleting virtual parameter...", { id: "vp-del" });
      const res = await apiRequest<{ success: boolean }>("/services/genieacs/virtual-parameters/" + encodeURIComponent(paramName), {
        method: "DELETE"
      });
      if (res.success) {
        toast.success("Virtual parameter deleted successfully", { id: "vp-del" });
        if (selectedParam?.name === paramName) {
          setSelectedParam(null);
          setName("");
          setScript("");
        }
        fetchVirtualParams();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete virtual parameter", { id: "vp-del" });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-1">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">Virtual Parameters</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Manage custom virtual calculations mapped to TR-069 device parameters</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">Parameter Names</h3>
              <Button size="sm" onClick={handleCreateNew} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-8 text-[10px] font-bold">
                <Plus className="h-3.5 w-3.5 mr-1" /> Add New
              </Button>
            </div>

            <CardContainer title="Virtual Names" description="Defined virtual calculations" gradientColor="#a855f7">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <RefreshCw className="h-6 w-6 animate-spin text-purple-500" />
                </div>
              ) : (
                <div className="space-y-2 mt-2">
                  {virtualParams.length === 0 ? (
                    <div className="text-center py-8 text-xs text-muted-foreground">No virtual parameters found.</div>
                  ) : (
                    virtualParams.map((param) => (
                      <div
                        key={param.name}
                        onClick={() => handleSelectParam(param)}
                        className={`w-full flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all duration-200 ${
                          selectedParam?.name === param.name
                            ? "bg-purple-500/5 border-purple-500/40 shadow-sm"
                            : "bg-card/60 hover:bg-secondary/20 border-border/60"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500 border border-purple-500/25">
                            <Cpu className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-extrabold text-xs text-slate-800 dark:text-slate-200">{param.name}</div>
                            <div className="text-[9px] text-muted-foreground font-semibold mt-0.5">Virtual Parameter</div>
                          </div>
                        </div>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-rose-500 hover:bg-rose-500/10 rounded-xl" onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(param.name);
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
            <CardContainer title={selectedParam ? `Edit Virtual Param: ${selectedParam.name}` : "Create Virtual Param"} description="Define expression script" gradientColor="#22c55e">
              <div className="space-y-4 mt-2">
                <div className="grid grid-cols-1 gap-2 text-xs font-semibold">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] text-muted-foreground uppercase">Parameter Name</Label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={!!selectedParam}
                      placeholder="e.g. CPU"
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] text-muted-foreground uppercase">Virtual Script</Label>
                    <textarea
                      value={script}
                      onChange={(e) => setScript(e.target.value)}
                      rows={18}
                      className="w-full p-4 rounded-xl border font-mono text-xs bg-secondary/20 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t">
                  <Button onClick={handleSave} disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-9 text-xs font-bold">
                    <CheckCircle className="h-3.5 w-3.5 mr-1.5" /> Save Parameter
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
