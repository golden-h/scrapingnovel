'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ChapterContent } from '@/components/ChapterContent'
import { Loader2, ArrowLeft } from 'lucide-react'
import { Button } from "@/components/ui/button"

export default function ChapterPage() {
  const params = useParams()
  const router = useRouter()
  const [content, setContent] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [bookId, setBookId] = useState('')
  const [chapterId, setChapterId] = useState('')
  const [isDone, setIsDone] = useState(false)
  const [chapterTitle, setChapterTitle] = useState('')

  useEffect(() => {
    const fetchContent = async () => {
      if (!params.url) return

      try {
        const decodedUrl = decodeURIComponent(params.url)
        
        // Extract book ID and chapter ID from URL
        const urlObj = new URL(decodedUrl)
        const extractedBookId = urlObj.pathname.split('/')[2] // Get ID after /book/
        const rawChapterId = `chapter-${urlObj.pathname.split('/')[3]?.replace('.html', '')}` // Add 'chapter-' prefix
        
        console.log('Extracted IDs:', { bookId: extractedBookId, rawChapterId })
        
        if (!extractedBookId || !rawChapterId) {
          setError('Invalid chapter URL')
          setIsLoading(false)
          return
        }

        setBookId(extractedBookId)
        setChapterId(rawChapterId)
        
        try {
          // First get book data to get chapter title
          const bookResponse = await fetch(`/api/books/${extractedBookId}`)
          if (bookResponse.ok) {
            const bookData = await bookResponse.json()
            const chapter = bookData.book.chapters.find(c => c.id === rawChapterId)
            if (chapter) {
              setChapterTitle(chapter.title)
            }
          }
          
          // Then try to get content from storage
          const storageResponse = await fetch(`/api/books/${extractedBookId}/chapters/${rawChapterId}`)
          console.log('Storage response:', storageResponse.status)
          
          if (storageResponse.ok) {
            const data = await storageResponse.json()
            if (data.content) {
              console.log('Found content in storage')
              setContent(data.content)
              setIsLoading(false)
              return
            }
          }
          
          console.log('Content not found in storage, fetching from website')

          // If not in storage, extract from website
          const response = await fetch('/api/extract', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              url: decodedUrl,
              domain: 'uukanshu.cc',
              bookId: extractedBookId,
              chapterId: rawChapterId
            }),
          })

          if (!response.ok) {
            throw new Error('Failed to fetch chapter content')
          }

          const data = await response.json()
          setContent(data.content)
        } catch (err) {
          setError('Failed to load chapter content')
          console.error(err)
        } finally {
          setIsLoading(false)
        }
      } catch (err) {
        setError('Failed to load chapter content')
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchContent()
  }, [params.url])

  const handleMarkAsDone = async () => {
    try {
      if (!bookId || !chapterId) return
      
      const response = await fetch(`/api/chapters/${bookId}--${chapterId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ done: true }),
      })

      if (!response.ok) {
        throw new Error('Failed to update chapter status')
      }

      setIsDone(true)
    } catch (err) {
      console.error('Failed to mark chapter as done:', err)
    }
  }

  useEffect(() => {
    const fetchStatus = async () => {
      if (!bookId || !chapterId) return
      
      try {
        const response = await fetch(`/api/chapters/${bookId}--${chapterId}/status`)
        if (response.ok) {
          const status = await response.json()
          setIsDone(!!status.done)
        }
      } catch (err) {
        console.error('Failed to fetch chapter status:', err)
      }
    }

    fetchStatus()
  }, [bookId, chapterId])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error || !content) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-red-500">{error || 'Chapter not found'}</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-4">
      <div className="mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/book/${bookId}`)}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Chapter List
        </Button>
      </div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          {isDone && (
            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Done</span>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleMarkAsDone}
          disabled={isDone}
        >
          {isDone ? 'Done' : 'Mark Done'}
        </Button>
      </div>
      <ChapterContent 
        content={content}
        url={decodeURIComponent(params.url)}
        bookId={bookId}
        title={chapterTitle}
      />
    </div>
  )
}
