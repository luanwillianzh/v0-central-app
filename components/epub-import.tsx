"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Upload, Check, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useDb } from "@/lib/db-context"

export function EpubImport() {
  const { importEpub } = useDb()
  const [isImporting, setIsImporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [fileName, setFileName] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const file = files[0]

    // Check if the file is an EPUB
    if (!file.name.toLowerCase().endsWith(".epub")) {
      setError("O arquivo selecionado não é um EPUB válido.")
      return
    }

    setFileName(file.name)
    setIsImporting(true)
    setProgress(0)
    setStatus("Carregando arquivo...")
    setError(null)
    setSuccess(false)

    try {
      // Simulate progress for loading
      setProgress(10)
      setStatus("Analisando EPUB...")

      setTimeout(() => {
        setProgress(20)
        setStatus("Extraindo metadados...")
      }, 500)

      setTimeout(() => {
        setProgress(30)
        setStatus("Convertendo capítulos para HTML...")
      }, 1000)

      // Import the EPUB
      const book = await importEpub(file)

      setProgress(90)
      setStatus("Finalizando importação...")

      setTimeout(() => {
        setProgress(100)
        setStatus("Importação concluída!")
        setSuccess(true)

        // Reset the file input
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }

        // Reset the state after a delay
        setTimeout(() => {
          setIsImporting(false)
          setProgress(0)
          setStatus("")
          setFileName("")
        }, 2000)
      }, 500)
    } catch (err) {
      console.error("Import error:", err)
      setError(`Falha ao importar o arquivo EPUB: ${err instanceof Error ? err.message : "Erro desconhecido"}`)
      setProgress(0)
    }
  }

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  return (
    <div>
      <input ref={fileInputRef} type="file" accept=".epub" onChange={handleFileChange} className="hidden" />

      <Button variant="outline" className="flex items-center gap-2" onClick={triggerFileInput} disabled={isImporting}>
        <Upload className="h-4 w-4" />
        Importar EPUB
      </Button>

      {isImporting && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
          <div className="bg-card border rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Importando EPUB</h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm truncate max-w-[200px]">{fileName}</span>
                <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
              </div>

              <div className="w-full bg-secondary rounded-full h-2.5">
                <div
                  className="bg-primary h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>

              <p className="text-sm text-muted-foreground">{status}</p>

              {success && (
                <div className="flex items-center text-green-500 mt-2">
                  <Check className="h-4 w-4 mr-2" />
                  <span className="text-sm">Importado com sucesso!</span>
                </div>
              )}

              {error && (
                <div className="flex items-center text-red-500 mt-2">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsImporting(false)
                    setProgress(0)
                    setStatus("")
                    setFileName("")
                    setError(null)
                    setSuccess(false)
                  }}
                  disabled={!success && !error && progress < 100}
                >
                  {success || error ? "Fechar" : "Cancelar"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

