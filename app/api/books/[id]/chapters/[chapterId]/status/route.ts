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

export async function PUT(
    request: Request,
    { params }: { params: { id: string; chapterId: string } }
) {
    try {
        const { translated } = await request.json()
        
        if (typeof translated !== 'boolean') {
            return NextResponse.json({ error: 'Translated status must be a boolean' }, { status: 400 })
        }

        const storage = new BookStorage()
        const result = await storage.updateChapterStatus(params.id, params.chapterId, { translated })
        
        if (!result) {
            return NextResponse.json({ error: 'Chapter not found' }, { status: 404 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error updating chapter translated status:', error)
        return NextResponse.json({ 
            error: error instanceof Error ? error.message : 'An unexpected error occurred' 
        }, { status: 500 })
    }
}
