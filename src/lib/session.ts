// Edge-safe JWT helpers (used by middleware and server code).
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "liftlog_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

// Signing key: JWT_SECRET if set, otherwise the (server-only, secret) database URL
// that the Vercel ↔ Neon integration already injects, so no extra secret has to be managed.
function secret() {
  const s = process.env.JWT_SECRET || process.env.DATABASE_URL;
  if (!s) throw new Error("Set JWT_SECRET (or DATABASE_URL) to sign sessions");
  return new TextEncoder().encode(`liftlog-session:${s}`);
}

export type SessionPayload = { userId: string; name: string };

export async function signSession(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secret());
}

export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (typeof payload.userId !== "string") return null;
    return { userId: payload.userId, name: String(payload.name ?? "") };
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: MAX_AGE_SECONDS,
};
