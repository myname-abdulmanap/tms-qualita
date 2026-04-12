import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import MqttConfigPanel from "@/components/edc/mqtt-config-panel";

export const dynamic = "force-dynamic";

export default async function EdcMqttConfigPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  if (!token) {
    redirect("/login");
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          EDC MQTT Dynamic Config
        </h1>
        <p className="mt-1 text-gray-600">
          Atur host/topic MQTT secara dinamis dari dashboard admin. Payload JSON
          dari topic SN akan diproses ke data device dashboard.
        </p>
      </div>
      <MqttConfigPanel />
    </div>
  );
}
