import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import ProfileForm from "@/components/profile/profile-form";
export const dynamic = "force-dynamic";


function decodeJWT(token: string) {
  try {
    return JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
  } catch {
    return null;
  }
}

export default async function ProfilePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  if (!token) {
    redirect("/login");
  }

  const payload = decodeJWT(token);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profil Saya</h1>
        <p className="text-gray-500 mt-2">
          Kelola informasi profil dan ubah password Anda
        </p>
      </div>
      <ProfileForm userInfo={payload} />
    </div>
  );
}
