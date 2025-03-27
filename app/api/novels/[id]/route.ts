import { NextResponse } from "next/server"

// The base URL of your FastAPI backend
const API_BASE_URL = process.env.API_BASE_URL || "https://central-nu.vercel.app"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const id = params.id

  console.log(`Fetching novel with id: ${id} using API: ${API_BASE_URL}`)

  try {
    // Add a timeout to the fetch request
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    const response = await fetch(`${API_BASE_URL}/novel/${id}`, {
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
    return NextResponse.json(data)
  } catch (error) {
    console.error(`Error fetching novel ${id}:`, error)

    // Return mock data as fallback
    return NextResponse.json(getMockNovel(id))
  }
}

// Fallback mock data in case the API is unavailable
function getMockNovel(id: string) {
  const mockNovels = {
    "the-great-adventure": {
      nome: "The Great Adventure",
      desc: "An epic journey through unknown lands. Follow the protagonist as they navigate through treacherous mountains, dense forests, and encounter strange creatures.",
      cover: "/placeholder.svg?height=300&width=200",
      chapters: ["chapter-1", "chapter-2", "chapter-3"],
    },
    "mystery-manor": {
      nome: "Mystery Manor",
      desc: "A thrilling mystery set in an old mansion. When a group of strangers receives an invitation to spend a weekend at Mystery Manor, they have no idea what awaits them.",
      cover: "/placeholder.svg?height=300&width=200",
      chapters: ["chapter-1", "chapter-2"],
    },
    "future-world": {
      nome: "Future World",
      desc: "A sci-fi tale set in the distant future. In a world where technology has advanced beyond recognition, humanity faces new challenges and ethical dilemmas.",
      cover: "/placeholder.svg?height=300&width=200",
      chapters: ["chapter-1", "chapter-2", "chapter-3", "chapter-4"],
    },
    "love-in-paris": {
      nome: "Love in Paris",
      desc: "A romantic story set in the city of love. When two strangers meet by chance in a small café in Paris, their lives are forever changed.",
      cover: "/placeholder.svg?height=300&width=200",
      chapters: ["chapter-1", "chapter-2"],
    },
  }

  // Return the requested novel or a default one
  return (
    mockNovels[id as keyof typeof mockNovels] || {
      nome: "Sample Novel",
      desc: "This is a sample novel description. The actual novel data could not be fetched from the API.",
      cover: "/placeholder.svg?height=300&width=200",
      chapters: ["chapter-1", "chapter-2"],
    }
  )
}

