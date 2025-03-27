"use client"

import { useState, useEffect, useRef } from "react"

interface EpubReaderProps {
  url: string
  initialLocation?: string
  onLocationChange?: (cfi: string) => void
}

export default function EpubReader({ url, initialLocation, onLocationChange }: EpubReaderProps) {
  const viewerRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!viewerRef.current) return

    let book: any = null
    let rendition: any = null

    const initializeReader = async () => {
      try {
        setIsLoading(true)

        // Importar dinamicamente para evitar problemas de SSR
        const ePub = (await import("epubjs")).default

        // Criar uma nova instância do livro
        book = ePub(url)

        // Criar uma renderização
        rendition = book.renderTo(viewerRef.current, {
          width: "100%",
          height: "100%",
          spread: "none",
        })

        // Aplicar tema baseado no modo atual
        const isDarkMode = document.documentElement.classList.contains("dark")
        if (isDarkMode) {
          rendition.themes.register("dark", {
            body: {
              color: "#ffffff",
              background: "#1a1a1a",
            },
          })
          rendition.themes.select("dark")
        }

        // Exibir o livro
        if (initialLocation) {
          rendition.display(initialLocation)
        } else {
          rendition.display()
        }

        // Configurar eventos
        rendition.on("locationChanged", (location: any) => {
          if (onLocationChange) {
            onLocationChange(location.start.cfi)
          }
        })

        setIsLoading(false)
      } catch (err) {
        console.error("Error initializing EPUB reader:", err)
        setError("Erro ao carregar o livro. Por favor, tente novamente.")
        setIsLoading(false)
      }
    }

    initializeReader()

    // Limpeza
    return () => {
      if (rendition) {
        rendition.destroy()
      }
      if (book) {
        book.destroy()
      }
    }
  }, [url, initialLocation, onLocationChange])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando livro...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            className="px-4 py-2 bg-primary text-primary-foreground rounded"
            onClick={() => window.location.reload()}
          >
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full">
      <div ref={viewerRef} className="w-full h-[calc(100vh-8rem)]" />
    </div>
  )
}

