// lib/backend-fetch.ts
import { cookies } from "next/headers";

const BACKEND_URL = process.env.BACKEND_URL!;
const DEFAULT_TIMEOUT_MS = 15000;

export async function backendFetch(path: string, options: RequestInit = {}) {
  let token: string | undefined;
  
  try {
    const cookieStore = await cookies();
    token = cookieStore.get("session")?.value;
  } catch (error) {
    console.warn("⚠️ Could not access cookies:", error);
  }

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  // Always include Authorization header if token exists
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const timeoutMs =
    typeof (options as any).timeout === "number"
      ? (options as any).timeout
      : DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  const fetchOptions: RequestInit = {
    ...options,
    headers,
    cache: "no-store",
    signal: controller.signal,
  };

  try {
    return await fetch(`${BACKEND_URL}${path}`, fetchOptions);
  } catch (error: any) {
    if (error?.name === "AbortError") {
      throw new Error(`Request timeout after ${timeoutMs}ms: ${path}`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}