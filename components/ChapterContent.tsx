import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Check, Copy, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"

interface ChapterContentProps {
  content: string
  url: string
  bookId: string
}

export function ChapterContent({ content, url, bookId }: ChapterContentProps) {
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

  const handleTranslate = async () => {
    if (!content) return
    
    setIsTranslating(true)
    try {
      // Send content to chrome extension via chrome.runtime
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.sendMessage({
          type: 'SET_TRANSLATION_CONTENT',
          content: content
        });
      } else {
        // Fallback to clipboard if extension not available
        await navigator.clipboard.writeText(content)
      }
      window.open("https://chat.openai.com/g/g-6749b358a57c8191a95344323c84c1e1-dich-truyen-tieng-trung-do-thi", "_blank")
    } catch (error) {
      console.error("Error setting content for translation:", error)
      setError("Failed to prepare content for translation")
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
    <div className="space-y-6">
      {/* Original Content */}
      <Card className="p-6">
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
            <Button
              onClick={handleTranslate}
              disabled={isTranslating}
            >
              {isTranslating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Opening ChatGPT...
                </>
              ) : (
                "Translate"
              )}
            </Button>
          </div>
        </div>
        <div className="original-content whitespace-pre-wrap border rounded-md p-3 bg-gray-50">
          {content}
        </div>
      </Card>

      {/* Translated Content */}
      <Card className="p-6">
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
          <div className="text-red-500 mt-4">{error}</div>
        )}
      </Card>
    </div>
  )
}
