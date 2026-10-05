"use client"

import React, { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "react-hot-toast"
import { Upload } from "lucide-react"
import { apiRequest } from "@/lib/api"
import { BranchHierarchySelector, type BranchItem } from "@/components/admin/branch-hierarchy-selector"

interface Option {
  label: string
  value: string // Value will be the string representation of the ID
}

interface AddUserFormProps {
  onSubmit: () => void
  onCancel: () => void
  roles: Array<Option>
  departments: Array<Option> // departments now provides value as stringified IDs
  branches: Array<BranchItem>
}

export function AddUserForm({ onSubmit, onCancel, roles, departments, branches }: AddUserFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    roleId: "", // CHANGED: Renamed from 'role' to 'roleId' to match backend
    status: "pending" as "active" | "inactive" | "pending",
    departmentId: "", // CHANGED: Renamed from 'department' to 'departmentId'
    branchId: "",
    yeastarExt: "",
  })
  const [branchIds, setBranchIds] = useState<string[]>([])

  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null)
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setProfilePictureFile(file)

    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          setProfilePicturePreview(event.target.result as string)
        }
      }
      reader.readAsDataURL(file)
    } else {
      setProfilePicturePreview(null)
    }
  }

  const handleSelectChange = (name: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (name === "branchId") {
      if (value && value !== "none") {
        // Also ensure the primary branch is in branchIds so it reflects in the hierarchy
        setBranchIds((prev) => (prev.includes(value) ? prev : [...prev, value]))
      }
    }
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  // Format branches hierarchically for primary branch dropdown
  const hierarchicalPrimaryOptions = React.useMemo(() => {
    const map = new Map<string, BranchItem>()
    branches.forEach((b) => map.set(String(b.value), b))
    const isSub = (b: BranchItem) =>
      Boolean(b.parentId && b.parentId !== "none" && map.has(String(b.parentId)))
    const parents = branches.filter((b) => !isSub(b))

    const items: Array<{ value: string; label: string; isSub: boolean }> = []
    parents.forEach((parent) => {
      items.push({
        value: String(parent.value),
        label: `${parent.name || parent.label}${parent.code ? ` (${parent.code})` : ""}`,
        isSub: false,
      })
      const subs = branches.filter(
        (b) => isSub(b) && String(b.parentId) === String(parent.value)
      )
      subs.forEach((sub) => {
        items.push({
          value: String(sub.value),
          label: `  ↳ ${sub.name || sub.label}${sub.code ? ` (${sub.code})` : ""}`,
          isSub: true,
        })
      })
    })

    const listed = new Set(items.map((i) => i.value))
    branches.forEach((b) => {
      if (!listed.has(String(b.value))) {
        items.push({
          value: String(b.value),
          label: `${b.name || b.label}${b.code ? ` (${b.code})` : ""}`,
          isSub: false,
        })
      }
    })

    return items
  }, [branches])

  const isGlobalRole = useMemo(() => {
    const roleObj = roles.find((r) => r.value === formData.roleId)
    const roleName = String(roleObj?.label || "").toLowerCase()
    return roleName.includes("global") || roleName.includes("admin")
  }, [roles, formData.roleId])

  // Frontend validation (still good to have for immediate feedback)
  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) newErrors.name = "Name is required"
    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid"
    }
    if (!formData.password) newErrors.password = "Password is required"
    else if (formData.password.length < 8) newErrors.password = "Minimum 8 characters"

    if (!formData.roleId) newErrors.roleId = "Role is required" // CHANGED: Validate roleId
    if (formData.yeastarExt.trim() && !/^\d{1,7}$/.test(formData.yeastarExt.trim())) {
      newErrors.yeastarExt = "VoIP extension must be 1 to 7 digits"
    }
    // DepartmentId is optional based on schema, so no validation needed here unless it's strictly required by your business logic
    // if (!formData.departmentId) newErrors.departmentId = "Department is required"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
  
    setIsSubmitting(true);
  
    try {
      const data = new FormData();
      data.append("name", formData.name || "");
      data.append("email", formData.email || "");
      data.append("password", formData.password);
      data.append("roleId", formData.roleId);
      data.append("status", formData.status || "pending");
      if (formData.departmentId) {
        data.append("departmentId", formData.departmentId);
      }
      if (formData.branchId && formData.branchId !== "none") {
        data.append("branchId", formData.branchId);
      } else {
        data.append("branchId", "");
      }
      if (formData.yeastarExt.trim()) {
        data.append("yeastarExt", formData.yeastarExt.trim());
      }
      data.append("branchIds", JSON.stringify(branchIds.filter((id) => id !== formData.branchId && id !== "none")));
      if (profilePictureFile) {
        data.append("profilePicture", profilePictureFile);
      }
  
      await apiRequest(`/users`, {
        method: 'POST',
        body: data,
      });
  
      onSubmit();
      setFormData({
        name: "",
        email: "",
        password: "",
        roleId: "",
        status: "pending",
        departmentId: "",
        branchId: "",
        yeastarExt: "",
      });
      setBranchIds([]);
      setProfilePictureFile(null);
      setProfilePicturePreview(null);
      setErrors({});
      toast.success("User added successfully!");
  
    } catch (err: any) {
      console.error("Add user failed:", err);
  
      let errorMessage = "An unexpected error occurred during user creation.";
      let backendErrors: Record<string, string> = {};
  
      if (err.message) {
        try {
          const parsedErr = JSON.parse(err.message);
          if (parsedErr.errors && Array.isArray(parsedErr.errors) && parsedErr.errors.length > 0) {
            parsedErr.errors.forEach((e: any) => {
              if (e.path && e.msg) {
                backendErrors[e.path] = e.msg;
              }
            });
            setErrors(backendErrors);
            errorMessage = parsedErr.errors[0].msg || parsedErr.message || errorMessage;
          } else if (parsedErr.message) {
            errorMessage = parsedErr.message;
          } else if (parsedErr.error) {
            errorMessage = parsedErr.error;
          } else {
            errorMessage = err.message;
          }
        } catch (jsonParseError) {
          errorMessage = err.message;
        }
      }
  
      toast.error(errorMessage);
      if (Object.keys(backendErrors).length > 0) {
        setErrors(backendErrors);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="add-name">Full Name</Label>
          <Input
            id="add-name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="John Doe"
          />
          {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="add-email">Email Address</Label>
          <Input
            id="add-email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="john.doe@example.com"
          />
          {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="add-password">Password</Label>
          <Input
            id="add-password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter password"
          />
          {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="add-role">Role</Label>
          <Select value={formData.roleId} onValueChange={(val) => handleSelectChange("roleId", val)}> {/* CHANGED: Control roleId */}
            <SelectTrigger id="add-role">
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              {roles.map((role) => (
                <SelectItem key={role.value} value={role.value}>
                  {role.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.roleId && <p className="text-sm text-destructive">{errors.roleId}</p>} {/* CHANGED: Display roleId error */}
        </div>

        <div className="space-y-2">
          <Label htmlFor="add-department">Department</Label>
          <Select value={formData.departmentId} onValueChange={(val) => handleSelectChange("departmentId", val)}> {/* CHANGED: Control departmentId */}
            <SelectTrigger id="add-department">
              <SelectValue placeholder="Select a department" />
            </SelectTrigger>
            <SelectContent>
              {departments.map((dept) => (
                <SelectItem key={dept.value} value={dept.value}>
                  {dept.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.departmentId && <p className="text-sm text-destructive">{errors.departmentId}</p>} {/* CHANGED: Display departmentId error */}
        </div>

        <div className="space-y-2">
          <Label htmlFor="add-status">Status</Label>
          <Select value={formData.status} onValueChange={(val) => handleSelectChange("status", val as "active" | "inactive" | "pending")}>
            <SelectTrigger id="add-status">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="add-primary-branch">
              Primary Branch
              {isGlobalRole && (
                <span className="text-xs font-normal text-muted-foreground ml-1.5">
                  (Optional - Global Access)
                </span>
              )}
            </Label>
            {formData.branchId && formData.branchId !== "none" && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleSelectChange("branchId", "none")}
                className="h-6 px-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                Clear / Deselect
              </Button>
            )}
          </div>
          <Select value={formData.branchId || "none"} onValueChange={(val) => handleSelectChange("branchId", val)}>
            <SelectTrigger id="add-primary-branch">
              <SelectValue placeholder="Select primary branch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none" className="font-semibold text-primary">
                No Primary Branch (Global / All Branches)
              </SelectItem>
              {hierarchicalPrimaryOptions.map((branch) => (
                <SelectItem key={branch.value} value={branch.value}>
                  <span className={branch.isSub ? "text-muted-foreground pl-2" : "font-medium"}>
                    {branch.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="add-yeastar-ext">VoIP Extension</Label>
          <Input
            id="add-yeastar-ext"
            name="yeastarExt"
            value={formData.yeastarExt}
            onChange={handleChange}
            inputMode="numeric"
            placeholder="888"
          />
          {errors.yeastarExt && <p className="text-sm text-destructive">{errors.yeastarExt}</p>}
        </div>
      </div>

      <div className="pt-2 border-t">
        <BranchHierarchySelector
          branches={branches}
          selectedBranchIds={branchIds}
          onChange={setBranchIds}
          primaryBranchId={formData.branchId === "none" ? undefined : formData.branchId}
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="add-profile-picture" className="text-sm font-medium">Profile Picture</Label>
        <div className="flex items-center gap-4">
          <div className="border border-border rounded-md p-2 flex-1">
            <div className="relative border-2 border-dashed border-border rounded-md p-4 flex flex-col items-center justify-center gap-2">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Drag & drop or <span className="text-primary">browse</span>
              </p>
              <input
                id="add-profile-picture"
                type="file"
                accept="image/*"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={handleProfilePictureChange}
              />
            </div>
          </div>
          {profilePicturePreview && (
            <div className="h-20 w-20 rounded-md overflow-hidden border border-border">
              <img
                src={profilePicturePreview}
                alt="Profile preview"
                className="h-full w-full object-contain"
              />
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Recommended size: 512x512px. Max file size: 2MB
        </p>
      </div>

      <div className="flex justify-end space-x-4 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Adding User..." : "Create User"}
        </Button>
      </div>
    </form>
  )
}
