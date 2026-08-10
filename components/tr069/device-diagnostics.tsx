"use client";

import { CardContainer } from "@/components/ui/card-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { Play, Download } from "lucide-react";
import { apiRequest } from "@/lib/api";

interface TR069DeviceDiagnosticsProps {
  deviceId: string;
  deviceLog?: string;
}

type DiagnosticTask = {
  taskId?: string;
  diagnostic?: "ping" | "traceroute" | "dns";
  dataModel?: "TR-098" | "TR-181";
  resultPath?: string;
  resultStatus?: "queued" | "pending" | "completed" | "failed";
  [key: string]: unknown;
};

type DiagnosticResult = {
  status: "queued" | "pending" | "completed" | "failed";
  diagnosticsState: string;
  taskStatus?: "queued" | "consumed";
  message?: string | null;
  target?: string;
  summary?: Record<string, unknown>;
  results?: Array<Record<string, unknown>>;
  [key: string]: unknown;
};

const wait = (milliseconds: number) => new Promise(resolve => setTimeout(resolve, milliseconds));

function diagnosticNumber(result: DiagnosticResult, key: string) {
  const raw = result.summary?.[key];
  if (raw === null || raw === undefined || raw === "") return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function HumanDiagnosticResult({ result }: { result: DiagnosticResult }) {
  const success = diagnosticNumber(result, "successCount");
  const failed = diagnosticNumber(result, "failureCount");
  const sent = (success || 0) + (failed || 0);
  const loss = sent ? Math.round(((failed || 0) / sent) * 100) : null;
  return <div className="space-y-2 text-xs">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <strong className="text-sm">{result.target || "Diagnostic target"}</strong>
      <BadgeText value={result.status} />
    </div>
    {result.status === "queued" && <p className="text-amber-600">{result.message || "Waiting for the CPE to consume the queued task."}</p>}
    {result.status === "pending" && <p className="text-indigo-600">{result.message || "The CPE is running the diagnostic."}</p>}
    {result.status === "completed" && <p className={`text-base font-extrabold ${(success || 0) > 0 || result.results?.length ? "text-emerald-600" : "text-rose-600"}`}>
      {result.results?.length
        ? `Route completed with ${result.results.length} hop(s)`
        : (success || 0) > 0
          ? `${result.target || "Target"} is reachable`
          : `No reply from ${result.target || "target"}`}
    </p>}
    {success !== null && <div className="grid gap-2 sm:grid-cols-2">
      <div className="rounded-lg border bg-background/60 p-3"><span className="block text-[10px] uppercase text-muted-foreground">Packets</span><strong>{sent} sent · {success} received · {failed || 0} lost{loss !== null ? ` (${loss}%)` : ""}</strong></div>
      <div className="rounded-lg border bg-background/60 p-3"><span className="block text-[10px] uppercase text-muted-foreground">Latency min / avg / max</span><strong>{diagnosticNumber(result, "minimumResponseTime") ?? "—"} / {diagnosticNumber(result, "averageResponseTime") ?? "—"} / {diagnosticNumber(result, "maximumResponseTime") ?? "—"} ms</strong></div>
    </div>}
    {result.results && result.results.length > 0 && <ol className="max-h-64 space-y-1 overflow-auto rounded-lg border p-2 font-mono text-[10px]">
      {result.results.map((item, index) => <li key={String(item.index ?? index)}>{index + 1}. {String(item.HopHost || item.HopHostAddress || item.HostName || "Result")} {item.HopRTTimes ? `· ${String(item.HopRTTimes)} ms` : ""}</li>)}
    </ol>}
    {result.status === "completed" && success === 0 && (failed || 0) > 0 && <p className="text-muted-foreground">No ICMP replies were received. The target may block ping even when the WAN is online.</p>}
    {result.status === "failed" && <p className="text-rose-600">The CPE reported {result.diagnosticsState || "a diagnostic error"}.</p>}
  </div>;
}

function BadgeText({ value }: { value: string }) {
  return <span className="rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase">{value}</span>;
}

export function TR069DeviceDiagnostics({ deviceId, deviceLog }: TR069DeviceDiagnosticsProps) {
  const [pingTarget, setPingTarget] = useState("8.8.8.8");
  const [pingCount, setPingCount] = useState("4");
  const [tracerouteTarget, setTracerouteTarget] = useState("google.com");
  const [diagResults, setDiagResults] = useState("");
  const [latestResult, setLatestResult] = useState<DiagnosticResult | null>(null);
  const [resultStatus, setResultStatus] = useState<"idle" | "pending" | "completed" | "failed">("idle");
  const [isRunning, setIsRunning] = useState(false);
  const [logs] = useState(deviceLog || "");

  const runDiagnostic = async (type: "ping" | "traceroute" | "dns") => {
    setIsRunning(true);
    setDiagResults("");
    setLatestResult(null);
    setResultStatus("pending");
    toast.loading(`Executing TR-069 diagnostics...`, { id: "diag" });
    try {
      const target = type === "ping" ? pingTarget : tracerouteTarget;
      const response = await apiRequest<{ success: boolean; data?: DiagnosticTask; error?: string }>(
        `/services/genieacs/devices/${encodeURIComponent(deviceId)}/diagnostics`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type,
            target,
            repetitions: Number(pingCount) || 4,
            timeout: 5000
          }),
          suppressToast: true,
        }
      );
      if (!response.success) throw new Error(response.error || "Diagnostic could not be queued");
      const task = response.data;
      if (!task?.dataModel) throw new Error("The diagnostic task did not return its data model");
      setDiagResults(JSON.stringify({ task, result: { status: "pending", message: "Waiting for the CPE diagnostic response..." } }, null, 2));
      toast.loading(`${type.charAt(0).toUpperCase() + type.slice(1)} requested; waiting for CPE results...`, { id: "diag" });

      let finalResult: DiagnosticResult | null = null;
      let lastError: Error | null = null;
      // A CPE whose Connection Request cannot be reached may only collect the
      // task on its next periodic Inform (commonly every 300 seconds).
      for (let attempt = 1; attempt <= 72; attempt += 1) {
        if (attempt > 1) await wait(5000);
        try {
          const query = new URLSearchParams({
            type,
            dataModel: task.dataModel,
            refresh: "true"
          });
          if (task.taskId) query.set("taskId", task.taskId);
          const resultResponse = await apiRequest<{ success: boolean; data?: DiagnosticResult; error?: string }>(
            `/services/genieacs/devices/${encodeURIComponent(deviceId)}/diagnostics/result?${query}`,
            { suppressToast: true }
          );
          if (!resultResponse.success || !resultResponse.data) {
            throw new Error(resultResponse.error || "Diagnostic result is unavailable");
          }
          finalResult = resultResponse.data;
          setLatestResult(finalResult);
          setDiagResults(JSON.stringify({
            task: { ...task, resultStatus: finalResult.status },
            result: finalResult
          }, null, 2));
          if (finalResult.status === "completed" || finalResult.status === "failed") break;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error("Could not retrieve diagnostic result");
        }
      }

      if (!finalResult) throw lastError || new Error("No diagnostic response was returned by the CPE");
      setResultStatus(finalResult.status === "queued" ? "pending" : finalResult.status);
      if (finalResult.status === "completed") {
        toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} diagnostic completed`, { id: "diag" });
      } else if (finalResult.status === "failed") {
        toast.error(`CPE diagnostic failed: ${finalResult.diagnosticsState}`, { id: "diag", duration: 8000 });
      } else if (finalResult.status === "queued") {
        toast.error(finalResult.message || "ACS queued the task, but the CPE has not consumed it yet.", { id: "diag", duration: 8000 });
      } else {
        toast.error(finalResult.message || "The CPE has not completed the diagnostic yet. Retry shortly.", { id: "diag", duration: 8000 });
      }
    } catch (error) {
      setResultStatus("failed");
      toast.error(error instanceof Error ? error.message : "Diagnostic failed", { id: "diag" });
    } finally {
      setIsRunning(false);
    }
  };

  const downloadLogs = () => {
    const element = document.createElement("a");
    const file = new Blob([logs], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `device-${deviceId}-logs.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success("Logs downloaded successfully");
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="ping" className="w-full">
        <TabsList className="bg-secondary/40 border p-1 rounded-xl">
          <TabsTrigger value="ping" className="rounded-lg text-xs font-bold px-4 py-1.5 data-[state=active]:bg-indigo-600 data-[state=active]:text-white">Ping</TabsTrigger>
          <TabsTrigger value="traceroute" className="rounded-lg text-xs font-bold px-4 py-1.5 data-[state=active]:bg-indigo-600 data-[state=active]:text-white">Traceroute</TabsTrigger>
          <TabsTrigger value="dns" className="rounded-lg text-xs font-bold px-4 py-1.5 data-[state=active]:bg-indigo-600 data-[state=active]:text-white">DNS Lookup</TabsTrigger>
          <TabsTrigger value="logs" className="rounded-lg text-xs font-bold px-4 py-1.5 data-[state=active]:bg-indigo-600 data-[state=active]:text-white">System Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="ping" className="space-y-4 pt-4">
          <CardContainer title="Ping Diagnostic" description="Measure reachability, packet loss, and round-trip latency" gradientColor="#6366f1">
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
                <div className="space-y-2">
                  <Label htmlFor="pingTarget" className="text-[10px] text-muted-foreground uppercase">Target Host</Label>
                  <Input
                    id="pingTarget"
                    value={pingTarget}
                    onChange={(e) => setPingTarget(e.target.value)}
                    placeholder="IP address or hostname"
                    className="rounded-xl border-indigo-500/10 focus:border-indigo-500/40"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pingCount" className="text-[10px] text-muted-foreground uppercase">Ping Count</Label>
                  <Input
                    id="pingCount"
                    value={pingCount}
                    onChange={(e) => setPingCount(e.target.value)}
                    type="number"
                    min="1"
                    max="20"
                    className="rounded-xl border-indigo-500/10 focus:border-indigo-500/40"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button onClick={() => runDiagnostic("ping")} disabled={isRunning} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-9">
                  <Play className="h-4 w-4 mr-2" />
                  Run Ping
                </Button>
              </div>
            </div>
          </CardContainer>
        </TabsContent>

        <TabsContent value="traceroute" className="space-y-4 pt-4">
          <CardContainer title="Traceroute Diagnostic" description="Map nodes along routing hop path" gradientColor="#22c55e">
            <div className="space-y-4 mt-2">
              <div className="space-y-2 text-xs font-semibold">
                <Label htmlFor="tracerouteTarget" className="text-[10px] text-muted-foreground uppercase">Target Host</Label>
                <Input
                  id="tracerouteTarget"
                  value={tracerouteTarget}
                  onChange={(e) => setTracerouteTarget(e.target.value)}
                  placeholder="IP address or hostname"
                  className="rounded-xl border-indigo-500/10 focus:border-indigo-500/40"
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button onClick={() => runDiagnostic("traceroute")} disabled={isRunning} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-9">
                  <Play className="h-4 w-4 mr-2" />
                  Run Traceroute
                </Button>
              </div>
            </div>
          </CardContainer>
        </TabsContent>

        <TabsContent value="dns" className="space-y-4 pt-4">
          <CardContainer title="DNS Lookup" description="Verify nameserver resolutions" gradientColor="#3b82f6">
            <div className="space-y-4 mt-2">
              <div className="space-y-2 text-xs font-semibold">
                <Label htmlFor="dnsTarget" className="text-[10px] text-muted-foreground uppercase">Domain Name</Label>
                <Input
                  id="dnsTarget"
                  value={tracerouteTarget}
                  onChange={(e) => setTracerouteTarget(e.target.value)}
                  placeholder="Domain name to lookup"
                  className="rounded-xl border-indigo-500/10 focus:border-indigo-500/40"
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button onClick={() => runDiagnostic("dns")} disabled={isRunning} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-9">
                  <Play className="h-4 w-4 mr-2" />
                  Run DNS Lookup
                </Button>
              </div>
            </div>
          </CardContainer>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4 pt-4">
          <CardContainer title="System Logs" description="CWMP Inform Logs" gradientColor="#f43f5e">
            <div className="space-y-4 mt-2">
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={downloadLogs} className="rounded-xl border-indigo-500/10 hover:bg-indigo-500/10">
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  Download Logs
                </Button>
              </div>

              <div className="bg-slate-950 text-emerald-400 p-4 rounded-2xl max-h-60 overflow-y-auto font-mono text-[10px] leading-relaxed shadow-inner border border-slate-800">
                {logs ? (
                  <pre className="whitespace-pre-wrap">{logs}</pre>
                ) : (
                  <div className="text-center text-muted-foreground py-8">No logs stored on client cache</div>
                )}
              </div>
            </div>
          </CardContainer>
        </TabsContent>
      </Tabs>

      {diagResults && (
        <CardContainer title={`Diagnostic Results · ${resultStatus}`} gradientColor={resultStatus === "failed" ? "#ef4444" : resultStatus === "completed" ? "#22c55e" : "#6366f1"}>
          <div className="mt-2">{latestResult ? <HumanDiagnosticResult result={latestResult} /> : <p className="text-xs text-muted-foreground">Waiting for the first CPE response…</p>}</div>
          <details className="mt-3">
            <summary className="cursor-pointer text-[10px] font-bold uppercase text-muted-foreground">Technical details</summary>
            <div className="mt-2 max-h-80 overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950 p-4 font-mono text-[10px] leading-relaxed text-emerald-400 shadow-inner">
              <pre className="whitespace-pre-wrap">{diagResults}</pre>
            </div>
          </details>
        </CardContainer>
      )}
    </div>
  );
}
