"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { CardContainer } from "@/components/ui/card-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/api";
import { toast } from "react-hot-toast";
import { Users, Trash, Plus, RefreshCw, CheckCircle, UserCircle } from "lucide-react";

interface User {
  id: number;
  email: string;
  role?: { name: string };
  createdAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [roleId, setRoleId] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const res = await apiRequest<{ success: boolean; data: User[] }>("/services/genieacs/users");
      if (res.success && res.data) {
        setUsers(res.data);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load users");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSave = async () => {
    if (!email.trim() || !password.trim() || !roleId.trim()) {
      toast.error("Email, password, and role ID are required");
      return;
    }
    try {
      setIsSaving(true);
      const res = await apiRequest<{ success: boolean; data: any }>("/services/genieacs/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, roleId: parseInt(roleId) })
      });
      if (res.success) {
        toast.success("User created successfully");
        setEmail("");
        setPassword("");
        setRoleId("");
        setShowForm(false);
        fetchUsers();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to create user");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      const res = await apiRequest<{ success: boolean }>(`/services/genieacs/users/${id}`, { method: "DELETE" });
      if (res.success) {
        toast.success("User deleted");
        fetchUsers();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete user");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-1">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">System Users</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Manage operator accounts with access to TR-069 management</p>
          </div>
          <Button size="sm" onClick={() => setShowForm(!showForm)} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-8 text-[10px] font-bold">
            <Plus className="h-3.5 w-3.5 mr-1" /> Add User
          </Button>
        </div>

        {showForm && (
          <CardContainer title="Create User" description="Register a new system operator" gradientColor="#22c55e">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-3 text-xs font-semibold">
              <div className="space-y-1.5">
                <Label className="text-[10px] text-muted-foreground uppercase">Email</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="operator@isp.com" className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] text-muted-foreground uppercase">Password</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] text-muted-foreground uppercase">Role ID</Label>
                <Input type="number" value={roleId} onChange={(e) => setRoleId(e.target.value)} placeholder="1" className="rounded-xl" />
              </div>
              <div className="flex items-end">
                <Button onClick={handleSave} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-9 text-xs font-bold w-full">
                  <CheckCircle className="h-3.5 w-3.5 mr-1.5" /> Create
                </Button>
              </div>
            </div>
          </CardContainer>
        )}

        <CardContainer title="User Accounts" description="Registered operators" gradientColor="#0ea5e9">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-sky-500" />
            </div>
          ) : (
            <div className="overflow-x-auto mt-2">
              <table className="w-full text-left text-xs font-semibold">
                <thead>
                  <tr className="border-b border-border/60 text-muted-foreground text-[10px] uppercase font-bold">
                    <th className="py-2.5">ID</th>
                    <th className="py-2.5">Email</th>
                    <th className="py-2.5">Role</th>
                    <th className="py-2.5">Created</th>
                    <th className="py-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-muted-foreground">No users found.</td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.id} className="border-b border-border/30 hover:bg-secondary/15 transition-colors">
                        <td className="py-3 font-mono text-muted-foreground">{user.id}</td>
                        <td className="py-3 flex items-center gap-2">
                          <UserCircle className="h-4 w-4 text-sky-500" />
                          <span className="text-slate-800 dark:text-slate-200">{user.email}</span>
                        </td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-sky-500/10 text-sky-600">
                            {user.role?.name || "N/A"}
                          </span>
                        </td>
                        <td className="py-3 text-[10px] text-muted-foreground">{new Date(user.createdAt).toLocaleDateString()}</td>
                        <td className="py-3 text-right">
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-rose-500 hover:bg-rose-500/10 rounded-xl" onClick={() => handleDelete(user.id)}>
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
