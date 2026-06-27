import { NextRequest, NextResponse } from 'next/server'
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const adminUrl = 'http://localhost:3001'
  const path = request.nextUrl.pathname.replace('/api/admin-proxy', '')
  
  try {
    const response = await fetch(`${adminUrl}${path || '/'}${request.nextUrl.search}`, {
      method: request.method,
      headers: request.headers as any,
    })
    
    const data = await response.text()
    
    return new NextResponse(data, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'text/html',
      },
    })
  } catch (error) {
    console.error('Admin proxy error:', error)
    return new NextResponse('Error connecting to admin dashboard', { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const adminUrl = 'http://localhost:3001'
  const path = request.nextUrl.pathname.replace('/api/admin-proxy', '')
  
  try {
    const body = await request.text()
    const response = await fetch(`${adminUrl}${path || '/'}${request.nextUrl.search}`, {
      method: request.method,
      headers: request.headers as any,
      body,
    })
    
    const data = await response.text()
    
    return new NextResponse(data, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'text/html',
      },
    })
  } catch (error) {
    console.error('Admin proxy error:', error)
    return new NextResponse('Error connecting to admin dashboard', { status: 500 })
  }
}

// Handle all HTTP methods by forwarding them to the admin service
export const PUT = POST
export const PATCH = POST
export const DELETE = POST 
