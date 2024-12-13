import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Check, Copy, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"

interface ChapterContentProps {
  content: string
  url: string
}

export function ChapterContent({ content, url }: ChapterContentProps) {
  const [translatedContent, setTranslatedContent] = useState("")
  const [isTranslating, setIsTranslating] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    loadTranslation()
  }, [url])

  const loadTranslation = async () => {
    try {
      const response = await fetch(`/api/translation?url=${encodeURIComponent(url)}`)
      const data = await response.json()
      
      if (response.ok && data.translation) {
        setTranslatedContent(data.translation)
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
        body: JSON.stringify({ url, translation: newTranslation }),
      })
    } catch (error) {
      console.error("Error saving translation:", error)
      setError("Failed to save translation")
    }
  }

  return (
    <div className="space-y-6">
      {/* Original Content */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Original Content</h2>
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
        
        <Textarea
          value={translatedContent}
          onChange={(e) => handleTranslationChange(e.target.value)}
          className="min-h-[200px]"
          placeholder="Paste translated content here..."
        />

        {error && (
          <div className="text-red-500 mt-4">{error}</div>
        )}
      </Card>
    </div>
  )
}
