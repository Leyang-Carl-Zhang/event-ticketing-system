import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
export type Role = "ORGANIZER" | "STAFF" | "ATTENDEE";

const COOKIE_NAME = "session";
const JWT_EXPIRY = "7d";

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET must be set and contain at least 32 characters");
  }
  return new TextEncoder().encode(secret);
}

export type Session = { userId: string; role: Role };

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signToken(payload: Session): Promise<string> {
  return new SignJWT({
    sub: payload.userId,
    role: payload.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .sign(getJwtSecret());
}

export async function verifyToken(token: string): Promise<Session | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    const sub = payload.sub as string | undefined;
    const role = payload.role as Role | undefined;
    if (!sub || !role) return null;
    return { userId: sub, role };
  } catch {
    return null;
  }
}

export function getCookieOptions() {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  };
}

/** Get session from Next.js server (e.g. in Route Handlers or Server Components). */
export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

/** Get session from request (e.g. in Middleware). */
export async function getSessionFromRequest(request: NextRequest): Promise<Session | null> {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export { COOKIE_NAME };

/** Require session; throws if not authenticated. Use in API routes. */
export async function requireAuth(): Promise<Session> {
  const session = await getSession();
  if (!session) throw new AuthError("Not authenticated");
  return session;
}

/** Require ORGANIZER role; throws if not organizer. */
export async function requireOrganizer(): Promise<Session> {
  const session = await requireAuth();
  if (session.role !== "ORGANIZER") throw new AuthError("Organizer access required");
  return session;
}

/** Require STAFF role; throws if not staff. */
export async function requireStaff(): Promise<Session> {
  const session = await requireAuth();
  if (session.role !== "STAFF") throw new AuthError("Staff access required");
  return session;
}

/** Require ATTENDEE role; throws if not attendee. */
export async function requireAttendee(): Promise<Session> {
  const session = await requireAuth();
  if (session.role !== "ATTENDEE") throw new AuthError("Attendee access required");
  return session;
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}
