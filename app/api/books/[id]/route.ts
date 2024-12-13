import { NextResponse } from 'next/server'
import { BookStorage } from '@/app/services/storage/bookStorage'

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        console.log('Getting book with id:', params.id)
        const storage = new BookStorage()
        const book = await storage.getBook(params.id)
        
        if (!book) {
            console.log('Book not found:', params.id)
            return NextResponse.json({ error: 'Book not found' }, { status: 404 })
        }

        console.log('Found book:', book.title)
        return NextResponse.json({ book })
    } catch (error) {
        console.error('Error getting book:', error)
        return NextResponse.json({ 
            error: error instanceof Error ? error.message : 'An unexpected error occurred' 
        }, { status: 500 })
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const storage = new BookStorage()
        const success = await storage.deleteBook(params.id)
        
        if (!success) {
            return NextResponse.json({ error: 'Book not found' }, { status: 404 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting book:', error)
        return NextResponse.json({ 
            error: error instanceof Error ? error.message : 'An unexpected error occurred' 
        }, { status: 500 })
    }
}
