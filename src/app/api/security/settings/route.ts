import { NextRequest, NextResponse } from "next/server";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import firebaseApp from "@/lib/firebase";

const db = getFirestore(firebaseApp);

export async function GET(request: NextRequest) {
  try {
    // Get the current security settings
    const docSnap = await getDoc(doc(db, "site_security_settings", "security"));
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return NextResponse.json({
        exists: true,
        settings: {
          chapterProtection: data.chapterProtection === true,
          devGuardMode: data.devGuardMode === true,
          maintenanceMode: data.maintenanceMode === true,
          rightClickBlocker: data.rightClickBlocker === true,
        },
      });
    } else {
      return NextResponse.json({
        exists: false,
        message: "No security settings document found",
        settings: {
          chapterProtection: false,
          devGuardMode: false,
          maintenanceMode: false,
          rightClickBlocker: false,
        }
      });
    }
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message || "Failed to get security settings",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { 
      chapterProtection,
      devGuardMode,
      maintenanceMode,
      rightClickBlocker 
    } = await request.json();
    
    // Set security settings
    await setDoc(
      doc(db, "site_security_settings", "security"),
      {
        chapterProtection: chapterProtection === true,
        devGuardMode: devGuardMode === true,
        maintenanceMode: maintenanceMode === true, 
        rightClickBlocker: rightClickBlocker === true,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    
    return NextResponse.json({
      success: true,
      settings: {
        chapterProtection: chapterProtection === true,
        devGuardMode: devGuardMode === true,
        maintenanceMode: maintenanceMode === true,
        rightClickBlocker: rightClickBlocker === true,
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message || "Failed to update security settings",
      },
      { status: 500 }
    );
  }
} 