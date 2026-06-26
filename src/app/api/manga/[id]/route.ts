import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Define the base path to the Medusa folder
const MEDUSA_PATH = path.join(process.cwd(), 'Medusa');
const MANGA_PATH = path.join(MEDUSA_PATH, 'manga');
const MANGA_JSON_PATH = path.join(MANGA_PATH, 'manga.json');

// GET a specific manga by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // Check if manga.json exists
    if (!fs.existsSync(MANGA_JSON_PATH)) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Manga data file not found',
          manga: null
        },
        { status: 404 }
      );
    }
    
    // Read manga.json
    const content = fs.readFileSync(MANGA_JSON_PATH, 'utf8');
    const allManga = JSON.parse(content);
    
    // Find the specific manga by ID
    const manga = allManga.find((m: any) => m.id === id);
    
    if (!manga) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Manga not found',
          manga: null
        },
        { status: 404 }
      );
    }
    
    // Return the manga data
    return NextResponse.json({
      success: true,
      message: 'Manga found',
      manga
    });
  } catch (error) {
    console.error('Error fetching manga:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Failed to fetch manga',
        manga: null
      },
      { status: 500 }
    );
  }
}

// DELETE a manga by ID
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // In a real app, you would delete from a database
    // For now, we'll just return a success response
    
    return NextResponse.json({ 
      success: true,
      message: `Manga with ID ${id} deleted successfully` 
    });
  } catch (error) {
    console.error('Error deleting manga:', error);
    return NextResponse.json(
      { error: 'Failed to delete manga' },
      { status: 500 }
    );
  }
}

// UPDATE a manga by ID
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await request.json();
    
    // In a real app, you would update in a database
    // For now, we'll just return the updated data
    
    return NextResponse.json({ 
      ...body,
      id,
      updated: true
    });
  } catch (error) {
    console.error('Error updating manga:', error);
    return NextResponse.json(
      { error: 'Failed to update manga' },
      { status: 500 }
    );
  }
} 