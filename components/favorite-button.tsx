"use client"

import { Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useDb } from "@/lib/db-context"
import { useState, useEffect } from "react"

interface FavoriteButtonProps {
  novel: {
    id: string
    nome: string
    cover: string
  }
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
}

export function FavoriteButton({ novel, variant = "outline", size = "icon" }: FavoriteButtonProps) {
  const { isFavorite, addToFavorites, removeFromFavorites } = useDb()
  const [favorite, setFavorite] = useState(false)

  // Initialize favorite state once on mount
  useEffect(() => {
    setFavorite(isFavorite(novel.id))
  }, [novel.id, isFavorite])

  const toggleFavorite = () => {
    const newState = !favorite
    if (newState) {
      addToFavorites(novel)
    } else {
      removeFromFavorites(novel.id)
    }
    setFavorite(newState)
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        toggleFavorite()
      }}
      aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
      className={favorite ? "text-red-500 hover:text-red-600" : ""}
    >
      <Heart className={`h-[1.2rem] w-[1.2rem] ${favorite ? "fill-current" : ""}`} />
    </Button>
  )
}

