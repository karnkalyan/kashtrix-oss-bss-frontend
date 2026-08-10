"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Copy,
  List,
  RefreshCw,
  Search,
  TreePine,
  X
} from "lucide-react";
import { apiRequest } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Parameter = {
  path: string;
  value: unknown;
  type: string;
  source: string;
  writable: boolean;
  updatedAt: string | null;
};

type Response = {
  success: boolean;
  data: Parameter[];
  capabilities: {
    protocolRoots: Record<string, boolean>;
    features: Record<string, boolean>;
    parameterLeaves: number;
  };
  refreshTasks?: Array<{ objectName: string; status: string; message?: string }>;
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

type SortKey = "path" | "value" | "type" | "access" | "source";
type SortOrder = "asc" | "desc";

const ROOTS = [
  { value: "", label: "All model roots" },
  { value: "InternetGatewayDevice.", label: "TR-098 · InternetGatewayDevice" },
  { value: "Device.", label: "TR-181 · Device" },
  { value: "VirtualParameters.", label: "Virtual parameters" }
];
const PAGE_SIZES = [25, 50, 100, 250];

export function TR069DeviceParameters({ deviceId }: { deviceId: string }) {
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [root, setRoot] = useState("");
  const [access, setAccess] = useState("all");
  const [source, setSource] = useState("all");
  const [sort, setSort] = useState<SortKey>("path");
  const [order, setOrder] = useState<SortOrder>("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [view, setView] = useState<"flat" | "tree">("flat");
  const [result, setResult] = useState<Response | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (refresh = false) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
        access,
        source,
        sort,
        order
      });
      if (submitted) params.set("search", submitted);
      if (root) params.set("root", root);
      if (refresh) params.set("refresh", "true");
      const response = await apiRequest<Response>(
        `/services/genieacs/devices/${encodeURIComponent(deviceId)}/parameters?${params}`,
        { suppressToast: true }
      );
      setResult(response);
      setError("");
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Could not load TR-069 parameters");
    } finally {
      setLoading(false);
    }
  }, [access, deviceId, order, page, pageSize, root, sort, source, submitted]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(false), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const resetPageAnd = (action: () => void) => {
    setPage(1);
    action();
  };

  const clearFilters = () => {
    setQuery("");
    setSubmitted("");
    setRoot("");
    setAccess("all");
    setSource("all");
    setSort("path");
    setOrder("asc");
    setPage(1);
  };

  const changeSort = (key: SortKey) => {
    setPage(1);
    if (sort === key) setOrder(current => current === "asc" ? "desc" : "asc");
    else {
      setSort(key);
      setOrder("asc");
    }
  };

  const totalPages = Math.max(1, result?.pagination.totalPages || 1);
  const pageNumbers = useMemo(() => {
    const start = Math.max(1, Math.min(page - 2, totalPages - 4));
    return Array.from({ length: Math.min(5, totalPages) }, (_, index) => start + index);
  }, [page, totalPages]);

  const firstRow = result?.pagination.total ? (page - 1) * pageSize + 1 : 0;
  const lastRow = result ? Math.min(page * pageSize, result.pagination.total) : 0;
  const filterActive = Boolean(submitted || root || access !== "all" || source !== "all");

  return (
    <div className="space-y-4">
      {result?.capabilities && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Capability title="Parameter leaves" value={result.capabilities.parameterLeaves.toLocaleString()} />
          <Capability
            title="Protocol roots"
            value={Object.entries(result.capabilities.protocolRoots).filter(([, supported]) => supported).map(([name]) => name.toUpperCase()).join(", ") || "None"}
          />
          <Capability
            title="Management surfaces"
            value={Object.entries(result.capabilities.features).filter(([, supported]) => supported).map(([name]) => name).join(", ") || "None"}
          />
          <Capability
            title="Adapter gaps"
            value={Object.entries(result.capabilities.features).filter(([, supported]) => !supported).map(([name]) => name).join(", ") || "No major gaps"}
          />
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="border-b bg-muted/20 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold">TR-069 Parameter Table</h3>
              <p className="mt-1 text-xs text-muted-foreground">Search and inspect every cached CPE parameter with native ACS metadata.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => void load(true)} disabled={loading}>
                <RefreshCw className={`mr-1.5 size-3.5 ${loading ? "animate-spin" : ""}`} />
                Refresh table
              </Button>
              <Button variant="outline" size="sm" onClick={() => setView(current => current === "flat" ? "tree" : "flat")}>
                {view === "flat" ? <TreePine className="mr-1.5 size-3.5" /> : <List className="mr-1.5 size-3.5" />}
                {view === "flat" ? "Tree view" : "Table view"}
              </Button>
            </div>
          </div>

          <form
            className="mt-4 flex gap-2"
            onSubmit={event => {
              event.preventDefault();
              resetPageAnd(() => setSubmitted(query.trim()));
            }}
          >
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={event => setQuery(event.target.value)}
                className="pl-9"
                placeholder="Search parameter path or current value…"
              />
            </div>
            <Button type="submit">Search</Button>
          </form>

          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <FilterSelect value={root} onChange={value => resetPageAnd(() => setRoot(value))} label="Model root" options={ROOTS} />
            <FilterSelect
              value={access}
              onChange={value => resetPageAnd(() => setAccess(value))}
              label="Access"
              options={[
                { value: "all", label: "All access levels" },
                { value: "writable", label: "Writable only" },
                { value: "readonly", label: "Read-only only" }
              ]}
            />
            <FilterSelect
              value={source}
              onChange={value => resetPageAnd(() => setSource(value))}
              label="Source"
              options={[
                { value: "all", label: "All sources" },
                { value: "tr-098", label: "TR-098" },
                { value: "tr-181", label: "TR-181" },
                { value: "virtualparameters", label: "Virtual parameters" },
                { value: "genieacs", label: "ACS metadata" }
              ]}
            />
            <div className="flex items-center gap-2">
              <label className="sr-only" htmlFor="parameter-page-size">Rows per page</label>
              <select
                id="parameter-page-size"
                className="h-9 flex-1 rounded-md border bg-background px-3 text-xs"
                value={pageSize}
                onChange={event => resetPageAnd(() => setPageSize(Number(event.target.value)))}
              >
                {PAGE_SIZES.map(size => <option key={size} value={size}>{size} rows per page</option>)}
              </select>
              {filterActive && <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>Clear</Button>}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-muted-foreground">Loading parameter page…</div>
        ) : error ? (
          <div className="p-8 text-center text-sm text-destructive">
            {error}
            <Button variant="outline" size="sm" className="ml-3" onClick={() => void load(false)}>Retry</Button>
          </div>
        ) : !result?.data.length ? (
          <div className="p-12 text-center text-sm text-muted-foreground">No parameters match the selected filters.</div>
        ) : view === "flat" ? (
          <FlatTable rows={result.data} sort={sort} order={order} onSort={changeSort} />
        ) : (
          <TreeView rows={result.data} />
        )}

        {result && (
          <div className="flex flex-col gap-3 border-t bg-muted/10 px-4 py-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span>
              Showing <strong className="text-foreground">{firstRow.toLocaleString()}–{lastRow.toLocaleString()}</strong> of{" "}
              <strong className="text-foreground">{result.pagination.total.toLocaleString()}</strong> matching parameters
            </span>
            <div className="flex flex-wrap items-center gap-1">
              <PageButton label="First page" disabled={page <= 1} onClick={() => setPage(1)}><ChevronsLeft className="size-4" /></PageButton>
              <PageButton label="Previous page" disabled={page <= 1} onClick={() => setPage(value => value - 1)}><ChevronLeft className="size-4" /></PageButton>
              {pageNumbers.map(number => (
                <Button
                  key={number}
                  variant={number === page ? "default" : "outline"}
                  size="sm"
                  className="h-8 min-w-8 px-2"
                  onClick={() => setPage(number)}
                  aria-current={number === page ? "page" : undefined}
                >
                  {number}
                </Button>
              ))}
              <PageButton label="Next page" disabled={page >= totalPages} onClick={() => setPage(value => value + 1)}><ChevronRight className="size-4" /></PageButton>
              <PageButton label="Last page" disabled={page >= totalPages} onClick={() => setPage(totalPages)}><ChevronsRight className="size-4" /></PageButton>
              <span className="ml-2 whitespace-nowrap">Page {page} of {totalPages}</span>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function FlatTable({
  rows,
  sort,
  order,
  onSort
}: {
  rows: Parameter[];
  sort: SortKey;
  order: SortOrder;
  onSort: (key: SortKey) => void;
}) {
  return (
    <div className="max-h-[68vh] overflow-auto">
      <table className="w-full min-w-[980px] table-fixed text-left text-xs">
        <thead className="sticky top-0 z-10 border-b bg-background shadow-sm">
          <tr>
            <SortableHeader className="w-[44%]" label="Parameter path" field="path" sort={sort} order={order} onSort={onSort} />
            <SortableHeader className="w-[25%]" label="Current value" field="value" sort={sort} order={order} onSort={onSort} />
            <SortableHeader className="w-[10%]" label="Type" field="type" sort={sort} order={order} onSort={onSort} />
            <SortableHeader className="w-[10%]" label="Access" field="access" sort={sort} order={order} onSort={onSort} />
            <SortableHeader className="w-[8%]" label="Source" field="source" sort={sort} order={order} onSort={onSort} />
            <th className="w-12 p-3"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((row, index) => (
            <tr key={row.path} className={index % 2 ? "bg-muted/10 hover:bg-indigo-500/5" : "hover:bg-indigo-500/5"}>
              <td className="p-3 align-top">
                <div className="break-all font-mono font-medium text-foreground" title={row.path}>{row.path}</div>
                {row.updatedAt && <div className="mt-1 text-[9px] text-muted-foreground">Updated {formatTimestamp(row.updatedAt)}</div>}
              </td>
              <td className="p-3 align-top">
                <div className="max-h-24 overflow-auto whitespace-pre-wrap break-all rounded-md bg-muted/30 px-2 py-1.5 font-mono" title={formatValue(row.value)}>
                  {formatValue(row.value)}
                </div>
              </td>
              <td className="p-3 align-top"><Badge variant="outline" className="font-mono font-normal">{row.type || "unknown"}</Badge></td>
              <td className="p-3 align-top">
                <Badge className={row.writable ? "border border-amber-500/20 bg-amber-500/10 text-amber-700" : "border border-slate-500/20 bg-slate-500/10 text-slate-600"}>
                  {row.writable ? "Writable" : "Read-only"}
                </Badge>
              </td>
              <td className="p-3 align-top"><span className="whitespace-nowrap text-[10px] font-semibold text-muted-foreground">{row.source}</span></td>
              <td className="p-2 align-top">
                <Button variant="ghost" size="icon" onClick={() => void navigator.clipboard.writeText(row.path)} title="Copy parameter path">
                  <Copy className="size-3.5" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SortableHeader({
  className,
  label,
  field,
  sort,
  order,
  onSort
}: {
  className?: string;
  label: string;
  field: SortKey;
  sort: SortKey;
  order: SortOrder;
  onSort: (key: SortKey) => void;
}) {
  const Icon = sort !== field ? ArrowUpDown : order === "asc" ? ArrowUp : ArrowDown;
  return (
    <th className={`p-3 ${className || ""}`}>
      <button type="button" className="inline-flex items-center gap-1.5 font-semibold hover:text-indigo-600" onClick={() => onSort(field)}>
        {label}<Icon className="size-3.5" />
      </button>
    </th>
  );
}

function TreeView({ rows }: { rows: Parameter[] }) {
  const grouped = rows.reduce<Record<string, Parameter[]>>((groups, row) => {
    const key = row.path.split(".").slice(0, 3).join(".");
    (groups[key] ||= []).push(row);
    return groups;
  }, {});

  return (
    <div className="max-h-[68vh] space-y-3 overflow-auto p-4">
      {Object.entries(grouped).map(([group, items]) => (
        <div key={group} className="overflow-hidden rounded-xl border">
          <div className="sticky top-0 border-b bg-muted/40 px-4 py-3 font-mono text-xs font-semibold">
            {group}<Badge variant="outline" className="ml-2">{items.length}</Badge>
          </div>
          <div className="divide-y">
            {items.map(row => (
              <div key={row.path} className="grid gap-2 p-3 text-xs md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto_auto]">
                <span className="break-all font-mono">{row.path}</span>
                <span className="break-all font-mono text-muted-foreground">{formatValue(row.value)}</span>
                <Badge variant="outline">{row.writable ? "Writable" : "Read-only"}</Badge>
                <Button variant="ghost" size="icon" onClick={() => void navigator.clipboard.writeText(row.path)} title="Copy parameter path">
                  <Copy className="size-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  label,
  options
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="flex items-center gap-2 rounded-md border bg-background px-3">
      <span className="whitespace-nowrap text-[10px] font-bold uppercase text-muted-foreground">{label}</span>
      <select className="h-9 min-w-0 flex-1 bg-transparent text-xs outline-none" value={value} onChange={event => onChange(event.target.value)}>
        {options.map(option => <option key={option.value || "all"} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}

function PageButton({ label, disabled, onClick, children }: { label: string; disabled: boolean; onClick: () => void; children: React.ReactNode }) {
  return <Button variant="outline" size="icon" className="size-8" disabled={disabled} onClick={onClick} aria-label={label}>{children}</Button>;
}

function Capability({ title, value }: { title: string; value: string }) {
  const missing = /none|gap|missing/i.test(value);
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {missing ? <X className="size-4 text-amber-500" /> : <Check className="size-4 text-emerald-500" />}
        {title}
      </div>
      <p className="mt-2 text-sm font-semibold capitalize">{value}</p>
    </Card>
  );
}

function formatValue(value: unknown) {
  if (value === undefined || value === null || value === "") return "—";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value);
}

function formatTimestamp(value: string) {
  const timestamp = new Date(value);
  return Number.isNaN(timestamp.getTime()) ? value : timestamp.toLocaleString();
}
