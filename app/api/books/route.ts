import { NextResponse } from 'next/server'
import { BookStorage } from '@/app/services/storage/bookStorage'

export async function GET() {
    try {
        const storage = new BookStorage()
        const books = await storage.getAllBooks()
        return NextResponse.json({ books })
    } catch (error) {
        console.error('Error getting books:', error)
        return NextResponse.json({ 
            error: error instanceof Error ? error.message : 'An unexpected error occurred' 
        }, { status: 500 })
    }
}
