import { Page } from 'puppeteer';

interface UukanshuChapter {
    title: string;
    content: string;
    nextChapterUrl?: string;
    prevChapterUrl?: string;
}

export async function scrapeUukanshu(page: Page, url: string): Promise<UukanshuChapter> {
    try {
        console.log('Navigating to:', url);
        await page.goto(url, { 
            waitUntil: 'networkidle0',
            timeout: 30000 
        });
        console.log('Page loaded, waiting for content selector');

        // Wait for the main content to load
        await page.waitForSelector('div.readcotent', { timeout: 10000 });
        console.log('Content selector found');

        // Evaluate page content
        const result = await page.evaluate(() => {
            const contentEl = document.querySelector('div.readcotent');
            const titleEl = document.querySelector('h1');
            const nextLink = document.querySelector('a.next') as HTMLAnchorElement;
            const prevLink = document.querySelector('a.prev') as HTMLAnchorElement;

            if (!contentEl || !titleEl) {
                throw new Error('Required elements not found on page');
            }

            // Remove ads and scripts
            contentEl.querySelectorAll('script, .ad').forEach(el => el.remove());
            
            // Get the text content while preserving line breaks
            let paragraphs = Array.from(contentEl.childNodes)
                .filter(node => {
                    // Filter out empty text nodes and non-text nodes
                    if (node.nodeType === Node.TEXT_NODE) {
                        return node.textContent?.trim().length > 0;
                    }
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        return (node as Element).textContent?.trim().length > 0;
                    }
                    return false;
                })
                .map(node => node.textContent?.trim())
                .filter(text => text && text.length > 0);

            // Join paragraphs with double line breaks
            let content = paragraphs.join('\n\n');
            
            // Clean up the text while preserving formatting
            content = content
                .replace(/&nbsp;/g, ' ') // Replace HTML spaces
                .replace(/[""]/g, '"') // Normalize quotes
                .replace(/['']/g, "'") // Normalize apostrophes
                .replace(/（本章未完）/g, '') // Remove Chinese chapter indicators
                .trim();

            if (!content) {
                throw new Error('No content found in chapter');
            }

            return {
                title: titleEl.textContent?.trim() || '',
                content,
                nextChapterUrl: nextLink?.href,
                prevChapterUrl: prevLink?.href
            };
        });

        if (!result.content) {
            throw new Error('Failed to extract chapter content');
        }

        return result;
    } catch (error) {
        console.error(`Error scraping ${url}:`, error);
        throw new Error(`Failed to scrape chapter: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
