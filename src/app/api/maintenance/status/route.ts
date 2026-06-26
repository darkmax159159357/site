import { NextRequest, NextResponse } from "next/server";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import firebaseApp from "@/lib/firebase";

const db = getFirestore(firebaseApp);

export async function GET(request: NextRequest) {
  try {
    // Get the current maintenance status
    const docSnap = await getDoc(doc(db, "site_security_settings", "security"));
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return NextResponse.json({
        exists: true,
        maintenanceMode: data.maintenanceMode === true,
        data: data,
      });
    } else {
      return NextResponse.json({
        exists: false,
        message: "No maintenance document found",
      });
    }
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message || "Failed to get maintenance status",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { enable } = await request.json();
    
    // Set maintenance mode
    await setDoc(
      doc(db, "site_security_settings", "security"),
      {
        maintenanceMode: enable === true,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    
    return NextResponse.json({
      success: true,
      maintenanceMode: enable === true,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message || "Failed to update maintenance status",
      },
      { status: 500 }
    );
  }
} 