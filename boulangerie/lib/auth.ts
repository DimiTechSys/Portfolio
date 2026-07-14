import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import crypto from "crypto";
import { getSetting, setSetting } from "./settings";

const COOKIE_NAME = "bf_session";
const SESSION_DAYS = 7;

function secret(): string {
  return process.env.SESSION_SECRET || "insecure-dev-secret";
}

// --- Hachage de mot de passe (scrypt) -------------------------------------
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = (stored || "").split(":");
  if (!salt || !hash) return false;
  const candidate = crypto.scryptSync(password, salt, 64).toString("hex");
  const a = Buffer.from(hash, "hex");
  const b = Buffer.from(candidate, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// --- Jeton de session signé (HMAC) ----------------------------------------
function sign(value: string): string {
  return crypto.createHmac("sha256", secret()).update(value).digest("hex");
}

function makeToken(): string {
  const exp = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const payload = `admin.${exp}`;
  return `${payload}.${sign(payload)}`;
}

function isValidToken(token: string | undefined): boolean {
  if (!token) return false;
  const idx = token.lastIndexOf(".");
  if (idx < 0) return false;
  const payload = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  if (sign(payload) !== sig) return false;
  const exp = Number(payload.split(".")[1]);
  return Number.isFinite(exp) && exp > Date.now();
}

// --- Mot de passe admin stocké en base (paramètre) ------------------------
export async function checkAdminPassword(password: string): Promise<boolean> {
  const stored = await getSetting("adminPasswordHash");
  if (!stored) return false;
  return verifyPassword(password, stored);
}

export async function setAdminPassword(password: string): Promise<void> {
  await setSetting("adminPasswordHash", hashPassword(password));
}

// --- Session côté serveur --------------------------------------------------
export async function createSession(): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE_NAME, makeToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export async function isAuthenticated(): Promise<boolean> {
  const jar = await cookies();
  return isValidToken(jar.get(COOKIE_NAME)?.value);
}

// À appeler en tête des pages protégées du back-office.
export async function requireAuth(): Promise<void> {
  if (!(await isAuthenticated())) redirect("/admin/login");
}
