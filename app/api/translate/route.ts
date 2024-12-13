import { NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function POST(request: Request) {
    try {
        const { content } = await request.json()
        
        if (!content) {
            return NextResponse.json({ error: 'Content is required' }, { status: 400 })
        }

        const testPath = path.join(process.cwd(), 'tests', 'translate.robot')
        
        return new Promise((resolve, reject) => {
            // Escape special characters in content to prevent command line issues
            const escapedContent = content.replace(/"/g, '\\"')
            
            const robot = spawn('robot', [
                '--task', 'Translate Text',
                '--variable', `input_text:"${escapedContent}"`,
                testPath
            ])
            
            let output = ''
            
            robot.stdout.on('data', (data) => {
                const chunk = data.toString()
                output += chunk
                console.log(chunk)
            })
            
            robot.stderr.on('data', (data) => {
                console.error(data.toString())
            })
            
            robot.on('close', (code) => {
                if (code === 0) {
                    // Extract translation result from robot framework output
                    const match = output.match(/Translation Result: (.*?)(?=\n|$)/s)
                    const translatedContent = match ? match[1].trim() : ''
                    
                    resolve(NextResponse.json({
                        translatedContent,
                        success: true
                    }))
                } else {
                    reject(NextResponse.json(
                        { error: 'Translation failed', details: output },
                        { status: 500 }
                    ))
                }
            })
        })
    } catch (error) {
        console.error('Translation error:', error)
        return NextResponse.json(
            { error: 'Failed to translate content' },
            { status: 500 }
        )
    }
}
