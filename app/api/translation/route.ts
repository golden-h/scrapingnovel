import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const STORAGE_DIR = path.join(process.cwd(), 'storage', 'translations');

// Ensure storage directory exists
async function ensureStorageDir() {
  try {
    await fs.access(STORAGE_DIR);
  } catch {
    await fs.mkdir(STORAGE_DIR, { recursive: true });
  }
}

// POST /api/translation
export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('[API] Received request body:', body);

    const { bookId, url, translation } = body;
    console.log('[API] Extracted fields:', { bookId, url, translation });

    if (!bookId || !url || !translation) {
      console.log('[API] Missing required fields:', { bookId, url, translation });
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await ensureStorageDir();

    // Create a directory for each book
    const bookDir = path.join(STORAGE_DIR, bookId);
    await fs.mkdir(bookDir, { recursive: true });

    // Use URL's pathname as filename
    const urlObj = new URL(url);
    const fileName = `${urlObj.pathname.split('/').pop()}.json`;
    const filePath = path.join(bookDir, fileName);
    
    console.log('[API] Writing to file:', filePath);

    await fs.writeFile(filePath, JSON.stringify(translation, null, 2));
    console.log('[API] Successfully wrote to file');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Failed to save translation:', error);
    return NextResponse.json({ error: 'Failed to save translation' }, { status: 500 });
  }
}

// GET /api/translation?bookId=xxx&url=yyy
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const bookId = searchParams.get('bookId');
  const url = searchParams.get('url');

  if (!bookId || !url) {
    return NextResponse.json({ error: 'Missing bookId or url' }, { status: 400 });
  }

  // Use URL's pathname as filename
  const urlObj = new URL(url);
  const fileName = `${urlObj.pathname.split('/').pop()}.json`;
  const filePath = path.join(STORAGE_DIR, bookId, fileName);

  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return NextResponse.json(JSON.parse(content));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return NextResponse.json({ error: 'Translation not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to read translation' }, { status: 500 });
  }
}
