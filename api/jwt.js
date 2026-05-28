import jwt from "jsonwebtoken";
import { randomBytes } from "node:crypto";

const SECRET = process.env.DC_JWT_SECRET || (() => {
  console.warn("[jwt] DC_JWT_SECRET nicht gesetzt — generiere ephemere secret (Logins werden bei Restart ungueltig)");
  return randomBytes(48).toString("hex");
})();

const TTL = process.env.DC_JWT_TTL || "7d";

export function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: TTL, algorithm: "HS256" });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET, { algorithms: ["HS256"] });
  } catch {
    return null;
  }
}
