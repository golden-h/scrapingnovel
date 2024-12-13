import { NextResponse } from 'next/server'
import { BookStorage } from '@/app/services/storage/bookStorage'

export async function PUT(
    request: Request,
    { params }: { params: { id: string; chapterId: string } }
) {
    try {
        const { processed } = await request.json()
        
        if (typeof processed !== 'boolean') {
            return NextResponse.json({ error: 'Processed status must be a boolean' }, { status: 400 })
        }

        const storage = new BookStorage()
        const result = await storage.updateChapterProcessed(params.id, params.chapterId, processed)
        
        if (!result) {
            return NextResponse.json({ error: 'Chapter not found' }, { status: 404 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error updating chapter processed status:', error)
        return NextResponse.json({ 
            error: error instanceof Error ? error.message : 'An unexpected error occurred' 
        }, { status: 500 })
    }
}
