import { NextResponse } from 'next/server'
import puppeteer from 'puppeteer'
import { scrapeUukanshu } from '@/app/services/scrapers/uukanshu'
import { BookStorage } from '@/app/services/storage/bookStorage'

interface ScrapingResult {
    title: string;
    content: string;
    nextChapterUrl?: string;
    prevChapterUrl?: string;
}

export async function POST(req: Request) {
    let browser;
    try {
        const body = await req.json()
        const { url, domain, bookId, chapterId } = body

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 })
        }

        if (!domain) {
            return NextResponse.json({ error: 'Domain is required' }, { status: 400 })
        }

        // Check if content already exists in storage directory
        if (bookId && chapterId) {
            const storage = new BookStorage()
            const hasContent = await storage.hasChapterContent(bookId, chapterId)
            if (hasContent) {
                const content = await storage.getChapterContent(bookId, chapterId)
                if (content) {
                    console.log('Content found in storage directory, returning stored version')
                    return NextResponse.json({
                        content,
                        fromStorage: true
                    })
                }
            }
            console.log('Content not found in storage directory, proceeding with scraping')
        }

        browser = await puppeteer.launch({
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        })

        const page = await browser.newPage()
        
        // Enhanced page configuration
        await page.setViewport({ width: 1280, height: 800 })
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')

        let result: ScrapingResult;

        // Use different scraping logic based on domain
        switch (domain) {
            case 'uukanshu.cc':
                result = await scrapeUukanshu(page, url);
                break;
            default:
                throw new Error(`Unsupported domain: ${domain}`);
        }

        // Save content if we have bookId and chapterId
        if (bookId && chapterId && result.content) {
            const storage = new BookStorage()
            await storage.saveChapterContent(bookId, chapterId, result.content)
        }

        return NextResponse.json(result)
    } catch (error) {
        console.error('Error extracting content:', error)
        return NextResponse.json({ 
            error: error instanceof Error ? error.message : 'An unexpected error occurred' 
        }, { status: 500 })
    } finally {
        if (browser) {
            await browser.close()
        }
    }
}
