import { NextResponse } from 'next/server'
import { BookStorage } from '@/app/services/storage/bookStorage'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const storage = new BookStorage()
    const [bookId, chapterId] = params.id.split('--')
    const status = await storage.getChapterStatus(bookId, chapterId)
    
    if (!status) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 })
    }

    return NextResponse.json(status)
  } catch (error) {
    console.error('Error getting chapter status:', error)
    return NextResponse.json(
      { error: 'Failed to get chapter status' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { done } = await request.json()
    const storage = new BookStorage()
    const [bookId, chapterId] = params.id.split('--')
    
    console.log('Updating chapter status:', { bookId, chapterId, done })
    
    const success = await storage.updateChapterStatus(bookId, chapterId, { done })
    
    if (!success) {
      return NextResponse.json({ error: 'Failed to update chapter status' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating chapter status:', error)
    return NextResponse.json(
      { error: 'Failed to update chapter status' },
      { status: 500 }
    )
  }
}