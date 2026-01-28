import { backendFetch } from "@/lib/backend-fetch";

function getTokenFromCookie(request: Request): string | null {
  const cookie = request.headers.get("cookie");
  if (!cookie) return null;
  const match = cookie.match(/token=([^;]+)/);
  return match ? match[1] : null;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const queryParams = new URLSearchParams(url.search);
  const token = getTokenFromCookie(request);

  return await backendFetch(`/payment-gateways?${queryParams.toString()}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  const token = getTokenFromCookie(request);

  return await backendFetch("/payment-gateways", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
}
