// app/page.tsx (Server Component)
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function Home() {
  const cookieStore = await cookies();        
  const session = cookieStore.get("session")?.value;
  redirect(session ? "/dashboard" : "/login");
}
