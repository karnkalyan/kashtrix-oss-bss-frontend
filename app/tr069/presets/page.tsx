"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { CardContainer } from "@/components/ui/card-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/api";
import { toast } from "react-hot-toast";
import { Settings, Trash, Plus, RefreshCw, Layers, CheckCircle } from "lucide-react";

interface Preset {
  _id: string;
  name: string;
  presetData: string;
}

export default function PresetsPage() {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPreset, setSelectedPreset] = useState<Preset | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [presetData, setPresetData] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const fetchPresets = async () => {
    try {
      setIsLoading(true);
      const res = await apiRequest<{ success: boolean; data: any[] }>("/services/genieacs/presets");
      if (res.success && res.data) {
        const mapped = (res.data || []).map((p: any) => ({
          _id: p._id || p.name || "unknown",
          name: p._id || p.name || "unknown",
          presetData: JSON.stringify(p, null, 2)
        }));
        setPresets(mapped);
        if (mapped.length > 0 && !selectedPreset) {
          handleSelectPreset(mapped[0]);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load presets");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPresets();
  }, []);

  const handleSelectPreset = (preset: Preset) => {
    setSelectedPreset(preset);
    setName(preset.name);
    setPresetData(preset.presetData || "{}");
  };

  const handleCreateNew = () => {
    setSelectedPreset(null);
    setName("");
    setPresetData(JSON.stringify({
      channel: "boot",
      weight: 0,
      precondition: "{}",
      configurations: []
    }, null, 2));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Preset name is required");
      return;
    }
    try {
      setIsSaving(true);
      toast.loading("Saving preset...", { id: "preset-save" });
      const res = await apiRequest<{ success: boolean; message: string }>("/services/genieacs/presets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, presetData })
      });
      if (res.success) {
        toast.success(res.message || "Preset saved successfully", { id: "preset-save" });
        fetchPresets();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to save preset", { id: "preset-save" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (presetName: string) => {
    if (!confirm(`Are you sure you want to delete preset "${presetName}"?`)) return;
    try {
      toast.loading("Deleting preset...", { id: "preset-del" });
      const res = await apiRequest<{ success: boolean }>("/services/genieacs/presets/" + encodeURIComponent(presetName), {
        method: "DELETE"
      });
      if (res.success) {
        toast.success("Preset deleted successfully", { id: "preset-del" });
        if (selectedPreset?.name === presetName) {
          setSelectedPreset(null);
          setName("");
          setPresetData("");
        }
        fetchPresets();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete preset", { id: "preset-del" });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-1">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">Presets</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Define presets to run scripts or configure devices based on preconditions</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">Presets List</h3>
              <Button size="sm" onClick={handleCreateNew} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-8 text-[10px] font-bold">
                <Plus className="h-3.5 w-3.5 mr-1" /> Create Preset
              </Button>
            </div>

            <CardContainer title="Presets" description="Configured presets" gradientColor="#ec4899">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <RefreshCw className="h-6 w-6 animate-spin text-pink-500" />
                </div>
              ) : (
                <div className="space-y-2 mt-2">
                  {presets.length === 0 ? (
                    <div className="text-center py-8 text-xs text-muted-foreground">No presets found.</div>
                  ) : (
                    presets.map((preset) => (
                      <div
                        key={preset.name}
                        onClick={() => handleSelectPreset(preset)}
                        className={`w-full flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all duration-200 ${
                          selectedPreset?.name === preset.name
                            ? "bg-pink-500/5 border-pink-500/40 shadow-sm"
                            : "bg-card/60 hover:bg-secondary/20 border-border/60"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-pink-500/10 text-pink-500 border border-pink-500/25">
                            <Layers className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-extrabold text-xs text-slate-800 dark:text-slate-200">{preset.name}</div>
                            <div className="text-[9px] text-muted-foreground font-semibold mt-0.5">Preset config</div>
                          </div>
                        </div>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-rose-500 hover:bg-rose-500/10 rounded-xl" onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(preset.name);
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
            <CardContainer title={selectedPreset ? `Edit Preset: ${selectedPreset.name}` : "Create Preset"} description="Edit preset definitions" gradientColor="#22c55e">
              <div className="space-y-4 mt-2">
                <div className="grid grid-cols-1 gap-2 text-xs font-semibold">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] text-muted-foreground uppercase">Preset Name</Label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={!!selectedPreset}
                      placeholder="e.g. boot_config"
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] text-muted-foreground uppercase">Preset Data (JSON)</Label>
                    <textarea
                      value={presetData}
                      onChange={(e) => setPresetData(e.target.value)}
                      rows={18}
                      className="w-full p-4 rounded-xl border font-mono text-xs bg-secondary/20 focus:outline-none focus:ring-1 focus:ring-pink-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t">
                  <Button onClick={handleSave} disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-9 text-xs font-bold">
                    <CheckCircle className="h-3.5 w-3.5 mr-1.5" /> Save Preset
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
