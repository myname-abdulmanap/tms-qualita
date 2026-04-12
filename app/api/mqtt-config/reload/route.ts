import { NextResponse } from "next/server"
import { backendFetch } from "@/lib/backend-fetch"

export async function POST() {
  try {
    const res = await backendFetch("/mqtt-config/reload", { method: "POST" })
    const text = await res.text()
    const data = text ? JSON.parse(text) : {}
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    return NextResponse.json({ message: "Failed", error: String(error) }, { status: 500 })
  }
}
