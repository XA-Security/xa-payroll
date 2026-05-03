import crypto from "node:crypto"
import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies"

export const SESSION_COOKIE_NAME = "xa_staff_session"

interface SessionPayload {
  humanity_id: string
  eid: string
  phone: string
  exp: number
}

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || ""

export function encryptSession(payload: SessionPayload): string {
  if (!ENCRYPTION_KEY) {
    throw new Error("ENCRYPTION_KEY environment variable not set")
  }

  const iv = crypto.randomBytes(16)
  const key = Buffer.from(ENCRYPTION_KEY, "base64")
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv)

  const payloadString = JSON.stringify(payload)
  let encrypted = cipher.update(payloadString, "utf8", "hex")
  encrypted += cipher.final("hex")

  const authTag = cipher.getAuthTag()
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`
}

export function decryptSession(encryptedToken: string): SessionPayload | null {
  if (!ENCRYPTION_KEY) {
    throw new Error("ENCRYPTION_KEY environment variable not set")
  }

  try {
    const [iv, authTag, encrypted] = encryptedToken.split(":")

    const key = Buffer.from(ENCRYPTION_KEY, "base64")
    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      key,
      Buffer.from(iv, "hex")
    )

    decipher.setAuthTag(Buffer.from(authTag, "hex"))

    let decrypted = decipher.update(encrypted, "hex", "utf8")
    decrypted += decipher.final("utf8")

    return JSON.parse(decrypted) as SessionPayload
  } catch {
    return null
  }
}

export function createSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/secure",
    maxAge: 8 * 60 * 60,
  }
}

export async function getSessionFromCookies(
  cookieStore: Awaited<ReturnType<typeof import("next/headers").cookies>>
): Promise<SessionPayload | null> {
  const cookie = cookieStore.get(SESSION_COOKIE_NAME)
  if (!cookie || !cookie.value) {
    return null
  }

  const payload = decryptSession(cookie.value)
  if (!payload) {
    return null
  }

  if (payload.exp < Date.now()) {
    return null
  }

  return payload
}
