"use client"

import { useState, useEffect } from "react"
import { Minus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

interface FontControlsProps {
  className?: string
}

export function FontControls({ className = "" }: FontControlsProps) {
  const [fontSize, setFontSize] = useState(16)

  // Carregar tamanho da fonte salvo
  useEffect(() => {
    try {
      const savedSize = localStorage.getItem("reader-font-size")
      if (savedSize) {
        const size = Number(savedSize)
        if (!isNaN(size) && size >= 12 && size <= 32) {
          setFontSize(size)
        }
      }
    } catch (error) {
      console.error("Error loading font size:", error)
    }
  }, [])

  // Salvar e aplicar tamanho da fonte quando mudar
  useEffect(() => {
    try {
      localStorage.setItem("reader-font-size", fontSize.toString())
      document.documentElement.style.setProperty("--reader-font-size", `${fontSize}px`)
      console.log("Font size updated:", fontSize)
    } catch (error) {
      console.error("Error saving font size:", error)
    }
  }, [fontSize])

  const increaseFontSize = () => setFontSize((prev) => Math.min(prev + 2, 32))
  const decreaseFontSize = () => setFontSize((prev) => Math.max(prev - 2, 12))

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Button
        variant="outline"
        size="icon"
        onClick={decreaseFontSize}
        disabled={fontSize <= 12}
        title="Diminuir tamanho da fonte"
      >
        <Minus className="h-4 w-4" />
      </Button>
      <span className="text-sm font-medium" title="Tamanho atual da fonte">
        {fontSize}px
      </span>
      <Button
        variant="outline"
        size="icon"
        onClick={increaseFontSize}
        disabled={fontSize >= 32}
        title="Aumentar tamanho da fonte"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  )
}

