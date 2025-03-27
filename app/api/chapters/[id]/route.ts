import { NextResponse } from "next/server"

// The base URL of your FastAPI backend
const API_BASE_URL = process.env.API_BASE_URL || "https://central-nu.vercel.app"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const id = params.id

  console.log(`Fetching chapter with id: ${id} using API: ${API_BASE_URL}`)

  try {
    // Add a timeout to the fetch request
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    const response = await fetch(`${API_BASE_URL}/chapter/${id}`, {
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
    console.error(`Error fetching chapter ${id}:`, error)

    // Return mock data as fallback
    return NextResponse.json(getMockChapter(id))
  }
}

// Fallback mock data in case the API is unavailable
function getMockChapter(id: string) {
  return {
    title: `Chapter ${id.split("-")[1] || "1"}`,
    subtitle: "Sample Chapter",
    content: `
      <h1>Chapter ${id.split("-")[1] || "1"}</h1>
      <p>This is a sample chapter content. The actual chapter data could not be fetched from the API.</p>
      <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
      <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
    `,
  }
}

