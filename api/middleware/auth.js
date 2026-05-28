import { verifyToken } from "../jwt.js";

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "unauthenticated" });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: "invalid_token" });
  }

  req.user = payload;
  next();
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "forbidden" });
  }
  next();
}
