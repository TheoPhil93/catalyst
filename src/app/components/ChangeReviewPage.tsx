// src/app/pages/ChangeReviewPage.tsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Check,
  X,
  Search,
  Loader2,
  RefreshCcw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Undo2,
  Filter,
  SlidersHorizontal,
  CornerDownRight,
  ArrowRight,
} from "lucide-react";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";

type ChangeType = "added" | "deleted" | "modified";
type Classification = "major" | "minor" | "patch";
type Category =
  | "Fahrbahn"
  | "Fahrstrom"
  | "Sicherungsanlagen"
  | "Kunstbauten"
  | "Hochbau"
  | "Publikumsanlagen";

type Decision = "pending" | "approved" | "rejected";

type ChangeItem = {
  id: string; // e.g. "SheetName:rowKey"
  object: string;
  type: ChangeType;
  classification: Classification;
  category: Category;
  changes: string;
  status: Decision;
};

type ChangesDoc = {
  uploadId: string;
  baselineUploadId: string | null;
  counts?: { total: number; added: number; deleted: number; modified: number };
  items: ChangeItem[];
};

const shortId = (id: string | null | undefined) => (id ? id.slice(0, 8) : "n a");

export function ChangeReviewPage() {
  const [params] = useSearchParams();
  const uploadId = params.get("uploadId");

  const [doc, setDoc] = useState<ChangesDoc | null>(null);
  const [items, setItems] = useState<ChangeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<ChangeType | "all">("all");
  const [filterCategory, setFilterCategory] = useState<Category | "all">("all");

  const fetchChanges = useCallback(async () => {
    if (!uploadId) {
      setLoading(false);
      setError("No uploadId provided. Open via /change-review?uploadId=...");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/uploads/${encodeURIComponent(uploadId)}/changes`, { cache: "no-store" });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || `Failed to load changes (HTTP ${res.status})`);
      }
      const data = (await res.json()) as ChangesDoc;
      setDoc(data);
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (e: any) {
      setDoc(null);
      setItems([]);
      setError(e?.message || "Failed to load changes");
    } finally {
      setLoading(false);
    }
  }, [uploadId]);

  useEffect(() => {
    void fetchChanges();
  }, [fetchChanges]);

  const handleDecision = useCallback(
    async (id: string, decision: Decision) => {
      if (!uploadId) return;

      const prev = items;
      setItems((cur) => cur.map((it) => (it.id === id ? { ...it, status: decision } : it)));

      setSavingIds((s) => new Set([...Array.from(s), id]));
      setError(null);

      try {
        const res = await fetch(
          `/api/uploads/${encodeURIComponent(uploadId)}/changes/${encodeURIComponent(id)}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: decision }),
          }
        );

        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(txt || `Failed to save decision (HTTP ${res.status})`);
        }
      } catch (e: any) {
        setItems(prev);
        setError(e?.message || "Failed to save decision");
      } finally {
        setSavingIds((s) => {
          const next = new Set(s);
          next.delete(id);
          return next;
        });
      }
    },
    [uploadId, items]
  );

  const filteredItems = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    return items.filter((item) => {
      const matchesSearch =
        q.length === 0 ||
        item.object.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        item.changes.toLowerCase().includes(q);

      const matchesType = filterType === "all" || item.type === filterType;
      const matchesCategory = filterCategory === "all" || item.category === filterCategory;

      return matchesSearch && matchesType && matchesCategory;
    });
  }, [items, searchTerm, filterType, filterCategory]);

  const stats = useMemo(() => {
    return {
      total: items.length,
      pending: items.filter((i) => i.status === "pending").length,
      approved: items.filter((i) => i.status === "approved").length,
      rejected: items.filter((i) => i.status === "rejected").length,
    };
  }, [items]);

  const getTypeStyles = (type: ChangeType) => {
    switch (type) {
      case "added":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "deleted":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "modified":
        return "bg-amber-50 text-amber-700 border-amber-200";
    }
  };

  const getClassificationColor = (cls: Classification) => {
    switch (cls) {
      case "major":
        return "text-rose-600 font-semibold";
      case "minor":
        return "text-indigo-600 font-medium";
      case "patch":
        return "text-zinc-500";
    }
  };

  const isSavingAny = savingIds.size > 0;

  return (
    <div className="flex flex-col h-full bg-zinc-50">
      {/* Header */}
      <div className="bg-white border-b border-zinc-200 px-8 py-5 shrink-0">
        <div className="flex items-start justify-between gap-6 mb-5">
          <div>
            <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">Change Review</h1>

            <div className="flex items-center gap-2 mt-2 text-sm text-zinc-500">
              <span className="text-xs text-zinc-500">Baseline</span>
              <span className="font-mono text-xs bg-zinc-100 px-1.5 py-0.5 rounded">
                {shortId(doc?.baselineUploadId)}
              </span>

              <ArrowRight className="w-3 h-3" />

              <span className="text-xs text-zinc-500">Upload</span>
              <span className="font-mono text-xs bg-zinc-100 px-1.5 py-0.5 rounded">
                {shortId(doc?.uploadId ?? uploadId)}
              </span>
            </div>

            {doc?.counts && (
              <div className="flex items-center gap-2 mt-3 text-xs text-zinc-500">
                <span className="font-mono bg-zinc-100 px-2 py-0.5 rounded">total {doc.counts.total}</span>
                <span className="font-mono bg-zinc-100 px-2 py-0.5 rounded">added {doc.counts.added}</span>
                <span className="font-mono bg-zinc-100 px-2 py-0.5 rounded">modified {doc.counts.modified}</span>
                <span className="font-mono bg-zinc-100 px-2 py-0.5 rounded">deleted {doc.counts.deleted}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              className="h-9 text-zinc-600"
              onClick={() => void fetchChanges()}
              disabled={loading || isSavingAny}
              title="Reload from backend"
            >
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCcw className="w-4 h-4 mr-2" />}
              Refresh
            </Button>

            <div className="flex gap-4 text-sm">
              <div className="flex flex-col items-end">
                <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-medium">Reviewed</span>
                <span className="font-mono font-medium text-zinc-900">
                  {stats.approved + stats.rejected} <span className="text-zinc-400">/ {stats.total}</span>
                </span>
              </div>

              <div className="h-8 w-px bg-zinc-200" />

              <div className="flex flex-col items-end">
                <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-medium">Pending</span>
                <span className="font-mono font-medium text-amber-600">{stats.pending}</span>
              </div>
            </div>

            <Button
              className="bg-zinc-900 hover:bg-zinc-800 text-white shadow-sm"
              disabled={stats.pending > 0 || loading || isSavingAny}
              title={stats.pending > 0 ? "Approve or reject all items before commit" : "Commit endpoint not implemented yet"}
              onClick={() => setError("Commit is not implemented yet. Next step: add POST /api/uploads/:id/commit in the backend.")}
            >
              {stats.pending === 0 ? "Commit & Merge" : "Complete Review First"}
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-md px-3 py-2">
            <AlertTriangle className="w-4 h-4" />
            <span className="truncate">{error}</span>
          </div>
        )}

        {/* Toolbar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Filter by object id, sheet key, or change text..."
              className="w-full pl-9 pr-4 py-2 h-9 bg-zinc-50 border border-zinc-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-300 transition-all placeholder:text-zinc-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="h-6 w-px bg-zinc-200 mx-1" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 border-dashed text-zinc-600" disabled={loading}>
                <Filter className="w-3.5 h-3.5 mr-2" />
                Type: {filterType === "all" ? "All" : filterType}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuCheckboxItem checked={filterType === "all"} onCheckedChange={() => setFilterType("all")}>
                All Types
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem checked={filterType === "added"} onCheckedChange={() => setFilterType("added")}>
                Added
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={filterType === "modified"} onCheckedChange={() => setFilterType("modified")}>
                Modified
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={filterType === "deleted"} onCheckedChange={() => setFilterType("deleted")}>
                Deleted
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 border-dashed text-zinc-600" disabled={loading}>
                <SlidersHorizontal className="w-3.5 h-3.5 mr-2" />
                Gattung: {filterCategory === "all" ? "All" : filterCategory}
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>Fachbereiche</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem checked={filterCategory === "all"} onCheckedChange={() => setFilterCategory("all")}>
                Alle
              </DropdownMenuCheckboxItem>

              {(
                [
                  "Fahrbahn",
                  "Fahrstrom",
                  "Sicherungsanlagen",
                  "Kunstbauten",
                  "Hochbau",
                  "Publikumsanlagen",
                ] as Category[]
              ).map((cat) => (
                <DropdownMenuCheckboxItem
                  key={cat}
                  checked={filterCategory === cat}
                  onCheckedChange={() => setFilterCategory(cat)}
                >
                  {cat}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-5xl mx-auto space-y-3">
          {loading && (
            <div className="flex items-center justify-center py-20 text-zinc-500">
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Loading changes...
            </div>
          )}

          {!loading && filteredItems.length === 0 && (
            <div className="text-center py-20 text-zinc-400 border-2 border-dashed border-zinc-200 rounded-lg">
              <p>No changes found matching your filters.</p>
            </div>
          )}

          {!loading &&
            filteredItems.map((item) => {
              const saving = savingIds.has(item.id);

              return (
                <Card
                  key={item.id}
                  className={`
                    group relative overflow-hidden transition-all duration-200 border
                    ${item.status === "pending" ? "border-zinc-200 shadow-sm hover:border-zinc-300" : "opacity-90 bg-zinc-50/50"}
                  `}
                >
                  <div
                    className={`absolute top-0 bottom-0 left-0 w-1 ${
                      item.type === "added"
                        ? "bg-emerald-500"
                        : item.type === "deleted"
                        ? "bg-rose-500"
                        : "bg-amber-500"
                    }`}
                  />

                  <div className="p-4 pl-6 flex items-start gap-5">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <h3 className={`text-sm font-semibold truncate ${item.status !== "pending" ? "text-zinc-500 line-through" : "text-zinc-900"}`}>
                            {item.object}
                          </h3>
                          <Badge variant="outline" className="font-mono text-[10px] text-zinc-400 border-zinc-200 h-5 px-1.5 shrink-0">
                            {item.id}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 mb-3">
                        <Badge
                          variant="outline"
                          className={`h-5 px-2 text-[10px] uppercase tracking-wide border-0 font-medium ${getTypeStyles(item.type)}`}
                        >
                          {item.type}
                        </Badge>

                        <span className="text-xs text-zinc-600 font-medium px-2 py-0.5 bg-zinc-100 rounded">
                          {item.category}
                        </span>

                        <span className={`text-xs capitalize ${getClassificationColor(item.classification)}`}>
                          {item.classification} impact
                        </span>
                      </div>

                      <div className="bg-zinc-50/80 rounded border border-zinc-200/60 p-2.5 font-mono text-xs text-zinc-700 flex gap-3 items-start">
                        <CornerDownRight className="w-3.5 h-3.5 mt-0.5 text-zinc-400 shrink-0" />
                        <span className="break-words">{item.changes}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0 pt-1">
                      {item.status === "pending" ? (
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => void handleDecision(item.id, "rejected")}
                            variant="ghost"
                            className="h-9 w-9 p-0 rounded-full text-zinc-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100"
                            title="Reject / Ignore"
                            disabled={saving}
                          >
                            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <X className="w-5 h-5" />}
                          </Button>

                          <Button
                            onClick={() => void handleDecision(item.id, "approved")}
                            className="h-9 px-4 bg-zinc-900 hover:bg-zinc-800 text-white rounded-full shadow-sm"
                            title="Approve / Merge"
                            disabled={saving}
                          >
                            {saving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Check className="w-4 h-4 mr-1.5" />}
                            <span className="text-xs font-medium">Approve</span>
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 animate-in fade-in duration-200">
                          {item.status === "approved" ? (
                            <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full text-xs font-medium border border-emerald-100">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Approved
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 text-rose-700 bg-rose-50 px-3 py-1 rounded-full text-xs font-medium border border-rose-100">
                              <XCircle className="w-3.5 h-3.5" />
                              Rejected
                            </span>
                          )}

                          <Button
                            onClick={() => void handleDecision(item.id, "pending")}
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-zinc-400 hover:text-zinc-700"
                            title="Undo"
                            disabled={saving}
                          >
                            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Undo2 className="w-3.5 h-3.5" />}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
        </div>
      </div>
    </div>
  );
}
