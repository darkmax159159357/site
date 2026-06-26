import { NextRequest, NextResponse } from "next/server";
import serverAuth from "@/lib/serverAuth";

// This tells Next.js not to statically generate this route
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await serverAuth();
    return NextResponse.json(session);
  } catch (err: any) {
    return NextResponse.json(
      {
        message: err.message,
      },
      {
        status: 500,
      }
    );
  }
}
