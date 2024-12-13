import { NextResponse } from 'next/server'
import { BookStorage } from '@/app/services/storage/bookStorage'

export async function GET(
    request: Request,
    { params }: { params: { id: string; chapterId: string } }
) {
    try {
        const storage = new BookStorage()
        const content = await storage.getChapterContent(params.id, params.chapterId)
        
        if (!content) {
            return NextResponse.json({ error: 'Chapter content not found' }, { status: 404 })
        }

        return NextResponse.json({ content })
    } catch (error) {
        console.error('Error getting chapter content:', error)
        return NextResponse.json({ 
            error: error instanceof Error ? error.message : 'An unexpected error occurred' 
        }, { status: 500 })
    }
}
