import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import fs from 'fs'
import path from 'path'

// Define the base path to the Medusa folder
const MEDUSA_PATH = path.join(process.cwd(), 'Medusa')
const MANGA_PATH = path.join(MEDUSA_PATH, 'manga')
const MANGA_JSON_PATH = path.join(MANGA_PATH, 'manga.json')

// Sample data - replace with your database logic
const sampleMangas = [
  {
    id: '1',
    title: 'The Beginning After The End',
    cover: '/fallback-image.png',
    status: 'ONGOING',
    author: 'TurtleMe',
    description: 'King Grey has unrivaled strength, wealth, and prestige in a world governed by martial ability. However, solitude lingers closely behind those with great power. Beneath the glamorous exterior of a powerful king lurks the shell of man, devoid of purpose and will.',
    type: 'MANHWA',
    rating: '4.8',
    published: '2018',
    chapters: [
      { id: '1', title: 'Chapter 1', number: 1 },
      { id: '2', title: 'Chapter 2', number: 2 }
    ]
  },
  {
    id: '2',
    title: 'Solo Leveling',
    cover: '/fallback-image.png',
    status: 'COMPLETED',
    author: 'Chugong',
    description: 'In a world where hunters — humans who possess magical abilities — must battle deadly monsters to protect humanity, Sung Jinwoo, the weakest hunter of all mankind, finds himself in a mysterious dungeon.',
    type: 'MANHWA',
    rating: '4.9',
    published: '2016',
    chapters: [
      { id: '3', title: 'Chapter 1', number: 1 },
      { id: '4', title: 'Chapter 2', number: 2 }
    ]
  }
]

export async function GET() {
  try {
    // Check if manga.json exists
    if (!fs.existsSync(MANGA_JSON_PATH)) {
      return NextResponse.json([], { status: 404 })
    }

    // Read manga.json
    const content = fs.readFileSync(MANGA_JSON_PATH, 'utf8')
    const data = JSON.parse(content)

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching manga data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch manga data' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    // You can add authentication check here
    // const session = await getServerSession()
    // if (!session) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const body = await request.json()
    
    // Validate required fields
    if (!body.title || !body.author) {
      return NextResponse.json(
        { error: 'Title and author are required' },
        { status: 400 }
      )
    }

    // In a real app, you would save to database here
    // For now, just return the data with a fake ID
    const newManga = {
      id: Date.now().toString(),
      ...body,
      cover: body.cover || '/fallback-image.png',
      status: body.status || 'ONGOING',
      chapters: []
    }

    return NextResponse.json(newManga, { status: 201 })
  } catch (error) {
    console.error('Error creating manga:', error)
    return NextResponse.json(
      { error: 'Failed to create manga' },
      { status: 500 }
    )
  }
} 