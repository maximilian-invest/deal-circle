import { Router } from "express";
import multer from "multer";
import path from "node:path";
import { mkdirSync, statSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const UPLOADS_DIR = process.env.DC_UPLOADS_DIR || "/var/lib/dealcircle-api/uploads";
const SPEAKERS_DIR = path.join(UPLOADS_DIR, "speakers");

mkdirSync(SPEAKERS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, SPEAKERS_DIR),
  filename: (_req, file, cb) => {
    const ext = (path.extname(file.originalname).toLowerCase() || ".jpg").slice(0, 5);
    const safeExt = [".jpg", ".jpeg", ".png", ".webp"].includes(ext) ? ext : ".jpg";
    cb(null, `speaker-${Date.now()}-${randomBytes(6).toString("hex")}${safeExt}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) {
      return cb(new Error("invalid_file_type"));
    }
    cb(null, true);
  },
});

const router = Router();

// Upload — admin only
router.post(
  "/speaker",
  requireAuth,
  requireAdmin,
  (req, res, next) => {
    upload.single("photo")(req, res, (err) => {
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE") return res.status(413).json({ error: "file_too_large" });
        if (err.message === "invalid_file_type") return res.status(400).json({ error: "invalid_file_type" });
        return next(err);
      }
      next();
    });
  },
  (req, res) => {
    if (!req.file) return res.status(400).json({ error: "no_file" });
    res.status(201).json({ path: `/api/uploads/speakers/${req.file.filename}` });
  }
);

// Download — public (URLs sind unguessable durch random token im Dateinamen)
router.get("/speakers/:filename", (req, res) => {
  const filename = req.params.filename;
  if (!/^[a-zA-Z0-9._-]+$/.test(filename)) return res.status(400).end();

  const full = path.join(SPEAKERS_DIR, filename);
  try {
    statSync(full);
  } catch {
    return res.status(404).end();
  }

  res.setHeader("Cache-Control", "public, max-age=604800, immutable");
  res.sendFile(full);
});

export default router;
