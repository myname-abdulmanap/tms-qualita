import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import DashboardClient from "./dashboard-client";
export const dynamic = "force-dynamic";


function decodeJWT(token: string) {
  try {
    return JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
  } catch {
    return null;
  }
}

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  if (!token) {
    redirect("/login");
  }

  const payload = decodeJWT(token);

  // Optional: You can pass user data to client component if needed
  // For now, we just verify the session exists

  return <DashboardClient />;
}