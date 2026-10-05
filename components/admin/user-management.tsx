"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UsersList } from "@/components/admin/users-list"
import { AddUserForm } from "@/components/admin/add-user-form"
import { CardContainer } from "@/components/ui/card-container"
import { EditUserForm } from "@/components/admin/edit-user-form"
import { UserDetails } from "@/components/admin/user-details"
import { DeleteUserDialog } from "@/components/admin/delete-user-dialog"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { toast } from "react-hot-toast"
import { apiRequest, getDynamicBaseUrl } from "@/lib/api"

export type User = {
  id: string
  name: string
  email: string
  role: string
  status: "active" | "inactive" | "pending"
  lastLogin: string
  createdAt: string
  avatar?: string
  department?: string
  branchId?: string
  branchName?: string
  branchIds?: string[]
  branchNames?: string[]
  yeastarExt?: string | null
  permissions?: string[]
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [activeTab, setActiveTab] = useState("users-list")
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // ← NEW: real-departments state
  const [departmentOptions, setDepartmentOptions] = useState<{ value: string; label: string }[]>([])
  const [roleOptions, setRoleOptions] = useState<{ value: string; label: string }[]>([])
  const [branchOptions, setBranchOptions] = useState<any[]>([])

  // ← NEW: fetch and map your JSON array
const fetchDepartments = async () => {
  try {
    const raw = await apiRequest("/department")

    // FIX: access correct field
    const departments = raw?.data

    if (!Array.isArray(departments)) {
      throw new Error("Invalid department response")
    }

    const opts = departments.map((d: any) => ({
      value: String(d.id),
      label: d.name
    }))

    setDepartmentOptions(opts)

  } catch (err: any) {
    console.error("dept fetch failed:", err)
    toast.error("Failed to load departments")
    setDepartmentOptions([])
  }
}

  useEffect(() => {
    fetchDepartments()
  }, [])



  const fetchRoles = async () => {
    try {
      const raw = await apiRequest("/roles")
      if (!Array.isArray(raw)) {
        throw new Error("Expected array of roles")
      }
      const opts = raw.map((d: any) => ({ value: String(d.id), label: d.name }))
      setRoleOptions(opts)
    } catch (err: any) {
      console.error("dept fetch failed:", err)
      toast.error("Failed to load departments")
      setRoleOptions([])
    }
  }

  useEffect(() => {
    fetchRoles()
  }, [])

  const fetchBranches = async () => {
    try {
      const raw = await apiRequest("/branches")
      if (!Array.isArray(raw)) {
        throw new Error("Expected array of branches")
      }
      const opts = raw
        .filter((branch: any) => branch.isActive !== false)
        .map((branch: any) => ({
          value: String(branch.id),
          id: String(branch.id),
          label: `${branch.name}${branch.code ? ` (${branch.code})` : ""}`,
          name: branch.name,
          code: branch.code,
          parentId: branch.parentId ? String(branch.parentId) : null,
          parent: branch.parent || null,
        }))
      setBranchOptions(opts)
    } catch (err: any) {
      console.error("branch fetch failed:", err)
      toast.error("Failed to load branches")
      setBranchOptions([])
    }
  }

  useEffect(() => {
    fetchBranches()
  }, [])





  // const roleOptions = [
  //   { value: "1", label: "Administrator" },
  //   { value: "2", label: "Manager" },
  //   { value: "3", label: "Support" },
  //   { value: "4", label: "Technician" },
  //   { value: "5", label: "Billing" },
  //   { value: "6", label: "Customer" },
  // ]

  const buildAvatarUrl = (avatarPath?: string | null) => {
    const base = getDynamicBaseUrl().replace(/\/+$/, "")
    const path = avatarPath?.replace(/^\/+/, "") ?? ""
    return path ? `${base}/${path}` : "/placeholder.svg"
  }

  const roleToLabel = (val: any) => {
    return roleOptions.find((r) => r.value === String(val))?.label ?? String(val)
  }

  const deptToLabel = (val: any) => {
    if (val == null) return "-"
    return (
      departmentOptions.find((d) => d.value === String(val))?.label ??
      String(val)
    )
  }

  const fetchUsers = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiRequest("/users")
      const mapped: User[] = data
        .filter((u: any) => String(u.role?.name || "").toLowerCase() !== "customer")
        .map((u: any) => ({
        id: String(u.id),
        name: u.name,
        email: u.email,
        role: String(u.roleId || u.role?.id || ""),
        status: u.status,
        lastLogin: u.lastLogin ?? "-",
        createdAt: u.createdAt,
        avatar: u.profilePicture ?? "",
        department: String(u.departmentId || u.department?.id || ""),
        branchId: u.branchId ? String(u.branchId) : "",
        branchName: u.branch?.name || "",
        branchIds: (u.userBranches || []).map((userBranch: any) => String(userBranch.branchId || userBranch.branch?.id)),
        branchNames: (u.userBranches || []).map((userBranch: any) => userBranch.branch?.name).filter(Boolean),
        yeastarExt: u.yeastarExt || "",
        permissions: u.role?.permissions?.map((permission: any) => permission.name) || [],
      }))
      setUsers(mapped)
    } catch (err: any) {
      console.error("user fetch failed:", err)
      toast.error(err.message)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleAddUser = () => {
    fetchUsers()
    setActiveTab("users-list")
    toast.success("User created!")
  }

  const handleEditComplete = () => {
    fetchUsers()
    setActiveTab("users-list")
    toast.success("User updated!")
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
  
    try {
      await apiRequest(`/users/${selectedUser.id}`, {
        method: 'DELETE',
      });
      toast.success("User deleted successfully!");
      // If we reach this point, the request was successful (status 2xx)
      fetchUsers();
      setSelectedUser(null);
      setShowDeleteDialog(false);
      toast.success("Deleted!");
    } catch (err: any) {
      // The error caught here will be the one thrown by apiRequest
      // (e.g., 'Session expired. Please log in again.', 'HTTP 404', or a custom error message from the backend)
      console.error("delete error:", err);
      toast.error(err.message || "An unknown error occurred during deletion.");
    }
  };

  const handleViewUser = (u: User) => {
    setSelectedUser(u)
    setActiveTab("user-details")
  }
  const handleEditClick = (u: User) => {
    setSelectedUser(u)
    setActiveTab("edit-user")
  }
  const handleDeleteClick = (u: User) => {
    setSelectedUser(u)
    setShowDeleteDialog(true)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8 text-muted-foreground">
        Loading…
      </div>
    )
  }
  if (error) {
    return (
      <div className="p-8 text-center text-destructive bg-red-800 text-white rounded-lg">
        {error}
        <Button onClick={fetchUsers} className="ml-4">
          Retry
        </Button>
      </div>
    )
  }

  return (
    <>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex justify-between items-center mb-4">
          <TabsList className="grid grid-cols-4">
            <TabsTrigger value="users-list">Users List</TabsTrigger>
            <TabsTrigger value="add-user">Add User</TabsTrigger>
            {selectedUser && (
              <TabsTrigger value="user-details">Details</TabsTrigger>
            )}
            {selectedUser && (
              <TabsTrigger value="edit-user">Edit</TabsTrigger>
            )}
          </TabsList>
          {activeTab === "users-list" && (
            <Button onClick={() => setActiveTab("add-user")} size="sm">
              <Plus className="h-4 w-4 mr-2" /> Add User
            </Button>
          )}
        </div>

        <TabsContent value="users-list">
          <CardContainer
            title="System Users"
            description="Manage all system users"
            gradientColor="#6366f1"
          >
            <UsersList
              users={users}
              onView={handleViewUser}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
              roleOptions={roleOptions}
              departmentOptions={departmentOptions}
              branchOptions={branchOptions}
              buildAvatarUrl={buildAvatarUrl}
            />
          </CardContainer>
        </TabsContent>

        <TabsContent value="add-user">
          <CardContainer
            title="Add New User"
            description="Create a new user"
            gradientColor="#8b5cf6"
          >
            <AddUserForm
              onSubmit={handleAddUser}
              onCancel={() => setActiveTab("users-list")}
              roles={roleOptions}
              departments={departmentOptions}
              branches={branchOptions}
            />
          </CardContainer>
        </TabsContent>

        <TabsContent value="user-details">
          {selectedUser && (
            <CardContainer
              title="User Details"
              description="View info"
              gradientColor="#6366f1"
            >
              <UserDetails
                user={selectedUser}
                roles={roleOptions}
                departments={departmentOptions}
                branches={branchOptions}
                buildAvatarUrl={buildAvatarUrl}
                onEdit={() => setActiveTab("edit-user")}
                onBack={() => setActiveTab("users-list")}
              />
            </CardContainer>
          )}
        </TabsContent>

        <TabsContent value="edit-user">
          {selectedUser && (
            <CardContainer
              title="Edit User"
              description="Modify info"
              gradientColor="#6366f1"
            >
              <EditUserForm
                user={selectedUser}
                onComplete={handleEditComplete}
                onCancel={() => setActiveTab("users-list")}
                roles={roleOptions}
                departments={departmentOptions}
                branches={branchOptions}
                buildAvatarUrl={buildAvatarUrl}
              />
            </CardContainer>
          )}
        </TabsContent>
      </Tabs>

      {showDeleteDialog && selectedUser && (
        <DeleteUserDialog
          user={selectedUser}
          open={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          onConfirm={handleDeleteUser}
        />
      )}
    </>
  )
}
