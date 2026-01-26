// server.js
const express = require("express");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const XLSX = require("xlsx");
const { XMLParser } = require("fast-xml-parser");

const app = express();
app.use(cors());

// WICHTIG: damit PATCH/POST JSON Bodies in req.body ankommen
app.use(express.json());

// ------------------------------------------------------------
// Verzeichnisse
// ------------------------------------------------------------
const uploadDir = path.join(__dirname, "uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const dataDir = path.join(__dirname, "data");
const snapshotsDir = path.join(dataDir, "snapshots");
const changesDir = path.join(dataDir, "changes");
fs.mkdirSync(snapshotsDir, { recursive: true });
fs.mkdirSync(changesDir, { recursive: true });

const snapshotPath = (id) => path.join(snapshotsDir, `${id}.json`);
const changesPath = (id) => path.join(changesDir, `${id}.json`);

// ------------------------------------------------------------
// Helper
// ------------------------------------------------------------
function nowIso() {
  return new Date().toISOString();
}

async function writeJson(p, obj) {
  await fs.promises.writeFile(p, JSON.stringify(obj, null, 2), "utf8");
}

async function readJson(p) {
  const raw = await fs.promises.readFile(p, "utf8");
  return JSON.parse(raw);
}

async function exists(p) {
  try {
    await fs.promises.access(p);
    return true;
  } catch {
    return false;
  }
}

// ------------------------------------------------------------
// Upload Registry (In-Memory + Persistenz)
// ------------------------------------------------------------
const uploads = new Map(); // key: uploadId, value: record

// Persistenz-Index
const uploadsIndexFile = path.join(dataDir, "uploads-index.json");

// Debounced Persist
let persistTimer = null;

async function persistUploadsNow() {
  const list = Array.from(uploads.values())
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, 500);

  await writeJson(uploadsIndexFile, list);
}

function schedulePersistUploads() {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    persistUploadsNow().catch((e) =>
      console.warn("persistUploadsNow failed:", e?.message || e)
    );
  }, 250);
}

async function hydrateUploadsFromIndex() {
  if (!(await exists(uploadsIndexFile))) return false;

  try {
    const list = await readJson(uploadsIndexFile);
    if (!Array.isArray(list)) return false;

    for (const rec of list) {
      if (rec?.uploadId) uploads.set(rec.uploadId, rec);
    }

    console.log(
      `[hydrate] loaded ${uploads.size} uploads from uploads-index.json`
    );
    return true;
  } catch (e) {
    console.warn(
      "[hydrate] failed reading uploads-index.json:",
      e?.message || e
    );
    return false;
  }
}

// Fallback-Scan, falls kein Index existiert
async function hydrateUploadsByScanningDisk() {
  try {
    const files = await fs.promises.readdir(uploadDir);
    let count = 0;

    for (const filename of files) {
      const ext = path.extname(filename).toLowerCase();
      if (ext !== ".xlsx" && ext !== ".xml") continue;

      const uploadId = path.parse(filename).name;
      const filePath = path.join(uploadDir, filename);

      const stat = await fs.promises.stat(filePath);
      const createdAt = stat.birthtime
        ? stat.birthtime.toISOString()
        : new Date(stat.mtimeMs).toISOString();
      const updatedAt = stat.mtime ? stat.mtime.toISOString() : createdAt;

      const hasSnapshot = await exists(snapshotPath(uploadId));
      const hasChanges = await exists(changesPath(uploadId));

      const status = hasSnapshot ? "validated" : "processing";

      const rec = {
        uploadId,
        status,
        originalName: filename, // bei Scan unbekannt -> fallback
        storedAs: filename,
        sizeBytes: stat.size,
        createdAt,
        updatedAt,
        error: null,
        validation: hasSnapshot ? { sheetCount: undefined } : null,
        changesReady: hasChanges,
      };

      uploads.set(uploadId, rec);
      count++;
    }

    console.log(`[hydrate] scanned disk and rebuilt ${count} upload records`);
    schedulePersistUploads();
  } catch (e) {
    console.warn("[hydrate] scan failed:", e?.message || e);
  }
}

// Beim Start hydratisieren + processing uploads neu anstoßen
async function hydrateUploadsOnStartup() {
  const ok = await hydrateUploadsFromIndex();
  if (!ok) {
    await hydrateUploadsByScanningDisk();
  }

  // Re-trigger processing uploads (z. B. nach nodemon restart)
  for (const rec of uploads.values()) {
    if (rec.status !== "processing") continue;

    const filePath = path.join(
      uploadDir,
      rec.storedAs || `${rec.uploadId}.xlsx`
    );
    const fileExists = await exists(filePath);

    if (!fileExists) {
      rec.status = "failed";
      rec.error = "File missing after restart";
      rec.updatedAt = nowIso();
      uploads.set(rec.uploadId, rec);
      continue;
    }

    console.log(`[hydrate] re-trigger validation job for ${rec.uploadId}`);
    startValidationJob(rec.uploadId, filePath);
  }

  schedulePersistUploads();
}

// ------------------------------------------------------------
// Multer Setup
// ------------------------------------------------------------
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const id = crypto.randomUUID();
    cb(null, `${id}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext !== ".xlsx" && ext !== ".xml")
    return cb(new Error("Only .xlsx or .xml allowed"));
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
});

// ------------------------------------------------------------
// Snapshot Extraction (XLSX -> JSON)
// ------------------------------------------------------------
function extractSnapshotXlsx(filePath) {
  const wb = XLSX.readFile(filePath, { cellDates: true });
  const snapshot = { sheets: {} };

  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: null });
    snapshot.sheets[sheetName] = rows;
  }
  return snapshot;
}

// ------------------------------------------------------------
// Diff Helpers
// ------------------------------------------------------------
function pickKeyField(rows) {
  if (!rows || rows.length === 0) return null;
  const keys = Object.keys(rows[0] || {});
  const idKey = keys.find((k) => /id/i.test(k));
  return idKey || null;
}

function normalizeVal(v) {
  if (v === null || v === undefined) return null;
  if (v instanceof Date) return v.toISOString();
  return v;
}

function rowKey(row, keyField, fallbackIndex) {
  if (keyField && row[keyField] != null) return String(row[keyField]);
  return `row_${fallbackIndex}`;
}

function inferCategory(sheetName) {
  const s = (sheetName || "").toLowerCase();
  if (s.includes("fahrbahn") || s.includes("fb")) return "Fahrbahn";
  if (s.includes("fahrstrom") || s.includes("fs")) return "Fahrstrom";
  if (s.includes("sicherung") || s.includes("sa")) return "Sicherungsanlagen";
  if (s.includes("kunst") || s.includes("kb")) return "Kunstbauten";
  if (s.includes("hochbau") || s.includes("hb")) return "Hochbau";
  return "Publikumsanlagen";
}

function inferClassification(sheetName, diffs) {
  const txt = (sheetName + " " + diffs.join(" ")).toLowerCase();
  if (/(geometr|koord|epsg|shape)/.test(txt)) return "major";
  return "patch";
}

function diffSheet(oldRows, newRows, sheetName) {
  const keyField = pickKeyField(newRows) || pickKeyField(oldRows);

  const oldMap = new Map();
  (oldRows || []).forEach((r, i) => oldMap.set(rowKey(r, keyField, i), r));

  const newMap = new Map();
  (newRows || []).forEach((r, i) => newMap.set(rowKey(r, keyField, i), r));

  const changes = [];

  // deleted + modified
  for (const [k, oldRow] of oldMap.entries()) {
    const newRow = newMap.get(k);
    if (!newRow) {
      changes.push({
        id: `${sheetName}:${k}`,
        object: k,
        type: "deleted",
        classification: "minor",
        category: inferCategory(sheetName),
        changes: `Removed from sheet "${sheetName}"`,
        status: "pending",
      });
      continue;
    }

    const allKeys = Array.from(
      new Set([...Object.keys(oldRow), ...Object.keys(newRow)])
    );
    const diffs = [];
    for (const field of allKeys) {
      const a = normalizeVal(oldRow[field]);
      const b = normalizeVal(newRow[field]);
      if (a !== b) diffs.push(`${field}: "${a}" → "${b}"`);
    }

    if (diffs.length) {
      const cls = inferClassification(sheetName, diffs);
      changes.push({
        id: `${sheetName}:${k}`,
        object: k,
        type: "modified",
        classification: cls,
        category: inferCategory(sheetName),
        changes:
          diffs.slice(0, 6).join(" | ") +
          (diffs.length > 6 ? ` (+${diffs.length - 6} more)` : ""),
        status: "pending",
      });
    }
  }

  // added
  for (const [k] of newMap.entries()) {
    if (!oldMap.has(k)) {
      changes.push({
        id: `${sheetName}:${k}`,
        object: k,
        type: "added",
        classification: "minor",
        category: inferCategory(sheetName),
        changes: `Added in sheet "${sheetName}"`,
        status: "pending",
      });
    }
  }

  return changes;
}

function computeChanges(baseSnapshot, newSnapshot) {
  const baseSheets = baseSnapshot?.sheets || {};
  const newSheets = newSnapshot?.sheets || {};
  const sheetNames = Array.from(
    new Set([...Object.keys(baseSheets), ...Object.keys(newSheets)])
  );

  let all = [];
  for (const name of sheetNames) {
    all = all.concat(
      diffSheet(baseSheets[name] || [], newSheets[name] || [], name)
    );
  }
  return all;
}

// ------------------------------------------------------------
// Upload Records
// ------------------------------------------------------------
function createRecord({ uploadId, originalName, storedAs, sizeBytes }) {
  const rec = {
    uploadId,
    status: "processing",
    originalName,
    storedAs,
    sizeBytes,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    error: null,
    validation: null,
    changesReady: false,
  };
  uploads.set(uploadId, rec);
  schedulePersistUploads();
  return rec;
}

function updateRecord(uploadId, patch) {
  const rec = uploads.get(uploadId);
  if (!rec) return null;
  const next = { ...rec, ...patch, updatedAt: nowIso() };
  uploads.set(uploadId, next);
  schedulePersistUploads();
  return next;
}

// ------------------------------------------------------------
// Validation
// ------------------------------------------------------------
async function validateFileOnServer(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === ".xlsx") {
    const wb = XLSX.readFile(filePath, { cellDates: true });
    if (!wb.SheetNames || wb.SheetNames.length === 0) {
      throw new Error("XLSX has no sheets");
    }
    return { ok: true, details: { sheetCount: wb.SheetNames.length } };
  }

  if (ext === ".xml") {
    const xml = await fs.promises.readFile(filePath, "utf8");
    const parser = new XMLParser({ ignoreAttributes: false });
    parser.parse(xml);
    return { ok: true, details: { parsed: true } };
  }

  throw new Error("Unsupported file extension");
}

function startValidationJob(uploadId, filePath) {
  // Mini-Delay, damit UI "processing" sieht
  setTimeout(async () => {
    try {
      const ext = path.extname(filePath).toLowerCase();

      const result = await validateFileOnServer(filePath);
      updateRecord(uploadId, {
        status: "validated",
        error: null,
        validation: result.details,
      });
      console.log(`[${uploadId}] validated`, result.details);

      // Snapshot
      let snapshot = null;
      if (ext === ".xlsx") {
        snapshot = extractSnapshotXlsx(filePath);
      } else if (ext === ".xml") {
        // TODO: echte XML -> Snapshot Extraktion
        snapshot = { sheets: {} };
      } else {
        snapshot = { sheets: {} };
      }

      await writeJson(snapshotPath(uploadId), snapshot);

      // Baseline: letzte validierte Version vor dieser
      const candidates = Array.from(uploads.values())
        .filter((u) => u.uploadId !== uploadId && u.status === "validated")
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

      const base = candidates[0];
      let baseSnapshot = null;

      if (base && (await exists(snapshotPath(base.uploadId)))) {
        baseSnapshot = await readJson(snapshotPath(base.uploadId));
      }

      // Changes berechnen & persistieren
      const changes = computeChanges(baseSnapshot, snapshot);

      await writeJson(changesPath(uploadId), {
        uploadId,
        baselineUploadId: base?.uploadId || null,
        counts: {
          total: changes.length,
          added: changes.filter((c) => c.type === "added").length,
          deleted: changes.filter((c) => c.type === "deleted").length,
          modified: changes.filter((c) => c.type === "modified").length,
        },
        items: changes,
      });

      updateRecord(uploadId, { changesReady: true });
    } catch (err) {
      updateRecord(uploadId, {
        status: "failed",
        error: err?.message || "Validation failed",
      });
      console.log(`[${uploadId}] failed`, err?.message);
    }
  }, 700);
}

// ------------------------------------------------------------
// Routes
// ------------------------------------------------------------
app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.get("/api/uploads", (_req, res) => {
  const list = Array.from(uploads.values())
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, 50);
  res.json(list);
});

app.get("/api/uploads/:id", (req, res) => {
  const rec = uploads.get(req.params.id);
  if (!rec) return res.status(404).json({ error: "Not found" });
  res.json(rec);
});

app.get("/api/uploads/:id/changes", async (req, res) => {
  const id = req.params.id;
  if (!(await exists(changesPath(id)))) {
    return res.status(404).json({ error: "No changes computed yet" });
  }
  res.json(await readJson(changesPath(id)));
});

app.patch("/api/uploads/:id/changes/:changeId", async (req, res) => {
  const { id } = req.params;
  const changeId = decodeURIComponent(req.params.changeId);

  const { status } = req.body || {};
  if (!["pending", "approved", "rejected"].includes(status)) {
    return res.status(400).json({ error: "status must be pending|approved|rejected" });
  }

  if (!(await exists(changesPath(id)))) {
    return res.status(404).json({ error: "No changes computed yet" });
  }

  const doc = await readJson(changesPath(id));
  doc.items = doc.items.map((c) => (c.id === changeId ? { ...c, status } : c));
  await writeJson(changesPath(id), doc);

  res.json({ ok: true });
});

app.post("/api/uploads", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).send("No file received");

  const uploadId = path.parse(req.file.filename).name;

  const rec = createRecord({
    uploadId,
    originalName: req.file.originalname,
    storedAs: req.file.filename,
    sizeBytes: req.file.size,
  });

  const filePath = path.join(uploadDir, req.file.filename);
  startValidationJob(uploadId, filePath);

  res.json(rec);
});

// --- Snapshot / Sheets API ---
app.get("/api/uploads/:id/snapshot", async (req, res) => {
  const id = req.params.id;
  if (!(await exists(snapshotPath(id)))) {
    return res.status(404).json({ error: "No snapshot computed yet" });
  }
  res.json(await readJson(snapshotPath(id)));
});

app.get("/api/uploads/:id/sheets", async (req, res) => {
  const id = req.params.id;
  if (!(await exists(snapshotPath(id)))) {
    return res.status(404).json({ error: "No snapshot computed yet" });
  }

  const snap = await readJson(snapshotPath(id));
  const sheetsObj = snap?.sheets || {};

  const sheets = Object.entries(sheetsObj).map(([name, rows]) => ({
    name,
    rowCount: Array.isArray(rows) ? rows.length : 0,
  }));

  res.json({ uploadId: id, sheets });
});

app.get("/api/uploads/:id/sheets/:sheetName", async (req, res) => {
  const id = req.params.id;
  const sheetName = decodeURIComponent(req.params.sheetName);

  if (!(await exists(snapshotPath(id)))) {
    return res.status(404).json({ error: "No snapshot computed yet" });
  }

  const snap = await readJson(snapshotPath(id));
  const sheetsObj = snap?.sheets || {};
  const rows = sheetsObj[sheetName];

  if (!rows) return res.status(404).json({ error: `Sheet not found: ${sheetName}` });
  if (!Array.isArray(rows)) return res.status(400).json({ error: "Sheet data is not an array" });

  const limitRaw = parseInt(String(req.query.limit ?? "500"), 10);
  const offsetRaw = parseInt(String(req.query.offset ?? "0"), 10);

  const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(limitRaw, 5000)) : 500;
  const offset = Number.isFinite(offsetRaw) ? Math.max(0, offsetRaw) : 0;

  const slice = rows.slice(offset, offset + limit);

  res.json({
    uploadId: id,
    sheetName,
    totalRows: rows.length,
    offset,
    limit,
    rows: slice,
  });
});

// ------------------------------------------------------------
// Fehler Handler (MUSS ganz am Ende stehen)
// ------------------------------------------------------------
app.use((err, _req, res, _next) => {
  res.status(400).send(err.message || "Upload error");
});

// ------------------------------------------------------------
// Start
// ------------------------------------------------------------
const port = 3001;

hydrateUploadsOnStartup().catch((e) =>
  console.warn("hydrateUploadsOnStartup failed:", e?.message || e)
);

app.listen(port, () =>
  console.log(`API listening on http://localhost:${port}`)
);
