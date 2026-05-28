import { Router } from "express";
import db from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// Alle Events, sortiert: upcoming chronologisch, past absteigend.
router.get("/", requireAuth, (_req, res) => {
  const rows = db
    .prepare(`
      SELECT id, title, starts_at, time_label, location, status,
             fee_cents, max_attendees, confirmed_count,
             description, speaker, photo_count, created_at, updated_at
      FROM events
      ORDER BY starts_at ASC
    `)
    .all();

  res.json({ events: rows });
});

export default router;
