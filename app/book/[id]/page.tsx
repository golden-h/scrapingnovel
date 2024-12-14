'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChapterList } from "@/components/ChapterList"

interface Chapter {
  id: string
  title: string
  url: string
  translated?: boolean
  done?: boolean
}

interface Book {
  id: string
  title: string
  chapters: Chapter[]
}

export default function BookPage() {
  const params = useParams()
  const [book, setBook] = useState<Book | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null)

  const handleMarkAsDone = async (chapterId: string) => {
    try {
      const response = await fetch(`/api/chapters/${chapterId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ done: true }),
      })

      if (!response.ok) {
        throw new Error('Failed to update chapter status')
      }

      // Update the local state
      setBook(prevBook => {
        if (!prevBook) return null
        return {
          ...prevBook,
          chapters: prevBook.chapters.map(chapter =>
            chapter.id === chapterId ? { ...chapter, done: true } : chapter
          ),
        }
      })
    } catch (err) {
      console.error('Failed to mark chapter as done:', err)
    }
  }

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const response = await fetch(`/api/books/${params.id}`)
        if (!response.ok) {
          throw new Error('Failed to fetch book')
        }
        const data = await response.json()
        setBook(data.book) // Assuming the API returns { book: Book }
      } catch (err) {
        setError('Failed to load book')
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchBook()
  }, [params.id])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error || !book) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-red-500">{error || 'Book not found'}</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">{book.title}</h1>
      
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-gray-600">
          Total Chapters: {book.chapters.length}
        </div>
        <div className="text-sm text-gray-600">
          Translated: {book.chapters.filter(c => c.translated).length}
          {' | '}
          Done: {book.chapters.filter(c => c.done).length}
        </div>
      </div>
      
      <ChapterList 
        chapters={book.chapters}
        selectedChapter={selectedChapter}
        onChapterSelect={(chapterId) => {
          setSelectedChapter(chapterId);
          const chapter = book.chapters.find(c => c.id === chapterId);
          if (chapter) {
            window.location.href = `/chapter/${encodeURIComponent(chapter.url)}`;
          }
        }}
      />
    </div>
  )
}
