import { NextResponse } from 'next/server'
import { BookStorage } from '@/app/services/storage/bookStorage'

export async function GET(
    request: Request,
    { params }: { params: { id: string; chapterId: string } }
) {
    try {
        const storage = new BookStorage()
        const hasContent = await storage.hasChapterContent(params.id, params.chapterId)
        return NextResponse.json({ hasContent })
    } catch (error) {
        console.error('Error checking chapter content status:', error)
        return NextResponse.json({ 
            error: error instanceof Error ? error.message : 'An unexpected error occurred',
            hasContent: false
        }, { status: 500 })
    }
}
