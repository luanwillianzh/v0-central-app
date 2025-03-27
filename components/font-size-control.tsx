"use client"

import { useState, useEffect } from "react"
import { Minus, Plus, Type } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

// Tamanhos de fonte disponíveis
const MIN_FONT_SIZE = 12
const MAX_FONT_SIZE = 24
const DEFAULT_FONT_SIZE = 16

interface FontSizeControlProps {
  contentId?: string
}

export function FontSizeControl({ contentId = "chapter-content" }: FontSizeControlProps) {
  const [fontSize, setFontSize] = useState(DEFAULT_FONT_SIZE)
  const [popoverOpen, setPopoverOpen] = useState(false)

  // Carregar tamanho da fonte salvo
  useEffect(() => {
    try {
      const savedFontSize = localStorage.getItem("reader-font-size")
      if (savedFontSize) {
        const parsedSize = Number(savedFontSize)
        if (!isNaN(parsedSize) && parsedSize >= MIN_FONT_SIZE && parsedSize <= MAX_FONT_SIZE) {
          setFontSize(parsedSize)
          console.log("Loaded font size:", parsedSize)
        }
      }
    } catch (error) {
      console.error("Error loading font size:", error)
    }
  }, [])

  // Salvar tamanho da fonte quando mudar
  useEffect(() => {
    try {
      localStorage.setItem("reader-font-size", fontSize.toString())
      console.log("Saved font size:", fontSize)

      // Forçar atualização do estilo no DOM
      const contentElement = document.getElementById(contentId)
      if (contentElement) {
        contentElement.style.fontSize = `${fontSize}px`
      }
    } catch (error) {
      console.error("Error saving font size:", error)
    }
  }, [fontSize, contentId])

  const increaseFontSize = () => {
    const newSize = Math.min(fontSize + 1, MAX_FONT_SIZE)
    console.log("Increasing font size to:", newSize)
    setFontSize(newSize)
  }

  const decreaseFontSize = () => {
    const newSize = Math.max(fontSize - 1, MIN_FONT_SIZE)
    console.log("Decreasing font size to:", newSize)
    setFontSize(newSize)
  }

  const handleSliderChange = (value: number[]) => {
    console.log("Slider changed to:", value[0])
    setFontSize(value[0])
  }

  const setFontSizePreset = (size: number) => {
    console.log("Setting font preset to:", size)
    setFontSize(size)
  }

  return (
    <>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Type className="h-[1.2rem] w-[1.2rem]" />
            <span className="absolute -bottom-1 -right-1 text-[10px] font-bold bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center">
              {fontSize}
            </span>
            <span className="sr-only">Ajustar tamanho da fonte</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="space-y-4 p-2">
            <h4 className="font-medium text-center">Tamanho da Fonte</h4>
            <div className="flex items-center justify-between">
              <Button variant="outline" size="icon" onClick={decreaseFontSize} disabled={fontSize <= MIN_FONT_SIZE}>
                <Minus className="h-4 w-4" />
              </Button>
              <div className="flex-1 mx-4">
                <Slider
                  value={[fontSize]}
                  min={MIN_FONT_SIZE}
                  max={MAX_FONT_SIZE}
                  step={1}
                  onValueChange={handleSliderChange}
                />
              </div>
              <Button variant="outline" size="icon" onClick={increaseFontSize} disabled={fontSize >= MAX_FONT_SIZE}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="text-center text-sm text-muted-foreground">{fontSize}px</div>
            <div className="flex justify-between">
              <Button variant="outline" size="sm" onClick={() => setFontSizePreset(MIN_FONT_SIZE)}>
                Pequeno
              </Button>
              <Button variant="outline" size="sm" onClick={() => setFontSizePreset(DEFAULT_FONT_SIZE)}>
                Médio
              </Button>
              <Button variant="outline" size="sm" onClick={() => setFontSizePreset(MAX_FONT_SIZE)}>
                Grande
              </Button>
            </div>
            <div className="text-center text-sm">
              <p style={{ fontSize: `${MIN_FONT_SIZE}px` }}>Texto pequeno</p>
              <p style={{ fontSize: `${DEFAULT_FONT_SIZE}px` }}>Texto médio</p>
              <p style={{ fontSize: `${MAX_FONT_SIZE}px` }}>Texto grande</p>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Controles móveis */}
      <div className="flex items-center gap-2 md:hidden">
        <Button variant="outline" size="icon" onClick={decreaseFontSize} disabled={fontSize <= MIN_FONT_SIZE}>
          <Minus className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium">{fontSize}px</span>
        <Button variant="outline" size="icon" onClick={increaseFontSize} disabled={fontSize >= MAX_FONT_SIZE}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </>
  )
}

