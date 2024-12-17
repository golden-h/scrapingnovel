import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Check, Copy, Loader2, Languages } from "lucide-react"
import { title } from "process"
import { useState, useEffect } from "react"
import { googleGenerativeService } from "@/app/services/googleGenerative"

interface ChapterContentProps {
  content: string
  url: string
  bookId: string
  title: string
}

export function ChapterContent({ content, url, bookId, title }: ChapterContentProps) {
  const [translatedContent, setTranslatedContent] = useState("")
  const [translatedTitle, setTranslatedTitle] = useState("")
  const [isTranslating, setIsTranslating] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    loadTranslation()
  }, [url, bookId])

  const loadTranslation = async () => {
    try {
      const response = await fetch(`/api/translation?url=${encodeURIComponent(url)}&bookId=${bookId}`)
      const data = await response.json()
      
      if (response.ok && data) {
        setTranslatedContent(data.content || "")
        setTranslatedTitle(data.title || "")
      }
    } catch (error) {
      console.error("Error loading translation:", error)
    }
  }

  const handleGoogleTranslate = async () => {
    if (!content || !title) return
    
    setIsTranslating(true)
    setError("")
    
    try {
      // Translate title first (usually small, no need for chunks)
      const translatedTitleText = await googleGenerativeService.translate(title, 500);
      
      // Extract text after ":" from translated title
      const titleParts = translatedTitleText.split(':');
      const cleanTitle = titleParts.length > 1 
        ? titleParts[1].trim() 
        : translatedTitleText.trim();
      
      setTranslatedTitle(cleanTitle);
      
      // Translate content in chunks
      const translatedContentText = await googleGenerativeService.translate(content);
      setTranslatedContent(translatedContentText)
      
      // Save translation
      await fetch("/api/translation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          url, 
          bookId,
          translation: translatedContentText,
          title: cleanTitle
        }),
      })
    } catch (error) {
      console.error("Error translating with Google API:", error)
      setError("Failed to translate using Google API. Please try again.")
    } finally {
      setIsTranslating(false)
    }
  }

  const handleCopy = async () => {
    if (!translatedContent) return

    try {
      await navigator.clipboard.writeText(translatedContent)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (error) {
      console.error("Error copying translation:", error)
      setError("Failed to copy translation")
    }
  }

  const handleTranslationChange = async (newTranslation: string) => {
    setTranslatedContent(newTranslation)
    try {
      await fetch("/api/translation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          url, 
          bookId,
          translation: newTranslation,
          title: translatedTitle
        }),
      })
    } catch (error) {
      console.error("Error saving translation:", error)
      setError("Failed to save translation")
    }
  }

  const handleTitleChange = async (newTitle: string) => {
    setTranslatedTitle(newTitle)
    try {
      await fetch("/api/translation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          url, 
          bookId,
          translation: translatedContent,
          title: newTitle
        }),
      })
    } catch (error) {
      console.error("Error saving title:", error)
      setError("Failed to save title")
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <Button
          onClick={handleGoogleTranslate}
          disabled={!content || isTranslating}
          variant="secondary"
          className="w-[200px]"
        >
          {isTranslating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Translating...
            </>
          ) : (
            <>
              <Languages className="mr-2 h-4 w-4" />
              Translate with Google
            </>
          )}
        </Button>

        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}
      </div>

      <Card className="p-4">
        {/* Translated Content */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Translated Content</h2>
          <Button
            variant="outline"
            size="icon"
            onClick={handleCopy}
            disabled={!translatedContent}
          >
            {isCopied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        {/* Title Input */}
        <div className="mb-4">
          <h3 className="text-sm font-medium mb-2">Title</h3>
          <Textarea
            value={translatedTitle}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="min-h-[60px]"
            placeholder="Enter chapter title..."
          />
        </div>

        {/* Content Input */}
        <div>
          <h3 className="text-sm font-medium mb-2">Content</h3>
          <Textarea
            value={translatedContent}
            onChange={(e) => handleTranslationChange(e.target.value)}
            className="min-h-[200px]"
            placeholder="Paste translated content here..."
          />
        </div>

        {error && (
          <p className="text-sm text-red-500 mt-2">{error}</p>
        )}
      </Card>
      {/* Original Content */}
      <Card className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Original Content</h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                navigator.clipboard.writeText(content);
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 2000);
              }}
            >
              {isCopied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
            
          </div>
        </div>        
        <div className="original-title whitespace-pre-wrap border rounded-md p-3 bg-gray-50">
            {title || 'No title available'}
        </div>
        <div className="original-content whitespace-pre-wrap border rounded-md p-3 bg-gray-50">
          {content}
        </div>
      </Card>
    </div>
  )
}
