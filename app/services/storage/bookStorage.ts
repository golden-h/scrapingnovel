import { promises as fs } from 'fs'
import path from 'path'

export interface Chapter {
    id: string
    title: string
    url: string
    isLoading?: boolean
    hasContent?: boolean
    error?: string
    processed?: boolean
    translated?: boolean
    done?: boolean
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

    private async checkTranslation(content: string): Promise<boolean> {
        // Check if the content contains any English text
        // This is a simple heuristic - you might want to adjust based on your needs
        const englishPattern = /[a-zA-Z]{2,}/;  // At least 2 consecutive English letters
        return englishPattern.test(content);
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

    async getBook(bookId: string, checkContent: boolean = false): Promise<Book | null> {
        try {
            console.log('Reading book file:', this.getBookPath(bookId))
            const content = await fs.readFile(this.getBookPath(bookId), 'utf-8')
            const book = JSON.parse(content)
            
            // Only check content status if explicitly requested
            // Return a new object with updated chapters, but don't modify the file
            if (checkContent) {
                const updatedChapters = await this.checkChapterContent(bookId, book.chapters)
                return {
                    ...book,
                    chapters: updatedChapters
                }
            }
            
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
            const book = await this.getBook(bookId, false)
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
            const content = await fs.readFile(this.getChapterPath(bookId, chapterId), 'utf-8')
            return content
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
            const book = await this.getBook(bookId, false)
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

    async getChapterStatus(bookId: string, chapterId: string): Promise<{ done?: boolean, translated?: boolean } | null> {
        try {
            const book = await this.getBook(bookId, false)
            if (!book) return null

            // Extract the raw chapter number for comparison
            const rawChapterNumber = chapterId.replace('chapter-', '')
            
            // Find chapter by raw ID from URL
            const chapter = book.chapters.find(c => {
                const urlMatch = c.url.match(/\/(\d+)\.html/)
                return urlMatch && urlMatch[1] === rawChapterNumber
            })

            if (!chapter) {
                console.error('Chapter not found:', { bookId, chapterId })
                return null
            }

            return {
                done: chapter.done,
                translated: chapter.translated
            }
        } catch (error) {
            console.error('Error getting chapter status:', error)
            return null
        }
    }

    async updateChapterStatus(bookId: string, chapterId: string, status: { done?: boolean, translated?: boolean }): Promise<boolean> {
        try {
            const book = await this.getBook(bookId, false)
            if (!book) {
                console.error('Book not found:', bookId)
                return false
            }

            // Extract the raw chapter number for comparison
            const rawChapterNumber = chapterId.replace('chapter-', '')
            
            // Find chapter by raw ID from URL
            const chapterIndex = book.chapters.findIndex(c => {
                const urlMatch = c.url.match(/\/(\d+)\.html/)
                return urlMatch && urlMatch[1] === rawChapterNumber
            })

            if (chapterIndex === -1) {
                console.error('Chapter not found:', { bookId, chapterId })
                return false
            }

            book.chapters[chapterIndex] = {
                ...book.chapters[chapterIndex],  // Preserve all existing fields
                done: status.done ?? book.chapters[chapterIndex].done,  // Only update if provided
                translated: status.translated ?? book.chapters[chapterIndex].translated  // Keep translated status
            }

            await fs.writeFile(
                this.getBookPath(bookId),
                JSON.stringify(book, null, 2),
                { mode: 0o666 }
            )

            return true
        } catch (error) {
            console.error('Error updating chapter status:', error)
            return false
        }
    }

    async updateTranslationStatus(bookId: string): Promise<void> {
        try {
            const book = await this.getBook(bookId, false)
            if (!book) return

            // Process each chapter
            const updatedChapters = await Promise.all(book.chapters.map(async chapter => {
                const content = await this.getChapterContent(bookId, chapter.id)
                if (!content) return chapter

                const isTranslated = await this.checkTranslation(content)
                return { ...chapter, translated: isTranslated }
            }))

            // Update the book with new translation statuses
            book.chapters = updatedChapters

            // Save the updated book
            await fs.writeFile(
                this.getBookPath(bookId),
                JSON.stringify(book, null, 2),
                { mode: 0o666 }
            )

            console.log('Updated translation status for book:', bookId)
        } catch (error) {
            console.error('Error updating translation status:', error)
        }
    }
}
