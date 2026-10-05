"use client"

import React, { useState, useMemo, useEffect, useRef } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Building2, GitBranch, X, Check, Plus, ChevronDown, ChevronUp } from "lucide-react"

export interface BranchItem {
  value: string
  label: string
  id?: string | number
  name?: string
  code?: string
  parentId?: string | number | null
  parent?: { id: number | string; name: string } | null
}

interface BranchHierarchySelectorProps {
  branches: BranchItem[]
  selectedBranchIds: string[]
  onChange: (newBranchIds: string[]) => void
  primaryBranchId?: string
  disabled?: boolean
}

export function BranchHierarchySelector({
  branches,
  selectedBranchIds,
  onChange,
  primaryBranchId,
  disabled = false,
}: BranchHierarchySelectorProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [activeMainBranchIds, setActiveMainBranchIds] = useState<string[]>([])
  const [collapsedBranches, setCollapsedBranches] = useState<Record<string, boolean>>({})
  const searchContainerRef = useRef<HTMLDivElement>(null)

  // Map branches by ID/value
  const branchMap = useMemo(() => {
    const map = new Map<string, BranchItem>()
    branches.forEach((b) => {
      map.set(String(b.value), b)
      if (b.id) map.set(String(b.id), b)
    })
    return map
  }, [branches])

  // Identify sub-branches vs main branches
  // A branch is a sub-branch if it has parentId pointing to another valid branch in the list
  const isSubBranch = useMemo(() => {
    return (b: BranchItem) => {
      if (!b.parentId || b.parentId === "none") return false
      return branchMap.has(String(b.parentId))
    }
  }, [branchMap])

  const mainBranches = useMemo(() => {
    return branches.filter((b) => !isSubBranch(b))
  }, [branches, isSubBranch])

  // Group sub-branches by their parent ID
  const subBranchesByParentId = useMemo(() => {
    const map = new Map<string, BranchItem[]>()
    branches.forEach((b) => {
      if (isSubBranch(b) && b.parentId) {
        const pId = String(b.parentId)
        const list = map.get(pId) || []
        list.push(b)
        map.set(pId, list)
      }
    })
    return map
  }, [branches, isSubBranch])

  // Automatically activate main branches if their ID or any of their sub-branches are in selectedBranchIds or primaryBranchId
  useEffect(() => {
    const allRelevantIds = new Set<string>([
      ...selectedBranchIds.map(String),
      ...(primaryBranchId ? [String(primaryBranchId)] : []),
    ])

    const neededMainBranchIds = new Set<string>(activeMainBranchIds)

    mainBranches.forEach((mb) => {
      const mbId = String(mb.value)
      if (allRelevantIds.has(mbId)) {
        neededMainBranchIds.add(mbId)
      }
      const subs = subBranchesByParentId.get(mbId) || []
      if (subs.some((sub) => allRelevantIds.has(String(sub.value)))) {
        neededMainBranchIds.add(mbId)
      }
    })

    if (neededMainBranchIds.size !== activeMainBranchIds.length) {
      setActiveMainBranchIds(Array.from(neededMainBranchIds))
    }
  }, [selectedBranchIds, primaryBranchId, mainBranches, subBranchesByParentId])

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Filter main branches based on search
  const filteredMainBranches = useMemo(() => {
    if (!searchTerm.trim()) return mainBranches
    const term = searchTerm.toLowerCase().trim()
    return mainBranches.filter((mb) => {
      const nameMatch = (mb.name || mb.label || "").toLowerCase().includes(term)
      const codeMatch = (mb.code || "").toLowerCase().includes(term)
      // Also match if any of its sub-branches match
      const subs = subBranchesByParentId.get(String(mb.value)) || []
      const subMatch = subs.some(
        (s) =>
          (s.name || s.label || "").toLowerCase().includes(term) ||
          (s.code || "").toLowerCase().includes(term)
      )
      return nameMatch || codeMatch || subMatch
    })
  }, [mainBranches, searchTerm, subBranchesByParentId])

  // Handle adding a main branch
  const handleAddMainBranch = (mainBranchId: string) => {
    const sId = String(mainBranchId)
    if (!activeMainBranchIds.includes(sId)) {
      setActiveMainBranchIds((prev) => [...prev, sId])
    }
    // Grant access to the main branch itself
    if (!selectedBranchIds.includes(sId)) {
      onChange([...selectedBranchIds, sId])
    }
    setSearchTerm("")
    setIsSearchOpen(false)
  }

  // Handle removing a main branch
  const handleRemoveMainBranch = (mainBranchId: string) => {
    const sId = String(mainBranchId)
    setActiveMainBranchIds((prev) => prev.filter((id) => id !== sId))
    const subs = subBranchesByParentId.get(sId) || []
    const subIds = new Set(subs.map((s) => String(s.value)))

    // Remove main branch and all its sub-branches, except primary branch if it happens to be here
    onChange(
      selectedBranchIds.filter((id) => {
        if (id === sId) return id === primaryBranchId
        if (subIds.has(id)) return id === primaryBranchId
        return true
      })
    )
  }

  // Toggle access to the main branch itself
  const handleToggleMainAccess = (mainBranchId: string, checked: boolean) => {
    const sId = String(mainBranchId)
    if (checked) {
      if (!selectedBranchIds.includes(sId)) {
        onChange([...selectedBranchIds, sId])
      }
    } else {
      if (sId !== primaryBranchId) {
        onChange(selectedBranchIds.filter((id) => id !== sId))
      }
    }
  }

  // Toggle access to an individual sub-branch
  const handleToggleSubBranch = (subBranchId: string, checked: boolean) => {
    const sId = String(subBranchId)
    if (checked) {
      if (!selectedBranchIds.includes(sId)) {
        onChange([...selectedBranchIds, sId])
      }
    } else {
      if (sId !== primaryBranchId) {
        onChange(selectedBranchIds.filter((id) => id !== sId))
      }
    }
  }

  // Select all sub-branches of a main branch
  const handleSelectAllSubBranches = (mainBranchId: string) => {
    const subs = subBranchesByParentId.get(String(mainBranchId)) || []
    const newIds = new Set(selectedBranchIds)
    newIds.add(String(mainBranchId)) // also include main branch
    subs.forEach((s) => newIds.add(String(s.value)))
    onChange(Array.from(newIds))
  }

  // Deselect all sub-branches of a main branch
  const handleDeselectAllSubBranches = (mainBranchId: string) => {
    const subs = subBranchesByParentId.get(String(mainBranchId)) || []
    const subIds = new Set(subs.map((s) => String(s.value)))
    onChange(
      selectedBranchIds.filter((id) => {
        if (subIds.has(id) && id !== primaryBranchId) return false
        return true
      })
    )
  }

  const toggleCollapse = (mainBranchId: string) => {
    setCollapsedBranches((prev) => ({
      ...prev,
      [mainBranchId]: !prev[mainBranchId],
    }))
  }

  // Stats calculation
  const totalSelectedCount = selectedBranchIds.length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-medium text-foreground">Branch & Sub-Branch Access</span>
          <p className="text-xs text-muted-foreground">
            Search and select branches to manage location and sub-branch access for this user.
          </p>
        </div>
        {totalSelectedCount > 0 && (
          <Badge variant="secondary" className="px-2 py-0.5 text-xs font-normal">
            {totalSelectedCount} location{totalSelectedCount > 1 ? "s" : ""} selected
          </Badge>
        )}
      </div>

      {/* Search & Select Main Branches Dropdown */}
      <div className="relative" ref={searchContainerRef}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="Search branches to add (e.g. Kathmandu, PKR, Head Office)..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setIsSearchOpen(true)
            }}
            onFocus={() => setIsSearchOpen(true)}
            disabled={disabled}
            className="pl-9 pr-8"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm("")
                setIsSearchOpen(false)
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Dropdown Results */}
        {isSearchOpen && (
          <div className="absolute z-50 mt-1 w-full max-h-64 overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow-lg">
            {filteredMainBranches.length === 0 ? (
              <div className="p-3 text-center text-sm text-muted-foreground">
                No matching branches found.
              </div>
            ) : (
              <div className="p-1 space-y-0.5">
                {filteredMainBranches.map((mb) => {
                  const sId = String(mb.value)
                  const isAlreadyAdded = activeMainBranchIds.includes(sId)
                  const subs = subBranchesByParentId.get(sId) || []

                  return (
                    <button
                      key={sId}
                      type="button"
                      onClick={() => handleAddMainBranch(sId)}
                      className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-sm text-left transition-colors ${
                        isAlreadyAdded
                          ? "bg-accent/40 text-muted-foreground"
                          : "hover:bg-accent hover:text-accent-foreground cursor-pointer"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-primary shrink-0" />
                        <span className="font-medium text-foreground">
                          {mb.name || mb.label}
                        </span>
                        {mb.code && (
                          <span className="text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-mono">
                            {mb.code}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {subs.length > 0 && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <GitBranch className="h-3 w-3" />
                            {subs.length} sub-branch{subs.length > 1 ? "es" : ""}
                          </span>
                        )}
                        {isAlreadyAdded ? (
                          <span className="text-xs text-emerald-600 font-medium flex items-center gap-0.5">
                            <Check className="h-3.5 w-3.5" /> Added
                          </span>
                        ) : (
                          <span className="text-xs text-primary font-medium flex items-center gap-0.5">
                            <Plus className="h-3.5 w-3.5" /> Add
                          </span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selected Branches List */}
      {activeMainBranchIds.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          <Building2 className="mx-auto h-8 w-8 text-muted-foreground/60 mb-2" />
          <p className="font-medium">No branch access configured yet</p>
          <p className="text-xs mt-1">
            Search and select a branch above to configure branch and sub-branch access.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {activeMainBranchIds.map((mainBranchId) => {
            const mb = branchMap.get(mainBranchId)
            if (!mb) return null

            const subs = subBranchesByParentId.get(mainBranchId) || []
            const isMainChecked = selectedBranchIds.includes(mainBranchId)
            const isMainPrimary = mainBranchId === primaryBranchId
            const isCollapsed = Boolean(collapsedBranches[mainBranchId])

            const selectedSubCount = subs.filter((s) =>
              selectedBranchIds.includes(String(s.value))
            ).length

            return (
              <div
                key={mainBranchId}
                className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden"
              >
                {/* Branch Header */}
                <div className="p-3 bg-muted/40 flex flex-wrap items-center justify-between gap-2 border-b">
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <Checkbox
                        checked={isMainChecked}
                        disabled={disabled || isMainPrimary}
                        onCheckedChange={(checked) =>
                          handleToggleMainAccess(mainBranchId, checked === true)
                        }
                      />
                      <span className="font-medium text-sm flex items-center gap-1.5">
                        <Building2 className="h-4 w-4 text-primary" />
                        {mb.name || mb.label}
                      </span>
                    </label>
                    {mb.code && (
                      <span className="text-xs bg-background border px-1.5 py-0.5 rounded text-muted-foreground font-mono">
                        {mb.code}
                      </span>
                    )}
                    {isMainPrimary && (
                      <Badge variant="default" className="text-[10px] py-0 px-1.5">
                        Primary Branch
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {subs.length > 0 && (
                      <Badge variant="outline" className="text-xs font-normal">
                        {selectedSubCount} of {subs.length} sub-branches
                      </Badge>
                    )}

                    {subs.length > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleCollapse(mainBranchId)}
                        className="h-7 px-2 text-xs text-muted-foreground"
                      >
                        {isCollapsed ? (
                          <ChevronDown className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronUp className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    )}

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMainBranch(mainBranchId)}
                      disabled={disabled || isMainPrimary}
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      title="Remove branch"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Sub-branches Area */}
                {!isCollapsed && (
                  <div className="p-4">
                    {subs.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">
                        No sub-branches registered under this branch. Access to this main branch is granted.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="font-medium text-foreground flex items-center gap-1">
                            <GitBranch className="h-3.5 w-3.5 text-primary" />
                            Select Sub-Branches:
                          </span>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="link"
                              size="sm"
                              onClick={() => handleSelectAllSubBranches(mainBranchId)}
                              disabled={disabled}
                              className="h-auto p-0 text-xs text-primary"
                            >
                              Select All
                            </Button>
                            <span>•</span>
                            <Button
                              type="button"
                              variant="link"
                              size="sm"
                              onClick={() => handleDeselectAllSubBranches(mainBranchId)}
                              disabled={disabled}
                              className="h-auto p-0 text-xs text-muted-foreground hover:text-destructive"
                            >
                              Deselect All
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
                          {subs.map((sub) => {
                            const subId = String(sub.value)
                            const isChecked = selectedBranchIds.includes(subId)
                            const isPrimary = subId === primaryBranchId

                            return (
                              <label
                                key={subId}
                                className={`flex items-center gap-2.5 p-2 rounded-md border text-xs cursor-pointer transition-colors ${
                                  isChecked
                                    ? "bg-primary/5 border-primary/40 font-medium"
                                    : "hover:bg-muted/50 border-border"
                                } ${isPrimary ? "ring-1 ring-primary" : ""}`}
                              >
                                <Checkbox
                                  checked={isChecked}
                                  disabled={disabled || isPrimary}
                                  onCheckedChange={(checked) =>
                                    handleToggleSubBranch(subId, checked === true)
                                  }
                                />
                                <div className="min-w-0 flex-1 flex items-center justify-between gap-1">
                                  <span className="truncate">
                                    {sub.name || sub.label}
                                  </span>
                                  {sub.code && (
                                    <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                                      {sub.code}
                                    </span>
                                  )}
                                  {isPrimary && (
                                    <span className="text-[10px] text-primary font-semibold shrink-0">
                                      (Primary)
                                    </span>
                                  )}
                                </div>
                              </label>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
