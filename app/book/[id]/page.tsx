'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { Card } from "@/components/ui/card"

interface Chapter {
  id: string
  title: string
  url: string
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
      
      <div className="grid gap-4">
        {book.chapters.map((chapter, index) => (
          <Link 
            key={chapter.id} 
            href={`/chapter/${encodeURIComponent(chapter.url)}`}
          >
            <Card className="p-4 hover:bg-gray-50 transition-colors cursor-pointer">
              <div className="font-medium">Chapter {index + 1}</div>
              <div className="text-sm text-gray-600 mt-1">{chapter.title}</div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
