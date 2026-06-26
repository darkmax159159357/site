import { NextResponse } from "next/server";

// Registration is handled client-side via Firebase Auth (registerUser in
// src/lib/firebaseAuth.ts). This legacy route — which used the old PHP server
// and wrote a local users.json — is no longer used and is kept only as a
// clear deprecation response.
export async function POST() {
  return NextResponse.json(
    {
      success: false,
      message: "This endpoint is deprecated. Registration is handled via Firebase on the client.",
    },
    { status: 410 }
  );
}
