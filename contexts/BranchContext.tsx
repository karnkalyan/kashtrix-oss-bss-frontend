"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

interface Branch {
  id: number;
  name: string;
  code?: string;
  isActive?: boolean;
  parentId?: number | null;
  [key: string]: any;
}

interface BranchContextType {
  selectedBranchId: number | null;
  setSelectedBranchId: (id: number | null) => void;
  branches: Branch[];
  loading: boolean;
  refreshBranches: () => Promise<void>;
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

export function BranchProvider({ children }: { children: React.ReactNode }) {
  const [selectedBranchId, setSelectedBranchIdState] = useState<number | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Initialize from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("selected-branch-id");
      if (stored) {
        setSelectedBranchIdState(parseInt(stored));
      }
    }
  }, []);

  const setSelectedBranchId = useCallback(async (id: number | null) => {
    if (typeof window !== "undefined") {
      if (id) localStorage.setItem("selected-branch-id", id.toString());
      else localStorage.removeItem("selected-branch-id");
    }
    setSelectedBranchIdState(id);
    window.dispatchEvent(new CustomEvent("tenant-theme-changed"));

    // Notify backend about the branch switch
    if (id) {
      try {
        await apiRequest("/auth/switch-branch", {
          method: "POST",
          body: JSON.stringify({ branchId: id }),
        });
      } catch (err) {
        console.error("Failed to switch branch on server:", err);
      }
    }

    // Reload page to refresh all data with new branch header
    window.location.reload();
  }, []);

  const refreshBranches = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiRequest("/branches/my-access");
      setBranches(data || []);
      
      // Auto-select first branch if none selected
      if (!selectedBranchId && data && data.length > 0) {
        setSelectedBranchIdState(data[0].id);
        if (typeof window !== "undefined") {
          localStorage.setItem("selected-branch-id", data[0].id.toString());
        }
      }
    } catch (err) {
      // If API fails, try to build branch list from user's branches
      if (user?.userBranches?.length) {
        const userBranches = user.userBranches.map((ub: any) => ub.branch).filter(Boolean);
        setBranches(userBranches);
        if (!selectedBranchId && userBranches.length > 0) {
          setSelectedBranchIdState(userBranches[0].id);
          if (typeof window !== "undefined") {
            localStorage.setItem("selected-branch-id", userBranches[0].id.toString());
          }
        }
      }
      console.error("Failed to fetch accessible branches:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedBranchId, user]);

  useEffect(() => {
    if (user) {
      refreshBranches();
    } else {
      setLoading(false);
    }
  }, [user]);

  return (
    <BranchContext.Provider value={{ 
      selectedBranchId, 
      setSelectedBranchId, 
      branches, 
      loading, 
      refreshBranches 
    }}>
      {children}
    </BranchContext.Provider>
  );
}

export function useBranch() {
  const context = useContext(BranchContext);
  if (context === undefined) {
    throw new Error("useBranch must be used within a BranchProvider");
  }
  return context;
}
