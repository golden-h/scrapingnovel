import { promises as fs } from 'fs'
import path from 'path'

export interface Chapter {
    id: string
    title: string
    url: string
    isLoading?: boolean
    hasContent?: boolean
    error?: string
}

export interface Book {
    id: string
    url: string
    title: string
    chapters: Chapter[]
    lastUpdated: string
}

export class BookStorage {
    private readonly STORAGE_DIR = path.join(process.cwd(), 'storage', 'books')

    private async ensureStorageDir() {
        try {
            await fs.access(this.STORAGE_DIR)
        } catch {
            await fs.mkdir(this.STORAGE_DIR, { recursive: true })
        }
    }

    private generateBookId(url: string): string {
        // Extract the numeric ID from URLs like 'https://uukanshu.cc/book/25138/'
        const match = url.match(/\/book\/(\d+)/);
        return match ? match[1] : Buffer.from(url).toString('base64').replace(/[/+=]/g, '_')
    }

    private getBookPath(bookId: string) {
        return path.join(this.STORAGE_DIR, `${bookId}.json`)
    }

    private getChapterPath(bookId: string, chapterId: string) {
        const chapterDir = path.join(this.STORAGE_DIR, bookId, 'chapters')
        return path.join(chapterDir, `${chapterId}.txt`)
    }

    private async checkChapterContent(bookId: string, chapters: Chapter[]): Promise<Chapter[]> {
        return await Promise.all(chapters.map(async (chapter) => {
            try {
                await fs.access(this.getChapterPath(bookId, chapter.id))
                return { ...chapter, hasContent: true }
            } catch {
                return { ...chapter, hasContent: false }
            }
        }))
    }

    async saveBook(url: string, title: string, chapters: Chapter[]): Promise<string> {
        await this.ensureStorageDir()
        
        const bookId = this.generateBookId(url)
        const book: Book = {
            id: bookId,
            url,
            title,
            chapters,
            lastUpdated: new Date().toISOString()
        }

        await fs.writeFile(
            this.getBookPath(bookId),
            JSON.stringify(book, null, 2),
            { mode: 0o666 } // Set file permissions
        )

        return bookId
    }

    async getBook(bookId: string): Promise<Book | null> {
        try {
            console.log('Reading book file:', this.getBookPath(bookId))
            const content = await fs.readFile(this.getBookPath(bookId), 'utf-8')
            const book = JSON.parse(content)
            
            // Check content status for each chapter
            book.chapters = await this.checkChapterContent(bookId, book.chapters)
            
            return book
        } catch (error) {
            console.error('Error reading book file:', error)
            return null
        }
    }

    async getAllBooks(): Promise<Book[]> {
        await this.ensureStorageDir()

        try {
            const files = await fs.readdir(this.STORAGE_DIR)
            const bookFiles = files.filter(file => file.endsWith('.json'))

            const books = await Promise.all(
                bookFiles.map(async file => {
                    const bookId = file.replace('.json', '')
                    const book = await this.getBook(bookId)
                    return book
                })
            )

            return books.filter((book): book is Book => book !== null)
        } catch (error) {
            console.error('Error reading books directory:', error)
            return []
        }
    }

    async saveChapterContent(bookId: string, chapterId: string, content: string) {
        const chapterPath = this.getChapterPath(bookId, chapterId)

        // Ensure chapter directory exists
        await fs.mkdir(path.dirname(chapterPath), { recursive: true })
        
        // Save chapter content with permissions
        await fs.writeFile(chapterPath, content, { mode: 0o666 })

        // Update book JSON
        try {
            const book = await this.getBook(bookId)
            if (book) {
                book.chapters = book.chapters.map(chapter => 
                    chapter.id === chapterId 
                        ? { ...chapter, hasContent: true }
                        : chapter
                );
                await fs.writeFile(
                    this.getBookPath(bookId),
                    JSON.stringify(book, null, 2),
                    { mode: 0o666 }
                );
            }
        } catch (error) {
            console.error('Error updating book chapter status:', error)
        }
    }

    async getChapterContent(bookId: string, chapterId: string): Promise<string | null> {
        try {
            return await fs.readFile(this.getChapterPath(bookId, chapterId), 'utf-8')
        } catch {
            return null
        }
    }

    async hasChapterContent(bookId: string, chapterId: string): Promise<boolean> {
        try {
            await fs.access(this.getChapterPath(bookId, chapterId))
            return true
        } catch {
            return false
        }
    }

    async deleteBook(bookId: string): Promise<boolean> {
        try {
            // Delete book file
            await fs.unlink(this.getBookPath(bookId))
            
            // Delete book directory if it exists
            const bookDir = path.join(this.STORAGE_DIR, bookId)
            try {
                await fs.rm(bookDir, { recursive: true })
            } catch {
                // Ignore if directory doesn't exist
            }
            
            return true
        } catch (error) {
            console.error('Error deleting book:', error)
            return false
        }
    }

    async updateChapterProcessed(bookId: string, chapterId: string, processed: boolean): Promise<boolean> {
        try {
            const book = await this.getBook(bookId)
            if (!book) return false

            book.chapters = book.chapters.map(chapter => 
                chapter.id === chapterId 
                    ? { ...chapter, processed }
                    : chapter
            );

            await fs.writeFile(
                this.getBookPath(bookId),
                JSON.stringify(book, null, 2),
                { mode: 0o666 }
            );

            return true
        } catch {
            return false
        }
    }
}
