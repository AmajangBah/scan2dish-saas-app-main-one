import crypto from "crypto";

type ParsedHash = {
  iterations: number;
  salt: Buffer;
  hash: Buffer;
};

function parsePinHash(stored: string): ParsedHash | null {
  // Format: pbkdf2$<iterations>$<saltB64>$<hashB64>
  const parts = stored.split("$");
  if (parts.length !== 4) return null;
  const [algo, iterStr, saltB64, hashB64] = parts;
  if (algo !== "pbkdf2") return null;
  const iterations = Number(iterStr);
  if (!Number.isFinite(iterations) || iterations < 10_000) return null;
  const salt = Buffer.from(saltB64, "base64");
  const hash = Buffer.from(hashB64, "base64");
  if (salt.length < 8 || hash.length < 16) return null;
  return { iterations, salt, hash };
}

export function isValidKitchenPin(pin: string) {
  return /^\d{4,8}$/.test(pin);
}

export function hashKitchenPin(pin: string) {
  if (!isValidKitchenPin(pin)) {
    throw new Error("PIN must be 4–8 digits");
  }
  const iterations = 120_000;
  const salt = crypto.randomBytes(16);
  const hash = crypto.pbkdf2Sync(pin, salt, iterations, 32, "sha256");
  return `pbkdf2$${iterations}$${salt.toString("base64")}$${hash.toString("base64")}`;
}

export function verifyKitchenPin(pin: string, storedHash: string) {
  if (!isValidKitchenPin(pin)) return false;
  const parsed = parsePinHash(storedHash);
  if (!parsed) return false;
  const computed = crypto.pbkdf2Sync(pin, parsed.salt, parsed.iterations, 32, "sha256");
  if (computed.length !== parsed.hash.length) return false;
  return crypto.timingSafeEqual(computed, parsed.hash);
}

function getKitchenSessionSecret() {
  const secret = process.env.KITCHEN_SESSION_SECRET;
  if (!secret) throw new Error("Missing KITCHEN_SESSION_SECRET");
  return secret;
}

export function signKitchenSession(params: { restaurantId: string; issuedAt: number }) {
  const secret = getKitchenSessionSecret();
  const payload = `v1.${params.restaurantId}.${params.issuedAt}`;
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyKitchenSession(token: string, restaurantId: string) {
  // Kitchen pages should degrade gracefully when secret is missing (treat as unauthenticated).
  const secret = process.env.KITCHEN_SESSION_SECRET;
  if (!secret) return false;
  const parts = token.split(".");
  if (parts.length !== 4) return false;
  const [v, rid, issuedAtStr, sig] = parts;
  if (v !== "v1") return false;
  if (rid !== restaurantId) return false;
  const issuedAt = Number(issuedAtStr);
  if (!Number.isFinite(issuedAt)) return false;

  // 12h max session validity as defense-in-depth (cookie is session-based)
  const maxAgeMs = 12 * 60 * 60 * 1000;
  if (Date.now() - issuedAt > maxAgeMs) return false;

  const payload = `v1.${rid}.${issuedAt}`;
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  try {
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch {
    return false;
  }
}

