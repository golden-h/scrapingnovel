'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

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
      
      <div className="grid gap-4">
        {book.chapters.map((chapter, index) => (
          <div key={chapter.id} className="flex items-center gap-2">
            <Link 
              href={`/chapter/${encodeURIComponent(chapter.url)}`}
              className="flex-grow"
            >
              <Card className="p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Chapter {index + 1}</div>
                    <div className="text-sm text-gray-600 mt-1">{chapter.title}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {chapter.translated && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full whitespace-nowrap">Translated</span>
                    )}
                    {chapter.done && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full whitespace-nowrap">Done</span>
                    )}
                  </div>
                </div>
              </Card>
            </Link>
            {/* <Button
              variant="outline"
              size="sm"
              onClick={() => handleMarkAsDone(chapter.id)}
              disabled={chapter.done}
            >
              {chapter.done ? 'Done' : 'Mark Done'}
            </Button> */}
          </div>
        ))}
      </div>
    </div>
  )
}
