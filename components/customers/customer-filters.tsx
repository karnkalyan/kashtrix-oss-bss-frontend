"use client"

import { useState, useEffect, useRef } from "react"
import { Search, X, SlidersHorizontal, RotateCcw } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { CardContainer } from "@/components/ui/card-container"
import { apiRequest } from "@/lib/api"

export interface CustomerFilterValues {
  search: string
  status: string
  packageId: string
  branchId: string
  connectionType: string
}

export const defaultCustomerFilters: CustomerFilterValues = {
  search: "",
  status: "all",
  packageId: "all",
  branchId: "all",
  connectionType: "all",
}

interface PackageOption {
  id: number
  packageName?: string
  packagePlanDetails?: {
    planName?: string
  }
}

interface BranchOption {
  id: number
  name: string
}

export interface CustomerFiltersProps {
  filters?: CustomerFilterValues
  onFilterChange?: (filters: CustomerFilterValues) => void
  onReset?: () => void
}

export function CustomerFilters({
  filters,
  onFilterChange,
  onReset,
}: CustomerFiltersProps) {
  const [internalFilters, setInternalFilters] = useState<CustomerFilterValues>(defaultCustomerFilters)
  const currentFilters = filters ?? internalFilters

  const [searchInput, setSearchInput] = useState(currentFilters.search)
  const [packages, setPackages] = useState<PackageOption[]>([])
  const [branches, setBranches] = useState<BranchOption[]>([])
  const [showAdvanced, setShowAdvanced] = useState(false)
  const isDebounceInitial = useRef(true)

  // Fetch package list and branch list for filter options
  useEffect(() => {
    let isMounted = true

    const loadFilterOptions = async () => {
      try {
        const [packagesRes, branchesRes] = await Promise.allSettled([
          apiRequest<any>("/package-price"),
          apiRequest<any>("/branch"),
        ])

        if (isMounted) {
          if (packagesRes.status === "fulfilled" && Array.isArray(packagesRes.value)) {
            setPackages(packagesRes.value)
          } else if (
            packagesRes.status === "fulfilled" &&
            Array.isArray((packagesRes.value as any)?.data)
          ) {
            setPackages((packagesRes.value as any).data)
          }

          if (branchesRes.status === "fulfilled" && Array.isArray(branchesRes.value)) {
            setBranches(branchesRes.value)
          } else if (
            branchesRes.status === "fulfilled" &&
            Array.isArray((branchesRes.value as any)?.data)
          ) {
            setBranches((branchesRes.value as any).data)
          }
        }
      } catch (err) {
        console.error("Failed to load customer filter options:", err)
      }
    }

    loadFilterOptions()

    return () => {
      isMounted = false
    }
  }, [])

  // Sync internal search input with external filters prop when reset/changed
  useEffect(() => {
    setSearchInput(currentFilters.search)
  }, [currentFilters.search])

  const notifyChange = (updated: CustomerFilterValues) => {
    if (onFilterChange) {
      onFilterChange(updated)
    } else {
      setInternalFilters(updated)
    }
  }

  // Debounced search trigger
  useEffect(() => {
    if (isDebounceInitial.current) {
      isDebounceInitial.current = false
      return
    }

    const timer = setTimeout(() => {
      if (searchInput !== currentFilters.search) {
        notifyChange({
          ...currentFilters,
          search: searchInput,
        })
      }
    }, 350)

    return () => clearTimeout(timer)
  }, [searchInput])

  const handleSearchClear = () => {
    setSearchInput("")
    notifyChange({
      ...currentFilters,
      search: "",
    })
  }

  const handleFieldChange = (field: keyof CustomerFilterValues, value: string) => {
    notifyChange({
      ...currentFilters,
      [field]: value,
    })
  }

  const handleResetAll = () => {
    setSearchInput("")
    if (onReset) {
      onReset()
    } else {
      notifyChange(defaultCustomerFilters)
    }
  }

  const advancedFilterCount =
    (currentFilters.branchId !== "all" ? 1 : 0) +
    (currentFilters.connectionType !== "all" ? 1 : 0)

  const hasAnyActiveFilter =
    Boolean(currentFilters.search) ||
    currentFilters.status !== "all" ||
    currentFilters.packageId !== "all" ||
    currentFilters.branchId !== "all" ||
    currentFilters.connectionType !== "all"

  return (
    <CardContainer title="" gradientColor="#3B82F6" forceDarkMode={false}>
      <div className="relative z-10 rounded-lg border p-4 shadow-sm theme-critical bg-gradient-to-b from-white to-gray-50 border-gray-200 dark:from-slate-800 dark:to-slate-900 dark:border-slate-700">
        <div className="flex flex-col space-y-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 sm:space-x-4 relative z-10">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, ID, phone, email, username..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9 pr-8 bg-white border-gray-200 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
            />
            {searchInput && (
              <button
                type="button"
                onClick={handleSearchClear}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Status Dropdown */}
            <Select
              value={currentFilters.status}
              onValueChange={(val) => handleFieldChange("status", val)}
            >
              <SelectTrigger className="w-[140px] bg-white border-gray-200 dark:bg-slate-800 dark:border-slate-700 dark:text-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200 dark:bg-slate-800 dark:border-slate-700 dark:text-white">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            {/* Plan Dropdown */}
            <Select
              value={currentFilters.packageId}
              onValueChange={(val) => handleFieldChange("packageId", val)}
            >
              <SelectTrigger className="w-[160px] bg-white border-gray-200 dark:bg-slate-800 dark:border-slate-700 dark:text-white">
                <SelectValue placeholder="Plan" />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200 dark:bg-slate-800 dark:border-slate-700 dark:text-white max-h-60">
                <SelectItem value="all">All Plans</SelectItem>
                {packages.map((pkg) => {
                  const label =
                    pkg.packageName ||
                    pkg.packagePlanDetails?.planName ||
                    `Plan #${pkg.id}`
                  return (
                    <SelectItem key={pkg.id} value={String(pkg.id)}>
                      {label}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>

            {/* Advanced Filters Toggle */}
            <Button
              variant={showAdvanced || advancedFilterCount > 0 ? "default" : "outline"}
              onClick={() => setShowAdvanced((prev) => !prev)}
              className="gap-2 border-gray-200 dark:border-slate-700"
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span>Filters</span>
              {advancedFilterCount > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-1 h-5 px-1.5 min-w-[18px] text-[10px] rounded-full"
                >
                  {advancedFilterCount}
                </Badge>
              )}
            </Button>

            {/* Reset / Clear All Button */}
            {hasAnyActiveFilter && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetAll}
                className="text-xs text-muted-foreground hover:text-foreground gap-1.5"
                title="Reset all filters"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset</span>
              </Button>
            )}
          </div>
        </div>

        {/* Collapsible Advanced Filters Section */}
        {showAdvanced && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-slate-700 flex flex-wrap items-center gap-4 px-4 pb-2">
            {/* Branch Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Branch:</span>
              <Select
                value={currentFilters.branchId}
                onValueChange={(val) => handleFieldChange("branchId", val)}
              >
                <SelectTrigger className="w-[160px] h-8 text-xs bg-white border-gray-200 dark:bg-slate-800 dark:border-slate-700 dark:text-white">
                  <SelectValue placeholder="All Branches" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200 dark:bg-slate-800 dark:border-slate-700 dark:text-white max-h-60">
                  <SelectItem value="all">All Branches</SelectItem>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={String(b.id)}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Connection Type Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Connection:</span>
              <Select
                value={currentFilters.connectionType}
                onValueChange={(val) => handleFieldChange("connectionType", val)}
              >
                <SelectTrigger className="w-[150px] h-8 text-xs bg-white border-gray-200 dark:bg-slate-800 dark:border-slate-700 dark:text-white">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200 dark:bg-slate-800 dark:border-slate-700 dark:text-white">
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="fiber">Fiber</SelectItem>
                  <SelectItem value="pppoe">PPPoE</SelectItem>
                  <SelectItem value="hotspot">Hotspot</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Reset Filters button inside expanded drawer */}
            {advancedFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => {
                  notifyChange({
                    ...currentFilters,
                    branchId: "all",
                    connectionType: "all",
                  })
                }}
              >
                Clear Advanced
              </Button>
            )}
          </div>
        )}
      </div>
    </CardContainer>
  )
}
