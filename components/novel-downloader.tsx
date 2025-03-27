"use client"

import { useState } from "react"
import { Download, Check, AlertCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import JSZip from "jszip"

interface NovelDownloaderProps {
  novelId: string
  novelTitle: string
  chapters: string[]
  onComplete?: () => void
}

export function NovelDownloader({ novelId, novelTitle, chapters, onComplete }: NovelDownloaderProps) {
  const [isDownloading, setIsDownloading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const downloadNovel = async () => {
    if (chapters.length === 0) {
      setError("Esta novel não possui capítulos para download.")
      return
    }

    setIsDownloading(true)
    setProgress(0)
    setStatus("Iniciando download...")
    setError(null)
    setSuccess(false)

    try {
      // Criar uma nova instância do JSZip para cada download
      const zip = new JSZip()

      // Limpar qualquer cache ou estado anterior
      zip.remove("mimetype")
      zip.remove("META-INF")
      zip.remove("META-INF/container.xml")
      zip.remove("OEBPS")

      // IMPORTANTE: A ordem dos arquivos é crucial para um EPUB válido
      // 1. Primeiro arquivo DEVE ser mimetype sem compressão
      zip.file("mimetype", "application/epub+zip", { compression: "STORE" })

      // 2. Adicionar a estrutura de diretórios do EPUB
      // Criar pasta META-INF e adicionar container.xml com o caminho correto
      const metaInf = zip.folder("META-INF")

      // Definir explicitamente o caminho correto no container.xml
      const containerXml =
        '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">\n' +
        "  <rootfiles>\n" +
        '    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>\n' +
        "  </rootfiles>\n" +
        "</container>"

      metaInf?.file("container.xml", containerXml, { compression: "STORE" })

      // Verificar se o container.xml foi adicionado corretamente
      console.log("Container XML adicionado:", containerXml)

      // 3. Criar pasta OEBPS para conteúdo
      const oebps = zip.folder("OEBPS")

      // Adicionar CSS básico
      oebps?.file(
        "style.css",
        `body { font-family: serif; margin: 5%; line-height: 1.6; }
         h1, h2, h3 { text-align: center; }
         .chapter { page-break-after: always; }
         img { max-width: 100%; }`,
      )

      // Buscar informações da novel
      setStatus("Obtendo informações da novel...")
      setProgress(5)

      const novelResponse = await fetch(`/api/novels/${novelId}`)
      if (!novelResponse.ok) throw new Error("Falha ao obter informações da novel")

      const novelData = await novelResponse.json()
      const title = novelData.nome || novelTitle
      const description = novelData.desc || ""
      const coverUrl = novelData.cover || ""

      setProgress(10)

      // Adicionar capa se disponível
      let coverFilename = ""
      if (coverUrl && !coverUrl.includes("placeholder")) {
        setStatus("Baixando capa...")
        try {
          const coverResponse = await fetch(coverUrl)
          if (coverResponse.ok) {
            const coverBlob = await coverResponse.blob()
            coverFilename = "cover.jpg"
            oebps?.file(coverFilename, coverBlob)
          }
        } catch (e) {
          console.warn("Não foi possível baixar a capa:", e)
        }
      }

      // Baixar todos os capítulos (até 4 simultaneamente)
      setStatus("Baixando capítulos...")

      const chapterFiles = []
      const totalChapters = chapters.length

      // Função para baixar um único capítulo
      const downloadChapter = async (chapterId: string, index: number) => {
        try {
          const response = await fetch(`/api/chapters/${chapterId}`)
          if (!response.ok) throw new Error(`Falha ao baixar capítulo ${index + 1}`)

          const chapterData = await response.json()
          const chapterTitle = chapterData.title || `Capítulo ${index + 1}`
          const chapterContent = chapterData.content || "<p>Conteúdo não disponível</p>"

          // Criar arquivo HTML para o capítulo
          const chapterFilename = `chapter_${index + 1}.html`
          const chapterHtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>${chapterTitle}</title>
  <link rel="stylesheet" type="text/css" href="style.css" />
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
</head>
<body>
  <div class="chapter">
    <h2>${chapterTitle}</h2>
    ${chapterContent}
  </div>
</body>
</html>`

          oebps?.file(chapterFilename, chapterHtml)
          return {
            id: chapterId,
            filename: chapterFilename,
            title: chapterTitle,
            index,
          }
        } catch (e) {
          console.warn(`Erro ao baixar capítulo ${index + 1}:`, e)
          return null
        }
      }

      // Baixar capítulos em grupos de 4
      let downloadedCount = 0
      const maxConcurrent = 4
      const chapterGroups = []

      // Dividir capítulos em grupos para download paralelo
      for (let i = 0; i < totalChapters; i += maxConcurrent) {
        chapterGroups.push(chapters.slice(i, i + maxConcurrent))
      }

      // Baixar cada grupo sequencialmente, mas os capítulos dentro do grupo em paralelo
      for (let groupIndex = 0; groupIndex < chapterGroups.length; groupIndex++) {
        const group = chapterGroups[groupIndex]

        setStatus(`Baixando grupo ${groupIndex + 1} de ${chapterGroups.length}...`)

        const chapterPromises = group.map((chapterId, idx) => {
          const globalIndex = groupIndex * maxConcurrent + idx
          return downloadChapter(chapterId, globalIndex)
        })

        const results = await Promise.all(chapterPromises)

        // Adicionar resultados válidos à lista de capítulos
        results.forEach((result) => {
          if (result) {
            chapterFiles.push(result)
            downloadedCount++

            // Atualizar progresso
            const downloadProgress = 10 + Math.floor((downloadedCount / totalChapters) * 70)
            setProgress(downloadProgress)
            setStatus(`Baixados ${downloadedCount} de ${totalChapters} capítulos...`)
          }
        })
      }

      // Ordenar capítulos pelo índice para garantir a ordem correta
      chapterFiles.sort((a, b) => a.index - b.index)

      // Criar arquivo OPF (metadados e manifesto)
      setStatus("Gerando arquivo EPUB...")
      setProgress(80)

      const uuid = `urn:uuid:${crypto.randomUUID()}`
      const date = new Date().toISOString().split("T")[0]

      let opfContent = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookID" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
    <dc:title>${escapeXml(title)}</dc:title>
    <dc:language>pt</dc:language>
    <dc:identifier id="BookID">${uuid}</dc:identifier>
    <dc:date>${date}</dc:date>
    <dc:description>${escapeXml(description)}</dc:description>
    <meta property="dcterms:modified">${new Date().toISOString()}</meta>
  </metadata>
  <manifest>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml" />
    <item id="css" href="style.css" media-type="text/css" />`

      // Adicionar capa ao manifesto se existir
      if (coverFilename) {
        opfContent += `
    <item id="cover-image" href="${coverFilename}" media-type="image/jpeg" properties="cover-image" />`
      }

      // Adicionar capítulos ao manifesto
      chapterFiles.forEach((chapter, index) => {
        opfContent += `
    <item id="chapter${index + 1}" href="${chapter.filename}" media-type="application/xhtml+xml" />`
      })

      opfContent += `
  </manifest>
  <spine toc="ncx">`

      // Adicionar capítulos ao spine
      chapterFiles.forEach((chapter, index) => {
        opfContent += `
    <itemref idref="chapter${index + 1}" />`
      })

      opfContent += `
  </spine>
  <guide>`

      // Adicionar primeiro capítulo como início do texto
      if (chapterFiles.length > 0) {
        opfContent += `
    <reference type="text" title="Início do Texto" href="${chapterFiles[0].filename}" />`
      }

      opfContent += `
  </guide>
</package>`

      oebps?.file("content.opf", opfContent)

      // Criar arquivo NCX (navegação)
      let ncxContent = `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="${uuid}" />
    <meta name="dtb:depth" content="1" />
    <meta name="dtb:totalPageCount" content="0" />
    <meta name="dtb:maxPageNumber" content="0" />
  </head>
  <docTitle>
    <text>${escapeXml(title)}</text>
  </docTitle>
  <navMap>`

      // Adicionar capítulos à navegação
      chapterFiles.forEach((chapter, index) => {
        ncxContent += `
    <navPoint id="navPoint-${index + 1}" playOrder="${index + 1}">
      <navLabel>
        <text>${escapeXml(chapter.title)}</text>
      </navLabel>
      <content src="${chapter.filename}" />
    </navPoint>`
      })

      ncxContent += `
  </navMap>
</ncx>`

      oebps?.file("toc.ncx", ncxContent)

      // Gerar o arquivo EPUB
      setProgress(90)
      setStatus("Finalizando arquivo EPUB...")

      // Verificar a estrutura do ZIP antes de gerar
      console.log("Estrutura do EPUB:", zip.files)

      const epubBlob = await zip.generateAsync(
        {
          type: "blob",
          compression: "DEFLATE",
          compressionOptions: { level: 9 },
          // Garantir que o mimetype seja o primeiro arquivo
          streamFiles: true,
        },
        (metadata) => {
          // Atualizar progresso durante a compressão
          const compressionProgress = 90 + Math.floor(metadata.percent / 10)
          setProgress(Math.min(compressionProgress, 99))
        },
      )

      // Criar link de download
      setProgress(100)
      setStatus("Download concluído!")

      const downloadUrl = URL.createObjectURL(epubBlob)
      const a = document.createElement("a")
      a.href = downloadUrl
      a.download = `${title.replace(/[^\w\s]/gi, "")}.epub`.replace(/\s+/g, "_")
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)

      setSuccess(true)

      // Limpar URL do objeto após o download
      setTimeout(() => {
        URL.revokeObjectURL(downloadUrl)
        if (onComplete) onComplete()
      }, 2000)
    } catch (err) {
      console.error("Erro ao baixar novel:", err)
      setError(`Falha ao baixar a novel: ${err instanceof Error ? err.message : "Erro desconhecido"}`)
      setProgress(0)
    }
  }

  // Função para escapar caracteres especiais em XML
  function escapeXml(unsafe: string): string {
    return unsafe.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case "<":
          return "&lt;"
        case ">":
          return "&gt;"
        case "&":
          return "&amp;"
        case "'":
          return "&apos;"
        case '"':
          return "&quot;"
        default:
          return c
      }
    })
  }

  return (
    <>
      <Button
        variant="outline"
        className="flex items-center gap-2"
        onClick={downloadNovel}
        disabled={isDownloading || chapters.length === 0}
      >
        <Download className="h-4 w-4" />
        Download All
      </Button>

      {isDownloading && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
          <div className="bg-card border rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Baixando Novel</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsDownloading(false)}
                disabled={!error && !success && progress > 0 && progress < 100}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">{novelTitle}</span>
                <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
              </div>

              <Progress value={progress} className="h-2" />

              <p className="text-sm text-muted-foreground">{status}</p>

              {success && (
                <div className="flex items-center text-green-500 mt-2">
                  <Check className="h-4 w-4 mr-2" />
                  <span className="text-sm">Download concluído com sucesso!</span>
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
                  onClick={() => setIsDownloading(false)}
                  disabled={!success && !error && progress < 100}
                >
                  {success || error ? "Fechar" : "Cancelar"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

