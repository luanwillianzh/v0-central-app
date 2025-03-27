import { NextResponse } from "next/server"

// The base URL of your FastAPI backend
const API_BASE_URL = process.env.API_BASE_URL || "https://central-nu.vercel.app"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const query = url.searchParams.get("q") || ""

  console.log(`Searching for novels with query: "${query}" using API: ${API_BASE_URL}`)

  try {
    // Add a timeout to the fetch request
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    const response = await fetch(`${API_BASE_URL}/search/${encodeURIComponent(query)}`, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    })

    clearTimeout(timeoutId)

    console.log(`API response status: ${response.status}`)

    if (!response.ok) {
      const errorText = await response.text().catch(() => "No error details available")
      console.error(`API error response: ${errorText}`)
      throw new Error(`API responded with status: ${response.status}`)
    }

    const data = await response.json()
    console.log(`Search results count: ${data.resultado?.length || 0}`)

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error searching novels:", error)

    // Return mock data as fallback
    if (query) {
      return NextResponse.json({
        sucesso: true,
        resultado: getMockSearchResults(query),
      })
    }

    return NextResponse.json(
      { sucesso: false, error: `Failed to search novels: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 200 }, // Return 200 with error info instead of 500
    )
  }
}

// Fallback mock data in case the API is unavailable
function getMockSearchResults(query: string) {
  const mockNovels = [
    {
      nome: "The Great Adventure",
      url: "the-great-adventure",
      cover: "/placeholder.svg?height=300&width=200",
    },
    {
      nome: "Mystery Manor",
      url: "mystery-manor",
      cover: "/placeholder.svg?height=300&width=200",
    },
    {
      nome: "Future World",
      url: "future-world",
      cover: "/placeholder.svg?height=300&width=200",
    },
    {
      nome: "Love in Paris",
      url: "love-in-paris",
      cover: "/placeholder.svg?height=300&width=200",
    },
  ]

  // Filter mock novels based on query
  return mockNovels.filter((novel) => novel.nome.toLowerCase().includes(query.toLowerCase()))
}

