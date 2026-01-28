// lib/backend-fetch.ts
import { cookies } from "next/headers";

const BACKEND_URL = process.env.BACKEND_URL!;

export async function backendFetch(path: string, options: RequestInit = {}) {
  let token: string | undefined;
  
  try {
    const cookieStore = await cookies();
    token = cookieStore.get("session")?.value;
  } catch (error) {
    console.warn("⚠️ Could not access cookies:", error);
  }

  console.log("🔑 Token:", token ? "exists (length: " + token.length + ")" : "not found");
  console.log("🌐 Fetching:", `${BACKEND_URL}${path}`);
  console.log("📋 Method:", options.method || "GET");

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  // Always include Authorization header if token exists
  if (token) {
    headers.Authorization = `Bearer ${token}`;
    console.log("🔐 Authorization header set");
  }

  const fetchOptions: RequestInit = {
    ...options,
    headers,
  };

  console.log("📦 Fetch options:", {
    method: fetchOptions.method || "GET",
    hasAuth: !!token,
    contentType: headers["Content-Type"],
  });

  return fetch(`${BACKEND_URL}${path}`, fetchOptions);
}