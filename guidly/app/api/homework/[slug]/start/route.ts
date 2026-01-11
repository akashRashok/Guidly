import { NextRequest, NextResponse } from "next/server";
import { db, assignments, studentSessions } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

// POST /api/homework/[slug]/start - Start a student session
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const { studentName, classCode } = body;

    // Validate input
    if (!studentName || typeof studentName !== "string" || studentName.trim().length === 0) {
      return NextResponse.json({ error: "Please enter your name" }, { status: 400 });
    }

    if (!classCode || typeof classCode !== "string" || classCode.trim().length !== 4) {
      return NextResponse.json({ error: "Please enter a valid 4-character class code" }, { status: 400 });
    }

    // Find assignment
    const assignment = await db
      .select()
      .from(assignments)
      .where(eq(assignments.linkSlug, slug))
      .limit(1)
      .then((rows) => rows[0]);

    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    if (assignment.isClosed) {
      return NextResponse.json({ error: "This assignment is closed" }, { status: 400 });
    }

    // Verify class code
    if (assignment.classCode !== classCode.toUpperCase()) {
      return NextResponse.json({ error: "Incorrect class code" }, { status: 400 });
    }

    // Create student session
    const sessionId = nanoid();
    
    await db.insert(studentSessions).values({
      id: sessionId,
      assignmentId: assignment.id,
      studentName: studentName.trim(),
      classCode: classCode.toUpperCase(),
      startedAt: new Date(),
    });

    return NextResponse.json({ sessionId });
  } catch (error) {
    console.error("Error starting session:", error);
    return NextResponse.json(
      { error: "Failed to start homework" },
      { status: 500 }
    );
  }
}


