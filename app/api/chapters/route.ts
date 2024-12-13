import { NextResponse } from 'next/server'
import puppeteer from 'puppeteer'
import { BookStorage } from '@/app/services/storage/bookStorage'

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { url } = body

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 })
        }

        const browser = await puppeteer.launch({
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        })

        try {
            const page = await browser.newPage()
            await page.setViewport({ width: 1280, height: 800 })
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')

            console.log('Navigating to:', url)
            await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 })

            // Wait for the chapter list container
            await page.waitForSelector('#list-chapterAll', { timeout: 5000 })

            const result = await page.evaluate(() => {
                const container = document.querySelector('#list-chapterAll')
                const titleEl = container?.querySelector('h2')
                const chapters = Array.from(container?.querySelectorAll('dd') || [])
                
                return {
                    title: titleEl?.textContent?.trim() || 'Unknown Title',
                    chapters: chapters.map(chapter => {
                        const link = chapter.querySelector('a')
                        const url = link?.href || ''
                        // Extract chapter ID from URL
                        const match = url.match(/\/(\d+)\.html/)
                        const chapterId = match ? `chapter-${match[1]}` : ''
                        
                        return {
                            id: chapterId,
                            title: link?.textContent?.trim() || `Chapter ${chapterId}`,
                            url: url,
                        }
                    }).filter(chapter => chapter.url && chapter.id) // Filter out chapters without URLs or IDs
                }
            })

            if (!result.chapters.length) {
                throw new Error('No chapters found')
            }

            // Save book data
            const storage = new BookStorage()
            const bookId = await storage.saveBook(url, result.title, result.chapters)
            
            return NextResponse.json({
                ...result,
                id: bookId
            })
        } finally {
            await browser.close()
        }
    } catch (error) {
        console.error('Error:', error)
        return NextResponse.json({ 
            error: error instanceof Error ? error.message : 'An unexpected error occurred',
            details: error instanceof Error ? error.stack : undefined
        }, { status: 500 })
    }
}
