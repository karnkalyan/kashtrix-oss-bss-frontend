"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { CardContainer } from "@/components/ui/card-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/api";
import { toast } from "react-hot-toast";
import { Settings, CheckCircle, RefreshCw, Server, Lock, Globe, Eye, EyeOff } from "lucide-react";

export default function ConfigPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [baseUrl, setBaseUrl] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [credentials, setCredentials] = useState<any[]>([]);

  const fetchConfig = async () => {
    try {
      setIsLoading(true);
      const res = await apiRequest<{ success: boolean; data: any }>("/services/genieacs/config");
      if (res.success && res.data) {
        setBaseUrl(res.data.baseUrl || "");
        const creds = res.data.credentials || [];
        setCredentials(creds);
        const userCred = creds.find((c: any) => c.key === "username");
        const passCred = creds.find((c: any) => c.key === "password");
        if (userCred) setUsername(userCred.value);
        if (passCred) setPassword(passCred.value);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load GenieACS config");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      toast.loading("Updating GenieACS configuration...", { id: "config-save" });
      const res = await apiRequest<{ success: boolean; message: string }>("/services/genieacs/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baseUrl, username, password })
      });
      if (res.success) {
        toast.success(res.message || "Configuration updated successfully", { id: "config-save" });
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update configuration", { id: "config-save" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-1">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">GenieACS Configuration</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Manage the connection parameters to your GenieACS ACS server</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CardContainer title="Server Connection" description="GenieACS NBI endpoint settings" gradientColor="#f59e0b">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <RefreshCw className="h-6 w-6 animate-spin text-amber-500" />
              </div>
            ) : (
              <div className="space-y-5 mt-3 text-xs font-semibold">
                <div className="space-y-1.5">
                  <Label className="text-[10px] text-muted-foreground uppercase flex items-center gap-1.5">
                    <Globe className="h-3 w-3" /> ACS Base URL
                  </Label>
                  <Input
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    placeholder="http://acs.example.com:7557"
                    className="rounded-xl font-mono"
                  />
                  <p className="text-[9px] text-muted-foreground">The NBI API endpoint of your GenieACS server (port 7557 by default)</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] text-muted-foreground uppercase flex items-center gap-1.5">
                    <Server className="h-3 w-3" /> Username
                  </Label>
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="admin"
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] text-muted-foreground uppercase flex items-center gap-1.5">
                    <Lock className="h-3 w-3" /> Password
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="rounded-xl pr-10"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 rounded-lg"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </div>

                <div className="pt-3 border-t">
                  <Button onClick={handleSave} disabled={isSaving} className="w-full bg-amber-600 hover:bg-amber-700 text-white rounded-xl h-9 text-xs font-bold">
                    <CheckCircle className="h-3.5 w-3.5 mr-1.5" /> Save Configuration
                  </Button>
                </div>
              </div>
            )}
          </CardContainer>

          <CardContainer title="Connection Status" description="Current credential state" gradientColor="#22c55e">
            <div className="space-y-4 mt-3 text-xs font-semibold">
              <div className="space-y-2">
                {credentials.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No credentials configured yet.</div>
                ) : (
                  credentials.map((cred: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-2xl border bg-card/60">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/25">
                          {cred.credentialType === "PASSWORD" ? <Lock className="h-4 w-4" /> : <Server className="h-4 w-4" />}
                        </div>
                        <div>
                          <div className="font-extrabold text-xs text-slate-800 dark:text-slate-200">{cred.label || cred.key}</div>
                          <div className="text-[9px] text-muted-foreground font-mono">
                            {cred.credentialType === "PASSWORD" ? "••••••••" : cred.value}
                          </div>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${cred.isActive ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-500"}`}>
                        {cred.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div className="p-3 rounded-2xl border bg-amber-500/5 border-amber-500/20">
                <p className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold">
                  💡 The ACS Base URL is used by the backend to proxy all GenieACS NBI requests (provisions, presets, virtual parameters, files, and device management).
                </p>
              </div>
            </div>
          </CardContainer>
        </div>
      </div>
    </DashboardLayout>
  );
}
