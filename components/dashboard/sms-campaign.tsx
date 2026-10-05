"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { 
  Send, 
  Users, 
  Search, 
  Filter, 
  Loader2, 
  MessageSquare, 
  Smartphone,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Network,
  GitBranch,
  MapPin,
  ScanLine,
  Clock,
  XCircle,
  X,
  FileSpreadsheet,
  Upload,
  Plus,
  Phone,
  Download,
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { apiRequest } from "@/lib/api"
import { getDynamicBaseUrl } from "@/lib/api"
import { SearchableSelect } from "@/components/ui/searchable-select"
const getSmsParts = (text: string) => {
  if (!text) return 0
  const isUnicode = /[^\u0000-\u007F]/.test(text)
  if (isUnicode) {
    return text.length <= 70 ? 1 : Math.ceil(text.length / 67)
  } else {
    return text.length <= 160 ? 1 : Math.ceil(text.length / 153)
  }
}

const cleanAndValidatePhone = (phone: any): string | null => {
  if (!phone) return null
  let cleaned = String(phone).replace(/\D/g, "").trim()
  if (cleaned.length === 13 && cleaned.startsWith("977")) {
    cleaned = cleaned.slice(3)
  }
  if (cleaned.length === 10 && cleaned.startsWith("9")) {
    return cleaned
  }
  return null
}

export function SmsCampaign() {
  const [recipientType, setRecipientType] = useState("customer")
  const [filters, setFilters] = useState({
    oltId: "all",
    oltPort: "",
    splitterId: "all",
    area: "",
    status: "all"
  })
  const [selectedHeadOffices, setSelectedHeadOffices] = useState<number[]>([])
  const [selectedBranches, setSelectedBranches] = useState<number[]>([])
  const [selectedSubBranches, setSelectedSubBranches] = useState<number[]>([])
  const [message, setMessage] = useState("")
  const [allBranchData, setAllBranchData] = useState<any[]>([])
  const [olts, setOlts] = useState<any[]>([])
  const [splitters, setSplitters] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [recipients, setRecipients] = useState<any[]>([])
  const [selectedRecipients, setSelectedRecipients] = useState<any[]>([])
  const [targetingScope, setTargetingScope] = useState<"all" | "select">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [recipientsCount, setRecipientsCount] = useState(0)
  const [duplicateCount, setDuplicateCount] = useState(0)
  const [rawRecipients, setRawRecipients] = useState<any[]>([])
  const [selectedAddresses, setSelectedAddresses] = useState<string[]>([])
  const [selectedStreets, setSelectedStreets] = useState<string[]>([])
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([])
  const [selectedGenders, setSelectedGenders] = useState<string[]>([])
  const [selectedPackages, setSelectedPackages] = useState<string[]>([])
  const [selectedMemberships, setSelectedMemberships] = useState<string[]>([])
  const [fullAddressKeywords, setFullAddressKeywords] = useState<string[]>([])
  const [debouncedFullAddressKeywords, setDebouncedFullAddressKeywords] = useState<string[]>([])
  const [fullAddressInput, setFullAddressInput] = useState("")
  const [manualNumbers, setManualNumbers] = useState<string[]>([])
  const [manualNumberInput, setManualNumberInput] = useState("")

  // Restored states to fix TypeScript compilation
  const [credit, setCredit] = useState<any>(null)
  const [smsProviders, setSmsProviders] = useState<any[]>([])
  const [selectedProvider, setSelectedProvider] = useState<string>("")
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [campaignLogs, setCampaignLogs] = useState<any[]>([])
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null)
  const [logsLoading, setLogsLoading] = useState(false)
  const [logsStatusFilter, setLogsStatusFilter] = useState<string>("all")
  const [statusCounts, setStatusCounts] = useState<any>({ sent: 0, failed: 0, skipped: 0, queued: 0, error: 0, total: 0 })

  // CSV Filter states & helpers
  const [useCsvFilter, setUseCsvFilter] = useState(false)
  const [csvRows, setCsvRows] = useState<any[]>([])
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [selectedCsvColumns, setSelectedCsvColumns] = useState<string[]>([])
  const [csvFileName, setCsvFileName] = useState("")
  const [csvMatchType, setCsvMatchType] = useState<"and" | "or">("or")

  // Debounce the fullAddressKeywords array
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedFullAddressKeywords(fullAddressKeywords)
    }, 500)
    return () => clearTimeout(handler)
  }, [fullAddressKeywords])

  // Trigger loading state immediately when any filter changes
  useEffect(() => {
    setLoading(true)
  }, [
    recipientType,
    filters,
    selectedHeadOffices,
    selectedBranches,
    selectedSubBranches,
    fullAddressKeywords,
    selectedAddresses,
    selectedStreets,
    selectedDistricts,
    selectedGenders,
    selectedPackages,
    selectedMemberships,
    useCsvFilter,
    selectedCsvColumns,
    csvMatchType
  ])

  const addFullAddressKeyword = (keyword: string) => {
    const clean = keyword.trim()
    if (!clean) return
    if (!fullAddressKeywords.includes(clean)) {
      setFullAddressKeywords([...fullAddressKeywords, clean])
    }
    setFullAddressInput("")
  }

  const removeFullAddressKeyword = (keyword: string) => {
    setFullAddressKeywords(fullAddressKeywords.filter(k => k !== keyword))
  }

  const handleFullAddressInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      addFullAddressKeyword(fullAddressInput)
    } else if (e.key === "Backspace" && !fullAddressInput && fullAddressKeywords.length > 0) {
      removeFullAddressKeyword(fullAddressKeywords[fullAddressKeywords.length - 1])
    }
  }

  const handleFullAddressInputBlur = () => {
    addFullAddressKeyword(fullAddressInput)
  }

  // Lowercased sets for highly optimized filtering
  const lowerAddresses = React.useMemo(() => new Set(selectedAddresses.map(v => v.toLowerCase().trim())), [selectedAddresses]);
  const lowerStreets = React.useMemo(() => new Set(selectedStreets.map(v => v.toLowerCase().trim())), [selectedStreets]);
  const lowerDistricts = React.useMemo(() => new Set(selectedDistricts.map(v => v.toLowerCase().trim())), [selectedDistricts]);
  const lowerGenders = React.useMemo(() => new Set(selectedGenders.map(v => v.toLowerCase().trim())), [selectedGenders]);
  const lowerPackages = React.useMemo(() => new Set(selectedPackages.map(v => v.toLowerCase().trim())), [selectedPackages]);
  const lowerMemberships = React.useMemo(() => new Set(selectedMemberships.map(v => v.toLowerCase().trim())), [selectedMemberships]);

  const mapCsvHeaderToRecipientKey = (header: string): string => {
    const h = header.toLowerCase().trim().replace(/[^a-z0-9]/g, "");
    if (h === "firstname" || h === "first") return "firstName";
    if (h === "middlename" || h === "middle") return "middleName";
    if (h === "lastname" || h === "last") return "lastName";
    if (h === "phonenumber" || h === "phone" || h === "contact" || h === "mobile") return "phone";
    if (h === "secondarycontactnumber" || h === "secondaryphone" || h === "secondarycontact") return "secondaryContactNumber";
    if (h === "email" || h === "emailaddress") return "email";
    if (h === "source") return "source";
    if (h === "status") return "status";
    if (h === "address") return "address";
    if (h === "street") return "street";
    if (h === "district") return "district";
    if (h === "province" || h === "state") return "province";
    if (h === "gender") return "gender";
    if (h === "notes") return "notes";
    if (h === "age") return "age";
    if (h === "fulladdress") return "fullAddress";
    return header;
  };

  const isCsvMatch = useCallback((r: any) => {
    if (!useCsvFilter || csvRows.length === 0 || selectedCsvColumns.length === 0) return true;
    
    const cleanPhone = (phone: string): string => {
      const digits = phone.replace(/\D/g, "");
      return digits.length >= 10 ? digits.slice(-10) : digits;
    };

    return csvRows.some(csvRow => {
      if (csvMatchType === "and") {
        return selectedCsvColumns.every(colName => {
          const recipientKey = mapCsvHeaderToRecipientKey(colName);
          const isPhoneField = recipientKey === "phone" || recipientKey === "secondaryContactNumber";
          
          const rawRecipientValue = String(r[recipientKey] || "");
          const rawCsvValue = String(csvRow[colName] || "");
          
          if (!rawRecipientValue || !rawCsvValue) return false;
          
          const recipientValue = isPhoneField ? cleanPhone(rawRecipientValue) : rawRecipientValue.toLowerCase().trim();
          const csvValue = isPhoneField ? cleanPhone(rawCsvValue) : rawCsvValue.toLowerCase().trim();
          
          return recipientValue !== "" && recipientValue === csvValue;
        });
      } else {
        return selectedCsvColumns.some(colName => {
          const recipientKey = mapCsvHeaderToRecipientKey(colName);
          const isPhoneField = recipientKey === "phone" || recipientKey === "secondaryContactNumber";
          
          const rawRecipientValue = String(r[recipientKey] || "");
          const rawCsvValue = String(csvRow[colName] || "");
          
          if (!rawRecipientValue || !rawCsvValue) return false;
          
          const recipientValue = isPhoneField ? cleanPhone(rawRecipientValue) : rawRecipientValue.toLowerCase().trim();
          const csvValue = isPhoneField ? cleanPhone(rawCsvValue) : rawCsvValue.toLowerCase().trim();
          
          return recipientValue !== "" && recipientValue === csvValue;
        });
      }
    });
  }, [useCsvFilter, csvRows, selectedCsvColumns, csvMatchType]);

  const csvMatchedCount = React.useMemo(() => {
    if (csvRows.length === 0) return 0;
    return rawRecipients.filter(isCsvMatch).length;
  }, [rawRecipients, isCsvMatch]);

  const parseCSV = (text: string) => {
    const lines: string[][] = [];
    let row: string[] = [];
    let inQuotes = false;
    let currentValue = "";
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentValue += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        row.push(currentValue.trim());
        currentValue = "";
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
        row.push(currentValue.trim());
        if (row.length > 0 && (row.length > 1 || row[0] !== "")) {
          lines.push(row);
        }
        row = [];
        currentValue = "";
      } else {
        currentValue += char;
      }
    }
    if (currentValue !== "" || row.length > 0) {
      row.push(currentValue.trim());
      lines.push(row);
    }
    return lines;
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setCsvFileName(file.name)
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      if (!text) return

      try {
        const rows = parseCSV(text)
        if (rows.length === 0) {
          toast.error("The CSV file is empty.")
          return
        }

        const headers = rows[0]
        const dataRows = rows.slice(1).map(row => {
          const obj: any = {}
          headers.forEach((header, index) => {
            obj[header] = row[index] || ""
          })
          return obj
        })

        setCsvHeaders(headers)
        setCsvRows(dataRows)
        setUseCsvFilter(true)
        
        // Auto-select common column names for filtering
        const commonHeaders = headers.filter(h => {
          const mapped = mapCsvHeaderToRecipientKey(h)
          return ["phone", "firstName", "lastName"].includes(mapped)
        })
        setSelectedCsvColumns(commonHeaders.length > 0 ? commonHeaders : [headers[0]])
        toast.success(`Loaded ${dataRows.length} rows from CSV.`)
      } catch (err) {
        console.error(err)
        toast.error("Failed to parse CSV file.")
      }
    }
    reader.readAsText(file)
  }

  const addressOptions = React.useMemo(() => {
    const values = new Set<string>();
    selectedAddresses.forEach(val => values.add(val.trim()));

    rawRecipients.forEach(r => {
      if (lowerStreets.size > 0 && (!r.street || !lowerStreets.has(r.street.trim().toLowerCase()))) return;
      if (lowerDistricts.size > 0 && (!r.district || !lowerDistricts.has(r.district.trim().toLowerCase()))) return;
      if (lowerGenders.size > 0 && (!r.gender || !lowerGenders.has(r.gender.trim().toLowerCase()))) return;
      if (lowerPackages.size > 0 && (!r.packageName || !lowerPackages.has(r.packageName.trim().toLowerCase()))) return;
      if (lowerMemberships.size > 0 && (!r.membershipName || !lowerMemberships.has(r.membershipName.trim().toLowerCase()))) return;
      if (debouncedFullAddressKeywords.length > 0) {
        const hasMatch = debouncedFullAddressKeywords.some(kw => r.fullAddress && r.fullAddress.toLowerCase().includes(kw.toLowerCase().trim()));
        if (!hasMatch) return;
      }
      if (!isCsvMatch(r)) return;

      if (r.address) values.add(r.address.trim());
    });

    return Array.from(values).sort().map(val => ({ value: val, label: val }));
  }, [rawRecipients, selectedAddresses, lowerStreets, lowerDistricts, lowerGenders, lowerPackages, lowerMemberships, debouncedFullAddressKeywords, isCsvMatch]);

  const streetOptions = React.useMemo(() => {
    const values = new Set<string>();
    selectedStreets.forEach(val => values.add(val.trim()));

    rawRecipients.forEach(r => {
      if (lowerAddresses.size > 0 && (!r.address || !lowerAddresses.has(r.address.trim().toLowerCase()))) return;
      if (lowerDistricts.size > 0 && (!r.district || !lowerDistricts.has(r.district.trim().toLowerCase()))) return;
      if (lowerGenders.size > 0 && (!r.gender || !lowerGenders.has(r.gender.trim().toLowerCase()))) return;
      if (lowerPackages.size > 0 && (!r.packageName || !lowerPackages.has(r.packageName.trim().toLowerCase()))) return;
      if (lowerMemberships.size > 0 && (!r.membershipName || !lowerMemberships.has(r.membershipName.trim().toLowerCase()))) return;
      if (debouncedFullAddressKeywords.length > 0) {
        const hasMatch = debouncedFullAddressKeywords.some(kw => r.fullAddress && r.fullAddress.toLowerCase().includes(kw.toLowerCase().trim()));
        if (!hasMatch) return;
      }
      if (!isCsvMatch(r)) return;

      if (r.street) values.add(r.street.trim());
    });

    return Array.from(values).sort().map(val => ({ value: val, label: val }));
  }, [rawRecipients, selectedStreets, lowerAddresses, lowerDistricts, lowerGenders, lowerPackages, lowerMemberships, debouncedFullAddressKeywords, isCsvMatch]);

  const districtOptions = React.useMemo(() => {
    const values = new Set<string>();
    selectedDistricts.forEach(val => values.add(val.trim()));

    rawRecipients.forEach(r => {
      if (lowerAddresses.size > 0 && (!r.address || !lowerAddresses.has(r.address.trim().toLowerCase()))) return;
      if (lowerStreets.size > 0 && (!r.street || !lowerStreets.has(r.street.trim().toLowerCase()))) return;
      if (lowerGenders.size > 0 && (!r.gender || !lowerGenders.has(r.gender.trim().toLowerCase()))) return;
      if (lowerPackages.size > 0 && (!r.packageName || !lowerPackages.has(r.packageName.trim().toLowerCase()))) return;
      if (lowerMemberships.size > 0 && (!r.membershipName || !lowerMemberships.has(r.membershipName.trim().toLowerCase()))) return;
      if (debouncedFullAddressKeywords.length > 0) {
        const hasMatch = debouncedFullAddressKeywords.some(kw => r.fullAddress && r.fullAddress.toLowerCase().includes(kw.toLowerCase().trim()));
        if (!hasMatch) return;
      }
      if (!isCsvMatch(r)) return;

      if (r.district) values.add(r.district.trim());
    });

    return Array.from(values).sort().map(val => ({ value: val, label: val }));
  }, [rawRecipients, selectedDistricts, lowerAddresses, lowerStreets, lowerGenders, lowerPackages, lowerMemberships, debouncedFullAddressKeywords, isCsvMatch]);

  const genderOptions = React.useMemo(() => {
    const values = new Set<string>();
    selectedGenders.forEach(val => values.add(val.trim()));

    rawRecipients.forEach(r => {
      if (lowerAddresses.size > 0 && (!r.address || !lowerAddresses.has(r.address.trim().toLowerCase()))) return;
      if (lowerStreets.size > 0 && (!r.street || !lowerStreets.has(r.street.trim().toLowerCase()))) return;
      if (lowerDistricts.size > 0 && (!r.district || !lowerDistricts.has(r.district.trim().toLowerCase()))) return;
      if (lowerPackages.size > 0 && (!r.packageName || !lowerPackages.has(r.packageName.trim().toLowerCase()))) return;
      if (lowerMemberships.size > 0 && (!r.membershipName || !lowerMemberships.has(r.membershipName.trim().toLowerCase()))) return;
      if (debouncedFullAddressKeywords.length > 0) {
        const hasMatch = debouncedFullAddressKeywords.some(kw => r.fullAddress && r.fullAddress.toLowerCase().includes(kw.toLowerCase().trim()));
        if (!hasMatch) return;
      }
      if (!isCsvMatch(r)) return;

      if (r.gender) values.add(r.gender.trim());
    });

    return Array.from(values).sort().map(val => ({ value: val, label: val }));
  }, [rawRecipients, selectedGenders, lowerAddresses, lowerStreets, lowerDistricts, lowerPackages, lowerMemberships, debouncedFullAddressKeywords, isCsvMatch]);

  const packageOptions = React.useMemo(() => {
    const values = new Set<string>();
    selectedPackages.forEach(val => values.add(val.trim()));

    rawRecipients.forEach(r => {
      if (lowerAddresses.size > 0 && (!r.address || !lowerAddresses.has(r.address.trim().toLowerCase()))) return;
      if (lowerStreets.size > 0 && (!r.street || !lowerStreets.has(r.street.trim().toLowerCase()))) return;
      if (lowerDistricts.size > 0 && (!r.district || !lowerDistricts.has(r.district.trim().toLowerCase()))) return;
      if (lowerGenders.size > 0 && (!r.gender || !lowerGenders.has(r.gender.trim().toLowerCase()))) return;
      if (lowerMemberships.size > 0 && (!r.membershipName || !lowerMemberships.has(r.membershipName.trim().toLowerCase()))) return;
      if (debouncedFullAddressKeywords.length > 0) {
        const hasMatch = debouncedFullAddressKeywords.some(kw => r.fullAddress && r.fullAddress.toLowerCase().includes(kw.toLowerCase().trim()));
        if (!hasMatch) return;
      }
      if (!isCsvMatch(r)) return;

      if (r.packageName) values.add(r.packageName.trim());
    });

    return Array.from(values).sort().map(val => ({ value: val, label: val }));
  }, [rawRecipients, selectedPackages, lowerAddresses, lowerStreets, lowerDistricts, lowerGenders, lowerMemberships, debouncedFullAddressKeywords, isCsvMatch]);

  const membershipOptions = React.useMemo(() => {
    const values = new Set<string>();
    selectedMemberships.forEach(val => values.add(val.trim()));

    rawRecipients.forEach(r => {
      if (lowerAddresses.size > 0 && (!r.address || !lowerAddresses.has(r.address.trim().toLowerCase()))) return;
      if (lowerStreets.size > 0 && (!r.street || !lowerStreets.has(r.street.trim().toLowerCase()))) return;
      if (lowerDistricts.size > 0 && (!r.district || !lowerDistricts.has(r.district.trim().toLowerCase()))) return;
      if (lowerGenders.size > 0 && (!r.gender || !lowerGenders.has(r.gender.trim().toLowerCase()))) return;
      if (lowerPackages.size > 0 && (!r.packageName || !lowerPackages.has(r.packageName.trim().toLowerCase()))) return;
      if (debouncedFullAddressKeywords.length > 0) {
        const hasMatch = debouncedFullAddressKeywords.some(kw => r.fullAddress && r.fullAddress.toLowerCase().includes(kw.toLowerCase().trim()));
        if (!hasMatch) return;
      }
      if (!isCsvMatch(r)) return;

      if (r.membershipName) values.add(r.membershipName.trim());
    });

    return Array.from(values).sort().map(val => ({ value: val, label: val }));
  }, [rawRecipients, selectedMemberships, lowerAddresses, lowerStreets, lowerDistricts, lowerGenders, lowerPackages, debouncedFullAddressKeywords, isCsvMatch]);

  const filteredRecipients = React.useMemo(() => {
    return rawRecipients.filter(r => {
      if (lowerAddresses.size > 0 && (!r.address || !lowerAddresses.has(r.address.trim().toLowerCase()))) return false;
      if (lowerStreets.size > 0 && (!r.street || !lowerStreets.has(r.street.trim().toLowerCase()))) return false;
      if (lowerDistricts.size > 0 && (!r.district || !lowerDistricts.has(r.district.trim().toLowerCase()))) return false;
      if (lowerGenders.size > 0 && (!r.gender || !lowerGenders.has(r.gender.trim().toLowerCase()))) return false;
      if (lowerPackages.size > 0 && (!r.packageName || !lowerPackages.has(r.packageName.trim().toLowerCase()))) return false;
      if (lowerMemberships.size > 0 && (!r.membershipName || !lowerMemberships.has(r.membershipName.trim().toLowerCase()))) return false;
      if (debouncedFullAddressKeywords.length > 0) {
        const hasMatch = debouncedFullAddressKeywords.some(kw => r.fullAddress && r.fullAddress.toLowerCase().includes(kw.toLowerCase().trim()));
        if (!hasMatch) return false;
      }
      if (!isCsvMatch(r)) return false;
      return true;
    });
  }, [rawRecipients, lowerAddresses, lowerStreets, lowerDistricts, lowerGenders, lowerPackages, lowerMemberships, debouncedFullAddressKeywords, isCsvMatch]);

  // Keep recipients and recipientsCount in sync with filteredRecipients
  useEffect(() => {
    setRecipients(filteredRecipients);
    setRecipientsCount(filteredRecipients.length);
  }, [filteredRecipients]);

  // Derive hierarchy: Head Office (parentId null) -> Branches -> Sub-Branches
  const headOffices = React.useMemo(() => allBranchData.filter((b: any) => b.parentId === null), [allBranchData])
  const headOfficeIds = React.useMemo(() => headOffices.map((b: any) => b.id), [headOffices])
  const branches = React.useMemo(
    () => allBranchData.filter((b: any) => b.parentId !== null && headOfficeIds.includes(b.parentId)),
    [allBranchData, headOfficeIds]
  )
  const branchIds = React.useMemo(() => branches.map((b: any) => b.id), [branches])

  const branchChildrenByParent = React.useMemo(() => {
    const map = new Map<number, any[]>()
    allBranchData.forEach((branch: any) => {
      if (branch.parentId === null || branch.parentId === undefined) return
      const parentId = Number(branch.parentId)
      map.set(parentId, [...(map.get(parentId) || []), branch])
    })
    return map
  }, [allBranchData])

  const getDescendantBranchIds = useCallback((parentIds: number[]) => {
    const descendants = new Set<number>()
    const stack = [...parentIds]

    while (stack.length > 0) {
      const parentId = stack.pop()
      if (parentId === undefined) continue

      for (const child of branchChildrenByParent.get(Number(parentId)) || []) {
        const childId = Number(child.id)
        if (!descendants.has(childId)) {
          descendants.add(childId)
          stack.push(childId)
        }
      }
    }

    return Array.from(descendants)
  }, [branchChildrenByParent])

  const getBranchPath = useCallback((branch: any) => {
    const byId = new Map<number, any>(allBranchData.map((item: any) => [Number(item.id), item]))
    const names = [branch.name]
    let parent = branch.parentId ? byId.get(Number(branch.parentId)) : null

    while (parent) {
      names.unshift(parent.name)
      parent = parent.parentId ? byId.get(Number(parent.parentId)) : null
    }

    return names.join(" / ")
  }, [allBranchData])

  const branchOptions = React.useMemo(() => {
    if (selectedHeadOffices.length === 0) return branches
    return branches.filter((branch: any) => selectedHeadOffices.includes(Number(branch.parentId)))
  }, [branches, selectedHeadOffices])

  const subBranchOptions = React.useMemo(() => {
    const directBranchIds = branchOptions.map((branch: any) => Number(branch.id))
    const seedIds = selectedBranches.length > 0 ? selectedBranches : directBranchIds.length > 0 ? directBranchIds : branchIds
    const descendantIds = new Set(getDescendantBranchIds(seedIds))
    return allBranchData.filter((branch: any) => descendantIds.has(Number(branch.id)))
  }, [allBranchData, branchIds, branchOptions, getDescendantBranchIds, selectedBranches])

  const getSelectedBranchScope = useCallback(() => {
    const selectedIds = new Set<number>([
      ...selectedHeadOffices,
      ...selectedBranches,
      ...selectedSubBranches,
    ])

    getDescendantBranchIds(Array.from(selectedIds)).forEach((id) => selectedIds.add(id))
    return selectedIds
  }, [getDescendantBranchIds, selectedBranches, selectedHeadOffices, selectedSubBranches])

  useEffect(() => {
    fetchBranches()
    fetchOlts()
    fetchSplitters()
    fetchSmsProviders()
    fetchCampaigns()
  }, [])

  // Fetch recipients count when filters, recipientType or debounced keywords change (DEBOUNCED BY 500ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchRecipients()
    }, 500)
    return () => clearTimeout(handler)
  }, [
    recipientType,
    filters,
    selectedHeadOffices,
    selectedBranches,
    selectedSubBranches,
    debouncedFullAddressKeywords
  ])

  // Debounced search for manual recipient selection
  useEffect(() => {
    if (!searchQuery.trim() || targetingScope !== "select") {
      setSearchResults([])
      return
    }

    const delayDebounceFn = setTimeout(async () => {
      setSearching(true)
      try {
        const endpoint = recipientType === "customer" ? "/customer" : "/lead"
        const params = new URLSearchParams({
          search: searchQuery,
          limit: "20"
        })

        if (filters.status !== "all") params.append("status", filters.status)
        if (recipientType === "customer") {
          if (filters.oltId !== "all") params.append("oltId", filters.oltId)
          if (filters.oltPort) params.append("oltPort", filters.oltPort)
          if (filters.splitterId !== "all") params.append("splitterId", filters.splitterId)
          if (filters.area) params.append("area", filters.area)
        } else {
          if (filters.area) params.append("area", filters.area)
        }

        // Add subBranch/branch filters to search query if a single sub-branch or branch is selected
        if (selectedSubBranches.length === 1) {
          params.append("subBranchId", String(selectedSubBranches[0]))
        } else if (selectedBranches.length === 1) {
          params.append("branchId", String(selectedBranches[0]))
        }

        const res = await apiRequest<any>(`${endpoint}?${params.toString()}`)
        const raw = Array.isArray(res) ? res : (res?.data || [])

        // Filter locally so Head Office selection includes every nested branch below it.
        let filteredRaw = raw
        const scopedBranchIds = getSelectedBranchScope()

        if (scopedBranchIds.size > 0) {
          filteredRaw = filteredRaw.filter((item: any) => {
            const itemBranchId = Number(item.branchId || item.branch?.id || item.lead?.branchId || item.lead?.branch?.id || 0)
            const itemSubBranchId = Number(item.subBranchId || item.subBranch?.id || item.lead?.subBranchId || item.lead?.subBranch?.id || 0)

            return scopedBranchIds.has(itemBranchId) || scopedBranchIds.has(itemSubBranchId)
          })
        }

        const data = recipientType === "customer"
          ? filteredRaw.map((c: any) => ({
              recipientId: c.id,
              name: c.firstName ? `${c.firstName} ${c.lastName || ""}`.trim() : `${c.lead?.firstName || ""} ${c.lead?.lastName || ""}`.trim(),
              phone: cleanAndValidatePhone(c.phoneNumber || c.lead?.phoneNumber) || cleanAndValidatePhone(c.secondaryContactNumber || c.secondaryPhone || c.lead?.secondaryContactNumber) || ""
            }))
          : filteredRaw.map((l: any) => ({
              recipientId: l.id,
              name: `${l.firstName || ""} ${l.lastName || ""}`.trim(),
              phone: cleanAndValidatePhone(l.phoneNumber) || cleanAndValidatePhone(l.secondaryContactNumber) || ""
            }))

        const validSearchData = data.filter((r: any) => r.phone)
        const seenSearchPhones = new Set<string>()
        setSearchResults(validSearchData.filter((r: any) => {
          if (seenSearchPhones.has(r.phone)) return false
          seenSearchPhones.add(r.phone)
          return true
        }))
      } catch (err) {
        console.error("Failed to search recipients", err)
      } finally {
        setSearching(false)
      }
    }, 400)

    return () => clearTimeout(delayDebounceFn)
  }, [searchQuery, recipientType, filters, targetingScope, selectedBranches, selectedSubBranches, getSelectedBranchScope])

  useEffect(() => {
    const hasActiveCampaign = campaigns.some((campaign) => ["queued", "processing"].includes(campaign.status))
    if (!hasActiveCampaign) return

    const interval = window.setInterval(() => {
      fetchCampaigns()
      if (selectedCampaignId) fetchCampaignLogs(selectedCampaignId)
    }, 5000)

    return () => window.clearInterval(interval)
  }, [campaigns, selectedCampaignId])

  const fetchBranches = async () => {
    try {
      const res = await apiRequest<any[]>("/branch")
      setAllBranchData(Array.isArray(res) ? res : [])
    } catch (err) {
      console.error("Failed to fetch branches")
    }
  }

  const fetchOlts = async () => {
    try {
      const res = await apiRequest<any>("/olt")
      const list = Array.isArray(res) ? res : (res?.data || [])
      setOlts(list)
    } catch (err) {
      console.error("Failed to fetch OLTs")
    }
  }

  const fetchSplitters = async () => {
    try {
      const res = await apiRequest<any>("/splitters")
      const list = Array.isArray(res) ? res : (res?.data || res?.splitters || [])
      setSplitters(list)
    } catch (err) {
      console.error("Failed to fetch splitters")
    }
  }

  const fetchSmsProviders = async () => {
    try {
      const res = await apiRequest<any>("/service/isp?includeInactive=true", { suppressToast: true })
      const list = res.data || res || []
      const providers = list.filter((s: any) => 
        s.service?.code === "AAKASHSMS" || s.service?.code === "SPARROWSMS"
      )
      setSmsProviders(providers)
      
      const defaultProvider = providers.find((p: any) => p.config?.isDefault === true) || providers[0]
      if (defaultProvider) {
        setSelectedProvider(defaultProvider.service.code)
        fetchCredit(defaultProvider.service.code)
      }
    } catch (err) {
      console.error("Failed to fetch SMS providers")
    }
  }

  const fetchCampaigns = async () => {
    try {
      const res = await apiRequest<any>("/service/sms/campaigns?limit=10")
      const list = Array.isArray(res) ? res : (res?.data || [])
      setCampaigns(list)
      const active = list.find((campaign: any) => ["queued", "processing"].includes(campaign.status))
      if (active) {
        setSelectedCampaignId(active.id)
        fetchCampaignLogs(active.id)
      }
    } catch (err) {
      console.error("Failed to fetch SMS campaigns")
    }
  }

  const fetchCampaignLogs = async (campaignId: number, status?: string) => {
    setLogsLoading(true)
    try {
      const statusParam = status || logsStatusFilter
      const res = await apiRequest<any>(`/service/sms/campaigns/${campaignId}/logs?limit=500${statusParam && statusParam !== 'all' ? `&status=${statusParam}` : ''}`)
      setCampaignLogs(res?.data || [])
      if (res?.statusCounts) setStatusCounts(res.statusCounts)
    } catch (err) {
      console.error("Failed to fetch SMS campaign logs")
    } finally {
      setLogsLoading(false)
    }
  }

  const fetchCredit = async (providerCode?: string) => {
    const code = providerCode || selectedProvider
    if (!code) return
    try {
      const res = await apiRequest<any>(`/service/sms/credit?provider=${code}`)
      setCredit(res?.data || res)
    } catch (err) {
      console.error("Failed to fetch SMS credit")
    }
  }

  const handleProviderChange = (value: string) => {
    setSelectedProvider(value)
    fetchCredit(value)
  }

  const fetchRecipients = useCallback(async () => {
    setLoading(true)
    setSelectedRecipients([])
    try {
      const endpoint = recipientType === "customer" ? "/customer" : "/lead"
      const params = new URLSearchParams({ limit: "all" })
      if (filters.status !== "all") params.append("status", filters.status)
      if (recipientType === "customer") {
        if (filters.oltId !== "all") params.append("oltId", filters.oltId)
        if (filters.oltPort) params.append("oltPort", filters.oltPort)
        if (filters.splitterId !== "all") params.append("splitterId", filters.splitterId)
      }
      if (debouncedFullAddressKeywords.length > 0) {
        params.append("area", debouncedFullAddressKeywords.join(","))
      }

      const res = await apiRequest<any>(`${endpoint}?${params.toString()}`)
      const raw = Array.isArray(res) ? res : (res?.data || [])

      // Filter locally so Head Office selection includes every nested branch below it.
      let filteredRaw = raw
      const scopedBranchIds = getSelectedBranchScope()

      if (scopedBranchIds.size > 0) {
        filteredRaw = filteredRaw.filter((item: any) => {
          const itemBranchId = Number(item.branchId || item.branch?.id || item.lead?.branchId || item.lead?.branch?.id || 0)
          const itemSubBranchId = Number(item.subBranchId || item.subBranch?.id || item.lead?.subBranchId || item.lead?.subBranch?.id || 0)

          return scopedBranchIds.has(itemBranchId) || scopedBranchIds.has(itemSubBranchId)
        })
      }

      // Keep full enriched recipient objects
      const data = recipientType === "customer"
        ? filteredRaw.map((c: any) => ({
            recipientId: c.id,
            name: c.firstName ? `${c.firstName} ${c.lastName || ""}`.trim() : `${c.lead?.firstName || ""} ${c.lead?.lastName || ""}`.trim(),
            phone: cleanAndValidatePhone(c.phoneNumber || c.lead?.phoneNumber) || cleanAndValidatePhone(c.secondaryContactNumber || c.secondaryPhone || c.lead?.secondaryContactNumber) || "",
            firstName: c.firstName || c.lead?.firstName || "",
            middleName: c.middleName || c.lead?.middleName || "",
            lastName: c.lastName || c.lead?.lastName || "",
            email: c.email || c.lead?.email || "",
            secondaryContactNumber: c.secondaryContactNumber || c.secondaryPhone || c.lead?.secondaryContactNumber || "",
            source: c.source || c.lead?.source || "",
            status: c.status || c.lead?.status || "",
            address: c.address || c.lead?.address || "",
            street: c.street || c.lead?.street || "",
            district: c.district || c.lead?.district || "",
            province: c.province || c.state || c.lead?.province || "",
            gender: c.gender || c.lead?.gender || "",
            notes: c.notes || c.lead?.notes || "",
            age: c.age || "",
            fullAddress: c.fullAddress || c.lead?.address || "",
            packageName: c.subscribedPkg?.packageName || c.packagePrice?.packageName || "",
            membershipName: c.membership?.name || ""
          }))
        : filteredRaw.map((l: any) => {
            const meta = l.metadata ? (typeof l.metadata === 'string' ? JSON.parse(l.metadata) : l.metadata) : null;
            return {
              recipientId: l.id,
              name: `${l.firstName || ""} ${l.lastName || ""}`.trim(),
              phone: cleanAndValidatePhone(l.phoneNumber) || cleanAndValidatePhone(l.secondaryContactNumber) || "",
              firstName: l.firstName || "",
              middleName: l.middleName || "",
              lastName: l.lastName || "",
              email: l.email || "",
              secondaryContactNumber: l.secondaryContactNumber || "",
              source: l.source || "",
              status: l.status || "",
              address: l.address || "",
              street: l.street || "",
              district: l.district || "",
              province: l.province || "",
              gender: l.gender || "",
              notes: l.notes || "",
              age: meta?.age || "",
              fullAddress: meta?.fullAddress || l.address || "",
              packageName: l.interestedPackage?.packageName || "",
              membershipName: l.membership?.name || ""
            };
          })

      const validRecipients = data.filter((r: any) => r.phone)
      // Deduplicate by phone number - keep first occurrence
      const seenPhones = new Set<string>()
      const uniqueRecipients: any[] = []
      let dupes = 0
      validRecipients.forEach((r: any) => {
        if (seenPhones.has(r.phone)) {
          dupes++
          return
        }
        seenPhones.add(r.phone)
        uniqueRecipients.push(r)
      })
      setDuplicateCount(dupes)
      setRawRecipients(uniqueRecipients)
    } catch (err) {
      console.error("Failed to fetch recipients", err)
    } finally {
      setLoading(false)
    }
  }, [recipientType, filters.status, filters.oltId, filters.oltPort, filters.splitterId, getSelectedBranchScope, debouncedFullAddressKeywords])

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error("Please write a message before sending.")
      return
    }

    if (!selectedProvider) {
      toast.error("No SMS provider selected.")
      return
    }

    const isCsvActive = useCsvFilter && csvRows.length > 0 && selectedCsvColumns.length > 0;

    if (targetingScope === "select" && selectedRecipients.length === 0 && manualNumbers.length === 0) {
      toast.error("Please select at least one recipient or add manual numbers.")
      return
    }

    if (targetingScope === "all" && recipientsCount === 0 && manualNumbers.length === 0) {
      toast.error("No recipients found with valid phone numbers matching current filters.")
      return
    }

    setSending(true)
    try {
      const recipientData = targetingScope === "select"
        ? selectedRecipients.map(r => ({
            phone: r.phone,
            recipientId: r.recipientId,
            name: r.name
          }))
        : (isCsvActive
            ? filteredRecipients.map(r => ({
                phone: r.phone,
                recipientId: r.recipientId,
                name: r.name
              }))
            : []);
      // Merge manual numbers (deduplicated against existing recipients)
      const existingPhones = new Set(recipientData.map((r: any) => r.phone))
      manualNumbers.forEach(num => {
        if (!existingPhones.has(num)) {
          recipientData.push({ phone: num, recipientId: null as any, name: 'Manual' })
          existingPhones.add(num)
        }
      })
      const scopedBranchIds = Array.from(getSelectedBranchScope())
      const dynamicFiltersList: string[] = []
      selectedAddresses.forEach(val => dynamicFiltersList.push(`address:${val}`))
      selectedStreets.forEach(val => dynamicFiltersList.push(`street:${val}`))
      selectedDistricts.forEach(val => dynamicFiltersList.push(`district:${val}`))
      selectedGenders.forEach(val => dynamicFiltersList.push(`gender:${val}`))
      selectedPackages.forEach(val => dynamicFiltersList.push(`package:${val}`))
      selectedMemberships.forEach(val => dynamicFiltersList.push(`membership:${val}`))
      fullAddressKeywords.forEach(val => {
        dynamicFiltersList.push(`fullAddress:${val.trim()}`)
      })

      const campaignFilters: any = {
        status: filters.status,
        area: filters.area,
        branchIds: scopedBranchIds,
        dynamicFilters: dynamicFiltersList,
      }

      if (recipientType === "customer") {
        campaignFilters.oltId = filters.oltId
        campaignFilters.oltPort = filters.oltPort
        campaignFilters.splitterId = filters.splitterId
      }

      const res = await apiRequest<any>("/service/sms/campaigns", {
        method: "POST",
        body: JSON.stringify({
          to: recipientData,
          text: message,
          type: recipientType,
          provider: selectedProvider,
          selectAll: targetingScope === "all" && !isCsvActive,
          filters: campaignFilters,
        })
      })
      const queued = res?.data?.queuedCount || 0
      const skipped = res?.data?.skippedCount || 0
      toast.success(`SMS campaign queued for ${queued} recipients${skipped ? `, ${skipped} skipped` : ""}.`)
      setMessage("")
      setSelectedRecipients([])
      setManualNumbers([])
      setManualNumberInput('')
      fetchCredit(selectedProvider)
      fetchCampaigns()
    } catch (err: any) {
      toast.error(err.message || "Failed to queue SMS campaign")
    } finally {
      setSending(false)
    }
  }

  const updateFilter = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const resetFilters = () => {
    setFilters({ oltId: "all", oltPort: "", splitterId: "all", area: "", status: "all" })
    setSelectedHeadOffices([])
    setSelectedBranches([])
    setSelectedSubBranches([])
    setSelectedAddresses([])
    setSelectedStreets([])
    setSelectedDistricts([])
    setSelectedGenders([])
    setSelectedPackages([])
    setFullAddressKeywords([])
    setDebouncedFullAddressKeywords([])
    setFullAddressInput("")
  }

  const activeFilterCount = [
    selectedHeadOffices.length > 0,
    selectedBranches.length > 0,
    selectedSubBranches.length > 0,
    filters.oltId !== "all",
    filters.oltPort !== "",
    filters.splitterId !== "all",
    selectedAddresses.length > 0 ||
      selectedStreets.length > 0 ||
      selectedDistricts.length > 0 ||
      selectedGenders.length > 0 ||
      selectedPackages.length > 0 ||
      selectedMemberships.length > 0 ||
      fullAddressKeywords.length > 0 ||
      (useCsvFilter && csvRows.length > 0),
    filters.status !== "all",
  ].filter(Boolean).length

  const activeCampaign = campaigns.find((campaign) => selectedCampaignId ? campaign.id === selectedCampaignId : ["queued", "processing"].includes(campaign.status))

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Bulk SMS Campaign</h1>
          <p className="text-muted-foreground">Broadcast messages to your customers and leads instantly.</p>
        </div>
        {credit && (
          <Card className="bg-emerald-500/10 border-emerald-500/20 p-4 flex items-center gap-4">
            <div className="p-2 rounded-full bg-emerald-500/20 text-emerald-500">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Available Credit</p>
              <p className="text-xl font-bold text-foreground">{credit.available_credit || 0}</p>
            </div>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Campaign Filters */}
        <Card className="bg-card border-border shadow-sm relative overflow-hidden">
          {loading && (
            <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] flex flex-col items-center justify-center z-50">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <span className="text-xs text-muted-foreground mt-2 font-medium">Updating filters...</span>
            </div>
          )}
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-foreground flex items-center gap-2 text-base">
                <Filter className="h-5 w-5 text-blue-500" />
                Target Audience
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">{activeFilterCount} active</Badge>
                )}
              </CardTitle>
              {activeFilterCount > 0 && (
                <Button variant="ghost" size="sm" className="text-xs h-7 px-2 text-muted-foreground" onClick={resetFilters}>
                  Clear all
                </Button>
              )}
            </div>
            <CardDescription>Select who you want to reach</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Recipient Type */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">Recipient Type</Label>
              <Select value={recipientType} onValueChange={(val) => {
                setRecipientType(val)
                setFilters(prev => ({ ...prev, status: "all", oltId: "all", oltPort: "", splitterId: "all" }))
              }}>
                <SelectTrigger className="bg-background border-input text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">
                    <div className="flex items-center gap-2"><Users className="h-3.5 w-3.5" />Active Customers</div>
                  </SelectItem>
                  <SelectItem value="lead">
                    <div className="flex items-center gap-2"><Users className="h-3.5 w-3.5 text-muted-foreground" />Potential Leads</div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Head Office Filter */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider flex items-center gap-1.5">
                <GitBranch className="h-3 w-3" /> Head Office
              </Label>
              <SearchableSelect
                options={headOffices.map((office: any) => ({
                  value: String(office.id),
                  label: office.name,
                  description: office.code || "Root office"
                }))}
                value={selectedHeadOffices.map(String)}
                onValueChange={(val) => {
                  const newHeadOfficeIds = (val as string[]).map(Number)
                  const allowedBranchIds = new Set(
                    branches
                      .filter((branch: any) => newHeadOfficeIds.length === 0 || newHeadOfficeIds.includes(Number(branch.parentId)))
                      .map((branch: any) => Number(branch.id))
                  )

                  setSelectedHeadOffices(newHeadOfficeIds)
                  setSelectedBranches((prev) => prev.filter((id) => allowedBranchIds.has(id)))
                  setSelectedSubBranches((prev) => {
                    const allowedDescendants = new Set(getDescendantBranchIds(Array.from(allowedBranchIds)))
                    return prev.filter((id) => allowedDescendants.has(id))
                  })
                }}
                placeholder="Select head office"
                multiple
                clearable
              />
            </div>

            {/* Branch Filter */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider flex items-center gap-1.5">
                <GitBranch className="h-3 w-3" /> Branches
              </Label>
              <SearchableSelect
                options={branchOptions.map((b: any) => ({
                  value: String(b.id),
                  label: b.name,
                  description: getBranchPath(b)
                }))}
                value={selectedBranches.map(String)}
                onValueChange={(val) => {
                  const newBranchIds = (val as string[]).map(Number)
                  setSelectedBranches(newBranchIds)
                  const allowedSubBranchIds = new Set(getDescendantBranchIds(newBranchIds.length > 0 ? newBranchIds : branchOptions.map((branch: any) => Number(branch.id))))
                  setSelectedSubBranches((prev) =>
                    prev.filter((id) => allowedSubBranchIds.has(id))
                  )
                }}
                placeholder="Select branches"
                multiple
                clearable
                disabled={branchOptions.length === 0}
              />
            </div>

            {/* Sub-Branch Filter */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider flex items-center gap-1.5">
                <GitBranch className="h-3 w-3 rotate-90" /> Sub-Branches
              </Label>
              <SearchableSelect
                options={subBranchOptions.map((sb: any) => ({
                  value: String(sb.id),
                  label: sb.name,
                  description: getBranchPath(sb)
                }))}
                value={selectedSubBranches.map(String)}
                onValueChange={(val) => setSelectedSubBranches((val as string[]).map(Number))}
                placeholder="Select sub-branches"
                multiple
                clearable
                disabled={subBranchOptions.length === 0}
              />
            </div>

            {/* OLT Filter — only for customers */}
            {recipientType === "customer" && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider flex items-center gap-1.5">
                  <Network className="h-3 w-3" /> OLT
                </Label>
                <Select value={filters.oltId} onValueChange={(val) => updateFilter("oltId", val)}>
                  <SelectTrigger className="bg-background border-input text-foreground">
                    <SelectValue placeholder="All OLTs" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All OLTs</SelectItem>
                    {olts.map((o: any) => (
                      <SelectItem key={o.id} value={o.id.toString()}>{o.name || o.host || `OLT-${o.id}`}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {recipientType === "customer" && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider flex items-center gap-1.5">
                  <Network className="h-3 w-3" /> OLT Port
                </Label>
                <Input
                  value={filters.oltPort}
                  onChange={(event) => updateFilter("oltPort", event.target.value)}
                  placeholder="e.g. 0/1/1"
                  className="bg-background border-input text-foreground"
                />
              </div>
            )}

            {/* Splitter Filter — only for customers */}
            {recipientType === "customer" && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider flex items-center gap-1.5">
                  <ScanLine className="h-3 w-3" /> Splitter
                </Label>
                <Select value={filters.splitterId} onValueChange={(val) => updateFilter("splitterId", val)}>
                  <SelectTrigger className="bg-background border-input text-foreground">
                    <SelectValue placeholder="All Splitters" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Splitters</SelectItem>
                    {splitters.map((s: any) => (
                      <SelectItem key={s.id} value={s.id.toString()}>{s.splitterId || s.name || `SPL-${s.id}`}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Address Filter */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="h-3 w-3 text-blue-500" /> Target Address
              </Label>
              <SearchableSelect
                options={addressOptions}
                value={selectedAddresses}
                onValueChange={(val) => setSelectedAddresses(val as string[])}
                placeholder="Search addresses..."
                multiple
                clearable
                disabled={loading || rawRecipients.length === 0}
              />
            </div>

            {/* Street Filter */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="h-3 w-3 text-emerald-500" /> Target Street
              </Label>
              <SearchableSelect
                options={streetOptions}
                value={selectedStreets}
                onValueChange={(val) => setSelectedStreets(val as string[])}
                placeholder="Search streets..."
                multiple
                clearable
                disabled={loading || rawRecipients.length === 0}
              />
            </div>

            {/* District Filter */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="h-3 w-3 text-purple-500" /> Target District
              </Label>
              <SearchableSelect
                options={districtOptions}
                value={selectedDistricts}
                onValueChange={(val) => setSelectedDistricts(val as string[])}
                placeholder="Search districts..."
                multiple
                clearable
                disabled={loading || rawRecipients.length === 0}
              />
            </div>

            {/* Full Address Keywords Tag Filter */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="h-3 w-3 text-red-500" /> Target Full Address (Keywords)
              </Label>
              <div className="flex flex-wrap gap-1.5 p-1.5 border border-input rounded-md bg-background focus-within:ring-1 focus-within:ring-ring focus-within:border-input min-h-[38px] items-center">
                {fullAddressKeywords.map((tag, idx) => (
                  <Badge key={idx} variant="secondary" className="gap-1 pr-1 pl-2 py-0.5 text-xs bg-indigo-500/10 text-indigo-500 border-indigo-500/20 hover:bg-indigo-500/20">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeFullAddressKeyword(tag)}
                      className="rounded-full hover:bg-indigo-500/25 p-0.5 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                <input
                  value={fullAddressInput}
                  onChange={(e) => setFullAddressInput(e.target.value)}
                  onKeyDown={handleFullAddressInputKeyDown}
                  onBlur={handleFullAddressInputBlur}
                  placeholder={fullAddressKeywords.length === 0 ? "Type keyword and press Enter..." : "Add..."}
                  className="flex-1 bg-transparent border-none outline-none focus:ring-0 text-sm h-6 min-w-[120px] text-foreground placeholder:text-muted-foreground"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Gender Filter */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="h-3 w-3 text-pink-500" /> Target Gender
              </Label>
              <SearchableSelect
                options={genderOptions}
                value={selectedGenders}
                onValueChange={(val) => setSelectedGenders(val as string[])}
                placeholder="Search genders..."
                multiple
                clearable
                disabled={loading || rawRecipients.length === 0}
              />
            </div>

            {/* Package Filter */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="h-3 w-3 text-indigo-500" /> Target Package
              </Label>
              <SearchableSelect
                options={packageOptions}
                value={selectedPackages}
                onValueChange={(val) => setSelectedPackages(val as string[])}
                placeholder="Search packages..."
                multiple
                clearable
                disabled={loading || rawRecipients.length === 0}
              />
            </div>

            {/* Membership Filter */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="h-3 w-3 text-amber-500" /> Target Membership
              </Label>
              <SearchableSelect
                options={membershipOptions}
                value={selectedMemberships}
                onValueChange={(val) => setSelectedMemberships(val as string[])}
                placeholder="Search memberships..."
                multiple
                clearable
                disabled={loading || rawRecipients.length === 0}
              />
              {rawRecipients.length === 0 && !loading && (
                <p className="text-[10px] text-muted-foreground italic mt-1">
                  No options available. Verify other audience filters match active leads or customers first.
                </p>
              )}
            </div>

            {/* CSV Filter Section */}
            <div className="space-y-2 pt-2 border-t border-border/50">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider flex items-center gap-1.5">
                  <FileSpreadsheet className="h-3.5 w-3.5 text-green-500" /> Filter by CSV
                </Label>
                {csvRows.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-muted-foreground font-medium">Enable</span>
                    <Checkbox
                      checked={useCsvFilter}
                      onCheckedChange={(checked) => setUseCsvFilter(!!checked)}
                      id="enable-csv-filter"
                    />
                  </div>
                )}
              </div>

              {!csvFileName ? (
                <div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full text-xs h-8 border-dashed flex items-center gap-2 hover:bg-green-500/5 hover:border-green-500/30 hover:text-green-600 transition-colors"
                    onClick={() => document.getElementById("csv-filter-upload")?.click()}
                  >
                    <Upload className="h-3.5 w-3.5" /> Upload filter CSV
                  </Button>
                  <input
                    id="csv-filter-upload"
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleCsvUpload}
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Upload a CSV file to match recipients against specific columns.
                  </p>
                </div>
              ) : (
                <div className="bg-accent/40 rounded-lg p-2.5 border border-border space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileSpreadsheet className="h-4 w-4 text-green-500 shrink-0" />
                      <span className="text-xs font-medium truncate text-foreground/90">
                        {csvFileName}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0 rounded-full"
                      onClick={() => {
                        setCsvFileName("")
                        setCsvRows([])
                        setCsvHeaders([])
                        setSelectedCsvColumns([])
                        setUseCsvFilter(false)
                      }}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <div className="text-[10px] text-muted-foreground flex flex-col gap-1">
                    <div className="flex justify-between">
                      <span>Rows in CSV: {csvRows.length}</span>
                      <span className="font-semibold text-green-600">
                        {useCsvFilter ? `${csvMatchedCount} Matched` : "Filter Inactive"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-border/30">
                    <span className="text-[10px] font-semibold text-foreground/60 uppercase tracking-wider">
                      Match Type:
                    </span>
                    <Select
                      value={csvMatchType}
                      onValueChange={(val: "and" | "or") => setCsvMatchType(val)}
                    >
                      <SelectTrigger className="h-6 text-[10px] px-2 w-[90px] bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="and">AND (All)</SelectItem>
                        <SelectItem value="or">OR (Any)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5 border-t border-border/30 pt-1">
                    <span className="text-[10px] font-semibold text-foreground/60 uppercase tracking-wider block">
                      Match columns:
                    </span>
                    <div className="grid grid-cols-2 gap-2 max-h-[120px] overflow-y-auto pr-1">
                      {csvHeaders.map((header) => (
                        <label
                          key={header}
                          className="flex items-center gap-1.5 text-xs text-foreground/80 cursor-pointer hover:text-foreground transition-colors truncate"
                          title={header}
                        >
                          <Checkbox
                            checked={selectedCsvColumns.includes(header)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedCsvColumns((prev) => [...prev, header])
                              } else {
                                setSelectedCsvColumns((prev) => prev.filter((h) => h !== header))
                              }
                            }}
                          />
                          <span className="truncate">{header}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Status Filter */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">Status</Label>
              <Select value={filters.status} onValueChange={(val) => updateFilter("status", val)}>
                <SelectTrigger className="bg-background border-input text-foreground">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {recipientType === "customer" ? (
                    <>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="qualified">Qualified</SelectItem>
                      <SelectItem value="unqualified">Unqualified</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Targeting Scope Selection */}
            <div className="space-y-1.5 pt-2 border-t border-border/50">
              <Label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">
                Targeting Scope
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={targetingScope === "all" ? "default" : "outline"}
                  className="text-xs h-8 px-3"
                  onClick={() => {
                    setTargetingScope("all");
                    setSelectedRecipients([]);
                  }}
                >
                  All Matching
                </Button>
                <Button
                  type="button"
                  variant={targetingScope === "select" ? "default" : "outline"}
                  className="text-xs h-8 px-3"
                  onClick={() => {
                    setTargetingScope("select");
                    setSearchQuery("");
                    setSearchResults([]);
                  }}
                >
                  Specific Select
                </Button>
              </div>
            </div>

            {/* Manual Number Entry */}
            <div className="space-y-1.5 pt-2 border-t border-border/50">
              <Label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider flex items-center gap-1.5">
                <Phone className="h-3 w-3" />
                Manual Numbers
              </Label>
              <div className="flex gap-1.5">
                <Input
                  placeholder="Enter phone number(s)..."
                  className="h-8 text-xs bg-background border-input flex-1"
                  value={manualNumberInput}
                  onChange={(e) => setManualNumberInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
                      e.preventDefault()
                      const parts = manualNumberInput.split(/[,\s]+/).map(s => s.replace(/\D/g, '').trim()).filter(Boolean)
                      const newNums: string[] = []
                      parts.forEach(num => {
                        let cleaned = num
                        if (cleaned.length === 13 && cleaned.startsWith('977')) cleaned = cleaned.slice(3)
                        if (cleaned.length === 10 && cleaned.startsWith('9') && !manualNumbers.includes(cleaned)) {
                          newNums.push(cleaned)
                        }
                      })
                      if (newNums.length > 0) setManualNumbers(prev => [...prev, ...newNums])
                      else if (parts.length > 0) toast.error('Invalid number. Must be 10 digits starting with 9.')
                      setManualNumberInput('')
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 px-2"
                  onClick={() => {
                    const parts = manualNumberInput.split(/[,\s]+/).map(s => s.replace(/\D/g, '').trim()).filter(Boolean)
                    const newNums: string[] = []
                    parts.forEach(num => {
                      let cleaned = num
                      if (cleaned.length === 13 && cleaned.startsWith('977')) cleaned = cleaned.slice(3)
                      if (cleaned.length === 10 && cleaned.startsWith('9') && !manualNumbers.includes(cleaned)) {
                        newNums.push(cleaned)
                      }
                    })
                    if (newNums.length > 0) setManualNumbers(prev => [...prev, ...newNums])
                    else if (parts.length > 0) toast.error('Invalid number. Must be 10 digits starting with 9.')
                    setManualNumberInput('')
                  }}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
              {manualNumbers.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {manualNumbers.map((num) => (
                    <Badge
                      key={num}
                      variant="secondary"
                      className="text-[10px] px-2 py-0.5 gap-1 font-mono"
                    >
                      {num}
                      <button
                        type="button"
                        className="ml-0.5 hover:text-red-500 transition-colors"
                        onClick={() => setManualNumbers(prev => prev.filter(n => n !== num))}
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </Badge>
                  ))}
                  <button
                    type="button"
                    className="text-[10px] text-muted-foreground hover:text-red-500 transition-colors underline"
                    onClick={() => setManualNumbers([])}
                  >
                    Clear all
                  </button>
                </div>
              )}
              <p className="text-[10px] text-muted-foreground italic">
                Add numbers manually. Press Enter or comma to add. Supports multiple numbers separated by comma or space.
              </p>
            </div>

            {targetingScope === "all" ? (
              /* All Matching Summary Card */
              <div className="p-4 rounded-lg bg-blue-600/5 border border-blue-600/20 mt-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-muted-foreground font-medium">Matching Recipients</span>
                  <Badge variant="outline" className="bg-blue-600/10 text-blue-600 border-blue-600/20 font-bold">
                    {loading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      `${recipientsCount} Total`
                    )}
                  </Badge>
                </div>
                {duplicateCount > 0 && (
                  <p className="text-[10px] text-amber-600 font-medium mt-1">
                    {duplicateCount} duplicate phone {duplicateCount === 1 ? 'number' : 'numbers'} removed
                  </p>
                )}
                <p className="text-[10px] text-muted-foreground italic">
                  Broadcasts to all valid phone numbers matching the current filters.
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-2 h-7 text-xs gap-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  onClick={fetchRecipients}
                  disabled={loading}
                >
                  <RefreshCw className="h-3 w-3" />
                  Refresh Count
                </Button>
              </div>
            ) : (
              /* Specific Selection UI */
              <div className="space-y-3 pt-2">
                {/* Search Bar */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">
                    Search & Add Recipients
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder={`Search ${recipientType === 'customer' ? 'customers' : 'leads'} by name or phone...`}
                      className="pl-8 h-8 text-xs bg-background border-input"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searching && (
                      <Loader2 className="absolute right-2.5 top-2.5 h-3.5 w-3.5 animate-spin text-muted-foreground" />
                    )}
                  </div>
                </div>

                {/* Search Results Dropdown */}
                {searchResults.length > 0 && (
                  <div className="border border-border rounded-md max-h-[180px] overflow-y-auto divide-y divide-border/50 bg-popover text-popover-foreground shadow-md">
                    {searchResults.map((rec) => {
                      const isAlreadySelected = selectedRecipients.some(r => r.phone === rec.phone);
                      return (
                        <button
                          key={rec.phone}
                          type="button"
                          className="w-full flex items-center justify-between px-3 py-2 hover:bg-muted/60 transition-colors text-left"
                          onClick={() => {
                            if (!isAlreadySelected) {
                              setSelectedRecipients(prev => [...prev, rec]);
                            }
                            setSearchQuery("");
                            setSearchResults([]);
                          }}
                        >
                          <div className="flex flex-col">
                            <span className="text-xs font-medium">{rec.name || "Unnamed"}</span>
                            <span className="text-[10px] text-muted-foreground">{rec.phone}</span>
                          </div>
                          {isAlreadySelected ? (
                            <Badge variant="secondary" className="text-[9px] px-1.5 py-0">Added</Badge>
                          ) : (
                            <span className="text-[10px] text-primary font-medium">+ Add</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Selected Recipients Checklist */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">
                      Selected List
                    </Label>
                    <Badge variant="outline" className="text-[10px] bg-slate-500/10">
                      {selectedRecipients.length} selected
                    </Badge>
                  </div>

                  <div className="border border-border rounded-md max-h-[180px] overflow-y-auto divide-y divide-border/50 bg-background/50">
                    {selectedRecipients.length === 0 ? (
                      <div className="p-4 text-xs text-center text-muted-foreground italic">
                        Use the search bar above to find and add recipients.
                      </div>
                    ) : (
                      selectedRecipients.map((rec) => (
                        <div key={rec.phone} className="flex items-center justify-between px-3 py-1.5 hover:bg-muted/40 transition-colors">
                          <div className="flex flex-col text-left">
                            <span className="text-xs font-medium text-foreground">{rec.name || "Unnamed"}</span>
                            <span className="text-[10px] text-muted-foreground">{rec.phone}</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                            onClick={() => setSelectedRecipients(prev => prev.filter(r => r.phone !== rec.phone))}
                          >
                            <span className="text-xs font-bold">×</span>
                          </Button>
                        </div>
                      ))
                    )}
                  </div>

                  {selectedRecipients.length > 0 && (
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-[10px] h-6 px-2 text-muted-foreground hover:bg-muted"
                        onClick={() => setSelectedRecipients([])}
                      >
                        Clear List
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Message Composer */}
        <Card className="lg:col-span-2 bg-card border-border shadow-sm flex flex-col">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-emerald-500" />
              Compose Message
            </CardTitle>
            <CardDescription>What would you like to say?</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 space-y-4">
            {/* SMS Provider Selection */}
            <div className="space-y-1.5 pb-4 border-b border-border/50">
              <Label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">SMS Provider Selection</Label>
              {smsProviders.length > 0 ? (
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  <Select value={selectedProvider} onValueChange={handleProviderChange}>
                    <SelectTrigger className="bg-background border-input text-foreground max-w-[240px]">
                      <SelectValue placeholder="Select SMS Provider" />
                    </SelectTrigger>
                    <SelectContent>
                      {smsProviders.map((provider) => (
                        <SelectItem key={provider.service.code} value={provider.service.code}>
                          {provider.service.name} {provider.config?.isDefault && "(Default)"} {provider.isActive === false && "(Inactive)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {credit && (
                    <div className="text-sm text-muted-foreground">
                      Available Credit: <span className="font-bold text-foreground">{credit.available_credit || 0}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-600">
                  No SMS providers configured. Please configure Aakash SMS or Sparrow SMS in settings.
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground/80">Message Text</label>
                <span className="text-xs text-muted-foreground">{message.length} characters ({getSmsParts(message)} {getSmsParts(message) === 1 ? 'part' : 'parts'})</span>
              </div>
              <Textarea
                placeholder="Type your message here..."
                className="min-h-[250px] bg-background border-input text-foreground focus:ring-emerald-500/50"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <div className="flex flex-wrap gap-2 mt-2">
                {[
                  { label: "+ First Name", token: "{firstName}" },
                  { label: "+ Last Name", token: "{lastName}" },
                  { label: "+ Expiry Date", token: "{expiryDate}" },
                  { label: "+ Due Amount", token: "{amount}" },
                  { label: "+ Package", token: "{package}" },
                ].map(({ label, token }) => (
                  <Button
                    key={token}
                    variant="outline"
                    size="sm"
                    className="text-[11px] h-7 bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground"
                    onClick={() => setMessage(prev => prev + token)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-border mt-auto">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-2 text-amber-600 bg-amber-500/5 px-3 py-1.5 rounded-full border border-amber-500/10">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-xs font-medium">
                    Estimated Cost: {((targetingScope === "all" ? recipientsCount : selectedRecipients.length) + manualNumbers.length) * getSmsParts(message)} Credits
                  </span>
                </div>
                <div className="flex items-center gap-2 text-emerald-600 bg-emerald-500/5 px-3 py-1.5 rounded-full border border-emerald-500/10">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-xs font-medium">Service Status: Online</span>
                </div>
              </div>
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 shadow-lg shadow-emerald-600/20 transition-all active:scale-[0.98]"
                onClick={handleSend}
                disabled={sending || loading || ((targetingScope === "all" ? recipientsCount === 0 : selectedRecipients.length === 0) && manualNumbers.length === 0) || !message.trim()}
              >
                {sending ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Queueing Campaign...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-5 w-5" />
                    Queue SMS Campaign ({(targetingScope === "all" ? recipientsCount : selectedRecipients.length) + manualNumbers.length} recipients)
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="text-foreground flex items-center gap-2 text-base">
                <Clock className="h-5 w-5 text-indigo-500" />
                Campaign Queue & Logs
              </CardTitle>
              <CardDescription>Track queued, sent, failed, and skipped campaign recipients.</CardDescription>
            </div>
            <div className="flex gap-2">
              {selectedCampaignId && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => {
                    const baseUrl = getDynamicBaseUrl().replace(/\/+$/, '')
                    const statusParam = logsStatusFilter && logsStatusFilter !== 'all' ? `?status=${logsStatusFilter}` : ''
                    window.open(`${baseUrl}/service/sms/campaigns/${selectedCampaignId}/export${statusParam}`, '_blank')
                  }}
                >
                  <Download className="h-3.5 w-3.5" />
                  Export CSV
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={fetchCampaigns} className="gap-1.5">
                <RefreshCw className="h-3.5 w-3.5" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {campaigns.length === 0 ? (
            <div className="text-sm text-muted-foreground border border-dashed rounded-md p-4">
              No SMS campaigns found yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                {campaigns.map((campaign) => (
                  <button
                    key={campaign.id}
                    type="button"
                    className={`w-full text-left rounded-md border p-3 transition-colors ${selectedCampaignId === campaign.id || (!selectedCampaignId && activeCampaign?.id === campaign.id) ? "border-indigo-500 bg-indigo-500/5" : "border-border hover:bg-muted/50"}`}
                    onClick={() => {
                      setSelectedCampaignId(campaign.id)
                      setLogsStatusFilter("all")
                      fetchCampaignLogs(campaign.id, "all")
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">Campaign #{campaign.id}</span>
                      <Badge variant={campaign.status === "completed" ? "default" : campaign.status === "failed" ? "destructive" : "secondary"}>
                        {campaign.status}
                      </Badge>
                    </div>
                    <div className="mt-2 grid grid-cols-4 gap-2 text-[11px] text-muted-foreground">
                      <span>Q {campaign.queuedCount}</span>
                      <span className="text-emerald-600">S {campaign.sentCount}</span>
                      <span className="text-red-600">F {campaign.failedCount}</span>
                      <span>Skip {campaign.skippedCount}</span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="lg:col-span-2 space-y-3">
                {/* Status counts summary */}
                {selectedCampaignId && (
                  <div className="grid grid-cols-5 gap-2">
                    {([
                      { key: 'all', label: 'All', count: statusCounts.total, color: 'bg-slate-100 text-slate-700 border-slate-200' },
                      { key: 'sent', label: 'Sent', count: statusCounts.sent, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                      { key: 'failed', label: 'Failed', count: statusCounts.failed, color: 'bg-red-50 text-red-700 border-red-200' },
                      { key: 'skipped', label: 'Skipped', count: statusCounts.skipped, color: 'bg-amber-50 text-amber-700 border-amber-200' },
                      { key: 'queued', label: 'Queued', count: statusCounts.queued, color: 'bg-blue-50 text-blue-700 border-blue-200' },
                    ] as const).map(({ key, label, count, color }) => (
                      <button
                        key={key}
                        type="button"
                        className={`rounded-md border px-2 py-1.5 text-center transition-all ${color} ${logsStatusFilter === key ? 'ring-2 ring-offset-1 ring-indigo-400 font-bold' : 'opacity-80 hover:opacity-100'}`}
                        onClick={() => {
                          setLogsStatusFilter(key)
                          if (selectedCampaignId) fetchCampaignLogs(selectedCampaignId, key)
                        }}
                      >
                        <div className="text-lg font-bold leading-tight">{count}</div>
                        <div className="text-[10px] font-medium">{label}</div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Logs table */}
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Phone</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Error</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logsLoading ? (
                        <TableRow>
                          <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                            <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                          </TableCell>
                        </TableRow>
                      ) : campaignLogs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                            {selectedCampaignId ? 'No logs found for this filter.' : 'Select a campaign to view logs.'}
                          </TableCell>
                        </TableRow>
                      ) : (
                        campaignLogs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell className="font-mono text-xs">{log.phone}</TableCell>
                            <TableCell className="text-xs">{log.name || "-"}</TableCell>
                            <TableCell>
                              <Badge variant={log.status === "sent" ? "default" : log.status === "failed" ? "destructive" : "secondary"} className="gap-1">
                                {log.status === "sent" && <CheckCircle2 className="h-3 w-3" />}
                                {log.status === "failed" && <XCircle className="h-3 w-3" />}
                                {log.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-[260px] truncate text-xs text-muted-foreground">{log.errorMessage || "-"}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
