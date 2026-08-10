"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { CardContainer } from "@/components/ui/card-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/api";
import { toast } from "react-hot-toast";
import { File, Trash, Plus, RefreshCw, Upload, CheckCircle } from "lucide-react";

interface GenieFile {
  _id: string;
  filename: string;
  metadata: {
    fileType: string;
  };
  length: number;
  uploadDate: string;
}

export default function FilesPage() {
  const [files, setFiles] = useState<GenieFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [filename, setFilename] = useState("");
  const [fileContent, setFileContent] = useState(""); // base64 encoded
  const [contentType, setContentType] = useState("application/octet-stream");
  const [fileType, setFileType] = useState("1 Firmware Upgrade Image");
  const [isUploading, setIsUploading] = useState(false);

  const fetchFiles = async () => {
    try {
      setIsLoading(true);
      const res = await apiRequest<{ success: boolean; data: any[] }>("/services/genieacs/files");
      if (res.success && res.data) {
        setFiles(res.data);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load files list");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFilename(file.name);
    setContentType(file.type || "application/octet-stream");
    
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      setFileContent(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!filename || !fileContent) {
      toast.error("Please select a file to upload");
      return;
    }
    try {
      setIsUploading(true);
      toast.loading("Uploading file to GenieACS storage...", { id: "file-up" });
      const res = await apiRequest<{ success: boolean; message: string }>("/services/genieacs/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: filename, fileContent, contentType, fileType })
      });
      if (res.success) {
        toast.success(res.message || "File uploaded successfully", { id: "file-up" });
        fetchFiles();
        setFilename("");
        setFileContent("");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload file", { id: "file-up" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (name: string) => {
    if (!confirm(`Are you sure you want to delete file "${name}"?`)) return;
    try {
      toast.loading("Deleting file...", { id: "file-del" });
      const res = await apiRequest<{ success: boolean }>("/services/genieacs/files/" + encodeURIComponent(name), {
        method: "DELETE"
      });
      if (res.success) {
        toast.success("File deleted successfully", { id: "file-del" });
        fetchFiles();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete file", { id: "file-del" });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-1">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">Files Management</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Upload firmware images, configuration files, and vendor files to ACS</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-4">
            <CardContainer title="ACS Storage" description="Files on the server" gradientColor="#3b82f6">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
                </div>
              ) : (
                <div className="overflow-x-auto mt-2">
                  <table className="w-full text-left text-xs font-semibold">
                    <thead>
                      <tr className="border-b border-border/60 text-muted-foreground text-[10px] uppercase font-bold">
                        <th className="py-2.5">Filename</th>
                        <th className="py-2.5">File Type</th>
                        <th className="py-2.5">Size</th>
                        <th className="py-2.5">Upload Date</th>
                        <th className="py-2.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {files.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center py-8 text-muted-foreground text-xs">No files found on storage.</td>
                        </tr>
                      ) : (
                        files.map((file) => (
                          <tr key={file._id} className="border-b border-border/30 hover:bg-secondary/15 transition-colors">
                            <td className="py-3 font-mono text-slate-850 dark:text-slate-150 flex items-center gap-2">
                              <File className="h-3.5 w-3.5 text-blue-500" />
                              {file.filename}
                            </td>
                            <td className="py-3 text-[10px] text-muted-foreground">{file.metadata?.fileType || "N/A"}</td>
                            <td className="py-3 font-mono text-[10px]">{(file.length / 1024 / 1024).toFixed(2)} MB</td>
                            <td className="py-3 text-[10px] text-muted-foreground">{new Date(file.uploadDate).toLocaleDateString()}</td>
                            <td className="py-3 text-right">
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-rose-500 hover:bg-rose-500/10 rounded-xl" onClick={() => handleDelete(file.filename)}>
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

          <div className="lg:col-span-4 space-y-4">
            <CardContainer title="Upload File" description="Add new firmware or configuration" gradientColor="#22c55e">
              <div className="space-y-4 mt-2 text-xs font-semibold">
                <div className="space-y-1.5">
                  <Label className="text-[10px] text-muted-foreground uppercase">File Type (Usage)</Label>
                  <select
                    value={fileType}
                    onChange={(e) => setFileType(e.target.value)}
                    className="w-full h-9 px-3 border rounded-xl bg-background text-xs focus:outline-none"
                  >
                    <option value="1 Firmware Upgrade Image">1 Firmware Upgrade Image</option>
                    <option value="2 Web Content">2 Web Content</option>
                    <option value="3 Vendor Configuration File">3 Vendor Configuration File</option>
                    <option value="4 Tone File">4 Tone File</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] text-muted-foreground uppercase">Select File</Label>
                  <div className="flex items-center justify-center w-full border border-dashed rounded-xl p-6 hover:bg-secondary/15 transition-colors cursor-pointer relative">
                    <input
                      type="file"
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <div className="text-center space-y-2">
                      <Upload className="h-6 w-6 text-muted-foreground mx-auto" />
                      <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 block">
                        {filename || "Choose a local file..."}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <Button onClick={handleUpload} disabled={isUploading || !filename} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-9 font-bold">
                    <CheckCircle className="h-3.5 w-3.5 mr-1.5" /> Upload File
                  </Button>
                </div>
              </div>
            </CardContainer>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
