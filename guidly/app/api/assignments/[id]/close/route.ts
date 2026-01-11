import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, assignments } from "@/lib/db";
import { eq, and } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify ownership and update
    const result = await db
      .update(assignments)
      .set({ isClosed: true })
      .where(
        and(
          eq(assignments.id, id),
          eq(assignments.teacherId, session.user.id)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error closing assignment:", error);
    return NextResponse.json(
      { error: "Failed to close assignment" },
      { status: 500 }
    );
  }
}

