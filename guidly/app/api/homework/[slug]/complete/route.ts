import { NextRequest, NextResponse } from "next/server";
import { db, studentSessions } from "@/lib/db";
import { eq } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

// POST /api/homework/[slug]/complete - Mark session as complete
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json({ error: "Missing session ID" }, { status: 400 });
    }

    // Mark session as completed
    await db
      .update(studentSessions)
      .set({ completedAt: new Date() })
      .where(eq(studentSessions.id, sessionId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error completing session:", error);
    return NextResponse.json(
      { error: "Failed to complete session" },
      { status: 500 }
    );
  }
}

