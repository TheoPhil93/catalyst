import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";

type UploadStatus = "processing" | "validated" | "failed";

type ServerUpload = {
  uploadId: string;
  status: UploadStatus;
  originalName: string;
  storedAs: string;
  sizeBytes: number;
  createdAt: string;
  updatedAt: string;
  error: string | null;
  validation?: { sheetCount?: number; parsed?: boolean };
  changesReady?: boolean;
};

type RecentUpload = {
  id: string; // stable row id (tempId or uploadId)
  serverUploadId?: string;
  filename: string;
  size: string;
  status: UploadStatus;
  timestamp: string;
  uploader: string;
  changesReady?: boolean;
};

type UiState = "idle" | "uploading" | "success" | "error";

const formatBytes = (bytes: number) => {
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  const kb = bytes / 1024;
  return `${kb.toFixed(0)} KB`;
};

const formatTimestamp = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString();
};

export function UploadPage() {
  const navigate = useNavigate();

  const [isDragging, setIsDragging] = useState(false);
  const [uiState, setUiState] = useState<UiState>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [recentUploads, setRecentUploads] = useState<RecentUpload[]>([]);

  const refreshUploads = useCallback(async () => {
    const res = await fetch("/api/uploads", { cache: "no-store" });
    if (!res.ok) return;

    const list = (await res.json()) as ServerUpload[];

    setRecentUploads(
      list.map((x) => ({
        id: x.uploadId,
        serverUploadId: x.uploadId,
        filename: x.originalName,
        size: formatBytes(x.sizeBytes),
        status: x.status,
        timestamp: formatTimestamp(x.createdAt),
        uploader: "You",
        changesReady: Boolean(x.changesReady),
      }))
    );
  }, []);

  useEffect(() => {
    void refreshUploads();
  }, [refreshUploads]);

  const validateFileClient = (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || (ext !== "xlsx" && ext !== "xml")) {
      return `Unsupported file type ".${ext ?? ""}". Allowed: .xlsx, .xml`;
    }
    const maxBytes = 25 * 1024 * 1024;
    if (file.size > maxBytes) return `File too large. Max allowed: ${formatBytes(maxBytes)}`;
    return null;
  };

  const pollStatus = (uploadId: string, rowId: string) => {
    let tries = 0;

    const t = window.setInterval(async () => {
      tries++;

      const res = await fetch(`/api/uploads/${encodeURIComponent(uploadId)}`, { cache: "no-store" });
      if (!res.ok) return;

      const data = (await res.json()) as ServerUpload;

      setRecentUploads((prev) =>
        prev.map((u) =>
          u.id === rowId
            ? { ...u, status: data.status, changesReady: Boolean(data.changesReady) }
            : u
        )
      );

      if (data.status !== "processing" || tries > 80) {
        window.clearInterval(t);
        void refreshUploads();
      }
    }, 1500);
  };

  const uploadFile = async (file: File) => {
    setUiState("uploading");
    setErrorMsg(null);
    setSelectedFileName(file.name);

    const validationError = validateFileClient(file);
    if (validationError) {
      setUiState("error");
      setErrorMsg(validationError);
      return;
    }

    const tempId = globalThis.crypto?.randomUUID?.() ?? String(Date.now());

    setRecentUploads((prev) => [
      {
        id: tempId,
        filename: file.name,
        size: formatBytes(file.size),
        status: "processing",
        timestamp: new Date().toLocaleString(),
        uploader: "You",
        changesReady: false,
      },
      ...prev,
    ]);

    try {
      const form = new FormData();
      form.append("file", file);

      const res = await fetch("/api/uploads", { method: "POST", body: form });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Upload failed with status ${res.status}`);
      }

      const data = (await res.json()) as ServerUpload;

      setRecentUploads((prev) =>
        prev.map((u) =>
          u.id === tempId
            ? {
                ...u,
                serverUploadId: data.uploadId,
                filename: data.originalName,
                size: formatBytes(data.sizeBytes),
                status: data.status ?? "processing",
                changesReady: Boolean(data.changesReady),
              }
            : u
        )
      );

      pollStatus(data.uploadId, tempId);
      setUiState("success");
    } catch (e: any) {
      setUiState("error");
      setErrorMsg(e?.message || "Upload failed");
      setRecentUploads((prev) => prev.map((u) => (u.id === tempId ? { ...u, status: "failed" } : u)));
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) void uploadFile(file);
    },
    []
  );

  const onSelectClick = () => fileInputRef.current?.click();

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void uploadFile(file);
    e.target.value = "";
  };

  const openReview = (uploadId: string) => {
    navigate(`/change-review?uploadId=${encodeURIComponent(uploadId)}`);
  };

  return (
    <div className="p-8 max-w-[1200px] mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-zinc-900 tracking-tight">Upload Catalog</h2>
        <p className="text-sm text-zinc-500 mt-1">Import new FDK versions for validation and processing.</p>
      </div>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-8">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              relative h-[320px] rounded-xl border-2 border-dashed transition-all duration-200 flex flex-col items-center justify-center text-center p-12
              ${isDragging ? "border-blue-500 bg-blue-50/50" : "border-zinc-200 bg-zinc-50/30 hover:border-zinc-300 hover:bg-zinc-50"}
            `}
          >
            <input ref={fileInputRef} type="file" accept=".xlsx,.xml" className="hidden" onChange={onFileInputChange} />

            <div className="h-16 w-16 bg-white rounded-full border border-zinc-100 shadow-sm flex items-center justify-center mb-6">
              {uiState === "uploading" ? (
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              ) : (
                <UploadCloud className={`h-8 w-8 ${isDragging ? "text-blue-500" : "text-zinc-400"}`} />
              )}
            </div>

            <h3 className="text-lg font-medium text-zinc-900 mb-2">
              {uiState === "uploading" ? "Uploading..." : "Drop FDK file here"}
            </h3>

            <p className="text-sm text-zinc-500 max-w-sm mb-6">
              Support for .xlsx and .xml formats. Files will be automatically validated.
            </p>

            {selectedFileName && (
              <div className="text-xs text-zinc-600 mb-4">
                Selected: <span className="font-mono">{selectedFileName}</span>
              </div>
            )}

            {uiState === "error" && errorMsg && (
              <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                {errorMsg}
              </div>
            )}

            {uiState === "success" && (
              <div className="mb-4 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2">
                Upload completed. Validation and change generation are running.
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" className="bg-white" onClick={onSelectClick} disabled={uiState === "uploading"}>
                Select File
              </Button>
              <Button className="bg-zinc-900" disabled>
                Import from URL
              </Button>
            </div>
          </div>
        </div>

        <div className="col-span-4 space-y-4">
          <Card className="bg-blue-50/50 border-blue-100 shadow-none">
            <CardContent className="p-4 flex gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 shrink-0" />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-1">Validation Active</p>
                <p className="text-blue-700/80 leading-relaxed">
                  Uploads are validated and converted into a snapshot. Then we compute a change list vs the last validated upload.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-zinc-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Validation Rules</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {["File readable", "Minimum structure present", "Changes computed against baseline"].map((rule, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-zinc-600">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  {rule}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="shadow-sm border-zinc-200 overflow-hidden">
        <CardHeader className="bg-white border-b border-zinc-100">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium">Recent Imports</CardTitle>
            <Button variant="ghost" size="sm" className="text-zinc-500" onClick={() => void refreshUploads()}>
              Refresh
            </Button>
          </div>
        </CardHeader>

        <div className="divide-y divide-zinc-100">
          {recentUploads.map((file) => {
            const serverId = file.serverUploadId || file.id;
            const canReview = file.status === "validated";

            return (
              <div key={file.id} className="p-4 flex items-center hover:bg-zinc-50/50 transition-colors group">
                <div className="h-10 w-10 rounded bg-zinc-100 flex items-center justify-center mr-4 text-zinc-500">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-zinc-900 truncate">{file.filename}</span>
                    <span className="text-xs text-zinc-400 font-mono">{file.size}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <span>{file.uploader}</span>
                    <span>•</span>
                    <span>{file.timestamp}</span>
                  </div>
                </div>

                <div className="mr-6">
                  {file.status === "validated" && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1.5 font-medium">
                      <CheckCircle2 className="h-3 w-3" /> Validated
                    </Badge>
                  )}
                  {file.status === "processing" && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 gap-1.5 font-medium">
                      <Loader2 className="h-3 w-3 animate-spin" /> Processing
                    </Badge>
                  )}
                  {file.status === "failed" && (
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 gap-1.5 font-medium">
                      <X className="h-3 w-3" /> Failed
                    </Badge>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  disabled={!canReview}
                  onClick={() => openReview(serverId)}
                  title={canReview ? "Open Change Review" : "Wait until validated"}
                >
                  Review <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
