/*
 * Copyright (c) 2024 Quy Quàng AI Coder
 * Contact: huyhoang270@gmail.com
 * 
 * Disclaimer: This is a free application for research and learning purposes only.
 * The author is not responsible for any legal or copyright issues related to its use.
 */

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Book, Loader2, CheckCircle2, Circle, Trash2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from 'next/link'
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

interface Chapter {
  id: string;
  title: string;
  url: string;
  isLoading?: boolean;
  hasContent?: boolean;
  error?: string;
}

interface Book {
  id: string;
  url: string;
  title: string;
  chapters: Chapter[];
  lastUpdated: string;
}

export default function Home() {
  const [url, setUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [books, setBooks] = useState<Book[]>([])
  const [selectedSource, setSelectedSource] = useState('uukanshu')

  useEffect(() => {
    // Load saved books on mount
    fetchSavedBooks()
  }, [])

  const fetchSavedBooks = async () => {
    try {
      const response = await fetch('/api/books')
      if (response.ok) {
        const data = await response.json()
        setBooks(data.books)
      }
    } catch (error) {
      console.error('Error loading books:', error)
    }
  }

  const extractChapters = async () => {
    if (!url) {
      setError('Please enter a URL')
      return
    }

    // Check if a book with this URL already exists
    const existingBook = books.find(book => book.url === url)
    if (existingBook) {
      setError('This book has already been added')
      return
    }

    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/chapters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      })
      
      const data = await response.json()

      if (response.ok) {
        // Refresh book list after extraction
        await fetchSavedBooks()
        setUrl('')
        
        // Get the newly added book
        const newBook = await fetch(`/api/books/${data.id}`).then(res => res.json())
        if (newBook?.book) {
          // Start loading all chapters automatically
          loadAllChapters(newBook.book)
        }
      } else {
        setError(data.error || 'Failed to extract chapters')
      }
    } catch (error) {
      setError(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
    setIsLoading(false)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const deleteBook = async (bookId: string) => {
    if (!confirm('Are you sure you want to delete this book? This action cannot be undone.')) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/books/${bookId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // Remove the book from local state
        setBooks(books.filter(book => book.id !== bookId))
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to delete book')
      }
    } catch (error) {
      setError(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
    setIsLoading(false)
  }

  const loadChapterContent = async (bookId: string, chapter: Chapter) => {
    // Skip if already loading or has content
    if (chapter.isLoading || chapter.hasContent) return;

    // Update chapter loading state
    setBooks(prevBooks => prevBooks.map(book => {
      if (book.id === bookId) {
        return {
          ...book,
          chapters: book.chapters.map(ch => 
            ch.id === chapter.id 
              ? { ...ch, isLoading: true, error: undefined }
              : ch
          )
        }
      }
      return book
    }))

    try {
      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          url: chapter.url,
          domain: selectedSource === 'uukanshu' ? 'uukanshu.cc' : '',
          bookId,
          chapterId: chapter.id
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to load chapter content')
      }

      // Update chapter state with content loaded
      setBooks(prevBooks => prevBooks.map(book => {
        if (book.id === bookId) {
          return {
            ...book,
            chapters: book.chapters.map(ch => 
              ch.id === chapter.id 
                ? { ...ch, isLoading: false, hasContent: true }
                : ch
            )
          }
        }
        return book
      }))
    } catch (error) {
      // Update chapter state with error
      setBooks(prevBooks => prevBooks.map(book => {
        if (book.id === bookId) {
          return {
            ...book,
            chapters: book.chapters.map(ch => 
              ch.id === chapter.id 
                ? { 
                    ...ch, 
                    isLoading: false, 
                    error: error instanceof Error ? error.message : 'Failed to load content'
                  }
                : ch
            )
          }
        }
        return book
      }))
    }
  }

  const loadAllChapters = async (book: Book) => {
    for (const chapter of book.chapters) {
      await loadChapterContent(book.id, chapter)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="container mx-auto px-4">
        <Card className="bg-white dark:bg-gray-800 shadow-lg mb-8">
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-2">
              <Book className="h-6 w-6 text-primary" />
              <CardTitle className="text-2xl">Truyencity Auto Tool</CardTitle>
            </div>
            <CardDescription>Extract and save novels from chinese websites</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <RadioGroup
                value={selectedSource}
                onValueChange={setSelectedSource}
                className="flex space-x-4 mb-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="uukanshu" id="uukanshu" />
                  <Label htmlFor="uukanshu">uukanshu.cc</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="comingsoon" id="comingsoon" disabled />
                  <Label htmlFor="comingsoon" className="text-gray-500">Coming Soon</Label>
                </div>
              </RadioGroup>

              <div className="flex gap-2">
                <Input
                  placeholder="Enter novel URL"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={isLoading}
                />
                <Button onClick={extractChapters} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading
                    </>
                  ) : (
                    'Get Chapters'
                  )}
                </Button>
              </div>

              {error && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        {books.length > 0 && (
          <Card className="bg-white dark:bg-gray-800 shadow-lg mb-8">
            <CardHeader>
              <CardTitle>Saved Books</CardTitle>
              <CardDescription>{books.length} books found</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {books.map((book) => (
                  <Card key={book.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-xl">{book.title}</CardTitle>
                          <CardDescription>
                            {book.chapters.length} chapters | Last updated: {formatDate(book.lastUpdated)}
                          </CardDescription>
                          <div className="mt-2 text-sm text-gray-500">
                            Progress: {book.chapters.filter(ch => ch.hasContent).length} / {book.chapters.length} chapters loaded
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            onClick={() => loadAllChapters(book)}
                            disabled={book.chapters.every(ch => ch.hasContent)}
                          >
                            {book.chapters.some(ch => ch.isLoading) ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Loading...
                              </>
                            ) : (
                              'Load All'
                            )}
                          </Button>
                          <Link href={`/book/${book.id}`}>
                            <Button>View Book</Button>
                          </Link>
                          <Button 
                            variant="destructive"
                            size="icon"
                            onClick={() => deleteBook(book.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    {/* <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {book.chapters.slice(0, 8).map((chapter) => (
                          <div 
                            key={chapter.id}
                            className="flex items-center gap-2 text-sm p-2 rounded-md border"
                          >
                            {chapter.isLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : chapter.hasContent ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : chapter.error ? (
                              <AlertCircle className="h-4 w-4 text-red-500" />
                            ) : (
                              <Circle className="h-4 w-4" />
                            )}
                            <span className="truncate">{chapter.title}</span>
                          </div>
                        ))}
                        {book.chapters.length > 8 && (
                          <div className="flex items-center justify-center p-2 rounded-md border">
                            +{book.chapters.length - 8} more
                          </div>
                        )}
                      </div>
                    </CardContent> */}
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      <footer className="mt-8 text-center text-sm text-gray-500 pb-4">
        <p> 2024 Quy Quàng AI Coder</p>
        <p>Contact: huyhoang270@gmail.com</p>
        <p className="mt-2">Disclaimer: This is a free application for research and learning purposes only.<br/>
        The author is not responsible for any legal or copyright issues related to its use.</p>
      </footer>
    </main>
  )
}
