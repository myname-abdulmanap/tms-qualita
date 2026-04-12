import { NextResponse } from "next/server"
import { backendFetch } from "@/lib/backend-fetch"

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const q = url.searchParams.toString()
    const res = await backendFetch(q ? `/mqtt-config/acl-template?${q}` : "/mqtt-config/acl-template")
    const text = await res.text()
    const data = text ? JSON.parse(text) : {}
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    return NextResponse.json({ message: "Failed", error: String(error) }, { status: 500 })
  }
}
