import { Router } from "express";
import multer from "multer";
import path from "node:path";
import { mkdirSync, statSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const UPLOADS_DIR = process.env.DC_UPLOADS_DIR || "/var/lib/dealcircle-api/uploads";

// Erlaubte Upload-Kinds → Subordner
const KINDS = {
  speaker: "speakers",
  cover:   "covers",
};

for (const sub of Object.values(KINDS)) {
  mkdirSync(path.join(UPLOADS_DIR, sub), { recursive: true });
}

function pickKind(req) {
  const k = req.params.kind;
  if (!Object.prototype.hasOwnProperty.call(KINDS, k)) return null;
  return KINDS[k];
}

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const sub = pickKind(req);
    if (!sub) return cb(new Error("invalid_kind"));
    cb(null, path.join(UPLOADS_DIR, sub));
  },
  filename: (req, file, cb) => {
    const ext = (path.extname(file.originalname).toLowerCase() || ".jpg").slice(0, 5);
    const safeExt = [".jpg", ".jpeg", ".png", ".webp"].includes(ext) ? ext : ".jpg";
    const kindPrefix = req.params.kind.slice(0, 8);
    cb(null, `${kindPrefix}-${Date.now()}-${randomBytes(6).toString("hex")}${safeExt}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },  // 8MB (cover kann größer sein)
  fileFilter: (_req, file, cb) => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) {
      return cb(new Error("invalid_file_type"));
    }
    cb(null, true);
  },
});

const router = Router();

// --- Upload: POST /:kind  — admin only ---
router.post(
  "/:kind",
  requireAuth,
  requireAdmin,
  (req, res, next) => {
    if (!pickKind(req)) return res.status(400).json({ error: "invalid_kind" });
    upload.single("photo")(req, res, (err) => {
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE") return res.status(413).json({ error: "file_too_large" });
        if (err.message === "invalid_file_type") return res.status(400).json({ error: "invalid_file_type" });
        if (err.message === "invalid_kind") return res.status(400).json({ error: "invalid_kind" });
        return next(err);
      }
      next();
    });
  },
  (req, res) => {
    if (!req.file) return res.status(400).json({ error: "no_file" });
    const sub = KINDS[req.params.kind];
    res.status(201).json({ path: `/api/uploads/${sub}/${req.file.filename}` });
  }
);

// --- Download: GET /:sub/:filename  — public ---
router.get("/:sub/:filename", (req, res) => {
  const { sub, filename } = req.params;
  if (!Object.values(KINDS).includes(sub)) return res.status(400).end();
  if (!/^[a-zA-Z0-9._-]+$/.test(filename)) return res.status(400).end();

  const full = path.join(UPLOADS_DIR, sub, filename);
  try { statSync(full); } catch { return res.status(404).end(); }

  res.setHeader("Cache-Control", "public, max-age=604800, immutable");
  res.sendFile(full);
});

export default router;
