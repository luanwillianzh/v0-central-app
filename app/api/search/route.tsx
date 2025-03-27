import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const query = url.searchParams.get("q") || ""

  try {
    const response = await fetch(`http://localhost:8000/search/${encodeURIComponent(query)}`)
    const data = await response.json()

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error searching novels:", error)
    return NextResponse.json({ sucesso: false, error: "Failed to search novels" }, { status: 500 })
  }
}

