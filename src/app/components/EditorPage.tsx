import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Save,
  Filter,
  Undo2,
  Table as TableIcon,
  Columns,
  AlertCircle,
  ChevronDown,
  Loader2,
  RefreshCcw,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";

// --- Types ---
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
};

type SheetInfo = { name: string; rowCount: number };

type SheetsResponse = {
  uploadId: string;
  sheets: SheetInfo[];
};

type SheetRowsResponse = {
  uploadId: string;
  sheetName: string;
  totalRows: number;
  offset: number;
  limit: number;
  rows: Array<Record<string, any>>;
};

type ColumnType = "text" | "number" | "date" | "enum";

interface ColumnDef {
  id: string;
  label: string;
  type: ColumnType;
  width: number;
}

const formatBytes = (bytes: number) => {
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  const kb = bytes / 1024;
  return `${kb.toFixed(0)} KB`;
};

const safeString = (v: any) => {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
};

function guessType(values: any[]): ColumnType {
  const cleaned = values.filter((v) => v !== null && v !== undefined && v !== "");
  if (cleaned.length === 0) return "text";

  const isNumber = cleaned.every((v) => typeof v === "number" || (typeof v === "string" && v.trim() !== "" && !isNaN(Number(v))));
  if (isNumber) return "number";

  const isIsoDate = cleaned.every((v) => {
    if (typeof v !== "string") return false;
    // sehr einfache ISO-Check
    return /^\d{4}-\d{2}-\d{2}/.test(v) || /^\d{4}-\d{2}-\d{2}T/.test(v);
  });
  if (isIsoDate) return "date";

  const distinct = new Set(cleaned.map((v) => safeString(v)));
  if (distinct.size <= 20) return "enum";

  return "text";
}

function computeWidth(label: string, sampleValues: string[]) {
  const base = Math.max(120, Math.min(320, label.length * 10 + 60));
  const longest = sampleValues.reduce((m, s) => Math.max(m, s.length), 0);
  const byValue = Math.max(120, Math.min(420, longest * 8 + 40));
  return Math.max(base, Math.min(byValue, 420));
}

export function EditorPage() {
  const [params] = useSearchParams();

  // optional: /editor?uploadId=...&sheet=...
  const uploadIdFromUrl = params.get("uploadId");
  const sheetFromUrl = params.get("sheet");

  const [uploads, setUploads] = useState<ServerUpload[]>([]);
  const [selectedUploadId, setSelectedUploadId] = useState<string | null>(uploadIdFromUrl);
  const [sheets, setSheets] = useState<SheetInfo[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string | null>(sheetFromUrl);

  const [rows, setRows] = useState<Array<Record<string, any>>>([]);
  const [totalRows, setTotalRows] = useState<number>(0);
  const [offset, setOffset] = useState<number>(0);
  const [limit, setLimit] = useState<number>(500);

  const [loadingUploads, setLoadingUploads] = useState(false);
  const [loadingSheets, setLoadingSheets] = useState(false);
  const [loadingRows, setLoadingRows] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedCell, setSelectedCell] = useState<{ rowIndex: number; colId: string } | null>(null);

  const loadUploads = async () => {
    setLoadingUploads(true);
    setError(null);
    try {
      const res = await fetch("/api/uploads", { cache: "no-store" });
      if (!res.ok) throw new Error(await res.text().catch(() => `HTTP ${res.status}`));
      const list = (await res.json()) as ServerUpload[];
      setUploads(list);

      // auto select latest validated if none selected
      if (!selectedUploadId) {
        const latestValidated = list.find((u) => u.status === "validated");
        if (latestValidated) setSelectedUploadId(latestValidated.uploadId);
      }
    } catch (e: any) {
      setError(e?.message || "Failed to load uploads");
    } finally {
      setLoadingUploads(false);
    }
  };

  const loadSheets = async (uploadId: string) => {
    setLoadingSheets(true);
    setError(null);
    try {
      const res = await fetch(`/api/uploads/${encodeURIComponent(uploadId)}/sheets`, { cache: "no-store" });
      if (!res.ok) throw new Error(await res.text().catch(() => `HTTP ${res.status}`));
      const data = (await res.json()) as SheetsResponse;
      setSheets(data.sheets || []);

      // default sheet selection
      if (!selectedSheet) {
        const first = data.sheets?.[0]?.name ?? null;
        setSelectedSheet(first);
      } else {
        // ensure it exists
        const exists = data.sheets?.some((s) => s.name === selectedSheet);
        if (!exists) setSelectedSheet(data.sheets?.[0]?.name ?? null);
      }
    } catch (e: any) {
      setSheets([]);
      setSelectedSheet(null);
      setError(e?.message || "Failed to load sheets");
    } finally {
      setLoadingSheets(false);
    }
  };

  const loadRows = async (uploadId: string, sheetName: string, nextOffset = 0, nextLimit = limit) => {
    setLoadingRows(true);
    setError(null);
    try {
      const url = `/api/uploads/${encodeURIComponent(uploadId)}/sheets/${encodeURIComponent(sheetName)}?offset=${nextOffset}&limit=${nextLimit}`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(await res.text().catch(() => `HTTP ${res.status}`));
      const data = (await res.json()) as SheetRowsResponse;

      setRows(data.rows || []);
      setTotalRows(data.totalRows || 0);
      setOffset(data.offset || 0);
      setLimit(data.limit || nextLimit);
      setSelectedCell(null);
    } catch (e: any) {
      setRows([]);
      setTotalRows(0);
      setError(e?.message || "Failed to load sheet rows");
    } finally {
      setLoadingRows(false);
    }
  };

  useEffect(() => {
    void loadUploads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
  if (uploads.length === 0) return;

  const hasValidated = uploads.some((u) => u.status === "validated");
  const hasProcessing = uploads.some((u) => u.status === "processing");

  if (hasValidated || !hasProcessing) return;

  const t = window.setInterval(() => {
    void loadUploads();
  }, 2000);

  return () => window.clearInterval(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [uploads]);


  useEffect(() => {
    if (!selectedUploadId) return;
    void loadSheets(selectedUploadId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUploadId]);

  useEffect(() => {
    if (!selectedUploadId || !selectedSheet) return;
    void loadRows(selectedUploadId, selectedSheet, 0, limit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSheet]);

  const columns: ColumnDef[] = useMemo(() => {
    // dynamische Spalten aus den Keys der ersten Rows
    const sample = rows.slice(0, 200);
    const keySet = new Set<string>();
    for (const r of sample) Object.keys(r || {}).forEach((k) => keySet.add(k));

    const keys = Array.from(keySet);

    return keys.map((k) => {
      const values = sample.map((r) => r?.[k]);
      const type = guessType(values);
      const sampleStrings = values.slice(0, 30).map((v) => safeString(v));
      return {
        id: k,
        label: k,
        type,
        width: computeWidth(k, sampleStrings),
      };
    });
  }, [rows]);

  const selectedValue = useMemo(() => {
    if (!selectedCell) return "";
    const r = rows[selectedCell.rowIndex];
    return r ? safeString(r[selectedCell.colId]) : "";
  }, [rows, selectedCell]);

  const validatedUploads = useMemo(() => uploads.filter((u) => u.status === "validated"), [uploads]);

  return (
    <div className="flex flex-col h-full bg-white text-zinc-900 font-sans">
      {/* Toolbar */}
      <div className="min-h-14 border-b border-zinc-200 px-4 py-2 bg-white shrink-0 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-4 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="bg-blue-600 p-1.5 rounded text-white">
              <TableIcon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-zinc-900 truncate">Data Editor</h1>
              <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                <span className="font-mono truncate">
                  {selectedUploadId ? `Upload ${selectedUploadId.slice(0, 8)}` : "No upload selected"}
                </span>
                <span className="w-1 h-1 rounded-full bg-zinc-300" />
                <span>{selectedSheet ?? "No sheet"}</span>
                <span className="w-1 h-1 rounded-full bg-zinc-300" />
                <span>{totalRows ? `${totalRows} rows` : "0 rows"}</span>
              </div>
            </div>
          </div>

          <div className="h-6 w-px bg-zinc-200 mx-2" />

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-8 text-zinc-500 hover:text-zinc-900" disabled>
              <Undo2 className="w-4 h-4 mr-2" /> Undo
            </Button>
            <Button variant="ghost" size="sm" className="h-8 text-zinc-500 hover:text-zinc-900" disabled>
              <Columns className="w-4 h-4 mr-2" /> Columns
            </Button>
            <Button variant="ghost" size="sm" className="h-8 text-zinc-500 hover:text-zinc-900" disabled>
              <Filter className="w-4 h-4 mr-2" /> Filter
            </Button>
          </div>

          <div className="h-6 w-px bg-zinc-200 mx-2" />

          {/* Upload selector */}
          <div className="flex items-center gap-2">
            <select
              className="h-9 border border-zinc-200 rounded-md px-2 text-sm bg-white"
              value={selectedUploadId ?? ""}
              onChange={(e) => setSelectedUploadId(e.target.value || null)}
              disabled={loadingUploads || validatedUploads.length === 0}
              title="Select a validated upload"
            >
              {validatedUploads.length === 0 && <option value="">No validated uploads</option>}
              {validatedUploads.map((u) => (
                <option key={u.uploadId} value={u.uploadId}>
                  {u.originalName} · {formatBytes(u.sizeBytes)} · {u.uploadId.slice(0, 8)}
                </option>
              ))}
            </select>

            <select
              className="h-9 border border-zinc-200 rounded-md px-2 text-sm bg-white"
              value={selectedSheet ?? ""}
              onChange={(e) => setSelectedSheet(e.target.value || null)}
              disabled={loadingSheets || !selectedUploadId || sheets.length === 0}
              title="Select a sheet"
            >
              {sheets.length === 0 && <option value="">No sheets</option>}
              {sheets.map((s) => (
                <option key={s.name} value={s.name}>
                  {s.name} ({s.rowCount})
                </option>
              ))}
            </select>

            <Button
              variant="outline"
              size="sm"
              className="h-9"
              onClick={() => {
                void loadUploads().then(() => {
                  if (selectedUploadId) void loadSheets(selectedUploadId);
                  if (selectedUploadId && selectedSheet) void loadRows(selectedUploadId, selectedSheet, 0, limit);
                });
              }}
            >
              <RefreshCcw className="w-4 h-4 mr-2" /> Refresh
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {error ? (
            <div className="bg-orange-50 text-orange-700 px-3 py-1.5 rounded text-xs font-medium border border-orange-100 flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5" />
              {error}
            </div>
          ) : (
            <div className="bg-zinc-50 text-zinc-600 px-3 py-1.5 rounded text-xs font-medium border border-zinc-200 flex items-center gap-2">
              {(loadingUploads || loadingSheets || loadingRows) && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {loadingUploads || loadingSheets || loadingRows ? "Loading..." : "Ready"}
            </div>
          )}

          <Button size="sm" className="bg-zinc-900 h-8 text-white" disabled>
            <Save className="w-4 h-4 mr-2" /> Save Changes
          </Button>
        </div>
      </div>

      {/* Formula Bar */}
      <div className="h-10 border-b border-zinc-200 bg-zinc-50 flex items-center px-4 gap-4 shrink-0">
        <div className="text-xs font-mono text-zinc-400 w-24 border-r border-zinc-200 pr-2">
          {selectedCell ? `${selectedCell.colId}` : ""}
        </div>
        <div className="flex-1 flex items-center gap-2">
          <span className="text-zinc-400 font-serif italic">fx</span>
          <input
            className="w-full bg-transparent border-none focus:outline-none text-sm text-zinc-700 font-mono"
            placeholder="Click a cell to inspect..."
            value={selectedValue}
            readOnly
          />
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto bg-zinc-50 relative">
        {!selectedUploadId ? (
          <div className="p-8 text-sm text-zinc-600">No validated upload selected. Upload a file first.</div>
        ) : !selectedSheet ? (
          <div className="p-8 text-sm text-zinc-600">No sheet selected.</div>
        ) : (
          <div className="inline-block min-w-full align-middle">
            {/* Header */}
            <div className="sticky top-0 z-20 shadow-sm bg-white border-b border-zinc-200">
              <div className="flex">
                <div className="w-10 shrink-0 border-r border-zinc-200 bg-zinc-100 border-b border-zinc-200" />
                {columns.map((col) => (
                  <div
                    key={col.id}
                    style={{ width: col.width }}
                    className="shrink-0 px-3 py-2 border-r border-zinc-200 text-xs font-bold text-zinc-700 flex items-center justify-between group bg-zinc-50 hover:bg-zinc-100 cursor-pointer"
                    title={col.type}
                  >
                    <span className="truncate">{col.label}</span>
                    <ChevronDown className="w-3 h-3 text-zinc-400" />
                  </div>
                ))}
                <div className="flex-1 border-b border-zinc-200 bg-zinc-50" />
              </div>
            </div>

            {/* Body */}
            <div className="bg-white">
              {rows.map((row, rowIndex) => (
                <div key={rowIndex} className="flex hover:bg-blue-50/50 group border-b border-zinc-100">
                  <div className="w-10 shrink-0 border-r border-zinc-200 bg-zinc-50 flex items-center justify-center text-[10px] text-zinc-400 select-none">
                    {offset + rowIndex + 1}
                  </div>

                  {columns.map((col) => (
                    <div
                      key={col.id}
                      style={{ width: col.width }}
                      onClick={() => setSelectedCell({ rowIndex, colId: col.id })}
                      className={`
                        shrink-0 px-3 py-1.5 border-r border-zinc-100 text-sm truncate cursor-cell
                        ${
                          selectedCell?.rowIndex === rowIndex && selectedCell?.colId === col.id
                            ? "ring-2 ring-inset ring-blue-600 z-10 bg-white"
                            : ""
                        }
                      `}
                      title={safeString(row?.[col.id])}
                    >
                      {safeString(row?.[col.id])}
                    </div>
                  ))}
                  <div className="flex-1 bg-white" />
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            <div className="p-4 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between">
              <div className="text-xs text-zinc-600">
                Showing {rows.length} rows (offset {offset}) of {totalRows}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={loadingRows || offset === 0}
                  onClick={() => selectedUploadId && selectedSheet && void loadRows(selectedUploadId, selectedSheet, Math.max(0, offset - limit), limit)}
                >
                  Prev
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={loadingRows || offset + limit >= totalRows}
                  onClick={() => selectedUploadId && selectedSheet && void loadRows(selectedUploadId, selectedSheet, offset + limit, limit)}
                >
                  Next
                </Button>

                <Button
                  size="sm"
                  className="bg-zinc-900 text-white"
                  disabled={loadingRows || rows.length >= totalRows || limit >= 5000}
                  onClick={() => {
                    const nextLimit = Math.min(5000, limit + 500);
                    setLimit(nextLimit);
                    if (selectedUploadId && selectedSheet) void loadRows(selectedUploadId, selectedSheet, 0, nextLimit);
                  }}
                  title="Increase row limit"
                >
                  Load more
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
