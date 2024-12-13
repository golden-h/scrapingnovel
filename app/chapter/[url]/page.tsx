'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { ChapterContent } from '@/components/ChapterContent'
import { Loader2 } from 'lucide-react'

export default function ChapterPage() {
  const params = useParams()
  const [content, setContent] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchContent = async () => {
      if (!params.url) return

      try {
        const decodedUrl = decodeURIComponent(params.url)
        
        // Extract book ID and chapter ID from URL
        const urlObj = new URL(decodedUrl)
        const bookId = urlObj.pathname.split('/')[2] // Get ID after /book/
        const chapterId = urlObj.pathname.split('/')[3]?.replace('.html', '') // Get the chapter number
        
        console.log('Extracted IDs:', { bookId, chapterId })
        
        if (!bookId || !chapterId) {
          setError('Invalid chapter URL')
          setIsLoading(false)
          return
        }

        const formattedChapterId = `chapter-${chapterId}`
        
        try {
          // First try to get content from storage
          const storageResponse = await fetch(`/api/books/${bookId}/chapters/${formattedChapterId}`)
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
              bookId,
              chapterId: formattedChapterId
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
      <ChapterContent 
        content={content}
        url={decodeURIComponent(params.url)}
      />
    </div>
  )
}
