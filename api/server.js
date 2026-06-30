import "dotenv/config";
import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.js";
import adminRoutes from "./routes/admin.js";
import adminEventsRoutes from "./routes/admin-events.js";
import eventsRoutes from "./routes/events.js";
import uploadsRoutes from "./routes/uploads.js";
import memberRoutes from "./routes/member.js";
import applicationsRoutes from "./routes/applications.js";
import stripeWebhookRoutes from "./routes/stripe-webhook.js";

const app = express();
const PORT = Number(process.env.DC_PORT || 3001);
const HOST = process.env.DC_HOST || "127.0.0.1";

// Läuft hinter nginx auf 127.0.0.1 → dem lokalen Proxy vertrauen, damit
// req.ip / X-Forwarded-For die echte Besucher-IP liefern (sonst sieht
// express-rate-limit nur 127.0.0.1 und wirft ERR_ERL_UNEXPECTED_X_FORWARDED_FOR).
app.set("trust proxy", "loopback");

app.disable("x-powered-by");

// Stripe-Webhook MUSS vor express.json() kommen — Stripe braucht raw body
// fuer die Signatur-Verifikation.
app.use("/api/stripe/webhook", express.raw({ type: "application/json", limit: "1mb" }), stripeWebhookRoutes);

app.use(express.json({ limit: "16kb" }));
app.use(cors({ origin: process.env.DC_CORS_ORIGIN || true, credentials: true }));

app.get("/healthz", (_req, res) => res.json({ ok: true, ts: Date.now() }));

app.use("/api/auth", authRoutes);
app.use("/api/events", eventsRoutes);
app.use("/api/uploads", uploadsRoutes);
app.use("/api/member", memberRoutes);
app.use("/api/applications", applicationsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin/events", adminEventsRoutes);

app.use((_req, res) => res.status(404).json({ error: "not_found" }));

app.use((err, _req, res, _next) => {
  console.error("[api]", err);
  res.status(500).json({ error: "server_error" });
});

app.listen(PORT, HOST, () => {
  console.log(`[api] listening on ${HOST}:${PORT}`);
});
