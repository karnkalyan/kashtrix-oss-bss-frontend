"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { CardContainer } from "@/components/ui/card-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/api";
import { toast } from "react-hot-toast";
import { Shield, Trash, Plus, RefreshCw, CheckCircle } from "lucide-react";

interface Permission {
  id: number;
  name: string;
  description?: string;
}

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const fetchPermissions = async () => {
    try {
      setIsLoading(true);
      const res = await apiRequest<{ success: boolean; data: Permission[] }>("/services/genieacs/permissions");
      if (res.success && res.data) {
        setPermissions(res.data);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load permissions");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Permission name is required");
      return;
    }
    try {
      setIsSaving(true);
      const res = await apiRequest<{ success: boolean; data: Permission }>("/services/genieacs/permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description })
      });
      if (res.success) {
        toast.success("Permission created successfully");
        setName("");
        setDescription("");
        setShowForm(false);
        fetchPermissions();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to create permission");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this permission?")) return;
    try {
      const res = await apiRequest<{ success: boolean }>(`/services/genieacs/permissions/${id}`, { method: "DELETE" });
      if (res.success) {
        toast.success("Permission deleted");
        fetchPermissions();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete permission");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-1">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">Permissions</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Manage access control permissions for TR-069 operations</p>
          </div>
          <Button size="sm" onClick={() => setShowForm(!showForm)} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-8 text-[10px] font-bold">
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Permission
          </Button>
        </div>

        {showForm && (
          <CardContainer title="Create Permission" description="Define a new access control entry" gradientColor="#22c55e">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3 text-xs font-semibold">
              <div className="space-y-1.5">
                <Label className="text-[10px] text-muted-foreground uppercase">Permission Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. tr069_devices_manage" className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] text-muted-foreground uppercase">Description</Label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Allows managing TR-069 devices" className="rounded-xl" />
              </div>
              <div className="flex items-end">
                <Button onClick={handleSave} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-9 text-xs font-bold w-full">
                  <CheckCircle className="h-3.5 w-3.5 mr-1.5" /> Save
                </Button>
              </div>
            </div>
          </CardContainer>
        )}

        <CardContainer title="Permission Entries" description="Active permission definitions" gradientColor="#8b5cf6">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-violet-500" />
            </div>
          ) : (
            <div className="overflow-x-auto mt-2">
              <table className="w-full text-left text-xs font-semibold">
                <thead>
                  <tr className="border-b border-border/60 text-muted-foreground text-[10px] uppercase font-bold">
                    <th className="py-2.5">ID</th>
                    <th className="py-2.5">Permission Name</th>
                    <th className="py-2.5">Description</th>
                    <th className="py-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {permissions.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-muted-foreground">No permissions found.</td>
                    </tr>
                  ) : (
                    permissions.map((perm) => (
                      <tr key={perm.id} className="border-b border-border/30 hover:bg-secondary/15 transition-colors">
                        <td className="py-3 font-mono text-muted-foreground">{perm.id}</td>
                        <td className="py-3 flex items-center gap-2">
                          <Shield className="h-3.5 w-3.5 text-violet-500" />
                          <span className="text-slate-800 dark:text-slate-200">{perm.name}</span>
                        </td>
                        <td className="py-3 text-muted-foreground text-[10px]">{perm.description || "—"}</td>
                        <td className="py-3 text-right">
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-rose-500 hover:bg-rose-500/10 rounded-xl" onClick={() => handleDelete(perm.id)}>
                            <Trash className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContainer>
      </div>
    </DashboardLayout>
  );
}
